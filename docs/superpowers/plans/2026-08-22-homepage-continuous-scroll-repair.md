# Homepage Continuous Scroll Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overlapping sticky chapter switcher with three independently positioned vertical sections that reveal their own content as the visitor scrolls down.

**Architecture:** `GuildScrollStory` remains the semantic owner of the three chapters, but no chapter shares an absolute-positioned stage. Each `motion.article` participates in normal document flow and uses `whileInView` for a local entrance; CSS gives every section an isolated editorial composition and clips decorative elements inside that section only.

**Tech Stack:** React 19, TypeScript, Framer Motion, CSS, Vitest, Testing Library, Playwright.

---

### Task 1: Lock the continuous-flow contract

**Files:**
- Modify: `apps/web/src/test/home-scroll-story.test.tsx`

- [ ] **Step 1: Add a failing structure test**

Require `data-scroll-layout="continuous"`, three ordered `data-scroll-section` articles, and the absence of the old `.scroll-story-sticky` stage.

- [ ] **Step 2: Verify RED**

Run `pnpm --filter @guild/web exec vitest run src/test/home-scroll-story.test.tsx --maxWorkers=1 --minWorkers=1`.

Expected: failure because the current component still reports a shared three-chapter switcher and renders `.scroll-story-sticky`.

### Task 2: Replace the shared progress switcher

**Files:**
- Modify: `apps/web/src/components/home/GuildScrollStory.tsx`

- [ ] **Step 1: Remove shared scroll transforms**

Delete `useScroll`, `useTransform`, the shared sticky wrapper, and progress-opacity mappings.

- [ ] **Step 2: Add local viewport reveals**

Give each article an ordered section id and `initial`, `whileInView`, `viewport`, and `transition` values. Preserve reduced-motion behavior by rendering visible, unshifted sections.

- [ ] **Step 3: Verify GREEN**

Run the focused Vitest command and confirm the continuous-flow contract passes.

### Task 3: Recompose all three sections

**Files:**
- Modify: `apps/web/src/home-scroll-story.css`

- [ ] **Step 1: Establish normal-flow section geometry**

Make the story height automatic; make every article relative, isolated, and at least one viewport tall; add section dividers and alternating backgrounds.

- [ ] **Step 2: Refine each composition**

Keep the origin year behind its text without collision, bound the mascot to the image card, turn the department collage into a clean editorial grid, and place the final two slogans in separate bordered type panels.

- [ ] **Step 3: Preserve responsive and reduced-motion behavior**

Stack media above copy on narrow screens, keep all type within the viewport, and disable entrance/orbit motion when requested.

### Task 4: Prove downward scrolling and no overlap

**Files:**
- Modify: `e2e/home-scroll-story.spec.ts`
- Update: `artifacts/qa/home-scroll-story-1440x900.png`
- Update: `artifacts/qa/home-scroll-story-mobile-390x844.png`

- [ ] **Step 1: Assert distinct vertical coordinates**

Verify the three section bounding boxes increase in document order, use non-absolute positioning, and do not overlap.

- [ ] **Step 2: Scroll each section into view**

Capture chapter 1, chapter 2, chapter 3, and mobile evidence after actual downward scrolling; click both retained route links.

- [ ] **Step 3: Run final verification**

Run all web tests with one worker, typecheck, lint, production build, and the focused Playwright case.
