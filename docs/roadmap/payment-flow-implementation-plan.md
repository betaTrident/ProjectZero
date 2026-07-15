# Project ZERO - Payment and Transaction Flow Implementation Plan (Draft)

> Status: Draft for review  
> Source roadmap: `docs/roadmap/payment-flow-roadmap.md`  
> Scope: Product-catalog removal, network-aware Stellar payments, OpenKYC-backed identity verification, hosted-wallet foundations, transaction settlement, reconciliation, and generated PDF receipts
> Deferred: Mainnet activation, formal SEP-12 interoperability, and final jurisdiction-specific compliance policy

## 1. Objective

Implement the payment-flow roadmap as a secure, testnet-first extension of the current MVP, including a hardened integration of the self-hosted `K:\ID-Verification-OpenKYC` service.

The finished flow should let an approved merchant create a payment request without selecting or tracking a product, let a customer pay through either the existing external-wallet path or an OpenKYC-approved Project ZERO hosted wallet, verify the on-chain payment against immutable server-side expectations, record the transaction exactly once in Supabase, and provide an access-controlled PDF receipt.

OpenKYC owns collection and review of identity evidence. Project ZERO owns authentication, the user-to-verification binding, the derived eligibility decision, wallet/payment authorization, and the audit trail. Raw identity documents, biometric images, OCR payloads, and liveness artifacts must not be copied into Supabase, receipts, logs, analytics, or payment metadata.

## 2. Scope boundaries

### 2.1 In scope

- Remove the merchant product catalog and all product associations from the live application flow.
- Keep `payment_requests` as the merchant-created payment intent/invoice record.
- Keep `transactions` as the canonical record of a verified Stellar settlement.
- Make Stellar network selection data-driven per payment request and hosted wallet.
- Add customer authentication paths needed to return an authenticated customer to a payment link.
- Deploy OpenKYC as a separately isolated service and harden its session, moderator, webhook, storage, and status APIs before integration.
- Add authenticated customer and merchant verification journeys using opaque OpenKYC session references.
- Add minimal KYC case, provider-event, and audit records in Supabase without storing raw identity evidence.
- Add signed webhook ingestion plus scheduled provider reconciliation so status changes are fast, replay-safe, idempotent, and recoverable.
- Require approved customer KYC for hosted-wallet provisioning and re-check derived eligibility before every hosted payment.
- Require approved merchant KYC before new payment requests can be published once merchant enforcement is enabled.
- Add a secure hosted-wallet storage and encryption foundation without publicly enabling provisioning.
- Add an authenticated, server-side hosted payment action behind a fail-closed eligibility gate and feature flag.
- Make settlement, transaction insertion, payer binding, and receipt-record creation idempotent and database-atomic.
- Generate PDF receipts outside the settlement transaction through a retryable job.
- Store PDFs in a private Supabase Storage bucket and issue short-lived signed URLs only after authorization.
- Add reconciliation, observability, rate limiting, tests, and testnet operational gates.
- Preserve the current external Freighter/SEP-7 payment path during the transition.

### 2.2 Explicitly deferred

- Mainnet hosted-wallet or merchant-KYC enforcement.
- Claiming that OpenKYC alone satisfies any specific country's legal KYC, AML, sanctions-screening, age-verification, or data-residency requirements; counsel/compliance approval remains a launch gate.
- Formal SEP-12 server compatibility, SEP-10/SEP-45 authentication, and advertising `KYC_SERVER` in `stellar.toml`. The first integration uses Supabase auth because KYC happens before a hosted Stellar account exists.
- Copying OpenKYC forms or raw provider payloads into Project ZERO.
- Embedding the verification app in an iframe. Use a top-level redirect or a separate verification tab to preserve camera permissions and reduce clickjacking risk.
- Automated approval without the configured OpenKYC document/liveness checks and, while manual review is required, an authorized moderator decision.
- Customer appeals, automated sanctions rescreening, and production retention/deletion periods until policy owners approve them.

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

### 3.1 OpenKYC integration baseline

Treat the checked-out OpenKYC repository as a useful prototype and provider adapter, not as production-ready code to deploy unchanged.

- It ships compiled Flutter `app` and `admin` bundles, Firebase Functions, and Firestore rules. The Dart source for rebuilding or safely modifying the Flutter applications is not present in this checkout.
- The documented self-hosted design uses a dedicated SDK server with a provider-issued `SERVER_URL` and `ACCESS_TOKEN`, plus a Firebase project for session state, authentication, functions, and identity artifacts.
- `createSession` accepts a server API key and returns a unique `session_id` and hosted `session_url`; its `vendor_id` can carry an opaque Project ZERO correlation value.
- Document processing advances through `NOT_STARTED`, `PROCESSING_IMAGES`, `IN_REVIEW`, moderator review, and final states such as `APPROVED`, `DECLINED`, `EXPIRED`, `ABANDONED`, or `KYC_EXPIRED`.
- The current function sends `session.completed` when processing reaches `IN_REVIEW`, not when a moderator reaches a final approval. Therefore that event must never be interpreted as KYC approval.
- The current webhook format uses HMAC-SHA256 but has no event ID, replay window, durable retry queue, or status-pull fallback. The current signature is calculated from re-serialized JSON rather than the exact raw request bytes.
- The current public moderator management and webhook-test functions do not verify a Firebase ID token or admin claim. CORS/origin checks are not authorization. These endpoints must be fixed or disabled before any Internet deployment.
- The current rules allow an authenticated anonymous user to read any unclaimed `NOT_STARTED` session, and identity images are retained as base64 values in Firestore. Replace this with a one-time session claim secret and private object storage with explicit lifecycle deletion.
- Firebase configuration values currently present in the compiled assets must be replaced with a Project ZERO-owned Firebase project configuration. All privileged credentials and provider tokens must be rotated and stored in managed server secrets.
- Pin the OpenKYC commit and artifact hashes used for the testnet integration. Obtain the Flutter source or a reproducible vendor build before production so security fixes do not depend on patching generated JavaScript.

