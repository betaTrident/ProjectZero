# Project ZERO — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the end-to-end MVP flow — merchant creates invoice → QR/link generated → customer reviews in wallet → authorizes payment → Stellar settles on-chain → dashboard auto-marks invoice paid — with no reusable customer secrets ever touching the merchant stack.

**Architecture:** Next.js 16 App Router front-end + Supabase backend (Postgres, RLS, SECURITY DEFINER functions) + Stellar SDK for transaction construction and Horizon-based on-chain verification. The customer's private key never leaves their Freighter wallet; the merchant backend only verifies the resulting on-chain hash against four immutable axes (memo, destination, amount, asset).

**Tech Stack:** Next.js 16, TypeScript, Supabase (Postgres + RLS + pg_cron), `@stellar/stellar-sdk`, `@stellar/freighter-api`, `react-qr-code`, `zod`, `vitest` (jsdom), shadcn/ui, Tailwind CSS.

---

## How to Read This Plan

Each phase maps to one merge gate. Within a phase, the four **tracks** (A/B/C/D) run in parallel — each dev owns specific files and never edits another dev's file. Conflicts are resolved via the **owner** making the edit; the other dev files a PR comment with the exact diff.

**Skill index** — read the listed skill file before starting each track/phase:

| Skill key | File path |
|---|---|
| `smart-contracts` | `k:\ProjectZero\.claude\skills\smart-contracts\SKILL.md` |
| `assets` | `k:\ProjectZero\.claude\skills\assets\SKILL.md` |
| `dapp` | `k:\ProjectZero\.claude\skills\dapp\SKILL.md` |
| `agentic-payments` | `k:\ProjectZero\.claude\skills\agentic-payments\SKILL.md` |
| `data` | `k:\ProjectZero\.claude\skills\data\SKILL.md` |
| `standards` | `k:\ProjectZero\.claude\skills\standards\SKILL.md` |
| `zk-proofs` | `k:\ProjectZero\.claude\skills\zk-proofs\SKILL.md` |
| `supabase` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase\SKILL.md` |
| `supabase-postgres` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase-postgres-best-practices\SKILL.md` |
| `tdd` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\b7a8f76985f1e93e75dd2f2a3b424dc731bd9d37\skills\test-driven-development\SKILL.md` |
| `systematic-debugging` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\b7a8f76985f1e93e75dd2f2a3b424dc731bd9d37\skills\systematic-debugging\SKILL.md` |
| `security-review` | `C:\Users\Dennis\.cursor\skills-cursor\review-security\SKILL.md` |
| `shadcn` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\shadcn\SKILL.md` |

---

## Phase 0 — Pre-flight (Shared Contracts + Environment)

> **Skills required:** `supabase`, `dapp`, `smart-contracts`
>
> **Who:** all devs together — lock these before any parallel work starts.
> **Blocks:** every other phase.

These contracts are the seams between tracks. Every dev codes against these shapes, not against another dev's WIP branch.

### Task 0.1 — Pin shared TypeScript contracts

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/lib/stellar/build-payment.ts` (signatures only)
- Modify: `src/lib/stellar/verify-payment.ts` (signatures only)

- [ ] **Step 1: Lock `PaymentRequest` type in `src/types/database.ts`**

Replace the existing `PaymentRequest` type with the canonical shape that all tracks import:

```typescript
export type PaymentRequest = {
  id: string
  merchant_id: string
  stellar_destination: string   // server-bound, never client-supplied
  amount: string                // string to preserve decimal precision
  asset_code: string            // 'XLM' | credit asset code
  asset_issuer: string | null   // null iff asset_code === 'XLM'
  memo: string                  // public correlation key — not a secret
  status: 'pending' | 'paid' | 'expired'
  expires_at: string
  paid_at: string | null
  created_at: string
}
```

- [ ] **Step 2: Lock `build-payment.ts` exported signatures**

Open `src/lib/stellar/build-payment.ts` and confirm (or add) these exported types and stubs — do not implement yet:

```typescript
export type PaymentParams = {
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
  memo: string
  networkPassphrase: string
}

// Returns a base64-encoded XDR ready for Freighter `signTransaction`
export function buildPaymentXDR(params: PaymentParams): string {
  throw new Error('not implemented')
}

// Returns a SEP-7 web+stellar: URI for non-Freighter wallet deeplinks
export function buildSep7Uri(params: PaymentParams & { payLink: string }): string {
  throw new Error('not implemented')
}
```

- [ ] **Step 3: Lock `verify-payment.ts` exported signatures**

Open `src/lib/stellar/verify-payment.ts` and confirm (or add):

```typescript
export type VerifyExpected = {
  memo: string
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
}

export type VerifyResult = { ok: boolean; reason?: string }

export async function verifyPaymentByHash(
  hash: string,
  expected: VerifyExpected
): Promise<VerifyResult> {
  throw new Error('not implemented')
}
```

- [ ] **Step 4: Commit pinned contracts**

```bash
git add src/types/database.ts src/lib/stellar/build-payment.ts src/lib/stellar/verify-payment.ts
git commit -m "chore: pin shared type contracts for parallel track work"
```

---

### Task 0.2 — Environment setup checklist

**Files:**
- Read: `.env.example` (or create if missing)

- [ ] **Step 1: Confirm `.env.local` variables are present**

Every dev must have all of these set before starting:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_NETWORK=testnet
PROJECT_ZERO_TREASURY_PUBLIC_KEY=G...
```

- [ ] **Step 2: Verify `src/constants/stellar.ts` constants match env**

The constants file must pair `STELLAR_TESTNET_HORIZON_URL` with `STELLAR_TESTNET_PASSPHRASE` explicitly so no silent mismatch is possible. Confirm they read:

```typescript
export const STELLAR_TESTNET_NETWORK = 'testnet'
export const STELLAR_TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'
export const DEFAULT_ASSET_CODE = 'XLM'
```

- [ ] **Step 3: Install Freighter wallet extension in browser, switch to Testnet, fund via Friendbot**

Friendbot URL: `https://friendbot.stellar.org?addr=<YOUR_PUBLIC_KEY>`

- [ ] **Step 4: Create per-track branches**

```bash
git checkout -b feat/track-a-stellar
git checkout -b feat/track-b-wallet
git checkout -b feat/track-c-backend
git checkout -b feat/track-d-dashboard-tests
```

---

## Phase 1 — Foundation (Parallel Start)

> **Merge gate: M1**
> All four tracks start simultaneously. No cross-track runtime dependency yet — each codes against the Phase 0 contracts.

---

### Track A — Stellar On-Chain Foundation

