# Project ZERO Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Project ZERO Next.js foundation with dependencies, app structure, environment examples, placeholder SQL, and a clean landing page.

**Architecture:** Create a Next.js App Router project in the current workspace using TypeScript, Tailwind CSS, and a `src` directory. Keep Phase 1 focused on foundation files and typed stubs for Supabase, Stellar, validation, actions, and route handlers without implementing merchant business logic.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, Zod, Supabase SSR/client packages, Stellar SDK, Freighter API, QR rendering, date-fns, clsx, tailwind-merge.

---

### Task 1: Scaffold Application

**Files:**
- Create/modify: `package.json`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`

- [ ] **Step 1: Check package manager availability**

Run: `pnpm --version`
Expected: version output if pnpm is available. If it fails, use npm for all package commands.

- [ ] **Step 2: Scaffold Next.js into the current non-empty directory**

Run with pnpm if available:
```bash
pnpm dlx create-next-app@latest . --yes --force --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Run with npm if pnpm is unavailable:
```bash
npx create-next-app@latest . --yes --force --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Next.js project files are created without interactive prompts.

### Task 2: Install Phase 1 Dependencies

**Files:**
- Modify: `package.json`
- Create/update: package lockfile for the selected package manager

- [ ] **Step 1: Install runtime dependencies**

Run with pnpm:
```bash
pnpm add lucide-react zod @supabase/supabase-js @supabase/ssr @stellar/stellar-sdk @stellar/freighter-api react-qr-code date-fns clsx tailwind-merge
```

Run with npm:
```bash
npm install lucide-react zod @supabase/supabase-js @supabase/ssr @stellar/stellar-sdk @stellar/freighter-api react-qr-code date-fns clsx tailwind-merge
```

Expected: dependencies are listed in `package.json`.

### Task 3: Initialize shadcn/ui

**Files:**
- Create/modify: `components.json`, `src/components/ui/*`, `src/lib/utils.ts`, `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: Initialize shadcn/ui non-interactively**

Run:
```bash
pnpm dlx shadcn@latest init -d
```

If using npm:
```bash
npx shadcn@latest init -d
```

Expected: `components.json` and base shadcn configuration are created.

- [ ] **Step 2: Add core Phase 1 primitives**

Run with pnpm:
```bash
pnpm dlx shadcn@latest add button card badge separator
```

Run with npm:
```bash
npx shadcn@latest add button card badge separator
```

Expected: reusable UI components are created under `src/components/ui`.

- [ ] **Step 3: Apply Geist font fix if shadcn rewrites Tailwind v4 globals**

Ensure `src/app/globals.css` defines literal Geist font names in `@theme inline`, and `src/app/layout.tsx` puts Geist font variables on `<html>`.

### Task 4: Create Project ZERO Structure and Stubs

**Files:**
- Create route placeholders under `src/app/(auth)`, `src/app/(dashboard)`, `src/app/pay/[paymentRequestId]`, and `src/app/api`
- Create component folders under `src/components/layout`, `src/components/dashboard`, `src/components/payment`, and `src/components/forms`
- Create lib stubs under `src/lib/supabase`, `src/lib/stellar`, `src/lib/validation`
- Create action stubs under `src/actions`
- Create types under `src/types`
- Create constants under `src/constants`
- Create `.env.local.example`, `supabase/schema.sql`, `supabase/rls.sql`, and `README.md`

- [ ] **Step 1: Create route and library directories**

Use native shell directory creation for the exact folders listed in the scaffold prompt.

- [ ] **Step 2: Add safe stubs**

Create placeholder page components, route handlers returning `501 Not Implemented`, server action placeholders, validation schemas, Supabase client helpers, Stellar constants/helpers, and basic shared types.

- [ ] **Step 3: Add docs and env example**

Create `.env.local.example`, `README.md`, `supabase/schema.sql`, and `supabase/rls.sql` with Phase 1 setup instructions and Phase 2 SQL notes.

### Task 5: Build Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` if needed

- [ ] **Step 1: Replace default starter page**

Build a clean Project ZERO landing page explaining credentialless commerce, invoices, QR/payment links, Stellar wallet payment, and automatic verification.

- [ ] **Step 2: Keep Phase 1 static**

Do not implement auth, database writes, payment verification, Freighter signing, or paid-status mutation in Phase 1.

### Task 6: Verify

**Files:**
- All Phase 1 files

- [ ] **Step 1: Run lint**

Run:
```bash
pnpm lint
```

or:
```bash
npm run lint
```

Expected: no lint errors.

- [ ] **Step 2: Run production build**

Run:
```bash
pnpm build
```

or:
```bash
npm run build
```

Expected: build exits successfully.

- [ ] **Step 3: Check required files exist**

Confirm the required folders and files from the Phase 1 scaffold prompt exist.