## 4. Target architecture and source-of-truth rules

### 4.1 Canonical ownership

Supabase is authoritative for Project ZERO application and authorization state:

- `payment_requests` defines what must be paid.
- `payment_attempts` records hosted-payment execution state and idempotency.
- `transactions` records a successfully verified on-chain settlement.
- `receipts` records the immutable receipt snapshot and PDF-generation lifecycle.
- `wallets` records non-secret hosted-wallet metadata.
- `wallet_secrets` stores encrypted key material and is never client-readable.
- `kyc_cases` stores the minimal, normalized eligibility projection used by Project ZERO.
- `kyc_provider_events` and `kyc_audit_log` make provider synchronization and status transitions idempotent and auditable without retaining raw identity payloads.

OpenKYC is authoritative for raw identity evidence, document/liveness results, and moderator decisions. It can inform Project ZERO eligibility only through an authenticated status response or a verified webhook. It cannot create a wallet, decrypt a wallet, mark a merchant eligible, or settle a payment directly.

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
| OpenKYC service | Collect identity evidence, run document/liveness checks, support moderator review, return signed status | Direct Supabase access, wallet provisioning, wallet decryption, payment authorization, raw identity data in webhook payloads |

### 4.3 KYC and payment state sequence

```text
Supabase-authenticated subject
        |
        v
Project ZERO creates kyc_case + opaque provider session
        |
        v
top-level OpenKYC verification flow
        |
        v
OpenKYC processing/manual review
        |
        +-- signed status webhook ------------+
        |                                      |
        +-- scheduled status reconciliation ---+
                                               v
                                 normalized Supabase kyc_case
                                               |
                         approved + current + policy matches?
                              | no                    | yes
                              v                       v
                    deny with safe code     wallet/payment gate
```

Project ZERO must make the payment-time decision from its normalized Supabase record so checkout does not depend on a live provider round trip. Webhooks provide low latency; reconciliation repairs missed events. If the decision is older than the configured maximum staleness, refresh it server-to-server and fail closed if freshness cannot be restored.

### 4.4 Payment state sequence

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
4. Keep OpenKYC in its own Firebase project and origin. Do not give it Supabase credentials, wallet keys, payment data, or direct access to Project ZERO tables.
5. Store normalized KYC state in dedicated tables rather than adding mutable `kyc_status` or arbitrary `kyc_payload` columns to `auth.users`, `public.merchants`, or user metadata.
6. Use an opaque random correlation value for `vendor_id`; never send an email address, legal name, Supabase auth token, wallet secret, payment ID, or Stellar transaction data to create a provider session.
7. Treat `APPROVED` as eligible only after the provider status is authenticated, mapped to the expected case and subject, current under the active policy version, unexpired, and recorded through a legal state transition.
8. Check customer approval both before hosted-wallet provisioning and before each hosted payment. Check merchant approval before publishing a new request and before rendering an active hosted-pay option once merchant enforcement is enabled.
9. Keep external Freighter/SEP-7 payment functional during rollout. A merchant whose KYC is suspended must have Project ZERO payment initiation disabled, although Project ZERO cannot prevent a direct on-chain transfer to a publicly known address.
10. Never treat `session.completed` as approval; in the current OpenKYC code it means image processing reached `IN_REVIEW`.
11. Use verified webhooks for low-latency updates and authenticated status reads for reconciliation. Neither channel is sufficient alone.
12. Align internal normalized states with SEP-12 semantics where useful (`APPROVED` to accepted, review/processing to processing, declined to rejected), but do not claim SEP-12 compliance until the full authenticated endpoint contract is implemented.
13. A revoked, declined, or expired customer immediately loses permission for new wallet provisioning, wallet-secret decryption for payment, and new hosted payment attempts. Preserve wallet records and funds for an audited support/recovery process; never delete a funded wallet automatically.
14. Use feature flags for rollout, not for authorization. When enforcement is on, only the server-side eligibility decision grants access; client state and auth metadata can never override it.
15. Store hosted-wallet metadata separately from encrypted secret material so normal wallet queries cannot accidentally select ciphertext.
16. Encrypt Stellar secrets with an authenticated cipher and a unique random nonce per secret. Store ciphertext, nonce, algorithm, and key version; never rely on ciphertext plus an implicit nonce.
17. Use a versioned keyring interface so decryption can read older versions and new writes use the active version. Production activation requires a managed KMS/envelope-encryption decision; a raw environment key is testnet-only.
18. Replace `mark_payment_paid()` with an idempotent settlement RPC that also binds the payer and creates the receipt record. Keep a compatibility wrapper only if an existing caller still needs it during rollout.
19. Do not place Storage upload or PDF rendering inside a PostgreSQL function. Queue the receipt row atomically, then render asynchronously and retry safely.
20. Generate receipt values from database snapshots, never by querying mutable merchant or payment-request display data during a later download.
21. Prefer a server-only PDF library that does not couple receipt rendering to the installed React version. Start with a small `pdfkit` proof-of-compatibility; stop and record a package decision if Next.js bundling or font packaging fails.
22. Carry payment amounts as validated decimal strings in TypeScript and use `numeric(19,7)` in PostgreSQL. Do not pass monetary values through JavaScript floating-point arithmetic.

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

