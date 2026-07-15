# Project ZERO UX/UI Implementation Plan

> **For agentic workers:** Execute this plan phase-by-phase using Composer 2.5. Read [`docs/design.md`](./design.md) first — it is the source of truth for UX decisions. Do NOT commit unless the user explicitly requests it.

**Goal:** Fix functional payment-flow blockers, then redesign every current page into a trust-first fintech experience with accurate data, responsive layouts, and complete UI states.

**Architecture:** Phase 0 stabilizes Stellar payment construction and test baseline. Phases 1–2 establish design tokens and shared components. Phases 3–5 redesign routes per persona (public/auth, merchant, customer). Phases 6–7 add route-level states and quality gates.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, shadcn/ui (base-nova), Supabase, `@stellar/stellar-sdk`, `@stellar/freighter-api`, Vitest.

**Executor model:** Composer 2.5

---

## How to read this plan

- Each **Phase** is a merge gate. Complete all tasks in a phase before starting the next.
- Each **Task** lists exact files, required skills, steps with checkboxes, code, commands, and expected output.
- **Skills** paths are relative to this workspace unless noted as Cursor plugin paths.
- If a step says "verify manually", document the result in your completion message.
- **Do not edit** `.cursor/plans/project_zero_ux_f14c8473.plan.md`.

### Skill index

| Skill key | Path |
|-----------|------|
| `design` | `docs/design.md` |
| `dapp` | `.claude/skills/dapp/SKILL.md` |
| `data` | `.claude/skills/data/SKILL.md` |
| `agentic-payments` | `.claude/skills/agentic-payments/SKILL.md` |
| `standards` | `.claude/skills/standards/SKILL.md` |
| `supabase` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase\SKILL.md` |
| `supabase-postgres` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase-postgres-best-practices\SKILL.md` |
| `shadcn` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\shadcn\SKILL.md` |
| `nextjs` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\nextjs\SKILL.md` |
| `react-best-practices` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\react-best-practices\SKILL.md` |
| `tdd` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\b7a8f76985f1e93e75dd2f2a3b424dc731bd9d37\skills\test-driven-development\SKILL.md` |
| `systematic-debugging` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\b7a8f76985f1e93e75dd2f2a3b424dc731bd9d37\skills\systematic-debugging\SKILL.md` |
| `verification` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\vercel\3d9d9cd0fe5d1bdaedb891135a5c45f19190b83f\skills\verification\SKILL.md` |
| `verification-before-completion` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\b7a8f76985f1e93e75dd2f2a3b424dc731bd9d37\skills\verification-before-completion\SKILL.md` |
| `review-security` | `C:\Users\Dennis\.cursor\skills-cursor\review-security\SKILL.md` |
| `context7-mcp` | Use MCP `plugin-context7-plugin-context7` for Freighter/Stellar SDK docs |

---

## Phase 0 — Functional Stabilization

> **Skills required:** `design`, `systematic-debugging`, `tdd`, `dapp`, `data`, `agentic-payments`, `context7-mcp`  
> **Blocks:** all UI phases. Payment flow must work before redesign.

### Task 0.1 — Fix `buildPaymentXDR` source account

**Files:**
- Modify: `src/lib/stellar/build-payment.ts`
- Modify: `src/lib/stellar/build-payment.test.ts`
- Modify: `src/components/payment/payment-request-card.tsx`

- [ ] **Step 1: Read Freighter + Stellar SDK docs via Context7**

Query `/stellar/freighter` and `/websites/developers_stellar` for: source account must be signer; sequence from Horizon.

- [ ] **Step 2: Add `sourcePublicKey` to `PaymentParams`**

```typescript
// src/lib/stellar/build-payment.ts
export type PaymentParams = {
  sourcePublicKey: string;  // customer wallet — NEW
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string | null;
  memo: string;
  networkPassphrase: string;
};
```

- [ ] **Step 3: Add async `buildPaymentXDR` that loads source sequence**

```typescript
import { getStellarServer } from "./client";

