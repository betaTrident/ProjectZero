# Project ZERO - Payment Flow Roadmap

This document is a standalone proposal for the next agent. It layers a hosted user-wallet, KYC, and auto-generated invoice/receipt flow on top of the existing MVP without rewriting `docs/mvp-roadmap.md` or `docs/mvp-implementation.md`.

## Goal

Build an end-to-end Stellar payment method where:

- users and merchants both onboard through Project ZERO with KYC
- the Project ZERO user wallet is hosted and custodial
- Supabase remains the source of truth
- Horizon is read-only verification, not canonical state
- every successful payment auto-generates a PDF invoice/receipt and stores it in Supabase Storage

## Relationship to the current whitepaper

The current whitepaper says the customer payment secret never leaves the customer's wallet. That statement remains true for the merchant trust boundary.

This roadmap introduces a separate user-wallet model where Project ZERO may host the customer's Stellar secret server-side. The whitepaper should later receive a small addendum clarifying that the "no customer secret on the merchant stack" claim still applies to the merchant boundary, even if Project ZERO also offers a hosted user wallet.

## Out of scope

- Editing `docs/mvp-roadmap.md`
- Editing `docs/mvp-implementation.md`
- Mainnet cutover
- Manual admin KYC review UI for the first implementation
- Multi-currency support on user wallets
- Passkey / 2FA upgrades for the hosted wallet

## 1. Actors and trust boundaries

| Actor | Responsibility |
| --- | --- |
| Merchant | Creates invoices and receives payments |
| User / customer | Completes KYC and pays through the Project ZERO-hosted wallet |
| Project ZERO backend | Stores canonical state, signs hosted-wallet transactions, generates receipts |
| Stellar network | Settlement layer only |

## 2. Data model additions

New migrations should live under `supabase/migrations/2026MMDD_payment_flow.sql` and related files.

### 2.1 Users table

Create a new `public.users` table separate from `auth.users`:

```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade unique,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email text not null unique check (email ~* '^[^@]+@[^@]+\\.[^@]+$'),
  phone text,
  kyc_status text not null default 'pending'
    check (kyc_status in ('pending', 'submitted', 'approved', 'rejected')),
  kyc_payload jsonb not null default '{}'::jsonb,
  kyc_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.2 Merchant KYC fields

Extend `public.merchants`:

```sql
alter table public.merchants
  add column if not exists kyc_status text not null default 'pending'
    check (kyc_status in ('pending', 'submitted', 'approved', 'rejected')),
  add column if not exists kyc_payload jsonb not null default '{}'::jsonb,
  add column if not exists kyc_reviewed_at timestamptz;
```

### 2.3 Hosted user wallet

Create `public.wallets` for custodial user wallets:

```sql
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  stellar_public_key text not null unique
    check (stellar_public_key ~ '^G[A-Z2-7]{55}$'),
  encrypted_secret bytea not null,
  encryption_key_version smallint not null,
  network text not null default 'testnet'
    check (network in ('testnet', 'mainnet')),
  created_at timestamptz not null default now()
);
```

### 2.4 Payment request network

Pin the payment request to a network:

```sql
alter table public.payment_requests
  add column if not exists network text not null default 'testnet'
    check (network in ('testnet', 'mainnet'));
```

### 2.5 Receipt fields

Extend `public.receipts`:

```sql
alter table public.receipts
  add column if not exists pdf_path text,
  add column if not exists merchant_name_snapshot text,
  add column if not exists merchant_business_name text,
  add column if not exists amount numeric(12,2),
  add column if not exists asset_code text,
  add column if not exists paid_at timestamptz;
```

### 2.6 RLS and storage

Add separate migration files for:

- `supabase/migrations/2026MMDD_payment_flow_rls.sql`
- `supabase/migrations/2026MMDD_storage.sql`
- `supabase/migrations/2026MMDD_create_invoice_receipt.sql`

Requirements:

- users can read and write their own `public.users` row
- wallets.encrypted_secret must never be returned to the client
- merchants can only read public user data through service-role logic
- a private `invoices` bucket stores PDFs
- service role can write any invoice PDF
- the merchant owner can read PDFs for their own payment requests
- the user tied to the payment can read the same PDF
- `create_invoice_receipt(p_payment_request_id uuid, p_tx_hash text)` should insert the receipt, call the existing paid-status mutation, and return the new receipt id

## 3. Onboarding and KYC

The KYC flow should be the same for users and merchants, with the only difference being which table receives the submitted payload.

### 3.1 KYC UI

Recommended files:

- `src/app/(auth)/onboarding/kyc/page.tsx`
- `src/components/forms/kyc-form.tsx`
- `src/actions/kyc.ts`

Requirements:

- server page requires an authenticated session
- form collects legal name, address, date of birth, government ID type, ID number, phone, and email
- email can be auto-filled from the session
- ID image upload should go to a private Supabase Storage bucket such as `kyc-id`
- submission writes `kyc_payload` and sets `kyc_status = 'submitted'`

### 3.2 KYC review

For the first implementation, approval can be treated as a deferred admin flow. If needed, add a stub API route such as `src/app/api/admin/kyc/route.ts` for future manual review.

### 3.3 Wallet provisioning

After a user reaches `kyc_status = 'approved'`, provision a custodial wallet:

1. Generate a Stellar keypair.
2. Encrypt the secret with `nacl.secretbox` using `WALLET_ENCRYPTION_KEY`.
3. Store only the encrypted secret and public key.
4. Fund the account on testnet via Friendbot.
5. Return only the public key to the client.

For merchants, keep the existing merchant wallet behavior aligned with the current MVP plan. If a merchant record needs a public key, that key remains their Project ZERO wallet public key, while outbound signing stays consistent with the existing merchant-side flow.

### 3.4 User authentication meaning in this flow

In the user flow, "authenticated on Stellar" means:

- the user is authenticated into Project ZERO
- KYC has been approved
- the hosted wallet exists for the same network as the payment request

If the payment page network and the wallet network do not match, the flow should fail closed.

## 4. Transaction flow

### 4.1 Existing MVP path

The merchant still creates `payment_requests` as before.

Default QR behavior:

- primary QR payload is the web link, e.g. `https://app/pay/<id>`
- optionally render a SEP-7 URI as a secondary QR for other Stellar wallets

