# Project ZERO - Payment and Transaction Flow Implementation Plan (Draft)

> Status: Draft for review  
> Source roadmap: `docs/roadmap/payment-flow-roadmap.md`  
> Scope: Product-catalog removal, network-aware Stellar payments, hosted-wallet foundations, transaction settlement, reconciliation, and generated PDF receipts  
> Deferred: KYC design and implementation

## 1. Objective

Implement the non-KYC parts of the payment-flow roadmap as a secure, testnet-first extension of the current MVP.

The finished flow should let a merchant create a payment request without selecting or tracking a product, let a customer pay through either the existing external-wallet path or a future Project ZERO hosted wallet, verify the on-chain payment against immutable server-side expectations, record the transaction exactly once in Supabase, and provide an access-controlled PDF receipt.

This plan deliberately does **not** decide what KYC data is collected, how it is reviewed, which provider is used, or when approval can be revoked. It creates only the narrow integration boundary that the later KYC plan must satisfy before hosted-wallet provisioning and payment are enabled for real users.

## 2. Scope boundaries

### 2.1 In scope

- Remove the merchant product catalog and all product associations from the live application flow.
- Keep `payment_requests` as the merchant-created payment intent/invoice record.
- Keep `transactions` as the canonical record of a verified Stellar settlement.
- Make Stellar network selection data-driven per payment request and hosted wallet.
- Add customer authentication paths needed to return an authenticated customer to a payment link.
- Add a secure hosted-wallet storage and encryption foundation without publicly enabling provisioning.
- Add an authenticated, server-side hosted payment action behind a fail-closed eligibility gate and feature flag.
- Make settlement, transaction insertion, payer binding, and receipt-record creation idempotent and database-atomic.
- Generate PDF receipts outside the settlement transaction through a retryable job.
- Store PDFs in a private Supabase Storage bucket and issue short-lived signed URLs only after authorization.
- Add reconciliation, observability, rate limiting, tests, and testnet operational gates.
- Preserve the current external Freighter/SEP-7 payment path during the transition.

### 2.2 Explicitly deferred

- `public.users` KYC fields or a KYC-specific profile model.
- Merchant or customer KYC forms, schemas, document upload buckets, and review APIs.
- KYC vendor selection, webhook ingestion, manual review, appeal, retention, deletion, and sanctions-screening policy.
- The final implementation of `assertHostedWalletEligible(authUserId)`.
- Automatic public hosted-wallet provisioning.
- Activating hosted-wallet payment in production before the KYC gate is implemented.

### 2.3 Out of scope

- Mainnet cutover.
- Editing the already-completed MVP implementation history as though it were current work.
- Multi-currency balances inside a hosted wallet.
- Passkeys, 2FA, smart accounts, or account abstraction.
- Email delivery of receipts.
- Product, SKU, inventory, order-line, cart, or fulfillment tracking.
- x402, MPP, Soroban payment channels, or other machine-payment protocols; the current flow is a classic Stellar account payment.

## 3. Current repository baseline

The implementation must extend the current repository rather than re-implement the roadmap from scratch.

- Next.js App Router, Supabase SSR, Zod, Vitest, and `@stellar/stellar-sdk` are already installed.
- Merchant auth and onboarding already exist.
- `payment_requests`, `transactions`, and `receipts` already exist in the baseline migration.
- The existing verifier checks memo, destination, amount, asset code, and asset issuer.
- `mark_payment_paid()` currently changes a pending request to paid and inserts a transaction atomically.
- `/api/stellar/verify` already uses a service-role client and a payment-ID-plus-client-fingerprint rate-limit key.
- The public payment page already supports Freighter, SEP-7 fallback, status polling, and an inline paid-state receipt.
- `getStellarServer()` currently resolves one environment-selected Horizon server and is not network-aware.
- Product catalog behavior currently exists in the database, types, actions, invoice form, dashboard, navigation, protected routes, copy, and tests.
- `transactions.source_wallet` exists but is not reliably populated by the current settlement path.
- `receipts` currently contains only identity fields and a receipt number; no PDF lifecycle or snapshot fields exist.

## 4. Target architecture and source-of-truth rules

### 4.1 Canonical ownership

Supabase is authoritative for application state:

- `payment_requests` defines what must be paid.
- `payment_attempts` records hosted-payment execution state and idempotency.
- `transactions` records a successfully verified on-chain settlement.
- `receipts` records the immutable receipt snapshot and PDF-generation lifecycle.
- `wallets` records non-secret hosted-wallet metadata.
- `wallet_secrets` stores encrypted key material and is never client-readable.

