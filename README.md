# Project ZERO

Project ZERO is a Stellar-powered credentialless commerce MVP for MSMEs, social sellers, and local merchants.

Merchants can register, create a merchant profile, create invoices and products, generate public payment links with QR codes, and review verified payment history. Customers pay on `/pay/[id]` with Freighter on Stellar Testnet; the server verifies each transaction on Horizon before marking invoices paid.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui (base-nova)
- Supabase Auth, Postgres, Realtime-ready tables, and RLS
- Stellar Testnet (`@stellar/stellar-sdk`, `@stellar/freighter-api`)
- Zod validation
- Vitest

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
PROJECT_ZERO_TREASURY_PUBLIC_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components or any `NEXT_PUBLIC_` variable.

## Local Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm test
npm run lint
npm run build
```

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password Auth in Supabase.
3. Apply migrations under `supabase/migrations/` (or run `supabase/schema.sql` then `supabase/rls.sql` for a fresh project).
4. If your project has “Tables not exposed to Data API automatically” enabled, the schema already includes explicit grants for `anon` and `authenticated` roles plus RLS policies.

## Current Flows

- Register at `/register`.
- Login at `/login` (honors `?next=` for post-auth redirect).
- Complete merchant onboarding at `/dashboard`.
- Create invoices at `/invoices` (share link + merchant QR).
- Create reusable products at `/products`.
- Review verified transaction history at `/payments`.
- Open public payment links at `/pay/[paymentRequestId]` (Freighter checkout + on-chain verify).

## Security Notes

- Dashboard routes are protected by `src/proxy.ts` and server-side user checks.
- Merchant-owned reads/writes are enforced by RLS and Server Actions.
- `stellar_destination` is server-bound at invoice creation — never client-supplied.
- Merchants cannot directly update `payment_requests.status`; settlement uses `mark_payment_paid` (service role only).
- Public users can read limited pending/paid payment request data for customer checkout pages.
- `/api/stellar/verify` is intentionally public for payer settlement; it binds verification to DB-stored memo, destination, amount, and asset.

## Known Limitations

- Email confirmation behavior depends on your Supabase Auth settings.
- Realtime subscriptions are prepared by table shape but not wired into the UI yet.
- MVP invoice forms default to XLM; non-XLM credit assets require issuer configuration.
- Testnet only — not production-ready for mainnet settlement.

## Documentation

- Live UX audit and acceptance criteria: [`docs/design.md`](docs/design.md)
- Implementation plan: [`docs/ux-ui-implementation-plan.md`](docs/ux-ui-implementation-plan.md)
