# Project ZERO — MVP Roadmap (4-Dev Parallel Plan)

> **Note:** The "Current state vs MVP" table below reflects a pre-implementation snapshot (2026-01). For the live route audit, functional status, and acceptance criteria, see [`docs/design.md`](./design.md).

Aligned to `docs/whitepaper.md`. MVP sentence: *merchant creates an invoice → generates a QR code and payment link → customer reviews the invoice in their wallet → authorizes the payment → Stellar settles → merchant dashboard automatically marks the invoice as paid.*

Goal of this doc: 4 devs work in parallel with minimal merge conflict. Each dev owns a **track** = a vertical slice of files. Shared seams are pinned contracts (types, SQL fn signatures, API shapes) defined up front in §Shared Contracts.

---

## Current state vs MVP

| MVP step | Status | Note |
|---|---|---|
| Merchant creates an invoice | ✅ done | `createPaymentRequest` + `POST /api/payment-requests`, Zod, `requireMerchantId` |
| Generates QR + payment link | 🟡 partial | `buildPaymentLink` works; QR only on customer `/pay` page |
| Customer reviews in wallet | ❌ missing | No Freighter, no SEP-7, no XDR |
| Customer authorizes | ❌ missing | Pay button disabled; no `requestSignature` |
| Stellar settles | ❌ missing | No tx build/submit; `getStellarServer()` has zero callers — stellar-lib dead code |
| Dashboard auto-marks paid | ❌ missing | `verifyPaymentByHash` stub; `/api/stellar/verify` → 501; no `status='paid'` write |
| Security: secrets never leave wallet | 🟡 partial | Vacuously true today; real only after wallet signing lands |
| Security: merchant verifies on-chain (memo+destination+amount+asset) | ❌ missing | Stub. Four axes persisted, no verifier consumes them |
| Security: merchant account integrity (auth/RLS/validation) | ✅ done | **Caveat:** `stellar_destination` not re-bound server-side |

## Blockers / high-severity gaps

1. No wallet integration / authorization (`/pay/[id]` Pay button disabled).
2. No server-side on-chain verification (`verify-payment.ts` stub, `/api/stellar/verify` → 501).
3. No settlement detection (`getStellarServer()` never imported).
4. No mark-paid write path (nothing UPDATEs `status='paid'`; `canMarkPaymentRequestPaid` unused).
5. No wallet-consumable artifact (`describeTestnetPayment` returns plain data; no `TransactionBuilder`/`Operation.payment`/`Memo`/SEP-7).
6. No DB write path for verified `transactions`/receipts.
7. Memo uses `Math.random`; memo is public on `/pay` → treat as **public correlation key**, not secret.
8. `stellar_destination` not re-bound server-side → compromised session can point invoices at arbitrary addresses.

## Risks

- "Customer secrets never leave wallet" vacuously true today — untested until wallet flow exists.
- stellar-lib dead code → wiring late surfaces drift (testnet passphrase hardwired in `describeTestnetPayment` would silently mismatch a mainnet Horizon URL).
- No RLS/server-action integration tests → integrity pillar implemented but unverified by automation.

---

## Shared Contracts (pin these BEFORE parallel work starts)

These are the seams between tracks. Lock the shapes first; each dev codes against the contract, not against another dev's WIP.

### `src/types/database.ts` — DB row types (Dev C owns, everyone imports)

```ts
export type PaymentRequest = {
  id: string
  merchant_id: string
  stellar_destination: string   // server-bound, never client-supplied
  amount: string                // string to preserve precision
  asset_code: string            // 'XLM' default
  asset_issuer: string | null   // null iff asset_code === 'XLM'
  memo: string                  // PUBLIC correlation key, not a secret
  status: 'pending' | 'paid' | 'expired'
  expires_at: string
  paid_at: string | null
  created_at: string
}
```

### `src/lib/stellar/build-payment.ts` — wallet artifact (Dev A owns, Dev B consumes)