Horizon is used to load classic accounts, submit classic transactions, and verify on-chain facts. A Horizon response never directly becomes application status without passing server validation and the atomic settlement function.

Supabase Storage is authoritative only for the PDF object. The `receipts.pdf_status` and `receipts.pdf_path` columns describe whether that object is ready for use.

### 4.2 Trust boundaries

| Boundary | Allowed | Forbidden |
| --- | --- | --- |
| Browser | Auth session, public wallet address, payment summary, signed receipt URL | Hosted secret, ciphertext, encryption key, service-role key |
| Server action/API | Resolve canonical request, decrypt briefly, build/sign/submit, verify, settle | Trust client-supplied amount, destination, asset, source-wallet claim, or network |
| Supabase authenticated role | Read/write rows allowed by narrow RLS policies | Directly mark requests paid, insert verified transactions, read wallet ciphertext |
| Supabase service role | Settlement RPC, wallet-secret access, receipt job | Exposure to client bundles or browser requests |
| Horizon | Network facts and submission result | Canonical invoice/payment/receipt status |

### 4.3 Payment state sequence

```text
payment request: pending
        |
        +-- external wallet signs/submits -----------+
        |                                            |
        +-- hosted action creates attempt            |
             -> submitting -> submitted              |
                                                      v
                                           server verifies chain
                                                      |
                                                      v
                           atomic DB settlement + receipt queue
                            request=paid, transaction inserted,
                                  receipt.pdf_status=queued
                                                      |
                                                      v
                                      PDF worker uploads object
                                      receipt.pdf_status=ready
```

No PDF failure may roll a verified payment back to pending. PDF generation is retryable post-settlement work.

## 5. Design decisions to pin before coding

1. Use the database value `testnet | mainnet` as the network discriminator. Convert it to the matching Horizon URL and Stellar network passphrase only in a server-only helper.
2. Keep mainnet in the type/constraint so data contracts do not need another migration, but reject it at runtime until a dedicated mainnet flag and launch review are complete.
3. Keep the existing external-wallet flow working. Hosted payment is additive and initially disabled.
4. Do not create provisional KYC columns or accept arbitrary KYC JSON in this implementation.
5. Model the future KYC dependency as one server-only eligibility interface. Its default implementation returns a typed `KYC_REQUIRED` denial.
6. Store hosted-wallet metadata separately from encrypted secret material so normal wallet queries cannot accidentally select ciphertext.
7. Encrypt Stellar secrets with an authenticated cipher and a unique random nonce per secret. Store ciphertext, nonce, algorithm, and key version; never rely on ciphertext plus an implicit nonce.
8. Use a versioned keyring interface so decryption can read older versions and new writes use the active version. Production activation requires a managed KMS/envelope-encryption decision; a raw environment key is testnet-only.
9. Replace `mark_payment_paid()` with an idempotent settlement RPC that also binds the payer and creates the receipt record. Keep a compatibility wrapper only if an existing caller still needs it during rollout.
10. Do not place Storage upload or PDF rendering inside a PostgreSQL function. Queue the receipt row atomically, then render asynchronously and retry safely.
11. Generate receipt values from database snapshots, never by querying mutable merchant or payment-request display data during a later download.
12. Prefer a server-only PDF library that does not couple receipt rendering to the installed React version. Start with a small `pdfkit` proof-of-compatibility; stop and record a package decision if Next.js bundling or font packaging fails.
13. Carry payment amounts as validated decimal strings in TypeScript and use `numeric(19,7)` in PostgreSQL. Do not pass monetary values through JavaScript floating-point arithmetic.

## 6. Data model and migration plan

Create append-only forward migrations. Do not rewrite already-applied migrations. Update `supabase/schema.sql`, `supabase/rls.sql`, and `src/types/database.ts` after the migrations are validated so local snapshots match deployable history.

### 6.1 Remove product tracking

Add a migration such as `supabase/migrations/2026MMDDHHMMSS_remove_product_catalog.sql`:

1. Drop the `payment_requests.product_id` foreign key and column.
2. Drop product RLS policies.
3. Drop product triggers and indexes.
4. Revoke product-table grants if still present.
5. Drop `public.products`.
6. Verify no view, function, policy, or test fixture depends on `products` before committing.

This is intentionally destructive. Before applying outside local/test environments, capture a database backup and record the row count being discarded. No product data is migrated into payment requests because payment requests already snapshot their own title, description, amount, and asset.

### 6.2 Network and payer binding

Extend `public.payment_requests` with:

- `network text not null default 'testnet' check (network in ('testnet', 'mainnet'))`
- `payer_user_id uuid null references auth.users(id) on delete set null`

