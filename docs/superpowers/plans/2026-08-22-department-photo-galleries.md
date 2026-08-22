# Department Photo Galleries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the technical department's placeholder imagery with supplied real photos and add an accessible photo gallery/slider to all six department pages, using approved annual-summary photos as temporary fallbacks.

**Architecture:** A typed photo catalog owns image paths, captions, and source labels for each department. A shared `DepartmentPhotoGallery` renders a compact editorial grid for small sets and a controlled carousel for larger sets; `ClosingPanel` mounts it consistently on every department page. The technical showcase reuses the same supplied-photo catalog for its hero and contact sheet, while publicity keeps its anime-appreciation presentation and adds real club records below it.

**Tech Stack:** React 19, TypeScript, Framer Motion, Vitest, Testing Library, CSS scroll-snap.

---

### Task 1: Lock the content contract with failing tests

**Files:**
- Modify: `apps/web/src/test/department-media.test.tsx`
- Create: `apps/web/src/components/departments/department-photos.ts`
- Create: `apps/web/src/components/departments/DepartmentPhotoGallery.tsx`

- [ ] **Step 1: Write the failing catalog test**

Assert that all six slugs exist, technical department uses the supplied `/assets/photos/departments/tech/` images, and publicity copy explicitly mentions anime appreciation.

- [ ] **Step 2: Write the failing interaction test**

Render the technical gallery, assert it is a carousel, click next/previous/thumbnail controls, and verify the active caption and counter change.

- [ ] **Step 3: Run the focused test and verify RED**

Run: `pnpm --filter @guild/web exec vitest run src/test/department-media.test.tsx --maxWorkers=1 --minWorkers=1`

Expected: FAIL because the catalog and gallery component do not exist.

### Task 2: Import approved fallback assets and implement the catalog

**Files:**
- Create: `apps/web/public/assets/photos/shared/*.jpg`
- Create: `apps/web/src/components/departments/department-photos.ts`
- Modify: `apps/web/src/components/departments/showcase-data.ts`

- [ ] **Step 1: Copy selected annual-summary photos with stable public filenames**

Copy only the selected group, activity, screening, collaboration, and stage photos from `D:/codeC/python/zuoyou/output/assets`; do not modify the source project.

- [ ] **Step 2: Define the six-department photo catalog**

Use all suitable supplied technical photos and 3–4 shared fallback photos for departments without local submissions. Every entry must have meaningful `alt` and `caption` text.

- [ ] **Step 3: Replace technical placeholder film entries**

Build the technical hero/contact-sheet entries from the supplied real photos and replace the introduction with the user-provided responsibilities: video production, photography, prop making, PR/AE workshops, anniversary backstage control, and project production.

### Task 3: Implement the responsive gallery and carousel

**Files:**
- Create: `apps/web/src/components/departments/DepartmentPhotoGallery.tsx`
- Modify: `apps/web/src/components/departments/DeptShowcasePage.tsx`
- Modify: `apps/web/src/departments.css`

- [ ] **Step 1: Implement the small-set editorial grid**

Render four or fewer photos as an asymmetric grid with lazy-loaded images, visible captions, and department accent styling.

- [ ] **Step 2: Implement the large-set carousel**

Render more than six photos with previous/next controls, counter, keyboard-accessible thumbnail buttons, CSS scroll-snap thumbnails, and reduced-motion-safe transitions.

- [ ] **Step 3: Mount the gallery on all six detail pages**

Insert it before the existing social-media shelf and responsibilities panel without changing public routing.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm --filter @guild/web exec vitest run src/test/department-media.test.tsx --maxWorkers=1 --minWorkers=1`

Expected: all department-media tests pass.

### Task 4: Regression and visual verification

**Files:**
- Verify: `apps/web/src/components/departments/**`
- Verify: `apps/web/src/departments.css`

- [ ] **Step 1: Run web typecheck and full unit tests**

Run: `pnpm --filter @guild/web typecheck`

Run: `pnpm --filter @guild/web exec vitest run --maxWorkers=1 --minWorkers=1`

- [ ] **Step 2: Run production build**

Run: `pnpm --filter @guild/web build`

- [ ] **Step 3: Start locally and inspect desktop/mobile**

Verify `/departments/tech` carousel controls and real imagery, `/departments/publicity` anime-appreciation wording and retained anime design, another fallback department gallery, and responsive behavior at desktop and mobile widths.
