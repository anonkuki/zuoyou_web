# Home And Department Real Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace homepage showcase imagery with every approved homepage photo except `creative-ensemble.jpg`, add the newly supplied original-department artwork dated 2026-09-07, and replace the department-index anime covers for original, COS, music, and dance with real department media.

**Architecture:** Keep department detail-page film metadata intact because it drives existing internal presentations, and add a dedicated typed `hubCovers` catalog for department-index cards. Keep the homepage layout's first two chapters, then use a compact stacked carousel for the remaining approved photos so all 12 assets are represented without making the page excessively tall. Extend department photo metadata with an optional record date and expose the new original-department assets through the existing portfolio carousel.

**Tech Stack:** React 19, TypeScript, Framer Motion, Vitest, Testing Library, Vite.

---

### Task 1: Lock the media contract with failing tests

**Files:**
- Modify: `apps/web/src/test/home-scroll-story.test.tsx`
- Modify: `apps/web/src/test/department-media.test.tsx`
- Modify: `apps/web/src/test/original-showcase.test.tsx`

- [ ] **Step 1: Write the failing homepage inventory test**

Assert that the story renders exactly the 12 current files under `/assets/photos/homepage/`, that every source is unique, and that `creative-ensemble.jpg`, `creative-workshop.jpg`, and `department-publicity-screening.jpg` are absent. Assert that the extra-photo area exposes previous/next controls.

- [ ] **Step 2: Write the failing department-index media test**

Assert that original, COS, music, and dance each define four `hubCovers`, and that their sources use the matching real-photo folders rather than `/assets/departments/<slug>/` anime artwork.

- [ ] **Step 3: Write the failing original-material test**

Assert that the original portfolio contains the 16 newly supplied files in addition to the four existing works, and that each new item carries `recordedAt: '2026-09-07'`. Assert that the rendered cards expose the localized date.

- [ ] **Step 4: Run focused tests and confirm RED**

Run: `pnpm --filter @guild/web test -- --run src/test/home-scroll-story.test.tsx src/test/department-media.test.tsx src/test/original-showcase.test.tsx`

Expected: FAIL because the 12-photo carousel, `hubCovers`, and dated original assets do not exist yet.

### Task 2: Implement homepage all-photo presentation

**Files:**
- Modify: `apps/web/src/components/home/GuildScrollStory.tsx`
- Modify: `apps/web/src/home-scroll-story.css`

- [ ] **Step 1: Replace the legacy image map**

Define the exact 12 approved homepage image records, assign the first five to the origin/create chapters, and reserve the other seven for the closing chapter. Do not reference the excluded `creative-ensemble.jpg` or the two deleted legacy files.

- [ ] **Step 2: Add the stacked carousel**

Implement a button-controlled, wraparound stacked carousel with an accessible status label, previous/next controls, and a thumbnail strip so all remaining photos stay available in a compact region.

- [ ] **Step 3: Add responsive styling**

Extend the existing story stylesheet with layered-card depth, stable aspect ratios, focus states, and a single-card mobile treatment.

- [ ] **Step 4: Run the focused homepage test and confirm GREEN**

Run: `pnpm --filter @guild/web test -- --run src/test/home-scroll-story.test.tsx`

Expected: PASS.

### Task 3: Add dated original material and real department-index covers

**Files:**
- Modify: `apps/web/src/components/departments/department-photos.ts`
- Modify: `apps/web/src/components/departments/showcase/OriginalShowcase.tsx`
- Modify: `apps/web/src/components/departments/showcase-data.ts`
- Modify: `apps/web/src/components/departments/DepartmentsHub.tsx`

- [ ] **Step 1: Add original artwork records**

Add all 16 newly supplied files as portfolio entries with meaningful alt text, concise captions, source `本部门投稿`, and `recordedAt: '2026-09-07'`; retain the four existing original works.

- [ ] **Step 2: Render record dates**

Display `2026年9月7日` on dated original work cards while leaving legacy cards valid without a date.

- [ ] **Step 3: Define dedicated hub covers**

Add a typed `hubCovers` property for original, COS, music, and dance. Use four new original posters and four existing real activity images for each of the other three departments.

- [ ] **Step 4: Render hub covers independently**

Make `DepartmentsHub` prefer `hubCovers` and fall back to the first four film covers for departments that intentionally retain the old catalog.

- [ ] **Step 5: Run focused department tests and confirm GREEN**

Run: `pnpm --filter @guild/web test -- --run src/test/department-media.test.tsx src/test/original-showcase.test.tsx`

Expected: PASS.

### Task 4: Full verification and visual acceptance

**Files:**
- Verify: `apps/web/src/**`
- Verify: `apps/web/public/assets/photos/**`

- [ ] **Step 1: Run full Web verification**

Run: `pnpm --filter @guild/web test -- --run`

Run: `pnpm --filter @guild/web typecheck`

Run: `pnpm --filter @guild/web build`

Expected: all commands exit 0 with no failed tests or TypeScript/build errors.

- [ ] **Step 2: Inspect asset integrity**

Verify every referenced image exists, confirm all 12 homepage sources are unique, and confirm the original material inventory includes all 16 new files.

- [ ] **Step 3: Browser-check desktop and mobile layouts**

Run the site locally, inspect the homepage and department index at desktop and mobile widths, exercise the carousel controls, and inspect the original-department page for dated content and broken images.

- [ ] **Step 4: Review the final diff**

Confirm only the requested media behavior, tests, styles, and plan changed; preserve all unrelated user-owned working-tree files.