### 6.3 KYC cases

Create `public.kyc_cases` with a narrow, provider-neutral contract:

- `id uuid primary key`
- `auth_user_id uuid not null references auth.users(id) on delete cascade`
- `merchant_id uuid null references public.merchants(id) on delete cascade`
- `subject_type text not null check (subject_type in ('customer', 'merchant'))`
- `provider text not null default 'openkyc'`
- `provider_session_id text null`
- `provider_correlation_id text not null unique`
- `status text not null check (status in ('not_started', 'in_progress', 'needs_review', 'approved', 'declined', 'expired', 'abandoned', 'failed', 'suspended'))`
- `reason_code text null` containing only a safe, allowlisted code
- `policy_version text not null`
- `decision_version bigint not null default 0`
- `attempt_number integer not null default 1`
- `provider_status_updated_at`, `last_synced_at`, `submitted_at`, `decided_at`, `expires_at`, `created_at`, `updated_at`

Rules:

- A merchant case requires `merchant_id`; a customer case must not set it.
- One active case per `(auth_user_id, subject_type, policy_version)` is enforced with a partial unique index. New attempts create a new case or increment a controlled attempt only through a server function.
- `provider_session_id` is unique per provider once assigned.
- The browser may read only a safe DTO for its own case: normalized status, safe reason/remediation code, timestamps, and whether a new attempt is allowed.
- Only service-role code may create cases, bind provider sessions, or transition decisions. Users and merchants cannot write KYC state directly.
- Do not add names, addresses, dates of birth, document numbers, OCR data, image paths, face scores, liveness scores, provider access tokens, or raw provider responses.

### 6.4 Provider events and KYC audit

Create service-role-only tables:

`public.kyc_provider_events`:

- `id uuid primary key`
- `provider`, `provider_event_id`, `provider_session_id`, `event_type`
- `body_sha256`, `occurred_at`, `received_at`, `processed_at`
- `processing_status check (processing_status in ('received', 'processed', 'ignored', 'failed'))`
- `error_code text null`, `attempt_count integer not null default 0`
- unique `(provider, provider_event_id)` and a second dedupe constraint on `(provider, provider_session_id, event_type, occurred_at, body_sha256)`

`public.kyc_audit_log`:

- case ID, previous/next normalized status, decision version, actor type (`provider`, `reconciler`, `system`, `admin`), actor ID when applicable, safe reason code, source event ID, and timestamp.

Do not persist the raw webhook body. Store only the hash and an allowlisted normalized envelope. Invalid signatures are rejected before database mutation and recorded only as redacted security telemetry.

### 6.5 Hosted-wallet metadata

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

### 6.6 Hosted-wallet secret isolation

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

### 6.7 Hosted payment attempts

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

### 6.8 Transactions

Retain the existing table and strengthen it:

- Make verified snapshot fields required for new rows: source wallet, destination wallet, amount, asset code, network, ledger, and verified time.
- Change transaction amount storage to `numeric(19,7)` and keep amounts as canonical decimal strings at application boundaries.
- Add `network` and `ledger` if absent.
- Keep `stellar_tx_hash` unique.
- Make `payment_request_id` unique because one payment request can settle only once.
- Store only a redacted/minimized verification payload; do not duplicate an unrestricted Horizon response.
- Derive the source wallet from the matching on-chain payment operation, not request metadata supplied by the browser.

### 6.9 Receipts

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

### 6.10 Atomic settlement RPC

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

### 6.11 Storage

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

### 7.3 Workstream C - Customer auth and KYC journey

The current registration form is merchant-specific. Add a minimal customer authentication path that collects only authentication credentials and returns safely to `/pay/<uuid>` after email confirmation/sign-in.

Requirements:

- Validate `next` as an internal relative path; reject protocol-relative and external URLs.
- Do not require a business name for customer registration.
- Do not create a merchant row for a customer unless they separately complete merchant onboarding.
- Allow one auth user to later become a merchant without creating a second identity; customer and merchant cases remain role-specific.
- Do not collect legal identity or government-document data in Project ZERO forms.
- `POST /api/kyc/sessions` authenticates the Supabase user, validates the intended subject type, rate-limits by user/IP, creates or recovers an idempotent `kyc_case`, generates an opaque provider correlation value, and calls OpenKYC server-to-server.
- Return only a validated HTTPS session URL on the configured OpenKYC origin. Never accept or redirect to a provider URL supplied by the browser.
- Launch verification as a top-level navigation or separate tab. Keep the Project ZERO status page polling its own safe status endpoint so a signed webhook can advance it without exposing Firebase credentials.
- A one-time, short-lived return-state token binds the post-verification destination to the auth user and a validated internal `next` path. The OpenKYC session ID alone is not an authentication or authorization credential.
- Provide explicit UI states: `verification required`, `continue verification`, `processing`, `manual review`, `approved`, `declined with safe remediation`, `expired`, `abandoned`, `provider unavailable`, and `status temporarily stale`.

### 7.4 Workstream D - OpenKYC service hardening and adapter

Fork or vendor-pin the OpenKYC backend into a separately deployed service. Do not import its Firebase Admin code into client bundles or make Project ZERO depend directly on Firestore collections.

Required OpenKYC changes before integration:

1. Upgrade the Functions runtime and dependencies to versions supported at deployment time; add lockfile, lint, unit, emulator, and contract tests.
2. Move provider `ACCESS_TOKEN`, Project ZERO API credentials, and webhook secrets to managed secrets. Store API-key verifiers as hashes or use a managed identity mechanism; never keep a plaintext allowlist in Firestore.
3. Replace the current unclaimed-session rule with an unguessable one-time claim token. An anonymous Firebase user may read/update only the session it has securely claimed.
4. Move identity images from base64 Firestore documents to private encrypted object storage. Grant reviewers short-lived access and apply lifecycle deletion based on the approved retention policy.
5. Require verified Firebase ID tokens plus server-side admin/moderator claims on moderator creation, deletion, blocking, settings, and webhook-test endpoints. Origin/CORS checks remain defense-in-depth only.
6. Add strict request schemas, content-type and body-size limits, per-credential/IP throttles, safe errors, timeouts, and SSRF-safe allowlists for configured outbound provider/webhook URLs.
7. Add `GET /v1/sessions/{sessionId}/status` for Project ZERO server reconciliation. It returns only session ID, opaque vendor ID, normalized provider status, decision/expiry timestamps, safe reason code, and monotonic decision version—never images, OCR, document numbers, or biometrics.
8. Emit `session.status_changed` for every legal state transition, especially final moderator changes. Include a unique event ID, session ID, opaque vendor ID, occurred-at timestamp, monotonic decision version, and minimal status data.
9. Sign the exact raw request bytes and include versioned signature, event-ID, and timestamp headers. Project ZERO uses constant-time comparison, an allowed clock-skew window, and database uniqueness to reject replay.
10. Deliver webhooks through a durable queue with capped exponential backoff and dead-letter visibility. A non-2xx response is retried; a successful delivery is idempotent.
11. Enforce an explicit state machine so processing events cannot overwrite a final decision, stale decision versions cannot move state backward, and `session.completed`/`IN_REVIEW` cannot grant approval.
12. Add deletion/export operations needed by the approved privacy policy and audit every moderator decision and privileged data access.

Recommended Project ZERO modules and routes:

- `src/lib/kyc/types.ts`
- `src/lib/kyc/provider.ts`
- `src/lib/kyc/openkyc-client.ts`
- `src/lib/kyc/repository.ts`
- `src/lib/kyc/eligibility.ts`
- `src/app/api/kyc/sessions/route.ts`
- `src/app/api/kyc/status/route.ts`
- `src/app/api/kyc/webhooks/openkyc/route.ts`
- `src/app/api/internal/kyc/reconcile/route.ts` or a dedicated worker

Provider mapping:

| OpenKYC state | Project ZERO state | Eligible |
| --- | --- | --- |
| `NOT_STARTED` | `not_started` | No |
| `PROCESSING_IMAGES`, `IN_PROGRESS` | `in_progress` | No |
| `IN_REVIEW` | `needs_review` | No |
| `APPROVED` | `approved` | Only if current, unexpired, and policy-matched |
| `DECLINED` | `declined` | No |
| `EXPIRED`, `KYC_EXPIRED` | `expired` | No |
| `ABANDONED` | `abandoned` | No |
| `PROCESSING_FAILED` | `failed` | No |

Webhook ingestion sequence:

1. Require POST and read the raw body with a strict maximum size.
2. Validate signature version, timestamp skew, event ID, event type, and constant-time HMAC before parsing or mutating data.
3. Parse with a strict schema and match both provider session ID and opaque vendor ID to one case.
4. Insert/dedupe the event, lock the case, reject stale decision versions and illegal transitions, then update the normalized case plus audit row atomically.
5. If a transition removes eligibility, suspend the wallet and prevent new hosted attempts in the same controlled transaction or an idempotent follow-up job.
6. Acknowledge already-processed valid events with 2xx. Return non-2xx for transient processing failures so OpenKYC retries.

Reconciliation queries nonterminal cases frequently and approved cases on a bounded cadence, using cursors, jittered retries, and a time budget. It applies the same transition function as webhooks. Payment-time code normally reads Supabase; it performs a synchronous provider refresh only when the local decision exceeds `KYC_STATUS_MAX_AGE_SECONDS`.

### 7.5 Workstream E - KYC eligibility and role policy

Define one server-only decision contract used by wallet provisioning, hosted payment, merchant request publishing, and payment-page availability:

```ts
type KycEligibility =
  | {
      allowed: true;
      caseId: string;
      decisionVersion: number;
      expiresAt: string | null;
      policyVersion: string;
    }
  | {
      allowed: false;
      code:
        | "KYC_REQUIRED"
        | "KYC_PENDING"
        | "KYC_DECLINED"
        | "KYC_EXPIRED"
        | "KYC_STATUS_STALE"
        | "ACCOUNT_SUSPENDED"
        | "MERCHANT_NOT_ELIGIBLE";
    };
```

`assertKycEligible` must authenticate the subject, load the case by server-derived auth/merchant identity and purpose, require `approved`, enforce expiry, active policy version, decision freshness, and account/wallet state, and return a stable decision reference for audit. It never calls OpenKYC on the hot path while the normalized decision is fresh.

Role policy:

- Customer approval authorizes hosted-wallet provisioning and is checked again before every hosted payment and wallet-secret decrypt.
- Merchant approval authorizes publishing new payment requests and displaying active Project ZERO payment initiation once merchant enforcement is enabled.
- Customer and merchant verification may use the same OpenKYC service but remain separate cases and policy versions.
- No Project ZERO administrator can manually set `approved` in the database. Any exceptional override requires a later dual-control, expiring, reasoned, and fully audited design.

### 7.6 Workstream F - Hosted-wallet custody foundation

Recommended server-only modules:

- `src/lib/wallets/crypto.ts`
- `src/lib/wallets/keyring.ts`
- `src/lib/wallets/repository.ts`
- `src/lib/wallets/provision.ts`
- `src/lib/kyc/eligibility.ts`
- `src/actions/wallets.ts` only if it exposes safe metadata operations

Provisioning service sequence:

1. Authenticate the user or accept a trusted internal user ID.
2. Call `assertKycEligible` for `hosted_wallet_provisioning` and fail closed.
3. Acquire a database idempotency lock for `(auth_user_id, network)`.
4. Generate the Stellar keypair server-side.
5. Encrypt the secret immediately with the active key version and a fresh nonce.
6. Write metadata and ciphertext in one database transaction.
7. Return only wallet ID, public key, network, and status.
8. Fund via Friendbot only on testnet, with bounded retries and stable error codes.
9. Mark the wallet active only after the account is observable on the correct network.
10. Never return or log the secret, ciphertext, nonce, plaintext XDR containing sensitive annotations, or encryption key.

No public UI or route may invoke provisioning until OpenKYC hardening, KYC synchronization, and policy gates pass. Keep `HOSTED_WALLET_ENABLED=false` as the default and enforce it server-side.

### 7.7 Workstream G - Hosted payment action

Recommended module: `src/actions/payments.ts` or a dedicated authenticated API route if the UI requires structured polling.

Sequence:

1. Authenticate the session and apply user-plus-payment rate limits.
2. Validate the payment request UUID and idempotency key.
3. Load the canonical request from Supabase; reject missing, non-pending, expired, disabled-network, or invalid-asset requests.
4. Run the feature flag, customer KYC, merchant KYC, decision-freshness, and wallet-suspension checks.
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

### 7.8 Workstream H - External-wallet verification integration

Keep `/api/stellar/verify`, but route it through the same network-aware verifier and settlement RPC.

- Read the network only from the stored request.
- Do not accept `signedByProjectZero`, `sourceWallet`, amount, destination, or asset as trusted client metadata.
- If an authenticated user verifies an external payment, bind them only under an explicit payer-binding rule; otherwise leave the payer nullable.
- Return idempotent success when the same request/hash was already settled.
- Preserve the existing per-payment-and-client rate limit and replace the in-memory implementation with a shared store before multi-instance production deployment.

### 7.9 Workstream I - Receipt generation and access

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
5. Avoid embedding customer email, auth UUID, hosted-wallet secret data, raw payloads, KYC state, provider references, or identity fields.
6. Compute SHA-256, upload to the deterministic private path, then atomically mark the row ready with path/hash/time.
7. On failure, record a stable error code, return to failed, and retry with capped exponential backoff.
8. After the retry threshold, alert operations but keep manual retry possible.

Receipt UI behavior:

- Paid pages render the database receipt snapshot, not just client-held payment state.
- Show `Preparing receipt` while queued/generating and a retry-safe refresh state if failed.
- The download route authorizes either the owning merchant or the receipt's payer user.
- Signed URLs should be short-lived and never stored in the database.
- Anonymous users may see the existing minimal paid confirmation, but cannot download a private PDF unless an explicit bearer-token design is approved later.

### 7.10 Workstream J - Reconciliation and operations

Add a protected scheduled reconciliation route or worker that:

- finds `submitted` attempts not yet verified;
- verifies their hashes on the attempt/request network;
- settles valid payments idempotently;
- marks terminal on-chain failures with stable codes;
- retries queued/failed receipt generation;
- detects paid requests missing a transaction or receipt and alerts rather than silently fabricating data;
- processes bounded batches with cursors and a time budget;
- uses a secret or platform-native cron authentication and rejects normal sessions.

Log identifiers, state transitions, duration, network, and safe error codes. Redact credentials, keys, ciphertext, signed XDR, full auth payloads, raw webhook bodies, provider responses, and all identity/biometric data. Add metrics for KYC session creation, webhook latency/failures/replays, reconciliation drift, decision staleness, submission success, payment verification latency, settlement conflicts, reconciliation recovery, PDF success, and PDF retry exhaustion.

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

### Phase 3 - OpenKYC hardening and KYC state foundation

Tasks:

- Create a Project ZERO-owned Firebase test project and isolated OpenKYC deployment; rotate all inherited configuration and credentials.
- Pin the OpenKYC artifact/commit and document the missing Flutter source as a production blocker.
- Harden session claims, privileged endpoints, secret storage, identity-object storage, state transitions, audit logs, status API, and durable webhooks.
- Add `kyc_cases`, provider events, KYC audit tables, RLS/grants, normalized types, and legal transition RPCs in Supabase.
- Add the Project ZERO OpenKYC client, raw-body webhook verifier, reconciliation adapter, and provider contract tests.

Exit gate:

- No OpenKYC privileged endpoint relies on CORS/origin alone; ID tokens/claims or server credentials are verified.
- An anonymous Firebase user cannot enumerate, read, or claim another verification session.
- Raw identity evidence is inaccessible from Project ZERO and has a tested retention/deletion path in OpenKYC.
- Forged, replayed, stale, oversized, mismatched, duplicate, out-of-order, and illegal-transition webhooks fail safely.
- Dropped webhooks are repaired by status reconciliation without duplicate audit transitions.
- `session.completed`/`IN_REVIEW` never maps to approval.

### Phase 4 - Customer and merchant KYC journeys

Tasks:

- Add customer authentication and safe return-to-payment behavior.
- Add idempotent KYC session creation, safe status DTOs, polling, return-state tokens, and remediation UI.
- Add separate customer and merchant policies and enforcement flags.
- Add `assertKycEligible` with expiry, freshness, policy-version, suspension, and role checks.
- Run OpenKYC emulator/test deployment and Project ZERO Supabase integration tests together.