Change `payment_requests.amount` to `numeric(19,7)` after checking that every existing value can be converted without loss. Update the Zod/API contract to accept a canonical positive decimal string with no more than seven fractional digits and an explicit upper bound.

Rules:

- Existing rows backfill to `testnet` before the column becomes non-null.
- Merchants cannot set or update `payer_user_id`.
- A hosted pay action may bind an unclaimed pending request to the current authenticated user.
- Once bound, `payer_user_id` is immutable.
- An external-wallet payment may remain unbound unless the payer is authenticated when verification occurs.
- A paid request cannot be rebound.

Add indexes for `(network, status, created_at)` as needed by reconciliation and `(payer_user_id, created_at desc)` for customer receipt history.

### 6.3 Hosted-wallet metadata

Create `public.wallets` with:

- `id uuid primary key`
- `auth_user_id uuid not null references auth.users(id) on delete cascade`
- `stellar_public_key text not null`
- `network text not null`
- `status text not null check (status in ('provisioning', 'active', 'suspended', 'closed'))`
- `created_at`, `updated_at`
- unique `(auth_user_id, network)`
- unique `(stellar_public_key, network)`
- Stellar `G...` format check

Authenticated users may read only their own wallet metadata. They cannot insert, update, or delete wallet rows directly.

### 6.4 Hosted-wallet secret isolation

Create `public.wallet_secrets` with:

- `wallet_id uuid primary key references public.wallets(id) on delete cascade`
- `ciphertext bytea not null`
- `nonce bytea not null`
- `algorithm text not null`
- `key_version smallint not null check (key_version > 0)`
- `created_at`, `rotated_at`

Security requirements:

- Enable RLS with no authenticated or anonymous policy.
- Revoke all privileges from `anon` and `authenticated`.
- Grant only the minimum service-role operations needed by server-only wallet functions.
- Never include this table in shared client query helpers, generated public DTOs, logs, errors, analytics, or test snapshots.
- Add a database constraint for the expected nonce length of the selected cipher.

### 6.5 Hosted payment attempts

Create `public.payment_attempts` to make retries and double-click handling observable:

- `id uuid primary key`
- `payment_request_id uuid not null`
- `payer_user_id uuid not null`
- `wallet_id uuid not null`
- `network text not null`
- `idempotency_key uuid not null unique`
- `status text not null check (status in ('created', 'submitting', 'submitted', 'verified', 'failed'))`
- `stellar_tx_hash text null unique`
- `error_code text null`
- `created_at`, `updated_at`, `submitted_at`, `verified_at`
- unique active-attempt rule per payment request, enforced with a partial unique index where practical

Store stable, non-sensitive error codes only. Do not persist raw secrets, signed XDR, auth tokens, or verbose Horizon payloads in this table.

### 6.6 Transactions

Retain the existing table and strengthen it:

- Make verified snapshot fields required for new rows: source wallet, destination wallet, amount, asset code, network, ledger, and verified time.
- Change transaction amount storage to `numeric(19,7)` and keep amounts as canonical decimal strings at application boundaries.
- Add `network` and `ledger` if absent.
- Keep `stellar_tx_hash` unique.
- Make `payment_request_id` unique because one payment request can settle only once.
- Store only a redacted/minimized verification payload; do not duplicate an unrestricted Horizon response.
- Derive the source wallet from the matching on-chain payment operation, not request metadata supplied by the browser.

### 6.7 Receipts

Extend `public.receipts` with immutable snapshot and rendering fields:

- `transaction_id uuid not null unique references public.transactions(id)`
- `payer_user_id uuid null references auth.users(id) on delete set null`
- `network text not null`
- `merchant_name_snapshot text not null`
- `payment_title_snapshot text not null`
- `payment_description_snapshot text null`
- `source_wallet_snapshot text not null`
- `destination_wallet_snapshot text not null`
- `amount numeric(12,7) not null`
- `asset_code text not null`
- `asset_issuer text null`
- `stellar_tx_hash text not null`
- `paid_at timestamptz not null`
- `pdf_status text not null default 'queued' check (pdf_status in ('queued', 'generating', 'ready', 'failed'))`
- `pdf_path text null`
- `pdf_sha256 text null`
- `pdf_attempt_count integer not null default 0`
- `pdf_last_error_code text null`
- `pdf_generated_at timestamptz null`

Add consistency checks so `ready` requires a path, hash, and generated timestamp. Use a database-generated receipt number with a unique constraint. The receipt number is a display identifier, not an authorization token.

### 6.8 Atomic settlement RPC