export async function buildPaymentXDR(params: PaymentParams): Promise<string> {
  const { sourcePublicKey, destination, amount, assetCode, assetIssuer, memo, networkPassphrase } = params;
  if (memo.length > 28) {
    throw new Error(`Memo exceeds 28-character MEMO_TEXT limit: ${memo.length} characters`);
  }

  const server = getStellarServer();
  const sourceAccount = await server.loadAccount(sourcePublicKey);

  const asset =
    assetCode === "XLM" ? Asset.native() : new Asset(assetCode, requireAssetIssuer(assetIssuer));

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(Operation.payment({ destination, asset, amount }))
    .addMemo(Memo.text(memo))
    .setTimeout(300)
    .build();

  return tx.toXDR();
}
```

- [ ] **Step 4: Update tests to pass `sourcePublicKey` and mock Horizon**

```typescript
// src/lib/stellar/build-payment.test.ts — add to vi.mock block
vi.mock("./client", () => ({
  getStellarServer: vi.fn(() => ({
    loadAccount: vi.fn().mockResolvedValue({
      accountId: () => "GBUYER...",
      sequenceNumber: () => "123456789",
      incrementSequenceNumber: vi.fn(),
    }),
  })),
}));

// Update each buildPaymentXDR call:
const xdr = await buildPaymentXDR({
  sourcePublicKey: "GBUYER...",
  destination: "GBVQ7...",
  // ...rest
});
```

- [ ] **Step 5: Update `payment-request-card.tsx` to pass customer address**

In `handlePay`, after `requestAccess()`:

```typescript
const xdr = await buildPaymentXDR({
  sourcePublicKey: access.address,
  destination: paymentRequest.stellar_destination,
  amount: paymentRequest.amount,
  assetCode: paymentRequest.asset_code,
  assetIssuer: paymentRequest.asset_issuer,
  memo: paymentRequest.memo,
  networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
});
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/lib/stellar/build-payment.test.ts
```

Expected: all PASS.

---

### Task 0.2 — Fix dashboard aggregate KPIs

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Replace sample-based counts with aggregate queries**

```typescript
const [
  { count: pendingCount },
  { count: paidCount },
  { count: productCount },
  { data: requests },
  { data: transactions },
] = await Promise.all([
  supabase
    .from("payment_requests")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchant.id)
    .eq("status", "pending"),
  supabase
    .from("payment_requests")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchant.id)
    .eq("status", "paid"),
  supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchant.id)
    .eq("is_active", true),
  supabase
    .from("payment_requests")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(5),
  supabase
    .from("transactions")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(5),
]);
```

- [ ] **Step 2: Use `pendingCount ?? 0`, `paidCount ?? 0`, `productCount ?? 0` in KPI cards**

- [ ] **Step 3: Remove stale "Phase 3" copy from transactions empty state**

Replace with: `"Verified payments appear here after customers complete checkout."`

---

### Task 0.3 — Stabilize Vitest harness

**Files:**
- Modify: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `src/actions/payment-requests.test.ts`

- [ ] **Step 1: Add jsdom + setupFiles to vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    testTimeout: 15_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Create `src/test/setup.ts`**

```typescript
import { vi } from "vitest";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn().mockResolvedValue({ isConnected: true, error: undefined }),
  requestAccess: vi.fn().mockResolvedValue({ address: "GBUYER...", error: undefined }),
  getNetwork: vi.fn().mockResolvedValue({
    network: "TESTNET",
    networkPassphrase: "Test SDF Network ; September 2015",
    error: undefined,
  }),
  signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: "mocked-xdr", error: undefined }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}));