```ts
export type PaymentParams = {
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
  memo: string
  networkPassphrase: string
}
export function buildPaymentXDR(params: PaymentParams): string          // signed-envelope-ready XDR
export function buildSep7Uri(params: PaymentParams & { payLink: string }): string
```

### `src/lib/stellar/verify-payment.ts` — verifier (Dev A owns, Dev C consumes)

```ts
export type VerifyExpected = {
  memo: string
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
}
export type VerifyResult = { ok: boolean; reason?: string }
export function verifyPaymentByHash(hash: string, expected: VerifyExpected): Promise<VerifyResult>
```

### `POST /api/stellar/verify` — settle endpoint (Dev C owns, Dev B calls)

- Request: `{ paymentRequestId: string, stellarTxHash: string }`
- Response: `{ ok: boolean, reason?: string }`
- Merchant-auth required. Service-role client. Calls `verifyPaymentByHash` then `mark_payment_paid()`.

### `mark_payment_paid()` SQL (Dev C owns)

```sql
mark_payment_paid(p_request_id uuid, p_tx_hash text, p_payload jsonb)
-- SECURITY DEFINER. Atomic: insert transactions + flip status pending->paid.
```

### `GET /api/stellar/status` — poll endpoint (Dev C owns, Dev D consumes)

- Response: `{ id, status, paid_at }` (Dev D polls from dashboard).

---

## Dev tracks

### Track A — Stellar on-chain (settlement + verification logic)
**Owner:** dev A
**Owns:** `src/lib/stellar/*`, `src/constants/stellar.ts`
**Mission:** real tx construction + on-chain verification. Kill the dead-code status.
**Depends on:** §Shared Contracts only.
**Blocks:** Dev B (needs `buildPaymentXDR`/`buildSep7Uri`), Dev C (needs `verifyPaymentByHash`).