Exit gate:

- A signed-in user can start once, resume the same active session, complete OpenKYC, and observe normalized status without exposing Firebase/provider credentials.
- A moderator approval becomes `approved`; decline, expiry, abandonment, and later revocation remove eligibility.
- Concurrent starts cannot create multiple active cases or provider sessions for one attempt.
- A Project ZERO user cannot approve themselves through client state, auth metadata, direct table writes, or forged provider identifiers.
- Merchant and customer cases cannot be substituted for each other.
- KYC enforcement flags remain off until the testnet policy and operations review is complete.

### Phase 5 - Hosted-wallet custody foundation (disabled)

Tasks:

- Add wallet metadata, secret isolation, encryption/keyring, repository, provisioning service, and Friendbot testnet adapter.
- Connect provisioning to the real, fail-closed KYC eligibility adapter and default-off hosted-wallet flag.
- Complete encryption, RLS, concurrency, KYC revocation, and secret-leak tests.

Exit gate:

- No browser-accessible query can read wallet ciphertext.
- The same user/network cannot receive duplicate wallets under concurrency.
- Wrong key version, modified ciphertext, invalid nonce, stale/revoked KYC, and disabled-feature tests fail closed.
- Only a currently approved customer can provision a testnet wallet.
- Revocation suspends new wallet use without deleting a funded wallet or losing the audit trail.

### Phase 6 - Hosted payment integration (test-only gate)

Tasks:

- Add payment attempts and the hosted payment action.
- Build, sign, submit, verify, settle, and enqueue receipts through the canonical pipeline.
- Add UI states for auth required, KYC required, wallet unavailable, insufficient balance/reserve, submitting, recovering, paid, and receipt preparing/ready.
- Add reconciliation for interrupted hosted attempts.

Exit gate:

- A genuinely OpenKYC-approved test user with a funded testnet hosted wallet can complete the full round trip.
- Double-clicks, action retries, network timeouts, and process interruption do not double-pay or double-settle.
- A pending, declined, expired, suspended, stale, or role-mismatched session receives a stable denial and no wallet is created or decrypted.
- Hosted payment remains disabled in normal deployment.

### Phase 7 - Enforcement rollout and testnet soak

Required before enabling hosted wallets or merchant enforcement:

- The OpenKYC Flutter source or a reproducible, supported vendor build is available.
- Identity collection, manual-review procedure, retention/deletion periods, privacy notice/consent, supported countries/documents, age requirements, and incident response are approved by policy owners.
- Any required AML/sanctions capability is integrated and separately validated; identity-document approval is not treated as a substitute.
- Revocation/suspension and funded-wallet support/recovery behavior are documented and rehearsed.
- Key management and rotation are reviewed.
- Threat model, privacy impact assessment, provider outage runbook, breach response, and custody incident runbook are approved.
- Shared rate limiting, webhook dead-letter alerting, scheduled reconciliation, access review, and retention jobs are deployed.
- A testnet soak covers KYC completion/drop-off, webhook latency, reconciliation drift, moderator SLA, revocation, provider outage, payment success, failure recovery, and receipt delivery.
- Enable customer KYC and hosted wallets for an internal allowlist first, then a bounded test cohort. Enable merchant enforcement separately only after existing-merchant migration/grace handling is approved.
- Mainnet remains disabled.

## 9. Test strategy

### 9.1 Unit tests

- Network parsing/config mapping and disabled-mainnet behavior.
- XDR network/server consistency, amount precision, memo limit, and asset issuer validation.
- Verifier success and every mismatch/failure code.
- Encryption round-trip, unique nonce, tamper rejection, wrong key version, and rotation reads.
- OpenKYC-to-normalized-state mapping, legal transitions, monotonic decision versions, expiry, policy mismatch, and default denial.
- Raw-body HMAC verification, constant-time comparison, timestamp skew, duplicate/replay detection, strict payload parsing, and safe error mapping.
- KYC decision freshness and role/purpose separation.
- Payment idempotency and safe error mapping.
- Receipt snapshot formatting and PDF content allowlist.
- Internal redirect validation.

### 9.2 Database and RLS tests

- Product table and `product_id` are absent after migration.
- Merchant isolation for payment requests, transactions, and receipts.
- Customer reads only their own wallet metadata and bound receipts.
- Customer/merchant reads only their own safe KYC case projection; provider events and KYC audit rows remain service-role-only.
- Authenticated users cannot insert/update KYC decisions, provider IDs, decision versions, policy versions, expiry, or audit events.
- Concurrent KYC session starts create one active case, and duplicate/out-of-order provider events create one legal transition.
- No authenticated or anonymous wallet-secret access.
- Merchant cannot directly set settlement fields, payer binding, transaction rows, or receipt ready state.
- Settlement RPC is service-role only.
- Concurrent same-hash settlement is idempotent.
- Concurrent different-hash settlement produces one success and one conflict.
- Receipt constraints enforce ready/path/hash consistency.

### 9.3 Route and action tests

- Unauthenticated, unauthorized, invalid-body, oversized-body, rate-limited, expired, wrong-network, disabled-feature, and every KYC-denial case.
- KYC session creation rejects unsafe return paths, wrong roles, browser-supplied provider URLs, duplicate active attempts, and provider correlation mismatches.
- Webhook route rejects missing/invalid signatures, stale timestamps, replayed event IDs, wrong content types, unknown sessions, wrong vendor IDs, stale decision versions, and illegal transitions.
- KYC status route returns no provider tokens, Firebase identifiers beyond the opaque session reference, legal identity data, images, OCR, biometrics, or raw reasons.
- Hosted action never accepts client overrides for canonical payment fields.
- Verify endpoint derives network from the database.
- Receipt download rejects cross-merchant/cross-user access.
- Cron/reconciliation endpoint requires its configured secret and respects batch limits.