```

- [ ] **Step 3: Run full suite**

```bash
npm test
```

Expected: 25/25 PASS, no timeout.

---

### Task 0.4 — Fix login `?next=` redirect

**Files:**
- Modify: `src/actions/auth.ts`
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Pass `next` through login form as hidden field**

In `login/page.tsx`, read `searchParams.next` and add:

```tsx
<input type="hidden" name="next" value={next ?? ""} />
```

- [ ] **Step 2: Honor `next` in login action**

```typescript
export async function login(formData: FormData) {
  // ... existing validation ...
  const next = formValue(formData, "next");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  // ... sign in ...
  redirect(safeNext);
}
```

---

### Task 0.5 — Fix payment error copy semantics

**Files:**
- Modify: `src/components/payment/payment-request-card.tsx`

- [ ] **Step 1: Track whether broadcast succeeded**

Add state: `const [broadcastHash, setBroadcastHash] = useState<string | null>(null);`

Set after `submitTransaction`: `setBroadcastHash(result.hash);`

- [ ] **Step 2: Conditional error message**

```tsx
{status === "error" && (
  <div role="alert" className="rounded-md border border-destructive/30 px-3 py-2 text-sm">
    <p className="font-medium">
      {broadcastHash ? "Payment submitted but not verified" : "Payment could not be completed"}
    </p>
    {errorMsg && <p className="mt-1 text-muted-foreground">Reason: <code>{errorMsg}</code></p>}
    <p className="mt-1 text-muted-foreground">
      {broadcastHash
        ? "Your transaction was broadcast. Contact the merchant with your transaction hash if this persists."
        : "No funds were moved."}
    </p>
  </div>
)}
```

- [ ] **Step 3: Replace hardcoded `green-*` success with tokens**

```tsx
<p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
  Payment confirmed on-chain.
</p>
```

(Requires success tokens from Phase 1; use `border-primary/30 bg-primary/10 text-primary` as interim if Phase 1 not done yet.)

---

### Phase 0 merge gate

- [ ] `buildPaymentXDR` uses customer source + live sequence (tests pass)
- [ ] Manual Testnet payment: invoice → Freighter → verify → dashboard shows paid
- [ ] Dashboard KPIs use aggregate counts
- [ ] `npm test` — 25/25 green
- [ ] Login respects `?next=`
- [ ] Payment error copy distinguishes pre/post broadcast

---

## Phase 1 — Design Foundations

> **Skills required:** `design`, `shadcn`, `nextjs`, `tdd`  
> **Depends on:** Phase 0

### Task 1.1 — Extend design tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add semantic color tokens per `docs/design.md` §6.2**

Add `--success`, `--warning`, `--info`, `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent` to `:root` and `.dark`.

- [ ] **Step 2: Register in `@theme inline` block**

```css
--color-success: var(--success);
--color-warning: var(--warning);
--color-info: var(--info);
--color-sidebar: var(--sidebar);
/* etc. */
```

- [ ] **Step 3: Verify tokens render**

Run `npm run dev`, inspect dashboard — no visual regressions on existing pages.

---

### Task 1.2 — Root layout providers

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `package.json` (if `next-themes` not wired)

- [ ] **Step 1: Mount Toaster**

```tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add metadata template**

```typescript
export const metadata: Metadata = {
  title: { default: "Project ZERO", template: "%s | Project ZERO" },
  description: "Credentialless commerce for MSMEs, social sellers, and local merchants.",
};
```

---

### Task 1.3 — Shared layout components

**Files:**
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/components/shared/status-badge.tsx`
- Create: `src/components/shared/empty-state.tsx`
- Create: `src/components/shared/query-feedback.tsx`
- Create: `src/components/shared/explorer-link.tsx`

- [ ] **Step 1: Implement `PageHeader`**

```tsx
type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
```

- [ ] **Step 2: Implement `StatusBadge`**

Map `pending` → warning variant, `paid` → success/default, `expired` → secondary, `cancelled` → outline.

- [ ] **Step 3: Implement `EmptyState`**

Icon (lucide) + title + description + optional Button CTA.

- [ ] **Step 4: Implement `QueryFeedback` (client component)**

```tsx
"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  "created=payment-request": "Invoice created successfully.",
  "created=merchant": "Merchant profile saved.",
  "created=product": "Product created.",
};

export function QueryFeedback() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const created = params.get("created");
    const error = params.get("error");
    if (created && MESSAGES[`created=${created}`]) {
      toast.success(MESSAGES[`created=${created}`]);
    }
    if (error) {
      toast.error(decodeURIComponent(error));
    }
    if (created || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      url.searchParams.delete("error");
      router.replace(url.pathname + url.search);
    }
  }, [params, router]);

  return null;
}
```

- [ ] **Step 5: Implement `ExplorerLink`**

```tsx
const TESTNET_EXPLORER = "https://stellar.expert/explorer/testnet/tx/";

