# Basic Member Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect registered users' email/contact data by default while adding explicit, reversible activity-email consent.

**Architecture:** Add one SQLite migration for consent state on registration requests and users. Keep full contact data limited to executive registration review, return masked email data to department managers, expose a self-service privacy-preference endpoint, and sanitize all audit details through one helper before persistence.

**Tech Stack:** TypeScript, Fastify, SQLite/better-sqlite3, Drizzle schema metadata, React, TanStack Query, Vitest/Testing Library.

---

### Task 1: Privacy helpers and schema migration

**Files:**
- Create: `apps/api/src/privacy.ts`
- Create: `apps/api/test/privacy.test.ts`
- Create: `apps/api/drizzle/0026_member_privacy_preferences.sql`
- Modify: `apps/api/src/database.ts`
- Modify: `apps/api/src/schema.ts`

- [ ] **Step 1: Write failing helper tests**

Test that `maskEmail('member@example.com')` does not contain the complete address and that `sanitizeAuditDetails` replaces password/token/cookie values and masks email/contact values recursively.

- [ ] **Step 2: Run the helper test and verify RED**

Run: `pnpm --filter @guild/api exec vitest run test/privacy.test.ts`

Expected: FAIL because `../src/privacy.js` does not exist.

- [ ] **Step 3: Implement the minimal privacy helpers**

Create pure recursive helpers that preserve non-sensitive values, replace secret-bearing keys with `[REDACTED]`, and mask email/contact values.

- [ ] **Step 4: Add and register migration**

Add `email_notifications_enabled INTEGER NOT NULL DEFAULT 0 CHECK(email_notifications_enabled IN (0,1))` to both `users` and `registration_requests`; register `0026_member_privacy_preferences` and mirror both fields in `schema.ts`.

- [ ] **Step 5: Run helper and migration tests**

Run: `pnpm --filter @guild/api exec vitest run test/privacy.test.ts test/api.integration.test.ts -t "migrates"`

Expected: PASS.

### Task 2: Consent, self-service preference, and email minimization APIs

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/test/api.integration.test.ts`

- [ ] **Step 1: Write failing API tests**

Cover registration defaulting consent to false, rejecting opt-in without a valid email, carrying explicit consent to an approved user, allowing that user to toggle consent, masking department-manager member results, preventing manager email search inference, preserving full executive access, and storing sanitized audit details.

- [ ] **Step 2: Run focused API tests and verify RED**

Run: `pnpm --filter @guild/api exec vitest run test/api.integration.test.ts -t "protects registered user contact data"`

Expected: FAIL because the consent fields and preference endpoint do not exist and manager responses still expose email.

- [ ] **Step 3: Implement minimal API behavior**

Accept `emailNotificationsEnabled` only as an explicit boolean; require an email contact when true; store it on the registration request; copy it during approval; include it only in the signed-in user's principal; add `PATCH /api/member/privacy-preferences`; mask/remove email for department manager listings and exclude email from their search predicate; pass every audit detail through `sanitizeAuditDetails`.

- [ ] **Step 4: Run the focused API test and verify GREEN**

Run: `pnpm --filter @guild/api exec vitest run test/api.integration.test.ts -t "protects registered user contact data"`

Expected: PASS.

### Task 3: Registration consent and member privacy controls

**Files:**
- Modify: `apps/web/src/api.ts`
- Modify: `apps/web/src/pages-auth.tsx`
- Modify: `apps/web/src/pages-social.tsx`
- Modify: `apps/web/src/pages-admin.tsx`
- Modify: `apps/web/src/test/app.test.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write failing UI tests**

Verify the registration request sends an unchecked-by-default consent flag, the profile privacy control calls the preference endpoint, and a department manager sees only a masked address in the member table.

- [ ] **Step 2: Run focused Web tests and verify RED**

Run: `pnpm --filter @guild/web exec vitest run src/test/app.test.tsx -t "email notification consent|privacy preference|masked member email"`

Expected: FAIL because the controls and response rendering do not exist.

- [ ] **Step 3: Implement minimal UI**

Add an optional registration checkbox with purpose/withdrawal text; add a privacy-preference card under account security; show masked email data when the API does not return a full address; never place another member's raw email on a public profile.

- [ ] **Step 4: Run focused Web tests and verify GREEN**

Run: `pnpm --filter @guild/web exec vitest run src/test/app.test.tsx -t "email notification consent|privacy preference|masked member email"`

Expected: PASS.

### Task 4: Full verification and deployment readiness

**Files:**
- Verify all modified files and existing department-card changes.

- [ ] **Step 1: Run full checks**

Run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

Expected: all commands exit 0.

- [ ] **Step 2: Inspect the diff and migration safety**

Run: `git diff --check` and review that no password, token, cookie, raw registration contact, or unrelated generated artifact is staged by this work.

- [ ] **Step 3: Report implementation separately from deployment**

State local verification evidence and identify that HTTPS remains a prerequisite before claiming production-grade personal-information protection.