Add `settle_payment_and_queue_receipt(...)` as `SECURITY DEFINER`, with an explicit `search_path`, service-role-only execution, and these steps in one transaction:

1. Lock the payment-request row with `FOR UPDATE`.
2. Validate pending/paid state, expiry, network, and immutable expected values.
3. If already paid by the same hash, return the existing transaction and receipt IDs as an idempotent success.
4. If already paid by a different hash, reject with a stable conflict code.
5. Bind `payer_user_id` only when allowed and never overwrite another payer.
6. Insert the verified transaction snapshot.
7. Mark the request paid and set `paid_at`.
8. Insert the immutable receipt snapshot with `pdf_status = 'queued'`.
9. Mark the related hosted attempt verified when an attempt ID is supplied.
10. Return payment request, transaction, and receipt identifiers.

Database constraints remain the final defense against duplicate transaction hashes, duplicate settlement per request, or duplicate receipts.

### 6.9 Storage

Create a private bucket named `invoices` or `receipts` and select one name consistently. Recommended object path:

```text
<merchant_id>/<payment_request_id>/<receipt_id>.pdf
```

The service role uploads objects. Client code does not directly list or read the bucket. An authenticated download route checks merchant ownership or matching `payer_user_id`, then returns a short-lived signed URL or streams the file. This avoids depending on complex Storage policies that expose broader folder enumeration.

## 7. Application implementation workstreams

### 7.1 Workstream A - Remove the product catalog

Delete catalog-only application files:

- `src/actions/products.ts`
- `src/lib/validation/product.schema.ts`
- `src/lib/validation/product.schema.test.ts`
- `src/app/(dashboard)/products/page.tsx`
- `src/app/(dashboard)/products/loading.tsx`
- `src/components/dashboard/create-product-form.tsx`
- `src/components/dashboard/products-page-content.tsx`
- `src/components/dashboard/products-table.tsx`

Update dependent files:

- Remove `productId` from `src/lib/validation/payment-request.schema.ts`.
- Remove `product_id` writes from `src/actions/payment-requests.ts` and `src/app/api/payment-requests/route.ts`.
- Stop loading products in `src/app/(dashboard)/invoices/page.tsx`.
- Remove product props and the selector from `src/components/dashboard/invoices-page-content.tsx` and `src/components/dashboard/create-invoice-form.tsx`.
- Remove the Products navigation item and icon from `src/components/layout/app-shell.tsx`.
- Remove `/products` from `src/proxy.ts`.
- Replace the dashboard product count with a payment-focused metric such as total verified volume for the currently displayed asset, or reduce the KPI grid to three cards until cross-asset totals are explicitly designed. Do not sum unlike assets into one monetary value.
- Remove product-specific query feedback and merchant-auth copy.
- Remove `products` and `product_id` from `src/types/database.ts`.

Do **not** delete generic marketing components such as `ProductShowcase` or rewrite sentences where “product” means Project ZERO itself. Only the merchant catalog feature is removed.

Update active design/UX documentation to mark the catalog route and invoice selector as removed. Historical completed plan files may remain as history, but should not be treated as current requirements.

### 7.2 Workstream B - Network-aware Stellar boundary

Replace the singleton environment-only client with server-only helpers, for example:

- `src/lib/stellar/network.ts`
- `src/lib/stellar/client.ts`

Expose:

- `parseStellarNetwork(value)`
- `getNetworkConfig(network)` returning Horizon URL and passphrase
- `getStellarServer(network)` with one cached server per network
- `assertNetworkEnabled(network)`

Update `buildPaymentXDR` so the same network value chooses both account-loading server and transaction passphrase. Do not accept a caller-provided passphrase independently of the chosen server.

Update `buildSep7Uri`, explorer links, payment badges, receipt copy, and dashboard labels to use the payment/transaction network instead of hardcoded Testnet wording.

Update `verifyPaymentByHash(hash, network, expected)` to:

- query the server selected by the payment request's database network;
- reject disabled networks before making a request;
- require a successful transaction;
- require the correct memo type and exact memo;
- inspect payment operations and identify the operation matching destination, amount, and asset;
- reject missing or ambiguous matches;
- validate the source wallet for hosted payments;
- normalize amounts at Stellar's seven-decimal precision;
- return a typed verified snapshot containing source, destination, amount, asset, issuer, network, ledger, hash, and on-chain timestamp;
- map Horizon not-found, rate-limit, timeout, and malformed-response cases to stable internal codes.

The API must pass this verified snapshot to the settlement RPC. It must not reconstruct transaction data from browser metadata.

