# Plan: Add a Project ZERO Claude Code Skill

## Context Summary

The project is **Project ZERO**: a Stellar-powered credentialless commerce MVP for MSMEs, social sellers, and local merchants. It is a Next.js 16 App Router app with TypeScript, Tailwind, shadcn/ui, Supabase Auth/Postgres/RLS, Vitest, and `@stellar/stellar-sdk` + `@stellar/freighter-api`.

Current state (from README and code):
- Phase 2 is complete: auth, merchant onboarding, invoices/products, public payment pages, RLS.
- Phase 3 is pending: Stellar wallet signing and server-side Horizon verification.
- Server-side verification is the security thesis: the frontend must never mark payments paid; only the server verifies Stellar transactions.

External research on Stellar's AI resources:
- Stellar publishes `developers.stellar.org/llms.txt` and per-page markdown for LLM context.
- Stellar Skills (`skills.stellar.org` / `github.com/stellar/stellar-dev-skill`) are Agent Skills for the Anthropic Agent Skills standard and work in Claude Code, Codex, etc.
- For this project, we should add a **project-specific** Claude Code skill that captures Project ZERO's architecture, conventions, and security rules, rather than re-implementing the ecosystem-wide Stellar skill.

## Proposed Implementation

Create one project skill at `.claude/skills/project-zero/SKILL.md`. This follows the Claude Code convention that project skills live under `.claude/skills/<name>/SKILL.md` and are invoked as `/project-zero`.

### Skill content

The skill will include:

1. **Frontmatter**
   - `name: project-zero`
   - `description`: When to use the skill (any work on this repo, especially Stellar payments, Supabase RLS, auth, and payment request flows).
   - `when_to_use`: Trigger phrases and file patterns.
   - `user-invocable: true`
   - `argument-hint`: `[task-description]`

2. **Project context**
   - What Project ZERO is (credentialless commerce MVP).
   - Target users (MSMEs, social sellers, local merchants).
   - Current phase status: Phase 2 shipped, Phase 3 pending.

3. **Architecture & stack**
   - Next.js App Router + Server Components + Server Actions.
   - Supabase SSR client, RLS, service-role usage.
   - Stellar Testnet only.
   - Zod validation, Vitest tests.

4. **Security non-negotiables**
   - Server-side payment verification only.
   - No client-side "mark as paid" path.
   - `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client.
   - RLS policies enforce merchant-owned reads/writes.
   - Public `/pay/[paymentRequestId]` is read-only for limited pending/paid data.

5. **Code conventions**
   - Server Actions go in `src/actions/`.
   - Validation schemas in `src/lib/validation/` with tests alongside.
   - Domain helpers in `src/lib/payments/` and `src/lib/stellar/` with tests.
   - Supabase clients in `src/lib/supabase/` (server vs browser).
   - Constants in `src/constants/`.
   - Types in `src/types/`.

6. **Stellar guidance (project-specific)**
   - Use constants from `src/constants/stellar.ts` (Testnet URL, passphrase, default asset code).
   - Payment memos follow `createPaymentMemo` format (`ZERO-<prefix>-<entropy>`).
   - Payment links use `buildPaymentLink`.
   - Payment status mutation uses `canMarkPaymentRequestPaid`.
   - Phase 3 will implement `src/lib/stellar/verify-payment.ts` and `src/app/api/stellar/verify/route.ts`.
   - Cross-reference: for general Stellar ecosystem knowledge, use the external `stellar-dev` skill, not this project skill.

7. **Verification checklist**
   - Run `npm test`, `npm run lint`, and `npm run build` after changes.
   - Ensure no `NEXT_PUBLIC_` exposure of service keys.
   - Ensure no client-side payment status mutation.

8. **Reference to existing docs**
   - Link to `README.md`, `project-zero-codex-scaffold-prompt.md`, and `docs/superpowers/plans/`.

### Files to create

- `.claude/skills/project-zero/SKILL.md`

### Files to leave unchanged

- All source files remain untouched; this is a meta/developer-experience addition only.

### Out of scope

- Not adding the external Stellar skill to the project (that would require `/plugin` or git clone and is a separate user decision).
- Not changing `CLAUDE.md` at this time; the project skill is a cleaner, on-demand alternative. We can add a root `CLAUDE.md` later if always-on context becomes needed.

## Validation

After creating the skill:
1. Run `npm test` to ensure no code changes broke tests.
2. Run `npm run lint` to ensure no lint regressions.
3. Inspect the skill file with `/project-zero` syntax check by reading it back.
4. Confirm the skill follows Agent Skills frontmatter rules (`name` lowercase with hyphens, `description` under 1024 chars).