### 9.4 Integration and failure-injection tests

- Existing external Freighter payment to verification to receipt.
- OpenKYC session creation to document submission to moderator decision to normalized Project ZERO eligibility.
- Hosted test-wallet payment to verification to receipt using a real approved test case.
- OpenKYC webhook is dropped, duplicated, delayed, or delivered out of order; reconciliation converges once without regressing state.
- Provider status API returns 404, 429, 5xx, malformed data, or times out; retry budgets and fail-closed staleness behavior hold.
- Approval is revoked immediately before or during wallet provisioning/payment; no new secret decryption or transaction submission occurs after the guarded decision point.
- Customer and merchant cases cannot authorize the opposite role, and one user with both roles is evaluated under the correct policy.
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

The OpenKYC fork must also gain its own lint, unit, Firebase Emulator Suite, and API contract test scripts. Run those at the Phase 3+ merge gates and record the exact commands in the fork once its package scripts are defined. A green Project ZERO build does not validate OpenKYC rules, Functions, queues, storage lifecycle, or moderator authorization.

## 10. Security review checklist

- [ ] No encryption key, Stellar secret, ciphertext, signed XDR, service-role key, or cron secret appears in client bundles or logs.
- [ ] OpenKYC provider tokens, Project ZERO integration credentials, webhook secrets, Firebase service credentials, and raw identity artifacts never enter Project ZERO client bundles, Supabase rows, receipts, payment metadata, logs, or analytics.
- [ ] OpenKYC runs in an isolated project/origin with least-privilege service accounts, managed secrets, credential rotation, access logging, backups, retention, and tested deletion.
- [ ] Every OpenKYC privileged endpoint verifies authentication and role claims server-side; CORS/origin is never treated as authorization.
- [ ] Session creation and claiming are idempotent, one-time, unguessable, rate-limited, and bound to the expected Project ZERO subject through an opaque correlation value.
- [ ] Webhooks verify exact raw bytes with versioned HMAC, constant-time comparison, timestamp skew, event ID, replay protection, strict schema validation, legal transition checks, and monotonic decision versions.
- [ ] Reconciliation uses authenticated provider status reads and applies the same transition function as webhooks.
- [ ] `IN_REVIEW`/`session.completed` cannot grant eligibility; only a current authenticated `APPROVED` decision under the active policy can do so.
- [ ] Identity documents and biometric images use private storage, short-lived reviewer access, lifecycle deletion, and no public URLs or base64 Firestore retention.
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
- [ ] Privacy notice/consent, data-subject export/deletion, breach response, moderator access review, acceptable-document policy, and jurisdictional requirements are approved before real-user collection.
- [ ] Identity verification is not represented as AML/sanctions compliance unless the required separate controls are implemented and validated.

## 11. Environment and configuration

Add placeholders to `.env.example` without real values:

```text
HOSTED_WALLET_ENABLED=false
KYC_PROVIDER=openkyc
KYC_CUSTOMER_ENFORCEMENT_ENABLED=false
KYC_MERCHANT_ENFORCEMENT_ENABLED=false
KYC_POLICY_VERSION=project-zero-testnet-v1
KYC_STATUS_MAX_AGE_SECONDS=300
OPENKYC_BASE_URL=
OPENKYC_SESSION_ORIGIN=
OPENKYC_API_KEY=
OPENKYC_WEBHOOK_SECRET=
KYC_RECONCILIATION_SECRET=
STELLAR_MAINNET_ENABLED=false
WALLET_ACTIVE_KEY_VERSION=1
WALLET_ENCRYPTION_KEY_V1=
RECEIPT_CRON_SECRET=
```

Keep testnet and mainnet Horizon URLs in a validated server-side configuration map. Environment configuration may define endpoints and enabled flags; it must not override the network stored on a payment request during a request.

Validate `OPENKYC_BASE_URL` and `OPENKYC_SESSION_ORIGIN` against exact HTTPS origins at startup. They may not be taken from request data. `OPENKYC_API_KEY`, `OPENKYC_WEBHOOK_SECRET`, Firebase service credentials, and provider SDK tokens are server-only secrets; use separate values per environment and support overlapping versions during rotation. Never prefix them with `NEXT_PUBLIC_`.

Before any hosted-wallet production activation, replace or formally approve the testnet environment-key strategy with managed key storage and document rotation/recovery.

## 12. File ownership map

| Area | Primary files |
| --- | --- |
| Product removal | Product files listed in Workstream A, invoice/dashboard/nav/proxy/type files |
| Database | `supabase/migrations/2026MMDD_*`, `supabase/schema.sql`, `supabase/rls.sql`, `supabase/tests/rls.test.sql` |
| Network/verifier | `src/lib/stellar/network.ts`, `src/lib/stellar/client.ts`, `src/lib/stellar/build-payment.ts`, `src/lib/stellar/verify-payment.ts` |
| Verify/settlement | `src/app/api/stellar/verify/route.ts`, database settlement RPC, related tests |
| Customer/merchant KYC UI | auth pages/actions, KYC status/start components, safe return handling |
| Project ZERO KYC adapter | `src/lib/kyc/*`, KYC session/status/webhook/reconciliation routes, related tests |
| OpenKYC service | hardened Firebase Functions, Firestore/Storage rules, status API, webhook queue, moderator auth, provider contract tests in the OpenKYC fork |
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
OpenKYC hardening + normalized KYC state
              |
              v
