# Manager Raffle Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-safe pixel gashapon raffle game to the homepage for management roles, backed by a persistent 250/40/10 prize pool.

**Architecture:** SQLite owns prize inventory and draw history. Fastify performs each weighted draw in one transaction and enforces management permissions; React only animates the returned result. The homepage mounts one isolated floating launcher/modal component so existing visual composition remains unchanged.

**Tech Stack:** React, TypeScript, TanStack Query, Framer Motion, Fastify, SQLite/better-sqlite3, Vitest.

---

### Task 1: Persistent raffle model

**Files:**
- Create: `apps/api/drizzle/0025_manager_raffle.sql`
- Modify: `apps/api/src/database.ts`
- Modify: `apps/api/src/schema.ts`
- Test: `apps/api/test/api.integration.test.ts`

- [ ] Add a failing migration test expecting three seeded prizes with initial stock 250, 40, and 10.
- [ ] Run `pnpm --filter @guild/api exec vitest run test/api.integration.test.ts -t "manager raffle"` and confirm the table-missing failure.
- [ ] Add `raffle_prizes` and `raffle_draws`, register migration `0025_manager_raffle`, and add Drizzle table declarations.
- [ ] Rerun the focused API test and confirm it passes.

### Task 2: Permissioned atomic draw API

**Files:**
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/api.integration.test.ts`

- [ ] Add failing tests proving guests and `MEMBER` cannot read/draw, all four management roles can draw, one stock unit is atomically consumed, history records the operator, and an empty pool returns 409.
- [ ] Add `GET /api/admin/raffle`, `POST /api/admin/raffle/draw`, and executive-only confirmed `POST /api/admin/raffle/reset`.
- [ ] Select a cryptographically random integer within total remaining stock, choose by cumulative stock, update with `remaining_stock > 0`, insert draw history, and write an audit event in one SQLite transaction.
- [ ] Rerun focused API tests.

### Task 3: Pixel gashapon homepage game

**Files:**
- Create: `apps/web/src/components/home/ManagerRaffle.tsx`
- Create: `apps/web/src/manager-raffle.css`
- Modify: `apps/web/src/components/home/HomePage.tsx`
- Modify: `apps/web/src/components/home/HomePage.tsx`
- Test: `apps/web/src/test/app.test.tsx`

- [ ] Add failing UI tests proving guests/members see no launcher, managers see an accessible “现场抽奖” launcher, a draw request reveals the returned prize, stock refreshes, and reduced motion remains usable.
- [ ] Build a CSS pixel-art Japanese hand-crank machine launcher, modal machine, crank/ball animation, prize cards, remaining total, recent results, and close/reset controls.
- [ ] Import the component-owned stylesheet directly, render only when `isManagementRole(user.role)` is true, and keep the fixed launcher clear of mobile safe areas.
- [ ] Rerun focused web tests.

### Task 4: Acceptance, GitHub, and production

**Files:**
- Verify all files above; keep local QA/private files excluded.

- [ ] Run lint, typecheck, contracts/API/web tests, and production build.
- [ ] Start locally and capture desktop/mobile manager raffle screenshots; visually inspect layout and interaction.
- [ ] Commit only scoped source/test/migration files and push `main`.
- [ ] Package a new release excluding local member-card drafts, deploy only under `C:\Services\zuoyou_web`, preserve shared data/uploads and unrelated Nginx sites, and retain rollback.
- [ ] Verify the active process, migration, public health, new frontend asset, role protection, and `http://62.234.83.174:8080/`.