### Track B — Customer wallet UI
**Owner:** dev B
**Owns:** `src/app/pay/[paymentRequestId]/page.tsx`, `src/components/payment/*`
**Mission:** customer reviews + authorizes in wallet on `/pay/[id]`.
**Depends on:** Dev A `buildPaymentXDR`/`buildSep7Uri` (can stub against contract first).
**Blocks:** nothing (hands hash to Dev C's `/api/stellar/verify`).

### Track C — Backend / DB / settle
**Owner:** dev C
**Owns:** `supabase/*`, `src/lib/supabase/*`, `src/actions/*`, `src/app/api/*`, `src/lib/validation/*`, `src/lib/payments/payment-request.ts`, `src/types/database.ts`
**Mission:** trustworthy persisted payment_request, verify endpoint, atomic mark-paid, server-side destination binding.
**Depends on:** §Shared Contracts. Dev A `verifyPaymentByHash` for Phase 3 (stub-OK until then).
**Blocks:** Dev B (needs `/api/stellar/verify`), Dev D (needs `mark_payment_paid`, status poll).

### Track D — Merchant dashboard + tests + infra
**Owner:** dev D
**Owns:** `src/app/(dashboard)/*`, `src/components/dashboard/*`, `vitest.config.ts`, `*.test.ts`, `supabase/tests/*`
**Mission:** merchant QR generation, live status polling, expiry, full test harness.
**Depends on:** Dev C status poll + `mark_payment_paid`; everyone's code under test.
**Blocks:** nothing in-critical-path; gates M4.

### File ownership matrix (no two devs edit same file)

| Path | Owner |
|---|---|
| `src/lib/stellar/build-payment.ts` | A |
| `src/lib/stellar/verify-payment.ts` | A |
| `src/lib/stellar/client.ts` | A |
| `src/constants/stellar.ts` | A |
| `src/app/pay/[paymentRequestId]/page.tsx` | B |
| `src/components/payment/payment-request-card.tsx` | B |
| `src/components/payment/copy-payment-link.tsx` | B |
| `src/components/payment/payment-page-placeholder.tsx` | B |
| `supabase/schema.sql` | C |
| `supabase/rls.sql` | C |
| `supabase/migrations/*` | C |
| `src/lib/supabase/*` | C |
| `src/actions/*` | C |
| `src/app/api/*` | C |
| `src/lib/validation/*` | C |
| `src/lib/payments/payment-request.ts` | C |
| `src/types/database.ts` | C |
| `src/app/(dashboard)/*` | D |
| `src/components/dashboard/*` | D |
| `vitest.config.ts` | D |
| `*.test.ts` (new) | D |
| `supabase/tests/*` | D |

**Conflict rule:** if a file must change across tracks, the **owner** makes the edit; the other dev files a ticket with the exact diff. Shared-contract files (`src/types/database.ts`, §Shared Contracts signatures) change only via PR review.

---

## Phases (each phase = 1 merge gate per track)

### Phase 1 — Foundation (parallel start)

All four tracks start here simultaneously. No cross-track dependency yet.

**Track A tasks:**
- Add `STELLAR_NETWORK_PASSPHRASE`, `STELLAR_NETWORK` constants pairing with Horizon URL (fix silent mismatch footgun). Testnet-only values.
- Scaffold `buildPaymentXDR` + `buildSep7Uri` signatures (return real XDR via `TransactionBuilder` + `Operation.payment` + `Memo.text`; `Asset.native()` for XLM, `new Asset(code, issuer)` for credit).
- Scaffold `verifyPaymentByHash` signature (call `getStellarServer().transactions().transaction(hash)`, load payments). Real logic in Phase 3.
- Unit-test `buildPaymentXDR` round-trips through `Transaction.fromXDR`.

**Track A acceptance:**
- `buildPaymentXDR` produces valid XDR decodable by `stellar-sdk`.
- `getStellarServer()` imported by `build-payment.ts` + `verify-payment.ts` — stellar-lib no longer dead code.
- Network passphrase constant paired with Horizon URL.

**Track B tasks:**
- Build `'use client'` wallet component in `payment-request-card.tsx` against the contract: import `@stellar/freighter-api`, call `requestSignature` with `buildPaymentXDR` (stub return OK until Dev A lands), submit to testnet via `getStellarServer()`.
- Enable Pay button. Surface wallet-connection / signing errors inline.
- Post returned `stellarTxHash` to `/api/stellar/verify` (Dev C endpoint stub OK).
- Render success state on `ok`.

**Track B acceptance:**
- `/pay/[id]` with Freighter on Testnet: Pay opens wallet showing correct destination, amount, asset, memo from the row.
- Approve ⇒ broadcasts Testnet tx ⇒ receives `stellar_tx_hash`.
- Reject / no wallet ⇒ readable error, no broadcast.

**Track C tasks:**
- Migration `_asset_issuer.sql`: `ALTER TABLE payment_requests ADD COLUMN asset_issuer text` + `CHECK` (non-XLM ⇒ non-null issuer `^G[A-Z0-9]{55}$`; XLM ⇒ null).
- Extend `payment-request.schema.ts` + `src/types/database.ts` with `asset_issuer`.
- In `createPaymentRequest` + `POST /api/payment-requests`: drop client `stellar_destination`; resolve server-side to `merchant.stellar_public_key` else `PROJECT_ZERO_TREASURY_PUBLIC_KEY`. Reject inbound field.
- Replace `createPaymentMemo` entropy with `crypto.randomUUID`/webcrypto.
- Migration `_mark_payment_paid.sql`: `SECURITY DEFINER` `mark_payment_paid(p_request_id, p_tx_hash, p_payload)` — insert `transactions` + flip pending→paid atomically.
- `src/lib/supabase/service.ts`: service-role client (SERVICE_ROLE key).
- Stub `POST /api/stellar/verify` to accept `{paymentRequestId, stellarTxHash}` and return `{ok:false, reason:'verify pending Phase 3'}` (real wiring Phase 3).
- Doc note in `docs/whitepaper.md` or README: memo is **public** correlation key; verification = four-tuple match.

**Track C acceptance:**
- Migration applies cleanly on fresh Supabase; `asset_issuer` CHECK rejects non-XLM row with null issuer.
- `POST /api/payment-requests` with hidden `stellar_destination` = arbitrary G-key is **ignored**; stored row = merchant's key (or treasury fallback).
- New memos are 128-bit+ crypto-random.
- `mark_payment_paid()` exists, atomic, only flips pending.
- `/api/stellar/verify` accepts the contract request shape (stub OK).

**Track D tasks:**
- Configure `vitest.config.ts`: jsdom env, setupFiles, mocks for `@stellar/stellar-sdk`, `@stellar/freighter-api`, `@supabase/ssr`, `next/navigation`.
- Render QR of `buildPaymentLink` on merchant dashboard invoice row/detail (`react-qr-code`).
- Add dashboard polling scaffold of `/api/stellar/status` (interval, abort on unmount) on recent-requests list.
- Write test skeleton files (verify, auth, settle, RLS) — fill as other tracks land.

**Track D acceptance:**
- `vitest.config.ts` loads jsdom + mocks; existing tests still green.
- Merchant dashboard shows QR per invoice scanning to `/pay/<id>`.
- Dashboard polling scaffold runs without errors (status loads at minimum).

**Phase 1 merge gate (M1):** Track A XDR decodable + stellar-lib wired; Track C migrations applied + destination server-bound + `mark_payment_paid()` exists; Track B + D scaffolds green.

---

### Phase 2 — Wire wallet ↔ settle ↔ dashboard

Cross-track wiring. Depends on Phase 1 contracts landed.

**Track A tasks:**
- Harden `buildPaymentXDR` for credit assets (`new Asset(code, issuer)`); add tests for native vs credit.
- Implement `verifyPaymentByHash` real logic: fetch tx, load payments, find payment op, assert destination/amount/asset code (+ issuer for non-native)/memo.text. Return `{ok, reason}`.
- Return `reason` naming the failing axis.

**Track A acceptance:**
- `verifyPaymentByHash` matches a real testnet tx; returns `{ok:false, reason:'memo'}` (etc.) on tampered input.
- Credit-asset XDR builds and verifies with issuer.

**Track B tasks:**
- Replace stub `buildPaymentXDR` import with Dev A's real export.
- After wallet submit, POST hash to `/api/stellar/verify`; on `ok` flip customer UI to paid/success.
- Handle `verify` failure (show which axis failed, do not mark paid).

**Track B acceptance:**
- Customer `/pay` shows paid/success after verify round-trip on a matching tx.
- Tampered tx shows verify failure, no paid state.

**Track C tasks:**
- Wire `POST /api/stellar/verify`: parse contract request, load row (service-role), call `verifyPaymentByHash`, on `ok` invoke `mark_payment_paid()` via service client. Return `{ok, reason}`. Remove 501 stub.
- Implement `settlePaymentRequest` server action: `canMarkPaymentRequestPaid` ⇒ `mark_payment_paid()`. No app-layer direct UPDATE.
- Require merchant auth on `/api/stellar/verify`; re-check `expires_at`/`status` in `/api/stellar/status`.

**Track C acceptance:**
- `POST /api/stellar/verify` with real testnet hash matching row ⇒ `{ok:true}`, row pending→paid, `paid_at` set, `transactions` row inserted.
- Tampered tx ⇒ `{ok:false, reason:<axis>}`, row stays pending.
- No app-layer direct `UPDATE payment_requests SET status` — only via SQL fn.

**Track D tasks:**
- Dashboard polling flips badge to `paid` within one poll interval after settlement (no manual reload).
- Unit tests for `verifyPaymentByHash` vs mocked Horizon: one match + one mismatch per axis (memo, destination, amount, asset code, asset issuer).
- Tests for `createPaymentRequest`: `requireMerchantId`, server-side destination rebinding ignoring client value, `asset_issuer` CHECK.

**Track D acceptance:**
- Dashboard badge flips to paid live after a testnet settlement.
- Verify test suite **fails** if any of the four comparison axes is removed/weakened.
- `createPaymentRequest` tests green.

**Phase 2 merge gate (M2 + M3):** end-to-end whitepaper MVP flow runs — invoice created → customer signs in wallet → Stellar settles → server verifies on-chain → dashboard marks invoice paid automatically.

---

### Phase 3 — Hardening, expiry, RLS tests

**Track A tasks:**
- Edge cases: memo length limits, amount precision, missing payment op in tx.
- Document native vs credit asset handling.

**Track B tasks:**
- Wallet-not-installed fallback (SEP-7 deeplink QR for non-Freighter wallets).
- Error UX polish.

**Track C tasks:**
- Migration `_expire_pending.sql`: `pg_cron` job (or externally-scheduled Next route) `UPDATE payment_requests SET status='expired' WHERE status='pending' AND expires_at < now()`.
- Rate-limit public `/api/stellar/status`.

**Track D tasks:**
- Test for `settlePaymentRequest`/`mark_payment_paid`: only pending flips; `transactions` row inserted with correct payload.
- RLS integration test: cross-merchant reads/writes on `payment_requests` + `transactions` blocked.
- Expiry test: pending row past `expires_at` → `expired`.

**Track D acceptance:**
- `settlePaymentRequest` test green.
- RLS test asserts cross-merchant access blocked.
- Pending invoice with past `expires_at` transitions to `expired` via cron.

**Phase 3 merge gate (M4):** CI covers verify/auth/settle/RLS; stale invoices expire; dashboard reflects settlement live.

---

## Milestones

- **M1** — Phase 1 merged: contracts landed, stellar-lib wired, migrations applied, destination server-bound, `mark_payment_paid()` exists, dashboard QR + polling scaffold.
- **M2** — Track A `verifyPaymentByHash` real + Track B wallet wires Dev A's real XDR.
- **M3** — End-to-end whitepaper MVP flow runs (invoice → wallet sign → Stellar settles → verify → dashboard auto-paid).
- **M4** — Phase 3 merged: CI covers verify/auth/settle/RLS; stale invoices expire; dashboard reflects settlement live.

## Merge order / dependency DAG

```
Phase 1:  A ──┐
         B ──┤ (stub against contract) ──→ M1
         C ──┤ (contracts + migrations)
         D ──┘ (scaffold + test harness)

Phase 2:  A.real-verify ──→ C.wire-verify ──→ B.success-state ──→ M3
                              ↑
                  B.posts-hash ┘
                  D.dashboard-poll + verify tests

Phase 3:  all tracks harden ──→ M4
```

Rule: a track merges to `main` only when its Phase acceptance passes. Cross-track PRs wait on the contract file, not on another track's branch.

## Per-dev setup

1. Clone, `npm i`.
2. Create Supabase project (Dev C shares connection string + service key via env, never committed).
3. `cp .env.example .env.local` — fill `STELLAR_HORIZON_URL`, `STELLAR_NETWORK_PASSPHRASE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PROJECT_ZERO_TREASURY_PUBLIC_KEY`.
4. Install Freighter browser wallet, switch to **Testnet**, fund via friendbot.
5. Branch per track: `feat/track-a-stellar`, `feat/track-b-wallet`, `feat/track-c-backend`, `feat/track-d-dashboard-tests`.
6. Each track PR targets `main`; CI must run `npm run lint && npm test`.

## Open questions (need human decision before Phase 1)

1. **Testnet vs mainnet for MVP** — confirm Testnet-only, defer network-switch abstraction?
2. **Asset code** — XLM-native only, or enable one Testnet credit asset (USDC testnet) now that `asset_issuer` is modeled?
3. **Settlement detection** — customer posts tx hash (current plan), or also need server-side Horizon poller/stream for memo-matching txs?
4. **Wallet target** — Freighter only, or must SEP-7 URI also work with Albedo/xBull via the same QR?
5. **Service-role key storage** — confirm `SERVICE_ROLE` key server-side only via env, never in client bundle?
6. **Rate-limit store** for public `/api/stellar/status` — in-memory, Supabase row, or edge KV?