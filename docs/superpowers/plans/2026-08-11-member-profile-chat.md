# Member Profile and Chat System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build mature, persistent member homepages and an authenticated guild chat system with directory discovery, direct messages, department channels, unread state, and responsive product-grade UI.

**Architecture:** Extend the existing SQLite schema with profile metadata plus conversations, participants, and messages. Keep all routes behind the existing HttpOnly session boundary; use TanStack Query polling for dependable same-origin near-real-time updates without an external broker. Add focused React route modules and a final visual layer that matches the approved guild console while leaving the homepage untouched.

**Tech Stack:** Fastify, better-sqlite3, Drizzle schema definitions, Zod, React 19, TypeScript, React Router, TanStack Query, Lucide, Vitest, Testing Library, Playwright.

**Implementation status (2026-08-11):** Tasks 1–4 and the targeted cross-account Playwright scenario are complete. The remaining delivery step is the fresh full gate, commit, and push recorded by the final verification output.

---

### Task 1: Persist profile and conversation data

**Files:**
- Create: `apps/api/drizzle/0005_member_profiles_chat.sql`
- Modify: `apps/api/src/schema.ts`
- Modify: `apps/api/src/database.ts`
- Test: `apps/api/test/api.integration.test.ts`

- [ ] **Step 1: Write failing migration and seed tests**

Assert that a seeded database exposes extended profile columns, six department conversations, conversation participants, and sample messages. Also verify existing databases receive the showcase backfill.

- [ ] **Step 2: Run the API test and verify RED**

Run: `pnpm --filter @guild/api exec vitest run test/api.integration.test.ts`

Expected: failure because profile columns and conversation tables do not exist.

- [ ] **Step 3: Add migration and schema definitions**

Add `guild_title`, `college`, `grade`, `skills`, `interests`, `avatar_color`, `profile_visibility`, and `last_seen_at` to users. Add `conversations`, `conversation_participants`, and `messages` with foreign keys, direct-key uniqueness, participant uniqueness, and message indexes.

- [ ] **Step 4: Add idempotent realistic seed data**

Create six department channels, profiles for the three demo accounts, direct conversations, participant read markers, and non-sensitive fictional messages. Call the backfill both after a fresh seed and when upgrading an existing development database.

- [ ] **Step 5: Run the API test and verify GREEN**

Run: `pnpm --filter @guild/api exec vitest run test/api.integration.test.ts`

Expected: migration and seed assertions pass.

### Task 2: Implement profile and chat APIs

**Files:**
- Create: `apps/api/src/social.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `apps/api/test/api.integration.test.ts`
- Test: `packages/contracts/test/contracts.test.ts`

- [ ] **Step 1: Write failing contract and API tests**

Cover profile update validation, member directory privacy, public member profile aggregates, direct-conversation idempotency, department access, message history pagination, empty-message rejection, reply references, edit/delete ownership, read markers, and unread counts.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm --filter @guild/contracts test && pnpm --filter @guild/api exec vitest run test/api.integration.test.ts`

Expected: new schemas and routes are missing.

- [ ] **Step 3: Add shared contracts and social query helpers**

Define `ProfileVisibility`, `ConversationType`, profile input, message input, and JSON-array parsing. Isolate conversation authorization, conversation summaries, profile projections, and message serialization in `social.ts`.

- [ ] **Step 4: Add authenticated endpoints**

Implement directory search, member homepage, extended profile patch, conversation list/create, message list/send/edit/delete, and mark-read endpoints. Enforce active-user, participant/department, owner, privacy, length, and reply-conversation boundaries.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the same contract and API commands; expect all tests to pass with explicit 401/403/404/409 coverage.

### Task 3: Build member homepages and directory

**Files:**
- Create: `apps/web/src/pages-social.tsx`
- Modify: `apps/web/src/pages-portal.tsx`
- Modify: `apps/web/src/app.tsx`
- Modify: `apps/web/src/layouts.tsx`
- Modify: `apps/web/src/api.ts`
- Test: `apps/web/src/test/app.test.tsx`

- [ ] **Step 1: Write failing React route tests**

Assert the member directory searches real members, profile cards navigate to `/portal/members/:id`, the personal editor saves extended fields, and the member homepage shows identity, statistics, skills, works, activities, and a chat action.

- [ ] **Step 2: Run the React test and verify RED**

Run: `pnpm --filter @guild/web exec vitest run src/test/app.test.tsx`

Expected: routes, navigation links, and fields are missing.

- [ ] **Step 3: Implement the member directory and homepage**

Add responsive directory filters and authored identity cards. Build a profile cover with avatar monogram, department/role status, contribution metrics, skill and interest tokens, published works, attended activities, and privacy-aware empty state.

- [ ] **Step 4: Upgrade the self profile editor**

Replace the minimal form with live preview, guild title, college/grade, skills/interests tag inputs, color selection, visibility control, validation feedback, and auth-query invalidation after save.

- [ ] **Step 5: Run React tests and verify GREEN**

Run the focused React test; expect all profile and directory assertions to pass.

### Task 4: Build the chat experience

**Files:**
- Modify: `apps/web/src/pages-social.tsx`
- Create: `apps/web/src/social.css`
- Modify: `apps/web/src/main.tsx`
- Test: `apps/web/src/test/app.test.tsx`

- [ ] **Step 1: Write failing chat component tests**

Assert conversation selection, unread badges, direct-chat creation, message sending, reply mode, edit/delete controls for own messages, mark-read calls, loading/error/empty states, and compact mobile layout.

- [ ] **Step 2: Run the React test and verify RED**

Run the focused React test; expected failure because the chat workspace does not exist.

- [ ] **Step 3: Implement the responsive chat workspace**

Create conversation rail, active header, scrollable message stream, reply preview, composer, profile context panel, and mobile back/navigation behavior. Poll conversation summaries and active messages every two seconds, optimistically clear the composer, and invalidate unread state after send/read/edit/delete.

- [ ] **Step 4: Apply product-grade visual design**

Use guild-green glass, warm parchment messages, role colors, temporal separators, presence signals, focus rings, hover/pressed states, reduced motion, and 1440/768/390 layouts. Do not alter `.reference-home` geometry.

- [ ] **Step 5: Run React tests and verify GREEN**

Run the focused React test and confirm all chat assertions pass.

### Task 5: End-to-end acceptance and publication

**Files:**
- Modify: `e2e/guild.spec.ts`
- Modify: `docs/acceptance-matrix.md`
- Modify: `artifacts/qa/README.md`
- Update: `artifacts/qa/*.png`

- [ ] **Step 1: Add the failing cross-account E2E scenario**

Log in as a member, update the homepage, find another member, open a direct chat and send a unique message. Log in as the recipient, verify unread state and the message, reply, then verify the original account sees the reply and cleared unread state. Capture profile, directory, chat desktop, and chat mobile evidence.

- [ ] **Step 2: Run targeted E2E and verify GREEN after implementation**

Run: `pnpm exec playwright test -g "个人主页与聊天形成跨账号闭环"`

Expected: one scenario passes with no console errors or horizontal overflow.

- [ ] **Step 3: Run fresh full gates**

Run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`. Expect zero failures.

- [ ] **Step 4: Review, commit, and push**

Stage source, migration, tests, docs, and safe QA screenshots only. Keep `prd.txt` untouched. Commit to and push `feature/adventurer-guild`.