### 7.3 Workstream C - Customer auth return path and KYC seam

The current registration form is merchant-specific. Add a minimal customer authentication path that collects only authentication credentials and returns safely to `/pay/<uuid>` after email confirmation/sign-in.

Requirements:

- Validate `next` as an internal relative path; reject protocol-relative and external URLs.
- Do not require a business name for customer registration.
- Do not create a merchant row for a customer unless they separately complete merchant onboarding.
- Allow one auth user to later become a merchant without creating a second identity.
- Do not collect legal identity or government-document data.

Define a server-only contract:

```ts
type WalletEligibility =
  | { allowed: true; decisionId: string }
  | { allowed: false; code: "KYC_REQUIRED" | "KYC_REJECTED" | "ACCOUNT_SUSPENDED" };
```

Until the separate KYC plan implements the adapter, production behavior is always denied. Tests may inject an allowed adapter. Do not add a user-controlled flag or auth metadata value that can grant eligibility.

### 7.4 Workstream D - Hosted-wallet custody foundation

Recommended server-only modules:

- `src/lib/wallets/crypto.ts`
- `src/lib/wallets/keyring.ts`
- `src/lib/wallets/repository.ts`
- `src/lib/wallets/provision.ts`
- `src/lib/wallets/eligibility.ts`
- `src/actions/wallets.ts` only if it exposes safe metadata operations

Provisioning service sequence:

1. Authenticate the user or accept a trusted internal user ID.
2. Call `assertHostedWalletEligible` and fail closed.
3. Acquire a database idempotency lock for `(auth_user_id, network)`.
4. Generate the Stellar keypair server-side.
5. Encrypt the secret immediately with the active key version and a fresh nonce.
6. Write metadata and ciphertext in one database transaction.
7. Return only wallet ID, public key, network, and status.
8. Fund via Friendbot only on testnet, with bounded retries and stable error codes.
9. Mark the wallet active only after the account is observable on the correct network.
10. Never return or log the secret, ciphertext, nonce, plaintext XDR containing sensitive annotations, or encryption key.

No public UI or route may invoke provisioning until KYC implementation is approved. Keep `HOSTED_WALLET_ENABLED=false` as the default and enforce it server-side.

### 7.5 Workstream E - Hosted payment action

Recommended module: `src/actions/payments.ts` or a dedicated authenticated API route if the UI requires structured polling.

Sequence:

1. Authenticate the session and apply user-plus-payment rate limits.
2. Validate the payment request UUID and idempotency key.
3. Load the canonical request from Supabase; reject missing, non-pending, expired, disabled-network, or invalid-asset requests.
4. Run the feature flag and KYC eligibility checks.
5. Load the current user's active wallet for the exact request network.
6. Atomically create or recover the `payment_attempts` row.
7. Verify the wallet has the required asset balance/trustline and enough XLM for minimum reserve plus fee. Return safe, actionable error codes.
8. Load and decrypt the wallet secret in a server-only scope.
9. Build from canonical request fields, sign with the hosted keypair, and submit to the request-selected Horizon server.
10. Persist the transaction hash on the attempt immediately after submission.
11. Call the same on-chain verifier used by the external-wallet path, including expected hosted source wallet.
12. Call `settle_payment_and_queue_receipt` with the verified snapshot.
13. Trigger PDF generation as best-effort post-settlement work; a failed trigger leaves the queued row for reconciliation.
14. Return a typed result containing safe status, transaction hash, receipt ID, and next URL.

Double submissions with the same idempotency key return the existing outcome. Concurrent attempts for the same request must not create two transactions. A browser cancellation after submission must be recoverable from `payment_attempts` and reconciliation.

### 7.6 Workstream F - External-wallet verification integration

Keep `/api/stellar/verify`, but route it through the same network-aware verifier and settlement RPC.

- Read the network only from the stored request.
- Do not accept `signedByProjectZero`, `sourceWallet`, amount, destination, or asset as trusted client metadata.
- If an authenticated user verifies an external payment, bind them only under an explicit payer-binding rule; otherwise leave the payer nullable.
- Return idempotent success when the same request/hash was already settled.
- Preserve the existing per-payment-and-client rate limit and replace the in-memory implementation with a shared store before multi-instance production deployment.

### 7.7 Workstream G - Receipt generation and access

Recommended files:

- `src/lib/payments/pdf.ts`
- `src/lib/payments/receipt-repository.ts`
- `src/app/api/receipts/[id]/generate/route.ts` for an authenticated internal job endpoint, or a dedicated worker
- `src/app/api/receipts/[id]/download/route.ts`
- `src/app/pay/[paymentRequestId]/receipt/page.tsx`