Customer/merchant KYC journeys + reconciliation
              |
              v
Wallet custody foundation (disabled)
              |
              v
Hosted attempt/action (test-only)
              |
              v
Controlled enforcement + testnet soak
```

Receipt work can ship for existing external-wallet payments before hosted-wallet activation. This delivers useful roadmap functionality without waiting for KYC.

## 14. Definition of done

The payment-flow roadmap is complete for testnet when:

- The product catalog and payment-product association are removed from database and runtime code.
- Merchants create standalone payment requests with no product dependency.
- Every request and transaction is pinned to a validated Stellar network.
- External-wallet payments still work and settle through the hardened idempotent RPC.
- Each verified payment produces exactly one canonical transaction and one receipt record.
- PDF generation is private, authorized, retryable, and recoverable.
- OpenKYC is isolated and hardened; privileged routes, session claims, storage, webhooks, status reads, retries, audit, retention, and deletion have passing tests.
- Project ZERO stores only minimal normalized KYC state and never receives raw identity documents or biometric artifacts.
- Customer and merchant verification journeys are authenticated, resumable, idempotent, role-specific, and recoverable after missed webhooks.
- Only a current, unexpired, policy-matched OpenKYC approval can authorize testnet wallet provisioning or hosted payment; revocation/suspension blocks new use.
- Hosted-wallet keys can be provisioned and used only in the controlled testnet cohort after the KYC gates pass.
- Normal deployments keep hosted provisioning/payment and KYC enforcement disabled until Phase 7 approval.
- Reconciliation recovers interrupted submissions and receipt jobs without duplicate settlement.
- Migrations, RLS tests, unit/integration tests, lint, build, and a live testnet smoke pass succeed.
- The policy, privacy, operational, custody, and mainnet launch gates remain explicit and unresolved rather than being hidden behind an `approved` status.

## 15. KYC decisions and remaining launch approvals

### 15.1 Decisions pinned by this plan

1. OpenKYC is authoritative for raw evidence and its moderator decision; Supabase `kyc_cases` is authoritative for Project ZERO's normalized authorization decision.
2. Merchant and customer verification use the same isolated provider but separate cases, purposes, and policy versions.
3. Customer approval gates both wallet provisioning and every hosted payment. Merchant approval gates publishing new requests and active payment initiation after merchant enforcement is enabled.
4. Revocation, decline, expiry, staleness, or suspension blocks new provisioning, secret decryption, and hosted attempts. It does not automatically delete a wallet or discard funds.
5. Raw documents, OCR, biometrics, and liveness artifacts remain only in OpenKYC private storage. Project ZERO retains normalized status, safe reason/remediation codes, provider references, hashes, timestamps, policy/decision versions, and audit transitions.
6. Webhooks use raw-body versioned HMAC, constant-time verification, timestamp and event-ID replay protection, strict schemas, idempotent database transitions, durable provider retries, and authenticated reconciliation.
7. OpenKYC moderators perform normal review. Project ZERO has no direct self-approval or single-admin override in the initial implementation.
8. The user sees actionable but non-sensitive states and can resume or restart when policy allows. Detailed provider/internal failure data is not exposed.
9. The integration is SEP-12-aligned only at the normalized status/design level. It is not SEP-12 compliant until the complete SEP-10/SEP-45-authenticated API and deletion/file contracts are implemented and tested.

### 15.2 Approvals still required before real-user enforcement

1. Supported countries, document types, minimum age, customer/merchant evidence requirements, and manual-review criteria.
2. Whether identity verification is sufficient for the intended testnet use or a separate AML/sanctions/PEP capability is required.
3. Retention and deletion periods for raw documents, biometrics, provider events, and audit logs by jurisdiction.
4. Privacy notice, explicit consent language, data-controller/processor roles, cross-border transfer rules, and data-subject request workflow.
5. Decline reason taxonomy, retry limits, appeal/support workflow, moderator SLA, and dual-control requirements for exceptional actions.
6. Existing-merchant migration/grace behavior when merchant enforcement is enabled.
7. Funded-wallet suspension, recovery/withdrawal, account closure, and customer-support procedures.
8. Production provider capacity/SLA, backups, disaster recovery, monitoring ownership, and incident escalation.

Until Phase 7 and these launch approvals pass, KYC may run only in controlled testnet environments and hosted-wallet functionality must remain disabled for general users.

## 16. Integration references

- Local OpenKYC overview: `K:\ID-Verification-OpenKYC\README.md`
- OpenKYC Functions entry point: `K:\ID-Verification-OpenKYC\idkit_cloud_function\functions\index.js`
- OpenKYC session controller: `K:\ID-Verification-OpenKYC\idkit_cloud_function\functions\src\controllers\session.controller.js`
- OpenKYC webhook implementation: `K:\ID-Verification-OpenKYC\idkit_cloud_function\functions\src\services\webhook.service.js`
- OpenKYC Firestore rules: `K:\ID-Verification-OpenKYC\idkit_cloud_function\firestore.rules`
- [FaceOnLive IDKit self-host documentation](https://docs.faceonlive.com/idkit-self-host-kyc-platform)
- [FaceOnLive session API documentation](https://docs.faceonlive.com/idkit-self-host-kyc-platform/creating-session-api)
- [FaceOnLive webhook documentation](https://docs.faceonlive.com/idkit-self-host-kyc-platform/webhook-integration-guide)
- [Stellar SEP-12 KYC API](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md)