export function ExplorerLink({ hash }: { hash: string }) {
  const short = `${hash.slice(0, 8)}…${hash.slice(-8)}`;
  return (
    <a
      href={`${TESTNET_EXPLORER}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-info hover:underline"
    >
      {short}
    </a>
  );
}
```

- [ ] **Step 6: Implement `AppShell`**

Use `Sheet` for mobile nav, sidebar links with `aria-current`, logout form. See `docs/design.md` §7.2.

- [ ] **Step 7: Wire `AppShell` into dashboard layout**

Replace inline header in `src/app/(dashboard)/layout.tsx` with `<AppShell>{children}</AppShell>`.

---

### Task 1.4 — Delete orphan placeholders

**Files:**
- Delete: `src/components/payment/payment-page-placeholder.tsx`
- Delete: `src/components/dashboard/dashboard-placeholder.tsx`

- [ ] **Step 1: Grep for imports — confirm zero references**

```bash
rg "payment-page-placeholder|dashboard-placeholder" src/
```

Expected: no matches.

- [ ] **Step 2: Delete files**

---

### Phase 1 merge gate

- [ ] Semantic tokens in `globals.css`
- [ ] Toaster mounted in root layout
- [ ] `AppShell` renders on all dashboard routes with mobile nav
- [ ] Shared components exist and are importable
- [ ] Orphan placeholders removed
- [ ] `npm run lint` passes

---

## Phase 2 — Public and Auth Experience

> **Skills required:** `design`, `nextjs`, `shadcn`, `supabase`, `react-best-practices`, `tdd`  
> **Depends on:** Phase 1

### Task 2.1 — Marketing landing page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/site-header.tsx`
- Create: `src/app/(marketing)/layout.tsx` (optional wrapper)

- [ ] **Step 1: Remove all "Phase 3" copy**

Replace `page.tsx` lines 132–135 with: `"Customers pay with Freighter on Stellar Testnet. Payments are verified on-chain before marking paid."`

- [ ] **Step 2: Replace fake QR grid with styled preview**

Use a static `Card` showing realistic invoice data (amount, merchant, pending badge) — no fake pixel grid.

- [ ] **Step 3: Update CTAs**

- Primary: "Start merchant setup" → `/register`
- Secondary: "Sign in" → `/login` (rename from "View dashboard shell")

- [ ] **Step 4: Wire `SiteHeader` on landing**

Either wrap in `(marketing)/layout.tsx` or import `SiteHeader` directly in `page.tsx`.

- [ ] **Step 5: Add `generateMetadata`**

```typescript
export const metadata: Metadata = {
  title: "Home",
  description: "Credentialless commerce for MSMEs on Stellar Testnet.",
};
```

---

### Task 2.2 — Auth pages polish

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/components/forms/auth-shell.tsx` (wire or delete)

- [ ] **Step 1: Use `AuthShell` wrapper for consistent layout**

Center card with logo, title, and form — DRY login/register.

- [ ] **Step 2: Add `generateMetadata`**

Login: `title: "Sign in"`; Register: `title: "Create account"`.

- [ ] **Step 3: Show loading state on submit**

Use `useFormStatus` (React 19) or pending button pattern:

```tsx
<Button type="submit" className="w-full" disabled={pending}>
  {pending ? "Signing in…" : "Sign in"}
</Button>
```

Note: requires extracting form into client component or using `useFormStatus` in child.

- [ ] **Step 4: Verify `?next=` hidden field from Phase 0 is present**

---

### Phase 2 merge gate

- [ ] Landing has accurate copy, no phase references
- [ ] `SiteHeader` visible on public routes
- [ ] Login/register use consistent shell
- [ ] Metadata titles set
- [ ] `npm run lint` passes

---

## Phase 3 — Merchant Shell and Operational Pages

> **Skills required:** `design`, `nextjs`, `shadcn`, `supabase`, `supabase-postgres`, `react-best-practices`, `tdd`  
> **Depends on:** Phase 2

### Task 3.1 — Dashboard redesign

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/dashboard/invoice-qr-dialog.tsx`
- Create: `src/components/dashboard/recent-requests-list.tsx`
- Create: `src/components/dashboard/recent-payments-list.tsx`

- [ ] **Step 1: Use `PageHeader` + `QueryFeedback`**

- [ ] **Step 2: KPI cards with accurate counts (from Phase 0)**

Add fourth KPI: "Expired" count via aggregate query.

- [ ] **Step 3: `RecentRequestsList` component**

Each row: title, amount, `PaymentStatusBadge`, actions (Copy link, QR icon opening `InvoiceQrDialog`).

- [ ] **Step 4: `InvoiceQrDialog`**

```tsx
"use client";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CopyPaymentLink } from "@/components/payment/copy-payment-link";

export function InvoiceQrDialog({ open, onOpenChange, paymentLink, title }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share invoice</DialogTitle>
        </DialogHeader>
        <div className="mx-auto w-fit rounded-lg bg-background p-4">
          <QRCode value={paymentLink} size={200} />
        </div>
        <CopyPaymentLink paymentLink={paymentLink} />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: `RecentPaymentsList` with `ExplorerLink`**

Show amount, asset, relative time — not raw hash only.

- [ ] **Step 6: Add `generateMetadata`**

`title: "Dashboard"`

---

### Task 3.2 — Invoices page redesign

**Files:**
- Modify: `src/app/(dashboard)/invoices/page.tsx`
- Create: `src/components/dashboard/create-invoice-form.tsx`
- Create: `src/components/dashboard/invoices-table.tsx`

- [ ] **Step 1: Extract `CreateInvoiceForm`**

Remove hidden `stellarDestination` field. Use `Select` for asset (XLM only for MVP; hide issuer). Use `NativeSelect` or shadcn `Select` for product.

- [ ] **Step 2: Extract `InvoicesTable`**

Columns: Title, Amount, Status (`StatusBadge`), Expires, Actions (Open link, Copy, QR).

- [ ] **Step 3: Mobile — form opens in `Sheet`**

Button "New invoice" opens sheet with form on `<md`.

- [ ] **Step 4: Add `QueryFeedback`**

- [ ] **Step 5: Update description copy**

Remove "cancelled" from description unless cancelled status is surfaced in UI.

- [ ] **Step 6: Add `generateMetadata`**

`title: "Invoices"`

---

### Task 3.3 — Products page redesign

**Files:**
- Modify: `src/app/(dashboard)/products/page.tsx`
- Create: `src/components/dashboard/create-product-form.tsx`
- Create: `src/components/dashboard/products-table.tsx`

- [ ] **Step 1: Extract form and table components**

- [ ] **Step 2: Show image thumbnail in table when `image_url` present**

- [ ] **Step 3: `EmptyState` when no products**

- [ ] **Step 4: Add `QueryFeedback` + `generateMetadata`**

---

### Task 3.4 — Payments page redesign

**Files:**
- Modify: `src/app/(dashboard)/payments/page.tsx`
- Create: `src/components/dashboard/payments-table.tsx`

- [ ] **Step 1: Remove "Phase 3" empty copy**

- [ ] **Step 2: Use `ExplorerLink` for tx hash column**

- [ ] **Step 3: Format dates with `toLocaleString()`**

- [ ] **Step 4: `EmptyState` with CTA link to `/invoices`**

- [ ] **Step 5: Add `generateMetadata`**

`title: "Payments"`

---

### Phase 3 merge gate

- [ ] Dashboard shows QR dialog per invoice
- [ ] All merchant pages use `PageHeader`, `QueryFeedback`
- [ ] No hidden misleading form fields
- [ ] Aggregate KPIs accurate
- [ ] Mobile nav works; tables readable on mobile (card fallback or horizontal scroll)
- [ ] `npm run lint && npm test` pass

---

## Phase 4 — Customer Payment Checkout

> **Skills required:** `design`, `dapp`, `agentic-payments`, `standards`, `data`, `shadcn`, `react-best-practices`, `tdd`  
> **Depends on:** Phase 0 (functional fix)

### Task 4.1 — Checkout state machine UI

**Files:**
- Modify: `src/components/payment/payment-request-card.tsx`
- Create: `src/components/payment/payment-progress.tsx`
- Create: `src/components/payment/wallet-trust-block.tsx`
- Modify: `src/app/pay/[paymentRequestId]/page.tsx`

- [ ] **Step 1: Create `PaymentProgress` step indicator**

Steps: Review → Connect → Sign → Verify → Done. Highlight current step based on `status` state.

- [ ] **Step 2: Create `WalletTrustBlock`**

Shield icon, "Secure connection", "Powered by Stellar Testnet", "We never hold your keys."

- [ ] **Step 3: Refactor `PaymentRequestCard` layout**

- Collapsible "Payment details" for memo, destination, expiry
- `WalletTrustBlock` above pay button
- `PaymentProgress` below header
- Token-based colors throughout

- [ ] **Step 4: Improve Freighter detection**

```typescript
// Check extension presence separately from connection
const [walletState, setWalletState] = useState<"unknown" | "missing" | "available">("unknown");

useEffect(() => {
  isConnected()
    .then((r) => setWalletState(r.error ? "missing" : "available"))
    .catch(() => setWalletState("missing"));
}, []);
```

Show SEP-7 QR only when `walletState === "missing"`, not merely disconnected.

- [ ] **Step 5: Add connected address + network badge when available**

After `requestAccess`, display truncated `access.address` and "Stellar Testnet" badge.

---

### Task 4.2 — Expired / unavailable states

**Files:**
- Modify: `src/app/pay/[paymentRequestId]/page.tsx`
- Create: `src/app/pay/[paymentRequestId]/not-found.tsx` (optional)
- Create: `src/components/payment/payment-unavailable.tsx`

- [ ] **Step 1: Fetch without status filter; branch in page**

```typescript
if (!paymentRequest) {
  notFound();
}

if (paymentRequest.status === "expired" || paymentRequest.status === "cancelled") {
  return <PaymentUnavailable status={paymentRequest.status} />;
}

if (paymentRequest.status !== "pending" && paymentRequest.status !== "paid") {
  notFound();
}
```

- [ ] **Step 2: `PaymentUnavailable` component**

Friendly message: "This invoice is no longer available." No 404.

- [ ] **Step 3: Add `generateMetadata`**

`title: "Pay invoice"`

---

### Task 4.3 — Paid receipt state

**Files:**
- Modify: `src/components/payment/payment-request-card.tsx`
- Create: `src/components/payment/payment-receipt.tsx`

- [ ] **Step 1: `PaymentReceipt` component**

Shows: checkmark, amount, merchant, `ExplorerLink` (if hash available), "Return to merchant" note.

- [ ] **Step 2: Render receipt when `status === "paid"`**

Replace simple green text with full receipt card.

---

### Phase 4 merge gate

- [ ] Checkout shows progress steps during payment
- [ ] Wallet trust block visible
- [ ] SEP-7 fallback only when Freighter truly absent
- [ ] Expired invoice shows friendly unavailable page
- [ ] Paid state shows receipt with explorer link
- [ ] Error copy correct per `docs/design.md` §9.7
- [ ] Manual Testnet e2e payment succeeds end-to-end

---

## Phase 5 — Cross-Route States and Accessibility

> **Skills required:** `design`, `nextjs`, `shadcn`, `react-best-practices`, `verification`  
> **Depends on:** Phases 3–4

### Task 5.1 — Loading states

**Files:**
- Create: `src/app/(dashboard)/loading.tsx`
- Create: `src/app/(dashboard)/dashboard/loading.tsx`
- Create: `src/app/(dashboard)/invoices/loading.tsx`
- Create: `src/app/(dashboard)/products/loading.tsx`
- Create: `src/app/(dashboard)/payments/loading.tsx`
- Create: `src/app/pay/[paymentRequestId]/loading.tsx`

- [ ] **Step 1: Dashboard group loading**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
```

- [ ] **Step 2: Pay page loading — centered card skeleton**

---

### Task 5.2 — Error boundaries

**Files:**
- Create: `src/app/(dashboard)/error.tsx`
- Create: `src/app/pay/[paymentRequestId]/error.tsx`

- [ ] **Step 1: Client error component with retry**

```tsx
"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset} className="mt-4">Try again</Button>
    </div>
  );
}
```

---

### Task 5.3 — Accessibility pass

**Files:**
- Modify: `src/components/payment/copy-payment-link.tsx`
- Modify: `src/components/layout/app-shell.tsx`
- Modify: all table components

- [ ] **Step 1: `CopyPaymentLink` — add `aria-live="polite"` region**

- [ ] **Step 2: Nav links — `aria-current="page"` on active route**

- [ ] **Step 3: Tables — add `<caption className="sr-only">` for screen readers**

- [ ] **Step 4: Verify focus trap on `InvoiceQrDialog` and mobile `Sheet`**

- [ ] **Step 5: Add `prefers-reduced-motion` override in `globals.css`**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Task 5.4 — Favicon and env

**Files:**
- Create: `src/app/icon.tsx` (or `public/favicon.ico`)
- Modify: `.env.example`

- [ ] **Step 1: Add dynamic favicon with "Z" on emerald background**

- [ ] **Step 2: Add `NEXT_PUBLIC_APP_URL=http://localhost:3000` to `.env.example`**

---

### Phase 5 merge gate

- [ ] Loading skeletons on all data-fetching routes
- [ ] Error boundaries with retry on dashboard and pay
- [ ] Accessibility checklist from `docs/design.md` §11 complete
- [ ] Favicon renders in browser tab
- [ ] Responsive check at 375px, 768px, 1280px (manual)

---

## Phase 6 — End-to-End Quality Gate

> **Skills required:** `verification-before-completion`, `systematic-debugging`, `review-security`, `tdd`  
> **Depends on:** All prior phases

### Task 6.1 — Automated checks

- [ ] **Step 1: Lint**

```bash
npm run lint
```

Expected: 0 warnings, exit 0.

- [ ] **Step 2: Tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: success, no type errors.

---

### Task 6.2 — Manual e2e checklist

- [ ] Register new merchant account
- [ ] Complete merchant onboarding with Testnet G-key
- [ ] Create product
- [ ] Create invoice with 30-min expiry
- [ ] Copy link and open QR from dashboard
- [ ] Open `/pay/[id]` on mobile viewport (375px)
- [ ] Pay with Freighter on Testnet
- [ ] Confirm checkout progress steps animate correctly
- [ ] Confirm dashboard badge flips to `paid` within 5s
- [ ] Confirm `/payments` shows transaction with explorer link
- [ ] Test expired invoice shows unavailable (not 404)
- [ ] Test login `?next=/invoices` redirects correctly

---

### Task 6.3 — Security review

- [ ] **Step 1: Run security review on all changed files**

Use `review-security` skill on uncommitted changes.

- [ ] **Step 2: Confirm no regressions**

- `stellar_destination` still server-bound
- `mark_payment_paid` only via RPC
- No secrets in client bundle
- Verify endpoint remains usable by customers (intentional)

---

### Task 6.4 — Documentation sync

**Files:**
- Modify: `README.md` (remove stale Phase 3 notes)
- Modify: `docs/mvp-roadmap.md` (add note at top: "Current state table reflects pre-implementation snapshot; see design.md for live audit")

- [ ] **Step 1: Update README feature list to match implemented state**

- [ ] **Step 2: Add pointer in roadmap to `docs/design.md`**

---

### Phase 6 merge gate (final)

- [ ] All automated checks green
- [ ] Manual e2e checklist complete
- [ ] Security review passed
- [ ] README and roadmap synced
- [ ] No "Phase 3" stale copy anywhere in `src/`

---

## File change matrix

| File | Phase | Action |
|------|-------|--------|
| `src/lib/stellar/build-payment.ts` | 0 | Fix source account |
| `src/lib/stellar/build-payment.test.ts` | 0 | Update tests |
| `src/components/payment/payment-request-card.tsx` | 0, 4 | Fix errors, redesign |
| `src/app/(dashboard)/dashboard/page.tsx` | 0, 3 | Fix KPIs, redesign |
| `vitest.config.ts` | 0 | Add jsdom |
| `src/test/setup.ts` | 0 | Create mocks |
| `src/actions/auth.ts` | 0 | Fix next redirect |
| `src/app/(auth)/login/page.tsx` | 0, 2 | next field, polish |
| `src/app/globals.css` | 1 | Design tokens |
| `src/app/layout.tsx` | 1 | Toaster, metadata |
| `src/components/layout/app-shell.tsx` | 1 | Create |
| `src/components/layout/page-header.tsx` | 1 | Create |
| `src/components/shared/*.tsx` | 1 | Create (5 files) |
| `src/app/(dashboard)/layout.tsx` | 1 | Wire AppShell |
| `src/app/page.tsx` | 2 | Landing redesign |
| `src/app/(auth)/*` | 2 | Auth polish |
| `src/app/(dashboard)/invoices/page.tsx` | 3 | Redesign |
| `src/app/(dashboard)/products/page.tsx` | 3 | Redesign |
| `src/app/(dashboard)/payments/page.tsx` | 3 | Redesign |
| `src/components/dashboard/*.tsx` | 3 | Extract (6+ files) |
| `src/components/payment/payment-progress.tsx` | 4 | Create |
| `src/components/payment/wallet-trust-block.tsx` | 4 | Create |
| `src/components/payment/payment-receipt.tsx` | 4 | Create |
| `src/components/payment/payment-unavailable.tsx` | 4 | Create |
| `src/app/pay/[paymentRequestId]/page.tsx` | 4 | Expired handling |
| `src/app/**/loading.tsx` | 5 | Create (6 files) |
| `src/app/**/error.tsx` | 5 | Create (2 files) |
| `src/app/icon.tsx` | 5 | Create |
| `.env.example` | 5 | Add APP_URL |
| `README.md` | 6 | Sync copy |

---

## Composer 2.5 execution notes

1. **Read `docs/design.md` before each phase.** If a step conflicts with the spec, follow the spec.
2. **One phase per session** when possible, to keep context focused.
3. **Run `npm test` after Phase 0** and after any change to `build-payment.ts` or `payment-request-card.tsx`.
4. **Do not skip Phase 0.** UI redesign on a broken payment flow wastes effort.
5. **Prefer extracting components** over growing page files beyond 150 lines.
6. **Use existing shadcn primitives** — do not install new UI libraries.
7. **Commit only when user asks.** Stage changes per phase for review.
8. **Manual Testnet verification** requires Freighter extension + funded Testnet account + `.env.local` with Supabase and Stellar vars.

---

## Appendix A — Cross-check matrix (2026-07-10)

Verified against live codebase, both audits, and MVP docs.

### Routes (8/8 covered)

| Route | design.md | Plan phase |
|-------|-----------|------------|
| `/` | §9.1 | Phase 2 |
| `/login` | §9.2 | Phase 0 + 2 |
| `/register` | §9.2 | Phase 2 |
| `/dashboard` | §9.3 | Phase 0 + 3 |
| `/invoices` | §9.4 | Phase 3 |
| `/products` | §9.5 | Phase 3 |
| `/payments` | §9.6 | Phase 3 |
| `/pay/[id]` | §9.7 | Phase 0 + 4 |

### Functional defects (10/10 covered)

| ID | Issue | Plan task |
|----|-------|-----------|
| F1 | Wrong XDR source account | 0.1 |
| F2 | Dashboard KPI sample bias | 0.2 |
| F3 | Vitest timeout / no jsdom | 0.3 |
| F4 | Silent redirect feedback | 1.3 QueryFeedback + Phase 3 |
| F5 | Login ignores `?next=` | 0.4 |
| F6 | Expired → 404 | 4.2 |
| F7 | Misleading error copy | 0.5 |
| F8 | Missing merchant QR | 3.1 InvoiceQrDialog |
| F9 | No loading/error routes | Phase 5 |
| F10 | Non-XLM form gap | 3.2 (XLM-only MVP) |

### MVP doc reconciliation

| MVP claim | Resolution |
|-----------|------------|
| Merchant QR (Track D2) | Phase 3.1 |
| Verify auth on endpoint | Intentionally public — documented in design.md §14 |
| `settlePaymentRequest` action | Deferred |
| Vitest jsdom (Track D1) | Phase 0.3 |
| CI workflow | Phase 6 / infra follow-up |

---

*Plan aligned to [`docs/design.md`](./design.md). Do not modify this plan or the `.cursor/plans/` file during execution.*
