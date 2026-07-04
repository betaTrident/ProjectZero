# Project ZERO

Project ZERO is a Stellar-powered credentialless commerce MVP for MSMEs, social sellers, and local merchants.

Merchants can register, create a merchant profile, create invoices/products, generate public payment links with QR codes, and review payment history. Stellar wallet signing and server-side Horizon verification are scheduled for Phase 3; Phase 2 keeps payment status mutation server-only and does not expose any client-side “mark paid” path.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth, Postgres, Realtime-ready tables, and RLS
- Stellar Testnet dependencies
- Zod validation
- Vitest

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000

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
3. Run `supabase/schema.sql` in the SQL editor.
4. Run `supabase/rls.sql` in the SQL editor.
5. If your project has “Tables not exposed to Data API automatically” enabled, the schema already includes explicit grants for `anon` and `authenticated` roles plus RLS policies.

## Phase 2 Flows

- Register at `/register`.
- Login at `/login`.
- Complete merchant onboarding at `/dashboard`.
- Create invoices at `/invoices`.
- Create reusable products at `/products`.
- Review verified transaction history at `/payments`.
- Open public payment links at `/pay/[paymentRequestId]`.

## Security Notes

- Dashboard routes are protected by `src/proxy.ts` and server-side user checks.
- Merchant-owned reads/writes are enforced by RLS and Server Actions.
- Public users can only read limited pending/paid payment request data for customer payment pages.
- Public users cannot insert transactions or update payment request status.
- Stellar verification is intentionally not implemented until Phase 3.

## Known Limitations

- Email confirmation behavior depends on your Supabase Auth settings.
- Realtime subscriptions are prepared by table shape but not wired into the UI until Phase 3.
- Stellar Freighter payment signing is not active yet.
- `/api/stellar/verify` still returns `501` until Phase 3.
