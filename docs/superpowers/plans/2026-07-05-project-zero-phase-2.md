# Project ZERO Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Supabase Auth, protected merchant flows, core database schema/RLS, invoice/product creation, dashboard lists, and public read-only payment pages.

**Architecture:** Server Components load merchant-owned data through the Supabase SSR client and Server Actions handle mutations after checking the authenticated user. Public `/pay/[paymentRequestId]` reads a limited view of pending/paid payment request data, while status mutation remains server-only for Phase 3 verification.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth/Postgres/RLS, Zod, shadcn/ui, Vitest.

---

### Task 1: Tests and Domain Helpers

**Files:**
- Create: `src/lib/payments/payment-request.test.ts`
- Create: `src/lib/payments/payment-request.ts`
- Modify: `package.json`

- [x] **Step 1: Add failing tests for memo/link/status helpers**

```ts
import { describe, expect, it } from "vitest";
import { buildPaymentLink, createPaymentMemo, canMarkPaymentRequestPaid } from "./payment-request";

describe("payment request helpers", () => {
  it("creates a stable ZERO memo prefix with compact entropy", () => {
    expect(createPaymentMemo("12345678-1234-1234-1234-123456789abc")).toMatch(
      /^ZERO-12345678-[A-Z0-9]{6}$/,
    );
  });

  it("builds shareable app links without trailing slash duplication", () => {
    expect(buildPaymentLink("https://zero.test/", "pay_123")).toBe("https://zero.test/pay/pay_123");
  });

  it("only allows pending, unexpired requests to be marked paid", () => {
    expect(canMarkPaymentRequestPaid({ status: "pending", expiresAt: null }, new Date("2026-01-01"))).toBe(true);
    expect(canMarkPaymentRequestPaid({ status: "paid", expiresAt: null }, new Date("2026-01-01"))).toBe(false);
    expect(
      canMarkPaymentRequestPaid(
        { status: "pending", expiresAt: "2025-12-31T23:59:59.000Z" },
        new Date("2026-01-01"),
      ),
    ).toBe(false);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/payments/payment-request.test.ts`
Expected: FAIL because helper module does not exist.

- [x] **Step 3: Implement minimal helpers**

```ts
export function buildPaymentLink(appUrl: string, paymentRequestId: string) {
  return `${appUrl.replace(/\/$/, "")}/pay/${paymentRequestId}`;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/payments/payment-request.test.ts`
Expected: PASS.

### Task 2: Supabase Schema and RLS

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `supabase/rls.sql`
- Modify: `src/types/database.ts`

- [x] **Step 1: Define tables, constraints, grants, indexes, and update timestamp trigger**
- [x] **Step 2: Define RLS policies with owner checks and public read-only payment access**
- [x] **Step 3: Update TypeScript table types used by Supabase client calls**

### Task 3: Auth and Protected Routing

**Files:**
- Create: `src/actions/auth.ts`
- Create: `src/proxy.ts`
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [x] **Step 1: Add server actions for login, registration, and logout**
- [x] **Step 2: Add `src/proxy.ts` to refresh sessions and redirect unauthenticated dashboard traffic**
- [x] **Step 3: Replace auth placeholders with real forms**

### Task 4: Merchant, Product, and Invoice Flow

**Files:**
- Modify: `src/actions/merchants.ts`
- Modify: `src/actions/products.ts`
- Modify: `src/actions/payment-requests.ts`
- Create: `src/lib/validation/auth.schema.ts`
- Modify: `src/lib/validation/*.ts`
- Modify: dashboard route pages

- [x] **Step 1: Validate input with Zod before writes**
- [x] **Step 2: Enforce authenticated merchant ownership in Server Actions**
- [x] **Step 3: Build dashboard overview, merchant onboarding, invoice form/list, product form/list, and payments table**

### Task 5: Public Payment Page

**Files:**
- Modify: `src/app/pay/[paymentRequestId]/page.tsx`
- Create: `src/components/payment/payment-request-card.tsx`

- [x] **Step 1: Load limited public payment request data**
- [x] **Step 2: Render QR code, payment metadata, status, and copyable link**
- [x] **Step 3: Keep Stellar payment button marked as Phase 3 TODO**

### Task 6: Verification

**Files:**
- Modify: `README.md`

- [x] **Step 1: Run tests**
- [x] **Step 2: Run lint**
- [x] **Step 3: Run build**
- [x] **Step 4: Update README with Phase 2 setup and limitations**
