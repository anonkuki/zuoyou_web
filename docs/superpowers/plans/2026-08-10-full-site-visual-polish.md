# Full-site Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise every non-home route to the same authored RPG/anime product-design standard as the approved homepage while preserving all existing business behavior.

**Architecture:** Keep page data flows and route components intact, add richer semantic framing to the shared `PageHero` and console layout, then apply a dedicated final-layer stylesheet that upgrades all shared public, member, admin, form, table, list, chart, and responsive patterns. The homepage scene remains isolated through `.reference-home` and existing home-specific selectors.

**Tech Stack:** React 19, TypeScript, React Router, Framer Motion, Tailwind-era CSS primitives, Vitest, Testing Library, Playwright.

---

### Task 1: Lock the visual component contract

**Files:**
- Modify: `apps/web/src/test/app.test.tsx`
- Modify: `apps/web/src/components.tsx`
- Modify: `apps/web/src/layouts.tsx`

- [x] **Step 1: Write failing tests**

Add assertions that a secondary route exposes an ornamental hero frame and that console routes expose the guild workspace shell, navigation rail, utility bar, and user identity block.

- [x] **Step 2: Verify the tests fail**

Run: `pnpm --filter @guild/web exec vitest run src/test/app.test.tsx`

Expected: failure because `data-visual="guild-page-v2"` and `data-workspace` do not exist.

- [x] **Step 3: Implement shared semantic framing**

Add non-interactive decorative nodes to `PageHero`; add workspace data attributes, rail ornaments, navigation caption, and top-bar context to `ConsoleLayout`. Preserve labels, links, role filtering, logout, and route outlet behavior.

- [x] **Step 4: Verify the tests pass**

Run: `pnpm --filter @guild/web exec vitest run src/test/app.test.tsx`

Expected: all web component tests pass.

### Task 2: Build the final-layer design system

**Files:**
- Create: `apps/web/src/guild-polish.css`
- Modify: `apps/web/src/main.tsx`

- [x] **Step 1: Define the route-level visual tokens**

Create scoped colors, shadows, carved borders, parchment layers, focus rings, transitions, and responsive sizing under `.app-shell`, `.auth-page`, and `.console` without changing `.reference-home` scene geometry.

- [x] **Step 2: Refine public route components**

Style page heroes, chronicles, departments, activity cards, work atlas, detail panels, recruitment flow, status page, state panels, and 404 presentation with authored compositions rather than repeated flat rectangles.

- [x] **Step 3: Refine member and admin components**

Style console rail/top bar, dashboard metrics, data tables, management lists, forms, filters, task/file cards, charts, audit rows, feedback states, buttons, and controls with consistent hierarchy and interaction feedback.

- [x] **Step 4: Refine responsive behavior**

At 1024px collapse complex grids to two columns; at 760px convert the console to a horizontal mobile rail, keep controls tap-friendly, and prevent narrow portrait layouts from becoming excessively tall or cramped.

### Task 3: Visual and functional acceptance

**Files:**
- Modify: `e2e/guild.spec.ts`
- Update: `artifacts/qa/*.png`
- Update: `docs/acceptance-matrix.md`

- [x] **Step 1: Add failing E2E design-contract assertions**

Assert that public secondary pages and authenticated console pages mount the v2 visual shells and that core actions remain accessible.

- [x] **Step 2: Run targeted E2E**

Run: `pnpm exec playwright test -g "非首页页面使用统一精修视觉系统"`

Expected: pass after Tasks 1 and 2.

- [x] **Step 3: Capture representative screenshots**

Capture public departments, activities, works, join, member dashboard, admin dashboard, member/file management at 1440x900; capture representative public and console routes at 390x844 and 768x1024.

- [x] **Step 4: Run fresh gates**

Run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and the full Playwright suite. Expected: zero failures and no console errors.

- [x] **Step 5: Review the diff and publish**

Stage only the plan, source, tests, acceptance documentation, and QA evidence. Keep the user's untracked `prd.txt` untouched. Commit and push `feature/adventurer-guild`.