> **Skills required:** `smart-contracts`, `assets`, `data`
>
> **Owner:** Dev A
> **Files owned:** `src/lib/stellar/build-payment.ts`, `src/lib/stellar/verify-payment.ts`, `src/lib/stellar/client.ts`, `src/constants/stellar.ts`
> **Mission:** Implement real XDR construction; scaffold real verification; kill dead-code status.

#### Task A1 — Implement `buildPaymentXDR`

**Files:**
- Modify: `src/lib/stellar/build-payment.ts`
- Create: `src/lib/stellar/build-payment.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/stellar/build-payment.test.ts
import { describe, it, expect } from 'vitest'
import { Transaction, Networks } from '@stellar/stellar-sdk'
import { buildPaymentXDR } from './build-payment'

describe('buildPaymentXDR', () => {
  const base = {
    destination: 'GBVQ7HRPQ52P4GKHRXAFRDKKL3BXQNMKJ3OAMDCMZRQ7S7XGJPNEGFE',
    amount: '10.0000000',
    assetCode: 'XLM',
    assetIssuer: null,
    memo: 'test-memo-123',
    networkPassphrase: Networks.TESTNET,
  }

  it('produces XDR decodable by stellar-sdk', () => {
    const xdr = buildPaymentXDR(base)
    expect(() => new Transaction(xdr, Networks.TESTNET)).not.toThrow()
  })

  it('embeds the correct memo text', () => {
    const xdr = buildPaymentXDR(base)
    const tx = new Transaction(xdr, Networks.TESTNET)
    expect(tx.memo.value?.toString()).toBe('test-memo-123')
  })

  it('targets the correct destination', () => {
    const xdr = buildPaymentXDR(base)
    const tx = new Transaction(xdr, Networks.TESTNET)
    const op = tx.operations[0] as any
    expect(op.destination).toBe(base.destination)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/stellar/build-payment.test.ts
```

Expected: FAIL with `not implemented`.

- [ ] **Step 3: Implement `buildPaymentXDR`**

```typescript
// src/lib/stellar/build-payment.ts
import {
  TransactionBuilder,
  Networks,
  Asset,
  Operation,
  Memo,
  BASE_FEE,
} from '@stellar/stellar-sdk'
import { getStellarServer } from './client'

export type PaymentParams = {
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
  memo: string
  networkPassphrase: string
}

export function buildPaymentXDR(params: PaymentParams): string {
  const { destination, amount, assetCode, assetIssuer, memo, networkPassphrase } = params
  const asset = assetCode === 'XLM' ? Asset.native() : new Asset(assetCode, assetIssuer!)

  // Use a throwaway source — Freighter will replace with the real signer
  const dummySource = {
    accountId: () => destination,
    sequenceNumber: () => '0',
    incrementSequenceNumber: () => {},
  }

  const tx = new TransactionBuilder(dummySource as any, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset,
        amount,
      })
    )
    .addMemo(Memo.text(memo))
    .setTimeout(300)
    .build()

  return tx.toXDR()
}

export function buildSep7Uri(params: PaymentParams & { payLink: string }): string {
  const { destination, amount, assetCode, assetIssuer, memo, payLink } = params
  const asset = assetCode === 'XLM' ? 'native' : `${assetCode}:${assetIssuer}`
  const url = new URL('web+stellar:pay')
  url.searchParams.set('destination', destination)
  url.searchParams.set('amount', amount)
  url.searchParams.set('asset_code', asset)
  url.searchParams.set('memo', memo)
  url.searchParams.set('memo_type', 'MEMO_TEXT')
  url.searchParams.set('callback', `url:${payLink}`)
  return url.toString()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/stellar/build-payment.test.ts
```

Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stellar/build-payment.ts src/lib/stellar/build-payment.test.ts
git commit -m "feat(stellar): implement buildPaymentXDR and buildSep7Uri"
```

---

#### Task A2 — Wire `getStellarServer()` and scaffold `verifyPaymentByHash`

**Files:**
- Modify: `src/lib/stellar/client.ts`
- Modify: `src/lib/stellar/verify-payment.ts`

- [ ] **Step 1: Confirm `getStellarServer` is importable from `client.ts`**

Open `src/lib/stellar/client.ts`. It must export:

```typescript
import { Horizon } from '@stellar/stellar-sdk'
import { STELLAR_TESTNET_HORIZON_URL } from '@/constants/stellar'

let _server: Horizon.Server | null = null

export function getStellarServer(): Horizon.Server {
  if (!_server) {
    _server = new Horizon.Server(STELLAR_TESTNET_HORIZON_URL)
  }
  return _server
}
```

- [ ] **Step 2: Scaffold real `verifyPaymentByHash` (real in Phase 2, stub returns false now)**

```typescript
// src/lib/stellar/verify-payment.ts
import { getStellarServer } from './client'

export type VerifyExpected = {
  memo: string
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
}

export type VerifyResult = { ok: boolean; reason?: string }

export async function verifyPaymentByHash(
  hash: string,
  expected: VerifyExpected
): Promise<VerifyResult> {
  // Phase 1 stub — real implementation in Phase 2 Task A3
  void hash
  void expected
  return { ok: false, reason: 'verify pending Phase 2' }
}
```

- [ ] **Step 3: Import `getStellarServer` from `verify-payment.ts` to confirm stellar-lib is no longer dead code**

Add at top of `verify-payment.ts`:

```typescript
import { getStellarServer } from './client' // wired; will be used in Phase 2
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/stellar/client.ts src/lib/stellar/verify-payment.ts
git commit -m "feat(stellar): wire getStellarServer; scaffold verifyPaymentByHash stub"
```

---

**Track A — Phase 1 Acceptance Criteria:**
- [ ] `buildPaymentXDR` produces valid XDR decodable by `stellar-sdk` (tests pass)
- [ ] `getStellarServer()` imported by both `build-payment.ts` and `verify-payment.ts` — stellar-lib is no longer dead code
- [ ] Network passphrase constant is paired with Horizon URL in `src/constants/stellar.ts`

---

### Track B — Customer Wallet UI

> **Skills required:** `dapp`, `agentic-payments`
>
> **Owner:** Dev B
> **Files owned:** `src/app/pay/[paymentRequestId]/page.tsx`, `src/components/payment/payment-request-card.tsx`, `src/components/payment/copy-payment-link.tsx`, `src/components/payment/payment-page-placeholder.tsx`
> **Mission:** Customer reviews invoice and signs in Freighter wallet; Submit hash to `/api/stellar/verify`.
> **Note:** Stub against Phase 0 contract for `buildPaymentXDR` — replace in Phase 2.

#### Task B1 — Enable wallet connection and Pay button

**Files:**
- Modify: `src/components/payment/payment-request-card.tsx`

- [ ] **Step 1: Add wallet connection state**

Replace the current placeholder Pay button with a real `'use client'` component. Key imports:

```typescript
'use client'
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api'
import { buildPaymentXDR } from '@/lib/stellar/build-payment'
import { STELLAR_TESTNET_PASSPHRASE, STELLAR_TESTNET_NETWORK } from '@/constants/stellar'
import { useState } from 'react'
```

- [ ] **Step 2: Implement `handlePay` flow**

Inside the component:

```typescript
const [status, setStatus] = useState<'idle' | 'connecting' | 'signing' | 'verifying' | 'paid' | 'error'>('idle')
const [errorMsg, setErrorMsg] = useState<string | null>(null)

