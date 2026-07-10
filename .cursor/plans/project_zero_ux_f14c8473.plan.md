---
name: Project Zero UX
overview: Document an approved trust-first fintech redesign for every current page, preceded by functional stabilization, and produce a phase-by-phase implementation plan optimized for Composer 2.5 execution.
todos:
  - id: write-design-spec
    content: Write and self-review docs/design.md from the approved direction, audit evidence, and Firecrawl research.
    status: completed
  - id: write-executor-plan
    content: Write and self-review docs/ux-ui-implementation-plan.md with exact phase files, skills, tests, and Composer 2.5 instructions.
    status: completed
  - id: cross-check-docs
    content: Cross-check both documents against every current route, shared component, MVP plan claim, and discovered functional defect.
    status: completed
  - id: handoff-review
    content: Present both document paths and ask for user review before any application code implementation.
    status: completed
isProject: false
---

# Project ZERO UX/UI and Functional Stabilization Plan

## Deliverables
- Create [`docs/design.md`](C:/Users/Dennis/OneDrive/Desktop/project-zero/docs/design.md) as the canonical UX/UI specification: goals, audited page inventory, design research, principles, tokens, responsive behavior, route-by-route states, reusable components, accessibility, and acceptance criteria.
- Create [`docs/ux-ui-implementation-plan.md`](C:/Users/Dennis/OneDrive/Desktop/project-zero/docs/ux-ui-implementation-plan.md) as the Composer 2.5 execution guide, with exact files, required skills, ordered checkboxes, tests, expected outcomes, phase gates, and a no-commit-without-explicit-approval rule.
- Reconcile both documents with [`docs/mvp-implementation.md`](C:/Users/Dennis/OneDrive/Desktop/project-zero/docs/mvp-implementation.md) and [`docs/mvp-roadmap.md`](C:/Users/Dennis/OneDrive/Desktop/project-zero/docs/mvp-roadmap.md), explicitly correcting claims that do not match the current code.

## Audit baseline to encode
- Treat the customer payment flow as blocked until [`src/lib/stellar/build-payment.ts`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/lib/stellar/build-payment.ts) builds from the connected customer account and its live sequence; Freighter signs an existing envelope and does not replace its source.
- Stabilize the default test suite: the current run reports 24/25 passing because [`src/actions/payment-requests.test.ts`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/actions/payment-requests.test.ts) times out on a cold import, while its isolated rerun passes.
- Correct inaccurate dashboard metrics in [`src/app/(dashboard)/dashboard/page.tsx`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/app/(dashboard)/dashboard/page.tsx), which derive totals from five-row samples.
- Cover missing merchant QR presentation, silent redirect feedback, missing mobile navigation, stale phase copy, absent route loading/error/not-found states, non-XLM form mismatch, misleading post-broadcast wallet error copy, and incomplete product management.

## Approved design direction
- Evolve the current dark/green brand into a trust-first fintech system: graphite surfaces, emerald primary actions, restrained cyan network accents, semantic status colors, Geist typography, and monospace only for chain identifiers.
- Use a responsive merchant operations shell: desktop sidebar plus compact mobile navigation; accurate KPIs; full-width searchable/filterable records; create/edit flows in dialogs or mobile sheets.
- Make [`src/app/pay/[paymentRequestId]/page.tsx`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/app/pay/[paymentRequestId]/page.tsx) a mobile-first staged checkout: review, connect/network check, sign/broadcast, verify, and receipt, with SEP-7 fallback and truthful failure recovery.
- Preserve the security model: private keys stay in wallets, merchant destinations remain server-bound, and paid state requires the four-axis on-chain verification.

## Implementation phases for Composer 2.5
1. **Functional stabilization** — repair wallet source/sequence construction and state semantics in [`src/lib/stellar/build-payment.ts`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/lib/stellar/build-payment.ts), [`src/components/payment/payment-request-card.tsx`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/components/payment/payment-request-card.tsx), associated Stellar tests, dashboard aggregates, and flaky test setup. Required skills: `systematic-debugging`, `test-driven-development`, `dapp`, `data`, `agentic-payments`, `context7-mcp`.
2. **Design foundations** — refine [`src/app/globals.css`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/app/globals.css), root metadata/theme behavior, and focused shadcn primitives; add shared page headers, app branding, feedback, empty/loading, and responsive data-list patterns. Required skills: `brainstorming` only if the approved spec must change, then `shadcn`, `nextjs`, `react-best-practices`, `test-driven-development`.
3. **Public and auth experience** — rebuild [`src/app/page.tsx`](C:/Users/Dennis/OneDrive/Desktop/project-zero/src/app/page.tsx), login/register pages, and auth shell with accurate MVP copy, trust cues, email-confirmation behavior, visible server-action feedback, accessibility, and responsive states. Required skills: `nextjs`, `shadcn`, `supabase`, `react-best-practices`, `test-driven-development`.
4. **Merchant shell and operational pages** — update the dashboard layout/navigation and the Dashboard, Invoices, Products, and Payments routes; extract focused feature components under `src/components/dashboard/`; add aggregate queries, filters, responsive cards/tables, QR/link actions, creation sheets, and meaningful empty/error states. Required skills: `nextjs`, `shadcn`, `supabase`, `supabase-postgres-best-practices`, `react-best-practices`, `test-driven-development`.
5. **Customer payment checkout** — redesign the payment route and components around a typed payment state machine; add connected-account/network disclosure, transaction progress, SEP-7 fallback, success receipt, expiration handling, and recovery without weakening verification. Required skills: `dapp`, `agentic-payments`, `standards`, `data`, `shadcn`, `react-best-practices`, `test-driven-development`.
6. **Cross-route state and accessibility pass** — add route-level loading/error/not-found handling, keyboard/focus behavior, semantic announcements, contrast, reduced motion, touch targets, and responsive verification at mobile/tablet/desktop sizes. Required skills: `nextjs`, `shadcn`, `react-best-practices`, `verification`.
7. **End-to-end quality gate** — run lint, unit/component tests, production build, manual merchant CRUD checks, and a real Freighter Testnet invoice-to-paid flow; then perform security and regression review. Required skills: `verification-before-completion`, `systematic-debugging`, `review-security`, `requesting-code-review`.

## Research basis
- Stripe Payment Links: branded, focused checkout; explicit deactivated states; collect only necessary information.
- Coinbase Business: simple Invoicing and Payment Links mental model with clear trust and security positioning.
- Ecommpay merchant dashboard: transparency, real-time financial overview, and payment-link operations.
- Request Finance: clarity, control, audit trails, and explicit double-payment/security confidence.
- Freighter and Stellar references: dark wallet trust cues, connected-wallet disclosure, and wallet-first responsive interaction.

## Document self-review
- Remove placeholders and ambiguous “polish” instructions.
- Ensure every route and shared component maps to an exact phase and file list.
- Ensure every functional defect maps to a test and acceptance gate.
- Ensure skill paths use this workspace’s current locations rather than stale `k:\ProjectZero` paths.
- Ensure Composer 2.5 can execute one phase at a time without inferring hidden requirements.