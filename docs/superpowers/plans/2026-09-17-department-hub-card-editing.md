# Department Hub Card Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each of the six departments' head and deputy head edit their own public department card's title and description directly from the department hub.

**Architecture:** Reuse the existing `departments.title` and `departments.description` fields so no migration or duplicate content store is introduced. Change the existing department update endpoint from executive-only access to manager access with server-side department scoping, then add a shared card editor to `DepartmentsHub`; because all six cards use that component, the behavior applies uniformly.

**Tech Stack:** Fastify, SQLite, Zod, React, TanStack Query, Vitest, Testing Library.

---

### Task 1: Department-scoped update API

**Files:**
- Modify: `apps/api/test/api.integration.test.ts`
- Modify: `apps/api/src/app.ts`

- [x] **Step 1: Write the failing integration test**

Add coverage proving that a department head and deputy can patch their own department, an ordinary member cannot patch any department, and a manager cannot patch another department.

- [x] **Step 2: Run the focused API test and verify RED**

Run: `pnpm --filter @guild/api test -- --run -t "lets department heads and deputies edit only their own public card"`

Expected: FAIL because `/api/admin/departments/:id` currently requires an executive account.

- [x] **Step 3: Implement the scoped update**

Load the target department, return 404 when absent, call `scopeDepartment` for non-executive department managers, validate trimmed title/description lengths, update the row, and write a `DEPARTMENT_UPDATED` audit event.

- [x] **Step 4: Run the focused API test and verify GREEN**

Run the same command and expect the new test to pass.

### Task 2: In-place editor for all six shared cards

**Files:**
- Modify: `apps/web/src/test/app.test.tsx`
- Modify: `apps/web/src/components/departments/DepartmentsHub.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write the failing UI test**

Render `/departments` as a department head, assert that only the matching department card has an edit button, open the editor, change the title and description, save, and assert the scoped PATCH request payload. Also assert that an ordinary member has no edit control.

- [x] **Step 2: Run the focused web test and verify RED**

Run: `pnpm --filter @guild/web test -- --run -t "edits only the signed-in manager's department card"`

Expected: FAIL because no card edit control exists.

- [x] **Step 3: Implement the shared editor**

Use `useAuth` to calculate card-level permissions, `useMutation` to PATCH the existing endpoint, and an accessible modal form for title and description. Render `dept.description` in the public card so saved copy is visible while preserving each department's static visual theme and duty tags.

- [x] **Step 4: Run the focused web test and verify GREEN**

Run the same command and expect the new test to pass.

### Task 3: Regression verification

**Files:**
- Verify only

- [x] **Step 1: Run API and web tests**

Run: `pnpm --filter @guild/api test` and `pnpm --filter @guild/web test`.

- [x] **Step 2: Run static checks and production build**

Run: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`.

- [x] **Step 3: Review the final diff**

Confirm the change touches only the scoped endpoint, shared card UI/styles, tests, and this plan, while preserving unrelated working-tree changes.