PDF worker behavior:

1. Claim one queued/failed receipt using a lock so two workers cannot render it concurrently.
2. Set `pdf_status = 'generating'` and increment the attempt count.
3. Render exclusively from receipt snapshot columns.
4. Include receipt number, merchant, payment title/description, amount/asset, masked source/destination, transaction hash, network, payment time, and an explorer URL.
5. Avoid embedding customer email, auth UUID, hosted-wallet secret data, raw payloads, or future KYC fields.
6. Compute SHA-256, upload to the deterministic private path, then atomically mark the row ready with path/hash/time.
7. On failure, record a stable error code, return to failed, and retry with capped exponential backoff.
8. After the retry threshold, alert operations but keep manual retry possible.

Receipt UI behavior:

- Paid pages render the database receipt snapshot, not just client-held payment state.
- Show `Preparing receipt` while queued/generating and a retry-safe refresh state if failed.
- The download route authorizes either the owning merchant or the receipt's payer user.
- Signed URLs should be short-lived and never stored in the database.
- Anonymous users may see the existing minimal paid confirmation, but cannot download a private PDF unless an explicit bearer-token design is approved later.

### 7.8 Workstream H - Reconciliation and operations

Add a protected scheduled reconciliation route or worker that:

- finds `submitted` attempts not yet verified;
- verifies their hashes on the attempt/request network;
- settles valid payments idempotently;
- marks terminal on-chain failures with stable codes;
- retries queued/failed receipt generation;
- detects paid requests missing a transaction or receipt and alerts rather than silently fabricating data;
- processes bounded batches with cursors and a time budget;
- uses a secret or platform-native cron authentication and rejects normal sessions.

Log identifiers, state transitions, duration, network, and error codes. Redact credentials, keys, ciphertext, signed XDR, full auth payloads, and future KYC data. Add metrics for submission success, verification latency, settlement conflicts, reconciliation recovery, PDF success, and PDF retry exhaustion.

## 8. Phased delivery plan

### Phase 0 - Contract freeze and product removal

Tasks:

- Pin network, status, verified-snapshot, settlement-result, receipt-status, and wallet-eligibility TypeScript contracts.
- Add the forward migration that removes `product_id` and `products`.
- Remove catalog UI/actions/routes/types/tests and product loading from invoice creation.
- Update dashboard metrics and active documentation.
- Regenerate or manually synchronize database types.

Exit gate:

- A merchant can create and view a payment request using title, optional description, amount, asset, and expiry only.
- No runtime query references `products` or `product_id`.
- `rg` finds no catalog feature references outside explicitly historical documentation.
- Migration reset, RLS tests, unit tests, lint, and production build pass.

### Phase 1 - Network-aware payments and hardened verification

Tasks:

- Add/backfill `payment_requests.network`.
- Add network-aware server/client helpers and enabled-network guards.
- Update XDR building, SEP-7, explorer links, badges, verification, and tests.
- Return a complete verified transaction snapshot.
- Add network and required snapshot fields to transactions.

Exit gate:

- Testnet requests use only testnet Horizon and passphrase.
- A forged or mismatched network is rejected before settlement.
- Wrong memo, destination, amount, asset, issuer, source, failed transaction, missing payment operation, and ambiguous operation tests all fail closed.
- Existing Freighter testnet payment still completes end to end.

### Phase 2 - Atomic settlement and receipt pipeline

Tasks:

- Add payer binding, strengthened transactions, receipt snapshot/lifecycle fields, and the private bucket.
- Implement `settle_payment_and_queue_receipt` and migrate both verify paths to it.
- Implement PDF rendering, upload, retry, authorization, receipt page, and signed download.
- Add reconciliation for missing/failed receipt work.

Exit gate:

- One verified hash produces exactly one paid request, transaction, and receipt.
- Repeating the same settlement returns the same result; a different hash conflicts.
- PDF failure does not undo payment settlement.
- Merchant and bound payer can download; unrelated authenticated users and anonymous callers cannot.
- Storage objects contain no disallowed identity or secret fields.

### Phase 3 - Hosted-wallet custody foundation (disabled)

Tasks:

- Add wallet metadata, secret isolation, encryption/keyring, repository, provisioning service, and Friendbot testnet adapter.
- Add the fail-closed eligibility adapter and default-off feature flag.
- Add customer authentication and safe return-to-payment behavior.
- Complete encryption, RLS, concurrency, and secret-leak tests.

Exit gate:

- No browser-accessible query can read wallet ciphertext.
- The same user/network cannot receive duplicate wallets under concurrency.
- Wrong key version, modified ciphertext, invalid nonce, and disabled feature tests fail closed.
- Provisioning remains unreachable in production configuration while KYC is deferred.

### Phase 4 - Hosted payment integration (test-only gate)

Tasks:

- Add payment attempts and the hosted payment action.
- Build, sign, submit, verify, settle, and enqueue receipts through the canonical pipeline.
- Add UI states for auth required, KYC required, wallet unavailable, insufficient balance/reserve, submitting, recovering, paid, and receipt preparing/ready.
- Add reconciliation for interrupted hosted attempts.

Exit gate:

- An injected eligible test user with a funded testnet hosted wallet can complete the full round trip.
- Double-clicks, action retries, network timeouts, and process interruption do not double-pay or double-settle.
- A non-eligible real session always receives `KYC_REQUIRED` and no wallet is created or decrypted.
- Hosted payment remains disabled in normal deployment.

### Phase 5 - KYC integration gate and testnet soak

This phase does not implement KYC. It is a release gate for the future KYC plan.

Required before enabling hosted wallets:

- The approved KYC implementation supplies `assertHostedWalletEligible` from authoritative server-side state.
- KYC revocation/suspension behavior for existing wallets is defined.
- Key management and rotation are reviewed.
- Threat model and custody incident runbook are approved.
- Shared rate limiting and scheduled reconciliation are deployed.
- A testnet soak covers success rate, latency, failure recovery, and receipt delivery.
- Mainnet remains disabled.

## 9. Test strategy

### 9.1 Unit tests

- Network parsing/config mapping and disabled-mainnet behavior.
- XDR network/server consistency, amount precision, memo limit, and asset issuer validation.
- Verifier success and every mismatch/failure code.
- Encryption round-trip, unique nonce, tamper rejection, wrong key version, and rotation reads.
- Eligibility adapter default denial.
- Payment idempotency and safe error mapping.
- Receipt snapshot formatting and PDF content allowlist.
- Internal redirect validation.

### 9.2 Database and RLS tests

- Product table and `product_id` are absent after migration.
- Merchant isolation for payment requests, transactions, and receipts.
- Customer reads only their own wallet metadata and bound receipts.
- No authenticated or anonymous wallet-secret access.
- Merchant cannot directly set settlement fields, payer binding, transaction rows, or receipt ready state.
- Settlement RPC is service-role only.
- Concurrent same-hash settlement is idempotent.
- Concurrent different-hash settlement produces one success and one conflict.
- Receipt constraints enforce ready/path/hash consistency.

### 9.3 Route and action tests

- Unauthenticated, unauthorized, invalid-body, rate-limited, expired, wrong-network, disabled-feature, and KYC-required cases.
- Hosted action never accepts client overrides for canonical payment fields.
- Verify endpoint derives network from the database.
- Receipt download rejects cross-merchant/cross-user access.
- Cron/reconciliation endpoint requires its configured secret and respects batch limits.

### 9.4 Integration and failure-injection tests

- Existing external Freighter payment to verification to receipt.
- Hosted test-wallet payment to verification to receipt using an injected eligible adapter.
- Horizon submit succeeds but the HTTP response is lost.
- Process stops after hash persistence but before verification.
- Database settles but PDF trigger fails.
- PDF upload succeeds but DB ready update fails.
- Duplicate job delivery and concurrent receipt workers.
- Horizon 404 eventual consistency, 429, 5xx, and timeout behavior.
- Friendbot duplicate funding/temporary failure.

### 9.5 Final verification commands

Run at each merge gate:

```bash
npm test
npm run lint
npm run build
npx supabase db reset
npx supabase test db
```

If the local Supabase project is not linked, record that limitation and run the repository's local migration/RLS workflow plus a live testnet smoke test through the real app/API/database path.

## 10. Security review checklist

- [ ] No encryption key, Stellar secret, ciphertext, signed XDR, service-role key, or cron secret appears in client bundles or logs.
- [ ] Hosted-wallet modules use `server-only` boundaries.
- [ ] Every privileged route re-authenticates and authorizes; UI visibility is not treated as authorization.
- [ ] KYC eligibility fails closed and cannot be granted from user metadata or client input.
- [ ] All network, amount, destination, memo, and asset expectations come from the stored payment request.
- [ ] Hosted source wallet comes from the authenticated user's stored wallet and is checked on-chain.
- [ ] Settlement is idempotent and concurrency-safe.
- [ ] External side effects are retried through explicit states rather than hidden inside DB transactions.
- [ ] Receipt downloads are access-controlled and signed URLs are short-lived.
- [ ] Raw Horizon payload retention is minimized.
- [ ] Rate limiting is shared across instances before production activation.
- [ ] CSP, CSRF/origin behavior for mutation routes, request-size limits, and safe error responses are reviewed.
- [ ] Backup/restore, key rotation, wallet suspension, and custody incident procedures are documented before hosted-wallet enablement.

