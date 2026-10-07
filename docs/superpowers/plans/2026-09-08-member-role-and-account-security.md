# Member Role and Account Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the president appoint ordinary members as department heads or deputies while every authenticated user can safely change a Chinese-capable username and password without losing their stable UID or personal profile.

**Architecture:** Keep `users.id` and `users.uid` as stable identities; treat `role` and `department_id` as revocable authorization attributes. Add authenticated account-security endpoints beside the existing profile endpoints, enforce current-password verification and username uniqueness, revoke other sessions after a password change, and expose the controls in the member profile and president department-management pages.

**Tech Stack:** Fastify, Zod, SQLite/better-sqlite3, React, TanStack Query, Vitest, Testing Library.

---

### Task 1: President department appointments

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/web/src/pages-admin.tsx`
- Test: `apps/api/test/api.integration.test.ts`
- Test: `apps/web/src/test/app.test.tsx`

- [x] Add an API integration test that posts `{ role: 'DEPARTMENT_ADMIN', departmentId: 'dept-cos' }` as the president, verifies the role, and revokes it.
- [x] Run the focused API test and confirm the current `403` failure.
- [x] Permit the president to grant and revoke `DEPARTMENT_ADMIN` while retaining the existing department-membership check.
- [x] Add a web test that selects a normal member from the `COS部新增副部长` selector and verifies the role-assignment request.
- [x] Run the focused web test and confirm the selector is absent.
- [x] Add president-only head and deputy appointment controls to department management and a president revocation control to member management.
- [x] Run both focused tests and confirm they pass.

### Task 2: Self-service username and password changes

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/web/src/pages-social.tsx`
- Test: `apps/api/test/api.integration.test.ts`
- Test: `apps/web/src/test/app.test.tsx`

- [x] Add API tests proving Chinese usernames are accepted, duplicate usernames are rejected, the current password is required, the password changes, other sessions are revoked, and audit events are written.
- [x] Run the focused API tests and confirm the endpoints return `404`.
- [x] Add `PATCH /api/member/account/username` and `PATCH /api/member/account/password`; use the existing Unicode username rule and scrypt password functions.
- [x] Add a web test that changes `星砂成员` and submits current/new password fields from the personal profile page.
- [x] Run the focused web test and confirm the editable account controls are absent.
- [x] Add separate username and password forms; refresh the authenticated session after username change and show explicit success/error feedback.
- [x] Run both focused tests and confirm they pass.

### Task 3: Full verification

**Files:**
- Verify: `apps/api/src/app.ts`
- Verify: `apps/web/src/pages-admin.tsx`
- Verify: `apps/web/src/pages-social.tsx`
- Verify: `apps/api/test/api.integration.test.ts`
- Verify: `apps/web/src/test/app.test.tsx`

- [x] Run `pnpm --filter @guild/api test` and confirm all API tests pass.
- [x] Run the focused web account/appointment tests.
- [x] Run API/Web type checks and lint, `pnpm build`, and `git diff --check`; record exact results.
- [x] Review the final diff to confirm unrelated user changes remain untouched and no production demo credentials were introduced.