async function handlePay() {
  try {
    setStatus('connecting')
    const connected = await isConnected()
    if (!connected) {
      await requestAccess()
    }

    setStatus('signing')
    const xdr = buildPaymentXDR({
      destination: paymentRequest.stellar_destination,
      amount: paymentRequest.amount,
      assetCode: paymentRequest.asset_code,
      assetIssuer: paymentRequest.asset_issuer,
      memo: paymentRequest.memo,
      networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
    })

    const { signedXDR } = await signTransaction(xdr, {
      network: STELLAR_TESTNET_NETWORK,
    })

    // Submit to Stellar network
    const server = (await import('@/lib/stellar/client')).getStellarServer()
    const tx = (await import('@stellar/stellar-sdk')).TransactionBuilder.fromXDR(
      signedXDR,
      STELLAR_TESTNET_PASSPHRASE
    )
    const result = await server.submitTransaction(tx as any)
    const stellarTxHash = result.hash

    setStatus('verifying')
    const res = await fetch('/api/stellar/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentRequestId: paymentRequest.id,
        stellarTxHash,
      }),
    })
    const json = await res.json()

    if (json.ok) {
      setStatus('paid')
    } else {
      setErrorMsg(json.reason ?? 'Verification failed')
      setStatus('error')
    }
  } catch (err: unknown) {
    setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    setStatus('error')
  }
}
```

- [ ] **Step 3: Render status-aware UI**

```typescript
return (
  <div>
    {/* invoice details: destination, amount, asset, memo */}
    {status === 'paid' && <p>Payment confirmed on-chain.</p>}
    {status === 'error' && <p>Error: {errorMsg}</p>}
    {status === 'idle' && (
      <button onClick={handlePay}>Pay with Freighter</button>
    )}
    {['connecting', 'signing', 'verifying'].includes(status) && (
      <p>{status.charAt(0).toUpperCase() + status.slice(1)}…</p>
    )}
  </div>
)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/payment/payment-request-card.tsx
git commit -m "feat(wallet): enable Pay button with Freighter signing flow"
```

---

#### Task B2 — Update `/pay/[paymentRequestId]/page.tsx` to render card

**Files:**
- Modify: `src/app/pay/[paymentRequestId]/page.tsx`

- [ ] **Step 1: Pass full `PaymentRequest` row to `payment-request-card`**

The page must fetch the row server-side and pass it as a prop. Confirm the page calls the Supabase client, fetches `payment_requests` by `id`, and passes the full row (typed as `PaymentRequest`) to `<PaymentRequestCard />`.

- [ ] **Step 2: Handle not-found and expired states**

```typescript
if (!row || row.status === 'expired') {
  return <p>This invoice is no longer available.</p>
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/pay/[paymentRequestId]/page.tsx
git commit -m "feat(pay-page): server-fetch row and render payment card"
```

---

**Track B — Phase 1 Acceptance Criteria:**
- [ ] `/pay/[id]` with Freighter on Testnet: Pay button opens wallet showing correct destination, amount, asset, memo
- [ ] Reject / no wallet ⇒ readable error displayed, no broadcast
- [ ] Paid state shown on `ok` response from `/api/stellar/verify`

---

### Track C — Backend / DB / Settlement

> **Skills required:** `supabase`, `supabase-postgres`
>
> **Owner:** Dev C
> **Files owned:** `supabase/schema.sql`, `supabase/rls.sql`, `supabase/migrations/*`, `src/lib/supabase/*`, `src/actions/*`, `src/app/api/*`, `src/lib/validation/*`, `src/lib/payments/payment-request.ts`, `src/types/database.ts`
> **Mission:** Secure server-side destination binding, atomic mark-paid, stub verify endpoint.

#### Task C1 — Migration: add `asset_issuer` column

**Files:**
- Create: `supabase/migrations/20260706_asset_issuer.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260706_asset_issuer.sql
ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS asset_issuer text,
  ADD CONSTRAINT chk_asset_issuer CHECK (
    (asset_code = 'XLM' AND asset_issuer IS NULL)
    OR
    (asset_code != 'XLM' AND asset_issuer ~ '^G[A-Z0-9]{55}$')
  );
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```

Expected: migration applies cleanly. Verify with:

```bash
supabase db diff
```

Expected: no diff (migration is the source of truth).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260706_asset_issuer.sql
git commit -m "feat(db): add asset_issuer column with CHECK constraint"
```

---

#### Task C2 — Server-side destination binding

**Files:**
- Modify: `src/actions/payment-requests.ts`
- Modify: `src/app/api/payment-requests/route.ts`
- Modify: `src/lib/validation/payment-request.schema.ts`

- [ ] **Step 1: Remove `stellar_destination` from the inbound schema**

In `payment-request.schema.ts`, delete `stellar_destination` from the Zod input schema entirely so it cannot be client-supplied.

- [ ] **Step 2: Resolve destination server-side in the create action**

In `src/actions/payment-requests.ts`, inside `createPaymentRequest`:

```typescript
// Resolve stellar_destination server-side — never from client input
const merchant = await getMerchantById(merchantId) // existing helper
const stellar_destination =
  merchant?.stellar_public_key ??
  process.env.PROJECT_ZERO_TREASURY_PUBLIC_KEY!

if (!stellar_destination) {
  throw new Error('No destination address available for this merchant')
}
```

- [ ] **Step 3: Replace memo entropy with `crypto.randomUUID()`**

Find `createPaymentMemo` (or wherever `Math.random` is used) and replace with:

```typescript
const memo = crypto.randomUUID().replace(/-/g, '').slice(0, 28) // 28 char max for MEMO_TEXT
```

- [ ] **Step 4: Reject any inbound `stellar_destination` in POST handler**

In `src/app/api/payment-requests/route.ts`:

```typescript
// Strip client-supplied stellar_destination before validation
const { stellar_destination: _ignored, ...safeBody } = await req.json()
```

- [ ] **Step 5: Commit**

```bash
git add src/actions/payment-requests.ts src/app/api/payment-requests/route.ts src/lib/validation/payment-request.schema.ts
git commit -m "fix(security): server-side stellar_destination binding; crypto memo"
```

---

#### Task C3 — `mark_payment_paid()` SQL function

**Files:**
- Create: `supabase/migrations/20260706_mark_payment_paid.sql`

- [ ] **Step 1: Write the SECURITY DEFINER function**

```sql
-- supabase/migrations/20260706_mark_payment_paid.sql
CREATE OR REPLACE FUNCTION mark_payment_paid(
  p_request_id uuid,
  p_tx_hash    text,
  p_payload    jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atomic: only flip pending → paid
  UPDATE payment_requests
  SET
    status  = 'paid',
    paid_at = now()
  WHERE id = p_request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment_request % not in pending state', p_request_id;
  END IF;

  -- Insert settlement receipt
  INSERT INTO transactions (payment_request_id, stellar_tx_hash, payload)
  VALUES (p_request_id, p_tx_hash, p_payload);
END;
$$;
```

- [ ] **Step 2: Apply migration and verify**

```bash
supabase db push
```

Test the function exists:

```sql
SELECT proname FROM pg_proc WHERE proname = 'mark_payment_paid';
```

Expected: one row returned.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260706_mark_payment_paid.sql
git commit -m "feat(db): SECURITY DEFINER mark_payment_paid atomic function"
```

---

#### Task C4 — Service-role client + stub verify endpoint

**Files:**
- Modify: `src/lib/supabase/service.ts` (create if missing)
- Modify: `src/app/api/stellar/verify/route.ts`

- [ ] **Step 1: Create service-role Supabase client**

```typescript
// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js'

let _serviceClient: ReturnType<typeof createClient> | null = null

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _serviceClient
}
```

- [ ] **Step 2: Stub `/api/stellar/verify` to accept contract request shape**

```typescript
// src/app/api/stellar/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const VerifySchema = z.object({
  paymentRequestId: z.string().uuid(),
  stellarTxHash: z.string().min(64).max(64),
})

export async function POST(req: NextRequest) {
  const parsed = VerifySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: 'invalid request' }, { status: 400 })
  }
  // Phase 1 stub — real wiring in Phase 2
  return NextResponse.json({ ok: false, reason: 'verify pending Phase 2' })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/service.ts src/app/api/stellar/verify/route.ts
git commit -m "feat(api): service-role client; stub /api/stellar/verify with contract shape"
```

---

**Track C — Phase 1 Acceptance Criteria:**
- [ ] `supabase db push` applies `asset_issuer` CHECK and `mark_payment_paid()` cleanly on fresh project
- [ ] `POST /api/payment-requests` ignores client-supplied `stellar_destination`; stored row = merchant key or treasury fallback
- [ ] New memos are 28-char crypto-random (no `Math.random`)
- [ ] `/api/stellar/verify` accepts `{paymentRequestId, stellarTxHash}` and returns `{ok, reason}` (stub ok)

---

### Track D — Merchant Dashboard + Tests + Infra

> **Skills required:** `tdd`, `shadcn`, `dapp`
>
> **Owner:** Dev D
> **Files owned:** `src/app/(dashboard)/*`, `src/components/dashboard/*`, `vitest.config.ts`, `*.test.ts` (new), `supabase/tests/*`
> **Mission:** QR code on dashboard invoices; polling scaffold; full test harness.

#### Task D1 — Configure Vitest with jsdom and mocks

**Files:**
- Modify: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Write failing test for Vitest config**

Create a trivial test to prove the config loads:

```typescript
// src/test/config.test.ts
import { describe, it, expect } from 'vitest'
describe('vitest config', () => {
  it('runs with jsdom env', () => {
    expect(typeof window).toBe('object')
  })
})
```

Run: `npx vitest run src/test/config.test.ts`

Expected: FAIL (no jsdom configured yet).

- [ ] **Step 2: Update `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create `src/test/setup.ts` with module mocks**

```typescript
// src/test/setup.ts
import { vi } from 'vitest'

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn().mockResolvedValue(true),
  requestAccess: vi.fn().mockResolvedValue(undefined),
  signTransaction: vi.fn().mockResolvedValue({ signedXDR: 'mocked-xdr' }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/'),
}))
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/test/setup.ts src/test/config.test.ts
git commit -m "test: configure vitest with jsdom and module mocks"
```

---

#### Task D2 — QR code on merchant dashboard invoice rows

**Files:**
- Modify: `src/components/dashboard/` (add QR to invoice detail or list component)
- Read skill: `shadcn` (for shadcn Card/Dialog patterns)

- [ ] **Step 1: Import `react-qr-code` (already in `package.json`)**

In the invoice list/detail component:

```typescript
import QRCode from 'react-qr-code'
import { buildPaymentLink } from '@/lib/payments/payment-request'
```

- [ ] **Step 2: Render QR per invoice**

```typescript
<QRCode
  value={buildPaymentLink(invoice.id)}
  size={128}
  aria-label={`QR code for invoice ${invoice.id}`}
/>
```

- [ ] **Step 3: Verify QR value scans to correct `/pay/<id>` URL on mobile browser**

Manual test — scan QR with phone, confirm it loads `/pay/<id>` page.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat(dashboard): render QR code per invoice"
```

---

#### Task D3 — Dashboard polling scaffold

**Files:**
- Modify: relevant dashboard list component

- [ ] **Step 1: Add polling for `/api/stellar/status`**

```typescript
'use client'
import { useEffect, useState, useRef } from 'react'

function usePaymentStatus(paymentRequestId: string, initialStatus: string) {
  const [status, setStatus] = useState(initialStatus)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'paid' || status === 'expired') return

    intervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/stellar/status?id=${paymentRequestId}`)
      if (!res.ok) return
      const data = await res.json()
      setStatus(data.status)
      if (data.status === 'paid' || data.status === 'expired') {
        clearInterval(intervalRef.current!)
      }
    }, 5000)

    return () => clearInterval(intervalRef.current!)
  }, [paymentRequestId, status])

  return status
}
```

- [ ] **Step 2: Wire hook to invoice badge rendering**

The invoice badge should render `paid`, `pending`, or `expired` based on polled status.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ src/app/(dashboard)/
git commit -m "feat(dashboard): live status polling hook for invoices"
```

---

#### Task D4 — Write test skeleton files for Phase 2

**Files:**
- Create: `src/lib/stellar/verify-payment.test.ts`
- Create: `src/actions/payment-requests.test.ts`
- Create: `supabase/tests/rls.test.sql`

- [ ] **Step 1: Create verify-payment test skeleton**

```typescript
// src/lib/stellar/verify-payment.test.ts
import { describe, it, expect, vi } from 'vitest'
import { verifyPaymentByHash } from './verify-payment'

// Mock Horizon server — fill in Phase 2 Task A3
vi.mock('./client', () => ({
  getStellarServer: vi.fn(),
}))

describe('verifyPaymentByHash', () => {
  it.todo('returns ok:true for matching tx')
  it.todo('returns ok:false, reason:memo when memo mismatches')
  it.todo('returns ok:false, reason:destination when destination mismatches')
  it.todo('returns ok:false, reason:amount when amount mismatches')
  it.todo('returns ok:false, reason:asset when asset mismatches')
})
```

- [ ] **Step 2: Create payment-requests action test skeleton**

```typescript
// src/actions/payment-requests.test.ts
import { describe, it, expect } from 'vitest'

describe('createPaymentRequest', () => {
  it.todo('rejects client-supplied stellar_destination')
  it.todo('uses merchant stellar_public_key as destination')
  it.todo('falls back to treasury key when merchant has none')
  it.todo('generates crypto-random memo')
  it.todo('requireMerchantId blocks unauthenticated callers')
})
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/stellar/verify-payment.test.ts src/actions/payment-requests.test.ts supabase/tests/rls.test.sql
git commit -m "test: add skeleton test files for Phase 2 implementation"
```

---

**Track D — Phase 1 Acceptance Criteria:**
- [ ] `npx vitest run` loads jsdom env + mocks; existing tests still green
- [ ] Merchant dashboard shows QR per invoice scanning to `/pay/<id>`
- [ ] Dashboard polling scaffold runs without errors (status loads at minimum)

---

### Phase 1 Merge Gate (M1)

Before merging any track to `main`, verify all of the following:

- [ ] Track A: `buildPaymentXDR` produces valid XDR (unit tests pass); stellar-lib wired (no dead code)
- [ ] Track B: `/pay/[id]` renders payment card; wallet errors show inline; Pay button enabled
- [ ] Track C: both migrations applied cleanly; `stellar_destination` server-bound; `mark_payment_paid()` exists; `/api/stellar/verify` accepts contract shape
- [ ] Track D: `vitest run` green including existing tests; QR renders; polling scaffold live
- [ ] CI: `npm run lint && npm test` green on all branches

---

## Phase 2 — Wire (Cross-Track Integration)

> **Merge gates: M2 and M3**
> **Skills required:** `smart-contracts`, `data`, `dapp`, `agentic-payments`, `supabase`, `systematic-debugging`
>
> Cross-track wiring. All Phase 1 contracts must be merged before Phase 2 starts.

---

### Track A — Real `verifyPaymentByHash` Implementation

> **Skills required:** `smart-contracts`, `data`

#### Task A3 — Implement real on-chain verification

**Files:**
- Modify: `src/lib/stellar/verify-payment.ts`
- Modify: `src/lib/stellar/verify-payment.test.ts`

- [ ] **Step 1: Write failing tests (fill in the skeletons from D4)**

```typescript
// src/lib/stellar/verify-payment.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStellarServer } from './client'
import { verifyPaymentByHash } from './verify-payment'

const mockTx = {
  memo: { type: 'text', value: 'test-memo-123' },
  payments: vi.fn(),
}

vi.mock('./client', () => ({
  getStellarServer: vi.fn(() => ({
    transactions: () => ({
      transaction: () => ({ call: vi.fn().mockResolvedValue(mockTx) }),
    }),
    payments: () => ({
      forTransaction: () => ({
        call: vi.fn().mockResolvedValue({
          records: [
            {
              type: 'payment',
              to: 'GBVQ7...',
              amount: '10.0000000',
              asset_type: 'native',
              asset_code: undefined,
              asset_issuer: undefined,
            },
          ],
        }),
      }),
    }),
  })),
}))

const expected = {
  memo: 'test-memo-123',
  destination: 'GBVQ7...',
  amount: '10.0000000',
  assetCode: 'XLM',
  assetIssuer: null,
}

describe('verifyPaymentByHash', () => {
  it('returns ok:true for exact match', async () => {
    const result = await verifyPaymentByHash('abc123', expected)
    expect(result.ok).toBe(true)
  })

  it('returns ok:false, reason:memo on memo mismatch', async () => {
    const result = await verifyPaymentByHash('abc123', { ...expected, memo: 'wrong' })
    expect(result).toEqual({ ok: false, reason: 'memo' })
  })

  it('returns ok:false, reason:destination on destination mismatch', async () => {
    const result = await verifyPaymentByHash('abc123', { ...expected, destination: 'GOTHER...' })
    expect(result).toEqual({ ok: false, reason: 'destination' })
  })

  it('returns ok:false, reason:amount on amount mismatch', async () => {
    const result = await verifyPaymentByHash('abc123', { ...expected, amount: '99.0000000' })
    expect(result).toEqual({ ok: false, reason: 'amount' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/stellar/verify-payment.test.ts
```

Expected: FAIL (stub always returns `ok: false, reason: 'verify pending Phase 2'`).

- [ ] **Step 3: Implement real `verifyPaymentByHash`**

```typescript
// src/lib/stellar/verify-payment.ts
import { getStellarServer } from './client'

export type VerifyExpected = {
  memo: string
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
}

export type VerifyResult = { ok: boolean; reason?: string }

export async function verifyPaymentByHash(
  hash: string,
  expected: VerifyExpected
): Promise<VerifyResult> {
  const server = getStellarServer()

  const tx = await server.transactions().transaction(hash).call()

  // Verify memo
  if (tx.memo !== expected.memo) {
    return { ok: false, reason: 'memo' }
  }

  // Load payment operations for this transaction
  const payments = await server.payments().forTransaction(hash).call()
  const paymentOp = payments.records.find((r: any) => r.type === 'payment')

  if (!paymentOp) {
    return { ok: false, reason: 'no payment operation found' }
  }

  // Verify destination
  if (paymentOp.to !== expected.destination) {
    return { ok: false, reason: 'destination' }
  }

  // Verify amount (normalize to 7 decimal places for comparison)
  const normalize = (v: string) => parseFloat(v).toFixed(7)
  if (normalize(paymentOp.amount) !== normalize(expected.amount)) {
    return { ok: false, reason: 'amount' }
  }

  // Verify asset
  if (expected.assetCode === 'XLM') {
    if (paymentOp.asset_type !== 'native') {
      return { ok: false, reason: 'asset' }
    }
  } else {
    if (
      paymentOp.asset_code !== expected.assetCode ||
      paymentOp.asset_issuer !== expected.assetIssuer
    ) {
      return { ok: false, reason: 'asset' }
    }
  }

  return { ok: true }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/stellar/verify-payment.test.ts
```

Expected: all 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stellar/verify-payment.ts src/lib/stellar/verify-payment.test.ts
git commit -m "feat(stellar): implement real verifyPaymentByHash with four-axis check"
```

---

#### Task A4 — Harden for credit assets

**Files:**
- Modify: `src/lib/stellar/build-payment.test.ts`

- [ ] **Step 1: Add credit asset test**

```typescript
it('builds valid XDR for credit asset (USDC testnet)', () => {
  const xdr = buildPaymentXDR({
    destination: 'GBVQ7...',
    amount: '5.0000000',
    assetCode: 'USDC',
    assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    memo: 'test-credit',
    networkPassphrase: Networks.TESTNET,
  })
  const tx = new Transaction(xdr, Networks.TESTNET)
  const op = tx.operations[0] as any
  expect(op.asset.code).toBe('USDC')
  expect(op.asset.issuer).toBe('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
})
```

- [ ] **Step 2: Run and confirm pass**

```bash
npx vitest run src/lib/stellar/build-payment.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/stellar/build-payment.test.ts
git commit -m "test(stellar): add credit asset XDR build test"
```

---

**Track A — Phase 2 Acceptance Criteria:**
- [ ] `verifyPaymentByHash` tests green for all four axes
- [ ] Credit asset XDR builds and verifies with issuer correctly

---

### Track B — Replace Stub, Handle Verify Results

> **Skills required:** `dapp`, `agentic-payments`

#### Task B3 — Wire real `buildPaymentXDR` and handle verify outcome

**Files:**
- Modify: `src/components/payment/payment-request-card.tsx`

- [ ] **Step 1: Confirm import is already using the real `buildPaymentXDR` from Track A**

The import `from '@/lib/stellar/build-payment'` should now resolve to the real implementation. No code change needed if Task A1 landed; just verify.

- [ ] **Step 2: Show verify failure reason inline**

Update error render:

```typescript
{status === 'error' && (
  <div role="alert">
    <p>Payment could not be verified.</p>
    {errorMsg && <p>Reason: <code>{errorMsg}</code></p>}
    <p>Your funds have not been moved if signing was rejected.</p>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/payment/payment-request-card.tsx
git commit -m "feat(wallet): show verify failure reason inline; wire real buildPaymentXDR"
```

---

**Track B — Phase 2 Acceptance Criteria:**
- [ ] Customer `/pay` shows paid/success after verify round-trip on a matching testnet tx
- [ ] Tampered tx shows verify failure with axis named (e.g., "memo"), no paid state

---

### Track C — Wire Real Verify Endpoint + `settlePaymentRequest`

> **Skills required:** `supabase`, `supabase-postgres`

#### Task C5 — Wire `/api/stellar/verify` with real logic

**Files:**
- Modify: `src/app/api/stellar/verify/route.ts`

- [ ] **Step 1: Write failing integration expectation**

(Manual test — cannot be unit-tested without a real testnet tx. Document the expected behavior:)

Given a real testnet tx hash matching a `pending` payment_request row, `POST /api/stellar/verify` should return `{ ok: true }` and the row should be `paid`.

- [ ] **Step 2: Implement real verify handler**

```typescript
// src/app/api/stellar/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPaymentByHash } from '@/lib/stellar/verify-payment'
import { getServiceClient } from '@/lib/supabase/service'
import { requireMerchantId } from '@/lib/supabase/server'

const VerifySchema = z.object({
  paymentRequestId: z.string().uuid(),
  stellarTxHash: z.string().length(64),
})

export async function POST(req: NextRequest) {
  const merchantId = await requireMerchantId()
  if (!merchantId) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })
  }

  const parsed = VerifySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: 'invalid request' }, { status: 400 })
  }

  const { paymentRequestId, stellarTxHash } = parsed.data
  const db = getServiceClient()

  // Load row
  const { data: row, error } = await db
    .from('payment_requests')
    .select('*')
    .eq('id', paymentRequestId)
    .eq('merchant_id', merchantId)
    .single()

  if (error || !row) {
    return NextResponse.json({ ok: false, reason: 'not found' }, { status: 404 })
  }

  if (row.status !== 'pending') {
    return NextResponse.json({ ok: false, reason: `already ${row.status}` })
  }

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ ok: false, reason: 'expired' })
  }

  const result = await verifyPaymentByHash(stellarTxHash, {
    memo: row.memo,
    destination: row.stellar_destination,
    amount: row.amount,
    assetCode: row.asset_code,
    assetIssuer: row.asset_issuer,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason })
  }

  // Atomic mark-paid via SECURITY DEFINER function
  const { error: rpcError } = await db.rpc('mark_payment_paid', {
    p_request_id: paymentRequestId,
    p_tx_hash: stellarTxHash,
    p_payload: { verified_at: new Date().toISOString() },
  })

  if (rpcError) {
    return NextResponse.json({ ok: false, reason: 'settle failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Implement `GET /api/stellar/status`**

```typescript
// src/app/api/stellar/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const db = await createServerSupabaseClient()
  const { data, error } = await db
    .from('payment_requests')
    .select('id, status, paid_at')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json(data)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stellar/verify/route.ts src/app/api/stellar/status/route.ts
git commit -m "feat(api): wire real /api/stellar/verify; implement /api/stellar/status"
```

---

**Track C — Phase 2 Acceptance Criteria:**
- [ ] `POST /api/stellar/verify` with real testnet hash matching row ⇒ `{ok:true}`, row `pending→paid`, `paid_at` set, `transactions` row inserted
- [ ] Tampered tx ⇒ `{ok:false, reason:<axis>}`, row stays `pending`
- [ ] No direct `UPDATE payment_requests SET status` anywhere in app code — only via `mark_payment_paid()` SQL fn

---

### Track D — Dashboard Live + Verify Tests

> **Skills required:** `tdd`, `systematic-debugging`

#### Task D5 — Unit tests for `verifyPaymentByHash`

**Files:**
- Modify: `src/lib/stellar/verify-payment.test.ts`

- [ ] **Step 1: Fill in the todo tests from Phase 1 skeleton with real assertions**

(See Task A3 Step 1 — the test code is identical. Confirm they pass on Track D's branch after Track A merges.)

```bash
npx vitest run src/lib/stellar/verify-payment.test.ts
```

Expected: all 5 PASS.

- [ ] **Step 2: Assert test suite fails if any axis comparison is removed**

In CI, the test suite for `verify-payment` must cover all four axes. Document this as a required check in `docs/testing-policy.md` (one sentence: "Removing any axis assertion from verify-payment.test.ts must cause CI to fail").

- [ ] **Step 3: Commit**

```bash
git add src/lib/stellar/verify-payment.test.ts
git commit -m "test(verify): all four-axis verify tests green"
```

---

#### Task D6 — `createPaymentRequest` action tests

**Files:**
- Modify: `src/actions/payment-requests.test.ts`

- [ ] **Step 1: Fill in action tests (replace todos)**

```typescript
// src/actions/payment-requests.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase + auth
vi.mock('@/lib/supabase/server', () => ({
  requireMerchantId: vi.fn().mockResolvedValue('merchant-uuid'),
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('@/lib/supabase/service', () => ({
  getServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: { id: 'req-uuid' }, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { stellar_public_key: 'GMERCHANT...' },
        error: null,
      }),
    })),
  })),
}))

describe('createPaymentRequest', () => {
  it('ignores client-supplied stellar_destination', async () => {
    const { createPaymentRequest } = await import('@/actions/payment-requests')
    // Pass a fake destination in the body
    const result = await createPaymentRequest({
      stellar_destination: 'GHACKER...',  // should be ignored
      amount: '5.00',
      asset_code: 'XLM',
      asset_issuer: null,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    } as any)
    // Verify the stored destination is NOT the hacker's address
    expect(result?.stellar_destination).not.toBe('GHACKER...')
  })

  it('generates a memo that is not from Math.random', async () => {
    const spy = vi.spyOn(Math, 'random')
    const { createPaymentRequest } = await import('@/actions/payment-requests')
    await createPaymentRequest({ amount: '1.00', asset_code: 'XLM', asset_issuer: null } as any)
    expect(spy).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/actions/payment-requests.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/actions/payment-requests.test.ts
git commit -m "test(actions): createPaymentRequest destination binding + memo entropy tests"
```

---

### Phase 2 Merge Gates (M2 + M3)

**M2 — Track A real verify + Track B wired XDR:**
- [ ] `verifyPaymentByHash` passes all four-axis tests
- [ ] Customer `/pay` sends real signed XDR to Stellar testnet

**M3 — End-to-end MVP flow:**
- [ ] Invoice created → customer signs in wallet → Stellar settles → `/api/stellar/verify` returns `ok:true` → dashboard badge flips to `paid` within one poll interval
- [ ] CI green: `npm run lint && npm test`

---

## Phase 3 — Hardening, Expiry, RLS

> **Merge gate: M4**
> **Skills required:** `standards` (SEP-7), `supabase-postgres` (pg_cron), `tdd`, `security-review`

---

### Track A — Edge Cases and Documentation

> **Skills required:** `smart-contracts`, `standards`

#### Task A5 — Edge case hardening

**Files:**
- Modify: `src/lib/stellar/verify-payment.ts`
- Modify: `src/lib/stellar/build-payment.ts`

- [ ] **Step 1: Handle missing payment operation in tx**

```typescript
// In verifyPaymentByHash, before accessing paymentOp:
if (!paymentOp) {
  return { ok: false, reason: 'no payment operation in transaction' }
}
```

- [ ] **Step 2: Handle memo length limit**

In `buildPaymentXDR`, add guard:

```typescript
if (memo.length > 28) {
  throw new Error(`Memo exceeds 28-char MEMO_TEXT limit: ${memo.length} chars`)
}
```

- [ ] **Step 3: Document native vs credit asset handling**

Add inline JSDoc to `buildPaymentXDR`:

```typescript
/**
 * Builds an unsigned XDR transaction ready for Freighter `signTransaction`.
 * Asset: pass assetCode='XLM' + assetIssuer=null for native lumens.
 *        pass assetCode='USDC' + assetIssuer=<issuer G-key> for credit assets.
 * Memo: treated as a public correlation key — do not include private data.
 */
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/stellar/verify-payment.ts src/lib/stellar/build-payment.ts
git commit -m "fix(stellar): edge cases — missing payment op, memo length guard, docs"
```

---

### Track B — SEP-7 Deeplink Fallback

> **Skills required:** `dapp`, `standards`, `agentic-payments`

#### Task B4 — Wallet-not-installed fallback

**Files:**
- Modify: `src/components/payment/payment-request-card.tsx`
- Modify: `src/components/payment/payment-page-placeholder.tsx`

- [ ] **Step 1: Detect Freighter absence**

```typescript
import { isConnected } from '@stellar/freighter-api'

const [freighterAvailable, setFreighterAvailable] = useState<boolean | null>(null)

useEffect(() => {
  isConnected().then(setFreighterAvailable).catch(() => setFreighterAvailable(false))
}, [])
```

- [ ] **Step 2: Show SEP-7 QR when Freighter is absent**

```typescript
import { buildSep7Uri } from '@/lib/stellar/build-payment'
import QRCode from 'react-qr-code'

{freighterAvailable === false && (
  <div>
    <p>No Freighter wallet detected. Scan with any SEP-7 compatible wallet (Albedo, xBull):</p>
    <QRCode
      value={buildSep7Uri({
        destination: paymentRequest.stellar_destination,
        amount: paymentRequest.amount,
        assetCode: paymentRequest.asset_code,
        assetIssuer: paymentRequest.asset_issuer,
        memo: paymentRequest.memo,
        networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
        payLink: window.location.href,
      })}
      size={200}
    />
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/payment/payment-request-card.tsx src/components/payment/payment-page-placeholder.tsx
git commit -m "feat(wallet): SEP-7 deeplink QR fallback for non-Freighter wallets"
```

---

### Track C — Expiry + Rate Limiting

> **Skills required:** `supabase`, `supabase-postgres`

#### Task C6 — Invoice expiry via pg_cron

**Files:**
- Create: `supabase/migrations/20260706_expire_pending.sql`

- [ ] **Step 1: Write expiry migration**

```sql
-- supabase/migrations/20260706_expire_pending.sql
-- Requires pg_cron extension enabled in Supabase dashboard
SELECT cron.schedule(
  'expire-pending-invoices',
  '*/5 * * * *',  -- every 5 minutes
  $$
    UPDATE payment_requests
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < now();
  $$
);
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```

- [ ] **Step 3: Rate-limit `/api/stellar/status`**

Add in-memory rate limit using `Map` (upgrade to edge KV if needed later):

```typescript
// src/app/api/stellar/status/route.ts — add at top
const rateMap = new Map<string, number>()
const RATE_LIMIT_MS = 2000 // 1 req per 2 seconds per ID

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const now = Date.now()
  const last = rateMap.get(id) ?? 0
  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  }
  rateMap.set(id, now)
  // ... rest of handler
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260706_expire_pending.sql src/app/api/stellar/status/route.ts
git commit -m "feat(backend): pg_cron invoice expiry; rate-limit status endpoint"
```

---

### Track D — Full Test Suite + RLS Integration Tests

> **Skills required:** `tdd`, `supabase-postgres`

#### Task D7 — `settlePaymentRequest` and `mark_payment_paid` tests

**Files:**
- Create: `src/lib/payments/payment-request.test.ts` (extend existing)

- [ ] **Step 1: Add settlement tests**

```typescript
describe('mark_payment_paid behavior', () => {
  it('only flips status from pending to paid', async () => {
    // Mock: call mark_payment_paid on a pending row
    // Assert: status becomes 'paid'
    // Assert: calling again on already-paid throws
  })

  it('inserts a transactions record', async () => {
    // Assert: after mark_payment_paid, a transactions row exists
  })
})
```

- [ ] **Step 2: Run and confirm green**

```bash
npx vitest run src/lib/payments/payment-request.test.ts
```

- [ ] **Step 3: Write RLS test**

```sql
-- supabase/tests/rls.test.sql
-- Test that merchant A cannot read merchant B's payment_requests
BEGIN;
SET LOCAL role = anon;
-- ... assert cross-merchant read returns 0 rows
ROLLBACK;
```

- [ ] **Step 4: Write expiry test**

```typescript
describe('invoice expiry', () => {
  it('pending row with past expires_at transitions to expired', async () => {
    // Insert a pending row with expires_at = 1 minute ago (mocked)
    // Trigger expiry logic
    // Assert status = 'expired'
  })
})
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/payments/payment-request.test.ts supabase/tests/rls.test.sql
git commit -m "test: settle, RLS cross-merchant block, and expiry tests"
```

---

### Phase 3 Merge Gate (M4)

- [ ] CI covers verify/auth/settle/RLS (all tests green, `npm run lint && npm test`)
- [ ] Stale pending invoices with past `expires_at` transition to `expired` via pg_cron
- [ ] Dashboard reflects `expired` status within one poll interval
- [ ] SEP-7 QR displays when Freighter is not installed
- [ ] Security review completed: run `security-review` skill on uncommitted changes

---

## File Ownership Matrix

| Path | Owner Track | Phase |
|---|---|---|
| `src/lib/stellar/build-payment.ts` | A | 1 |
| `src/lib/stellar/build-payment.test.ts` | A | 1 |
| `src/lib/stellar/verify-payment.ts` | A | 2 |
| `src/lib/stellar/verify-payment.test.ts` | A/D | 2 |
| `src/lib/stellar/client.ts` | A | 1 |
| `src/constants/stellar.ts` | A | 0 |
| `src/app/pay/[paymentRequestId]/page.tsx` | B | 1 |
| `src/components/payment/payment-request-card.tsx` | B | 1-3 |
| `src/components/payment/copy-payment-link.tsx` | B | 1 |
| `src/components/payment/payment-page-placeholder.tsx` | B | 3 |
| `supabase/schema.sql` | C | 1 |
| `supabase/rls.sql` | C | 1 |
| `supabase/migrations/*` | C | 1-3 |
| `src/lib/supabase/service.ts` | C | 1 |
| `src/actions/payment-requests.ts` | C | 1 |
| `src/app/api/payment-requests/route.ts` | C | 1 |
| `src/app/api/stellar/verify/route.ts` | C | 1-2 |
| `src/app/api/stellar/status/route.ts` | C | 2-3 |
| `src/lib/validation/payment-request.schema.ts` | C | 1 |
| `src/lib/payments/payment-request.ts` | C | 1 |
| `src/types/database.ts` | C (all import) | 0 |
| `src/app/(dashboard)/*` | D | 1-3 |
| `src/components/dashboard/*` | D | 1-3 |
| `vitest.config.ts` | D | 1 |
| `src/test/setup.ts` | D | 1 |
| `src/actions/payment-requests.test.ts` | D | 2 |
| `supabase/tests/rls.test.sql` | D | 3 |

---

## Milestones Summary

| Milestone | When | Criteria |
|---|---|---|
| **M1** | Phase 1 merged | Contracts landed; stellar-lib wired; migrations applied; destination server-bound; `mark_payment_paid()` exists; QR + polling scaffold |
| **M2** | Phase 2, Track A+B merged | Real `verifyPaymentByHash` green; customer `/pay` sends real signed XDR to testnet |
| **M3** | Phase 2 fully merged | Full end-to-end MVP flow: invoice → wallet sign → Stellar settles → verify → dashboard auto-paid |
| **M4** | Phase 3 merged | CI covers all axes; pg_cron expiry; SEP-7 fallback; RLS tests; security review complete |

## Dependency DAG

```
Phase 0:  All tracks ──→ lock contracts ──→ branch

Phase 1:  A ──┐
         B ──┤ (stub against contracts) ──→ M1
         C ──┤ (migrations + binding)
         D ──┘ (test harness + QR)

Phase 2:  A.real-verify ──→ C.wire-verify ──→ M3
                              ↑
               B.posts-hash ──┘
               D.verify-tests + dashboard-poll ──→ M3

Phase 3:  All tracks harden ──→ M4
```

## Open Questions (Resolve Before Phase 1)

| # | Question | Recommended default |
|---|---|---|
| 1 | Testnet vs mainnet for MVP? | Testnet-only; defer network-switch abstraction |
| 2 | Asset scope: XLM only or also USDC testnet? | XLM-only MVP; `asset_issuer` schema ready for credit assets |
| 3 | Settlement detection: customer posts hash, or Horizon poller/stream? | Customer posts hash (current plan) |
| 4 | Wallet target: Freighter only, or SEP-7 for Albedo/xBull too? | Freighter primary + SEP-7 QR fallback (Phase 3) |
| 5 | Service-role key: server-only via env, never in client bundle? | Yes — `SUPABASE_SERVICE_ROLE_KEY` server-only |
| 6 | Rate-limit store for `/api/stellar/status`: in-memory, Supabase row, or edge KV? | In-memory for MVP; upgrade if needed |

---

*Generated: 2026-07-06 | Source: `docs/whitepaper.md` + `docs/mvp-roadmap.md`*