## 11. Environment and configuration

Add placeholders to `.env.example` without real values:

```text
HOSTED_WALLET_ENABLED=false
STELLAR_MAINNET_ENABLED=false
WALLET_ACTIVE_KEY_VERSION=1
WALLET_ENCRYPTION_KEY_V1=
RECEIPT_CRON_SECRET=
```

Keep testnet and mainnet Horizon URLs in a validated server-side configuration map. Environment configuration may define endpoints and enabled flags; it must not override the network stored on a payment request during a request.

Before any hosted-wallet production activation, replace or formally approve the testnet environment-key strategy with managed key storage and document rotation/recovery.

## 12. File ownership map

| Area | Primary files |
| --- | --- |
| Product removal | Product files listed in Workstream A, invoice/dashboard/nav/proxy/type files |
| Database | `supabase/migrations/2026MMDD_*`, `supabase/schema.sql`, `supabase/rls.sql`, `supabase/tests/rls.test.sql` |
| Network/verifier | `src/lib/stellar/network.ts`, `src/lib/stellar/client.ts`, `src/lib/stellar/build-payment.ts`, `src/lib/stellar/verify-payment.ts` |
| Verify/settlement | `src/app/api/stellar/verify/route.ts`, database settlement RPC, related tests |
| Customer auth/KYC seam | auth pages/actions, `src/lib/wallets/eligibility.ts` |
| Wallet custody | `src/lib/wallets/*`, optional safe metadata action, wallet tests |
| Hosted pay | `src/actions/payments.ts`, `src/lib/payments/payment-attempts.ts`, payment UI states |
| Receipts | `src/lib/payments/pdf.ts`, receipt repository, generation/download routes, receipt page |
| Operations | reconciliation route/worker, scheduler config, structured logging/metrics |
| Shared types | `src/types/database.ts`, `src/types/payment.ts`, new wallet/receipt contracts |

Avoid parallel edits to the same shared schema, generated types, payment card, or settlement function. Merge database contracts and shared types before dependent UI/action branches.

## 13. Dependency order

```text
Product removal + shared contracts
              |
              v
Network-aware request/verifier
              |
              v
Atomic settlement + receipt queue ---> PDF worker/download/reconciliation
              |
              v
Wallet custody foundation (disabled)
              |
              v
Customer auth + hosted attempt/action (test-only)
              |
              v
Future KYC adapter implementation
              |
              v
Hosted-wallet enablement + testnet soak
```

Receipt work can ship for existing external-wallet payments before hosted-wallet activation. This delivers useful roadmap functionality without waiting for KYC.

## 14. Definition of done

The non-KYC roadmap work is complete when:

- The product catalog and payment-product association are removed from database and runtime code.
- Merchants create standalone payment requests with no product dependency.
- Every request and transaction is pinned to a validated Stellar network.
- External-wallet payments still work and settle through the hardened idempotent RPC.
- Each verified payment produces exactly one canonical transaction and one receipt record.
- PDF generation is private, authorized, retryable, and recoverable.
- Hosted-wallet keys can be provisioned and used only in isolated tests with an injected eligibility decision.
- Normal deployments keep hosted provisioning/payment disabled and fail with `KYC_REQUIRED`.
- Reconciliation recovers interrupted submissions and receipt jobs without duplicate settlement.
- Migrations, RLS tests, unit/integration tests, lint, build, and a live testnet smoke pass succeed.
- A separate approved KYC plan is the only remaining functional blocker to enabling the hosted-wallet customer path.

## 15. Questions intentionally handed to the KYC plan

The future KYC plan must answer these before Phase 5 can pass:

1. Which authoritative record and provider determine wallet eligibility?
2. Are merchant and customer checks identical or role-specific?
3. What happens to an active hosted wallet and pending payment when eligibility is suspended or rejected?
4. What data is stored locally versus only at the KYC provider, and for how long?
5. How are provider webhooks authenticated, replay-protected, audited, and reconciled?
6. Which support/admin actions exist, and what approval/audit controls protect them?
7. Does KYC approval authorize provisioning only, each payment, or both?
8. What customer-visible remediation and appeal states are required?

Until these questions are resolved, the payment and receipt foundations may be implemented and tested, but hosted-wallet functionality must remain disabled for real users.
