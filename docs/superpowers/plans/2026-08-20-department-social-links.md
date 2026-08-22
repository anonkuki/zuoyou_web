# Department Social Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all six department pages relevant, real Bilibili links; give 外宣&幻想研 a WeChat article showcase; turn footer social icons into real interactions; and document the safe QQ Channel integration boundary.

**Architecture:** Keep social-platform content as a reviewed static snapshot so production never stores Bilibili/WeChat/QQ cookies. Put platform-neutral content metadata in one frontend module, render it through a shared department shelf, and migrate the canonical department name in SQLite. QQ Channel remains a copyable channel code until an authorized QQ bot AppID/AppSecret and channel permissions are supplied.

**Tech Stack:** React 19, TypeScript, React Router, Vitest/Testing Library, Fastify, SQLite migrations.

---

### Task 1: Social content contract and failing frontend tests

**Files:**
- Create: `apps/web/src/components/departments/department-media.ts`
- Create: `apps/web/src/components/departments/DepartmentMediaShelf.tsx`
- Create: `apps/web/src/test/department-media.test.tsx`

- [ ] **Step 1: Write a failing test for six Bilibili mappings**

Assert that `departmentMediaBySlug` has exactly the six department slugs, every entry uses an HTTPS Bilibili video URL and HTTPS cover, and the publicity entry contains WeChat articles plus QQ channel code `pd17345257`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter @guild/web test -- src/test/department-media.test.tsx`

Expected: FAIL because `department-media.ts` and `DepartmentMediaShelf.tsx` do not exist.

- [ ] **Step 3: Add reviewed snapshot data**

Use the six verified videos from the legacy `BILIBILI_VIDEOS` snapshot and current Bilibili metadata API checks:

```ts
const bvidByDepartment = {
  cos: 'BV1Vr7YzLE1R',
  tech: 'BV1c4aGzKEYF',
  music: 'BV1gw8XzoExM',
  original: 'BV1KVG3z4EXM',
  dance: 'BV1iAstzHEfz',
  publicity: 'BV1Awsoz1EC4',
} as const;
```

Include the latest reviewed WeChat/Fantasy Lab articles from `D:\codeC\python\zuoyou\backup\generator-config.js`, upgrading article URLs to HTTPS.

- [ ] **Step 4: Implement the shared media shelf**

Render external links with `target="_blank"`, `rel="noreferrer"`, descriptive accessible names, HTTPS covers, dates, duration/views snapshot labels, and a publicity-only WeChat section. QQ Channel is a copy button, not an unauthenticated scraper.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `pnpm --filter @guild/web test -- src/test/department-media.test.tsx`

Expected: the focused media tests pass.

### Task 2: Department pages and footer interactions

**Files:**
- Modify: `apps/web/src/components/departments/DeptShowcasePage.tsx`
- Modify: `apps/web/src/components/home/PixelFooter.tsx`
- Modify: `apps/web/src/departments.css`
- Modify: `apps/web/src/home-responsive.css`
- Test: `apps/web/src/test/department-media.test.tsx`

- [ ] **Step 1: Add failing render assertions**

Render `ClosingPanel` and `PixelFooter` inside a router; assert that a department page exposes its mapped Bilibili link and that footer Bilibili/WeChat actions are real anchors rather than clipboard-only placeholder buttons.

- [ ] **Step 2: Run and verify RED**

Run the focused frontend test and confirm the missing links cause assertion failures.

- [ ] **Step 3: Mount `DepartmentMediaShelf` in every themed detail page**

Insert the shelf in `ClosingPanel` before duties so all six themed pages inherit the feature without duplicating markup.

- [ ] **Step 4: Replace footer placeholders**

Link Bilibili to `https://space.bilibili.com/10778739`, WeChat to the latest reviewed article, keep QQ Channel as a copy interaction with visible feedback, and remove the unsupported Xiaohongshu placeholder until an official account URL is supplied.

- [ ] **Step 5: Add responsive visual polish**

Create a horizontally scrollable video reel on narrow screens and a balanced two-column publicity article layout on desktop, using the existing parchment/pixel visual language.

- [ ] **Step 6: Run and verify GREEN**

Run the focused frontend test and confirm real hrefs and labels.

### Task 3: Canonical rename to 外宣&幻想研

**Files:**
- Create: `apps/api/drizzle/0011_publicity_fantasy_lab.sql`
- Modify: `apps/api/src/database.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/web/src/components/departments/showcase-data.ts`
- Modify: `apps/web/src/components/departments/pixel.tsx`
- Modify: `apps/web/src/components/home/LuminousGuildScene.tsx`
- Modify: `apps/web/src/test/app.test.tsx`
- Modify: `apps/api/test/api.integration.test.ts`

- [ ] **Step 1: Add failing API and UI assertions**

Assert `/api/public/departments/publicity` returns `外宣&幻想研`, the world area label uses the new name, and visible homepage/department labels no longer present the department as only `外宣部`.

- [ ] **Step 2: Run focused tests and verify RED**

Run the API integration test and relevant frontend tests; confirm old-name assertions fail.

- [ ] **Step 3: Add idempotent SQLite migration**

Update `departments.name`, description, and department conversation title for `dept-publicity`, then add `0011_publicity_fantasy_lab` to the migration sequence.

- [ ] **Step 4: Update source defaults and visible labels**

Keep the stable slug/id `publicity`/`dept-publicity`, but change the canonical display name to `外宣&幻想研` everywhere users see it.

- [ ] **Step 5: Run focused tests and verify GREEN**

Confirm the migrated API and frontend render the new name.

### Task 4: Verification and QQ Channel decision record

**Files:**
- Create: `docs/qq-channel-integration.md`

- [ ] **Step 1: Record the QQ Channel boundary**

Document that channel code `pd17345257` is not a public feed API. Reading messages requires an authorized QQ bot application, AppID/AppSecret, adding the bot to the channel, and only the permissions approved by Tencent/that channel. Never scrape with a personal QQ cookie.

- [ ] **Step 2: Run full gates**

Run sequentially: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` with Playwright browsers on `D:\Caches\ms-playwright`.

- [ ] **Step 3: Inspect Git boundary**

Use `git diff --check` and `git status --short`; preserve all pre-existing avatar work, QA screenshots, `.tmp-avatar-preview`, and the existing untracked feature checklist.
