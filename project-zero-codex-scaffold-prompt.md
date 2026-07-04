# Project ZERO — Codex Scaffold Prompt

Use this prompt inside your **Codex extension in VS Code** to scaffold and set up the coding environment for Project ZERO in a structured, secure, and hackathon-ready way.

---

## Codex Prompt

```txt
You are helping me scaffold and set up the coding environment for a hackathon MVP called Project ZERO.

Project ZERO is a Stellar-powered credentialless commerce platform for MSMEs, social sellers, and local merchants. The app lets merchants create invoices or simple product payment pages, generate QR/payment links, let customers pay using a Stellar wallet, and automatically update the payment status once the transaction is verified.

The goal is to build a fast, clean, secure, and hackathon-ready MVP using this stack:

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Next.js Route Handlers
- Server Actions where appropriate

Database/Auth/Realtime:
- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase Row Level Security

Payments:
- Stellar Testnet
- @stellar/stellar-sdk
- @stellar/freighter-api
- react-qr-code or qrcode.react

Validation/Security:
- Zod
- Server-side payment verification only
- No client-side “mark as paid”
- Environment variables only for secrets
- Supabase RLS policies for merchant-owned data

Important product requirements:
- Merchants should be able to register/login.
- Merchants should have a dashboard.
- Merchants should create payment requests/invoices.
- Merchants should create simple product payment pages.
- The app should generate a QR code and shareable payment link.
- Customers should open a public payment page.
- Customers should review merchant name, amount, description, and expiration time.
- Customers should pay using a Stellar wallet.
- The backend should verify the Stellar transaction.
- Once verified, the invoice/payment request should update from Pending to Paid.
- Merchants should see payment history and transaction hashes.
- Use Stellar Testnet only for now.

Security thesis:
The app must be designed so merchants never store card numbers, CVVs, or reusable payment credentials. Each payment must be tied to a specific invoice or payment request and authorized through the customer’s wallet. The frontend must never be trusted to mark payments as paid. Only the server should verify a Stellar transaction and update the database status.

Set this project up in 3 clear phases. After each phase, give me:
1. What was created
2. What files changed
3. Commands I need to run
4. Any environment variables I need to configure
5. Any remaining TODOs before the next phase
6. Which Codex skills were used and why

Do not skip structure. Do not create messy code. Do not overbuild unnecessary features. Prioritize a working hackathon MVP.

Skill usage protocol:
- Before starting any phase, check whether a Codex skill applies. If it does, use it before making changes.
- Use `superpowers:using-superpowers` at the start of the session to enforce skill discovery.
- Use `superpowers:brainstorming` only if requirements are unclear or if the implementation scope needs redesign before coding. If the requirements are clear, continue directly.
- Use `superpowers:writing-plans` before implementing each multi-step phase. Keep the plan phase-sized, not project-sized.
- Use `superpowers:test-driven-development` for business logic, auth/session behavior, database access helpers, API routes, Stellar transaction building, and server-side verification.
- Use `superpowers:systematic-debugging` whenever a test, build, auth flow, Supabase query, Stellar SDK call, or browser verification fails unexpectedly.
- Use `superpowers:verification-before-completion` before claiming a phase is complete.
- Use `vercel:nextjs` for Next.js App Router, Route Handlers, Server Actions, middleware, metadata, and routing decisions.
- Use `vercel:shadcn` when installing or composing shadcn/ui components.
- Use `vercel:react-best-practices` after editing multiple React/TSX files in a phase.
- Use `supabase:supabase` for Supabase Auth, SSR clients, SQL schema, RLS, Realtime, and server-side service-role usage.
- Use `supabase:supabase-postgres-best-practices` when writing tables, constraints, indexes, database functions, triggers, and RLS policies.
- Use `codex-security:security-scan` or `codex-security:security-diff-scan` before finishing Phase 3, focused on auth boundaries, public routes, secret exposure, RLS, payment verification, and status mutation paths.
- Use `vercel:agent-browser-verify` or equivalent browser verification after a dev server is running to test the real user flows.
- Do not use OpenAI API/platform skills unless an OpenAI-backed feature is explicitly added later. Project ZERO does not currently need OpenAI API keys.

Phase skill map:
- Phase 1 needs: `superpowers:writing-plans`, `vercel:nextjs`, `vercel:shadcn`, `supabase:supabase`, `superpowers:verification-before-completion`.
- Phase 2 needs: `superpowers:writing-plans`, `superpowers:test-driven-development`, `supabase:supabase`, `supabase:supabase-postgres-best-practices`, `vercel:nextjs`, `vercel:react-best-practices`, `superpowers:verification-before-completion`.
- Phase 3 needs: `superpowers:writing-plans`, `superpowers:test-driven-development`, `supabase:supabase`, `supabase:supabase-postgres-best-practices`, `vercel:nextjs`, `vercel:react-best-practices`, `codex-security:security-scan` or `codex-security:security-diff-scan`, `vercel:agent-browser-verify`, `superpowers:verification-before-completion`.

PHASE 1 — Project Foundation and Environment Setup

Skills to use in Phase 1:
- `superpowers:writing-plans`: create a small implementation plan for scaffolding, dependency installation, file structure, and initial docs.
- `vercel:nextjs`: guide Next.js App Router, TypeScript, Tailwind, route groups, Route Handler folder shape, and metadata conventions.
- `vercel:shadcn`: install and compose shadcn/ui consistently.
- `supabase:supabase`: set up Supabase browser/server client structure and environment variable conventions.
- `superpowers:verification-before-completion`: verify install, lint/build if available, folder structure, env example, and README before summarizing.

First, inspect the current workspace.

If there is no existing Next.js app, scaffold one using:
- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- src directory if appropriate
- pnpm if available, otherwise npm

Install and configure:
- shadcn/ui
- lucide-react
- zod
- @supabase/supabase-js
- @supabase/ssr
- @stellar/stellar-sdk
- @stellar/freighter-api
- react-qr-code or qrcode.react
- date-fns
- clsx
- tailwind-merge

Create a clean folder structure like:

src/
  app/
    page.tsx
    layout.tsx
    globals.css

    (auth)/
      login/
        page.tsx
      register/
        page.tsx

    (dashboard)/
      dashboard/
        page.tsx
      invoices/
        page.tsx
      products/
        page.tsx
      payments/
        page.tsx

    pay/
      [paymentRequestId]/
        page.tsx

    api/
      payment-requests/
        route.ts
      payment-requests/
        [id]/
          route.ts
      stellar/
        verify/
          route.ts
        status/
          route.ts

  components/
    ui/
    layout/
    dashboard/
    payment/
    forms/

  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    stellar/
      client.ts
      verify-payment.ts
      build-payment.ts
    validation/
      payment-request.schema.ts
      merchant.schema.ts
      product.schema.ts
    utils.ts

  actions/
    payment-requests.ts
    products.ts
    merchants.ts

  types/
    database.ts
    payment.ts
    merchant.ts

  constants/
    app.ts
    stellar.ts

Also create:
- .env.local.example
- README.md
- supabase/schema.sql
- supabase/rls.sql

The .env.local.example should include:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000

STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
PROJECT_ZERO_TREASURY_PUBLIC_KEY=

Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.

Create a clean landing page that briefly explains:
- Project ZERO
- Credentialless commerce for MSMEs
- Create invoice
- Generate QR/payment link
- Pay with Stellar wallet
- Automatic verification

Do not implement all business logic yet in Phase 1. Focus on clean setup, structure, dependencies, and initial pages.

PHASE 2 — Supabase Auth, Database Schema, Dashboard, and Core Merchant Flow

Skills to use in Phase 2:
- `superpowers:writing-plans`: split the phase into database, auth, protected routing, merchant onboarding, forms, dashboard, and public payment-page tasks.
- `superpowers:test-driven-development`: cover validation schemas, server actions, API route authorization, status transitions, and data access helpers before implementation where practical.
- `supabase:supabase`: implement Auth, SSR session handling, protected routes, Realtime preparation, and service-role boundaries.
- `supabase:supabase-postgres-best-practices`: design schema, constraints, indexes, timestamps, uniqueness rules, and RLS policies.
- `vercel:nextjs`: implement middleware, Server Actions, Route Handlers, route groups, and public/private data loading safely.
- `vercel:react-best-practices`: review dashboard, forms, lists, public payment page, and shared components after TSX edits.
- `superpowers:verification-before-completion`: verify auth redirects, SQL files, Zod validation, merchant-owned data access, and public read-only payment-page behavior before summarizing.

Implement Supabase authentication:
- Login page
- Register page
- Logout action
- Protected dashboard routes
- Middleware/session handling
- Redirect unauthenticated users away from dashboard pages

Create database SQL in supabase/schema.sql for these tables:

merchants:
- id uuid primary key
- user_id uuid references auth.users(id)
- business_name text not null
- slug text unique
- stellar_public_key text
- created_at timestamptz
- updated_at timestamptz

products:
- id uuid primary key
- merchant_id uuid references merchants(id)
- name text not null
- description text
- price numeric(12,2) not null
- asset_code text default 'XLM'
- image_url text
- is_active boolean default true
- created_at timestamptz
- updated_at timestamptz

payment_requests:
- id uuid primary key
- merchant_id uuid references merchants(id)
- product_id uuid references products(id) nullable
- title text not null
- description text
- amount numeric(12,2) not null
- asset_code text default 'XLM'
- status text default 'pending'
- stellar_destination text not null
- memo text unique not null
- expires_at timestamptz
- paid_at timestamptz
- created_at timestamptz
- updated_at timestamptz

transactions:
- id uuid primary key
- payment_request_id uuid references payment_requests(id)
- merchant_id uuid references merchants(id)
- stellar_tx_hash text unique not null
- source_wallet text
- destination_wallet text
- amount numeric(12,2)
- asset_code text
- verified_at timestamptz
- raw_payload jsonb
- created_at timestamptz

receipts:
- id uuid primary key
- payment_request_id uuid references payment_requests(id)
- merchant_id uuid references merchants(id)
- receipt_number text unique
- created_at timestamptz

Add constraints:
- payment_requests.status must only allow: pending, paid, expired, cancelled
- amount must be greater than 0

Create RLS policies in supabase/rls.sql:
- Merchants can only read/update their own merchant profile.
- Merchants can only CRUD their own products.
- Merchants can only CRUD their own payment requests.
- Merchants can only read their own transactions and receipts.
- Public users can read only active public payment request data needed for /pay/[paymentRequestId].
- Public users must not be able to update payment status.
- Only server-side service role logic should insert verified transactions and mark payment requests as paid.

Implement:
- Merchant onboarding after register if merchant profile does not exist
- Merchant dashboard overview
- Create invoice/payment request form
- Create simple product form
- Invoice list with statuses: Pending, Paid, Expired, Cancelled
- Payment history table
- Public customer payment page at /pay/[paymentRequestId]
- QR code generation for each payment request
- Shareable payment link copy button

Validation:
- Use Zod for invoice/product creation.
- Validate amount, title, description, expiration time, and Stellar public key.
- Never trust raw client input.

Do not implement real Stellar payment verification yet in Phase 2. Use placeholder UI and safe mock buttons only if needed, but clearly mark them as TODO.

PHASE 3 — Stellar Wallet Payment, Server-Side Verification, Realtime Updates, and Security Hardening

Skills to use in Phase 3:
- `superpowers:writing-plans`: split Stellar transaction building, Freighter UX, server verification, duplicate protection, Realtime updates, and hardening into small tasks.
- `superpowers:test-driven-development`: test transaction parsing/verification helpers, amount matching, memo matching, destination matching, expired/already-paid handling, and duplicate transaction rejection.
- `superpowers:systematic-debugging`: use this immediately for Horizon/Testnet, Freighter, Supabase Realtime, or auth/session failures.
- `supabase:supabase`: implement service-role verification writes, Realtime subscriptions, and secure server-side status updates.
- `supabase:supabase-postgres-best-practices`: add any indexes or constraints needed for transaction hashes, memo lookup, status queries, and Realtime-friendly updates.
- `vercel:nextjs`: implement secure Route Handlers, server/client boundaries, loading/error states, and environment variable usage.
- `vercel:react-best-practices`: review Freighter client components, Realtime UI, forms, tables, and status components.
- `codex-security:security-scan` or `codex-security:security-diff-scan`: review payment verification, public routes, auth checks, RLS assumptions, secret exposure, and client/server trust boundaries.
- `vercel:agent-browser-verify`: run end-to-end browser verification for register/login, invoice creation, public payment page, QR/link display, Freighter flow where possible, and paid status update.
- `superpowers:verification-before-completion`: verify build/tests/security review/browser flow results before final acceptance.

Implement Stellar Testnet payment flow.

Customer payment page:
- Show merchant business name
- Show invoice/product title
- Show description
- Show exact amount
- Show asset code
- Show expiration time
- Show payment status
- Add “Connect Freighter Wallet”
- Add “Pay with Stellar Testnet”
- Use @stellar/freighter-api to request wallet connection and sign transaction
- Use @stellar/stellar-sdk to build a Stellar payment transaction

Payment transaction requirements:
- Destination must be the merchant’s configured Stellar public key or project treasury public key depending on current setup.
- Amount must match payment_requests.amount.
- Asset must match payment_requests.asset_code.
- Memo must uniquely identify the payment request.
- Network must be Stellar Testnet.
- Never use mainnet.

Server-side verification:
Create /api/stellar/verify.

This endpoint should:
- Accept a transaction hash and payment_request_id.
- Fetch the payment request from Supabase using server-side credentials.
- Query Stellar Testnet/Horizon using @stellar/stellar-sdk.
- Verify the transaction exists and succeeded.
- Verify destination wallet matches expected destination.
- Verify amount matches expected amount.
- Verify asset matches expected asset.
- Verify memo matches the payment request memo.
- Verify the payment request is still pending and not expired.
- Prevent duplicate transaction hash reuse.
- Insert into transactions table.
- Update payment_requests.status to paid.
- Set paid_at timestamp.
- Return a safe response to the client.

Important:
- The frontend must never directly update status to paid.
- The frontend can only submit the transaction hash for verification.
- The server performs all verification and database updates.
- Add clear error handling for wrong amount, wrong destination, wrong memo, expired request, already paid request, and failed transaction.

Realtime:
- Subscribe the merchant dashboard to Supabase Realtime changes for payment_requests.
- When a payment request becomes paid, the UI should update automatically.
- The customer payment page should also show success after verification.

Security hardening:
- Check all API routes for authentication where needed.
- Public payment page should only expose limited fields.
- Do not expose service role key.
- Keep all Stellar verification server-side.
- Add rate limiting TODO comments or a simple protection mechanism if practical.
- Add server-side authorization checks in all mutation endpoints.
- Add error messages that are helpful but do not leak sensitive details.
- Add loading, error, empty, and success states.
- Add README instructions for setup.

README must include:
- Project overview
- Tech stack
- Environment variables
- Supabase setup steps
- How to run SQL schema and RLS
- How to run local dev server
- How to test Stellar Testnet payment flow
- How to create a merchant account
- How to create an invoice
- How to pay with Freighter
- Known limitations
- Future features

Final acceptance criteria:
- The app runs locally.
- A merchant can register/login.
- A merchant can create a payment request.
- The app generates a shareable payment link and QR code.
- A customer can open the payment page.
- A customer can connect Freighter.
- A customer can pay on Stellar Testnet.
- The backend verifies the transaction.
- The payment request changes from Pending to Paid only after backend verification.
- The merchant can see payment history and transaction hash.
- The dashboard updates without relying on manual screenshot checking.

Work carefully and incrementally. Start with Phase 1 only. After completing Phase 1, stop and summarize the changes before continuing.
```