### 4.2 Customer pay page

Recommended file:

- `src/app/pay/[paymentRequestId]/page.tsx`

Responsibilities:

- fetch the payment request on the server
- verify the logged-in user has approved KYC
- verify the user's wallet network matches the payment request network
- render the merchant name, amount, asset, memo, destination, and QR
- show a `Pay with Project ZERO` button

### 4.3 Hosted wallet payment action

Recommended file:

- `src/actions/payments.ts`

Flow:

1. Authenticate the session.
2. Resolve the user and load `wallets.encrypted_secret`.
3. Decrypt the Stellar secret server-side.
4. Build the payment XDR with the existing payment builder logic.
5. Sign with the hosted wallet keypair.
6. Submit to the correct Horizon endpoint for the payment request network.
7. Send the transaction hash to the existing verify endpoint.

The verification endpoint can accept additional metadata such as `signedByProjectZero` and `sourceWallet`.

### 4.4 On-chain verification

The existing verifier should still validate:

- memo
- destination
- amount
- asset

For this flow, it should also assert that the payment request network matches the chain/network being verified.

### 4.5 Atomic paid status and invoice generation

After verification succeeds:

1. Call `create_invoice_receipt(p_payment_request_id, p_tx_hash)`.
2. Insert a receipt row with snapshots and timestamps.
3. Generate a PDF invoice/receipt.
4. Store the PDF in Supabase Storage.
5. Write the storage path back to `receipts.pdf_path`.

Recommended files:

- `src/app/api/receipts/[id]/render/route.ts`
- `src/app/pay/[id]/receipt/page.tsx`
- `src/lib/payments/pdf.ts`

The receipt page should expose:

- inline receipt details
- a download button using a signed URL
- a dashboard link for recent payments

## 5. Source of truth model

Supabase remains the canonical state store.

- KYC writes go through Supabase
- wallet provisioning writes go through Supabase
- receipt creation and paid-state mutation go through Supabase
- Horizon is used only for submitting and verifying transactions

The roadmap should treat Horizon as read-only verification, not the authoritative record of status.

## 6. Network strategy

Network should be data-driven, not hardcoded.

Recommended helper:

- `src/lib/stellar/network.ts`

It should expose a `getStellarServer(network)` factory that returns the correct Horizon client and passphrase for:

- `testnet`
- `mainnet`

The network value should come from the payment request or wallet row, not directly from an environment variable at runtime.

Mainnet should remain gated on:

- a successful testnet soak period
- a security review of the custodial key flow
- any future wallet-upgrade work if the hosted wallet evolves toward passkeys

## 7. New file ownership

Planned ownership for the next implementation pass:

- `supabase/migrations/2026MMDD_*`
- `src/actions/kyc.ts`
- `src/actions/wallets.ts`
- `src/actions/payments.ts`
- `src/app/(auth)/onboarding/kyc/*`
- `src/app/pay/[id]/receipt/page.tsx`
- `src/app/api/receipts/*`
- `src/lib/wallets/crypto.ts`
- `src/lib/stellar/network.ts`
- `src/lib/payments/pdf.ts`
- `src/lib/validation/kyc.schema.ts`
- `src/lib/validation/wallet.schema.ts`

The existing MVP tracks should continue to own the original payment-request and verification pieces unless explicitly refactored.

## 8. Phases and milestones

### Phase 4 - KYC + custodial user wallet

- M5 - users table, wallet encryption, KYC form, wallet provisioning, network mismatch guard on the pay page
- M6 - network-aware Stellar helpers and verifier updates

### Phase 5 - Hosted pay path + auto-invoice

- M7 - hosted-wallet payment action, end-to-end testnet round trip, verification, receipt creation, PDF storage
- M8 - receipt page and signed PDF download links
- M9 - reconciliation job and security review

## 9. Open questions

These should be resolved before implementation starts:

1. PDF library choice: `@react-pdf/renderer` or `pdfkit`
2. Where `WALLET_ENCRYPTION_KEY` lives and how key rotation is tracked
3. Whether the KYC form should capture a separate email for receipt delivery
4. Whether the SEP-7 QR should be always visible or behind a toggle
5. What happens to a hosted wallet if KYC is later rejected

## 10. Suggested next step

If this proposal is accepted, the next agent should implement the data model and KYC / hosted-wallet foundation first, then layer the pay action and receipt generation on top.
