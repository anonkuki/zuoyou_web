# Homepage Freedom Chapter Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visually empty third homepage chapter with a balanced editorial composition built from real club artwork, concise principles, and a clear department call to action.

**Architecture:** Keep the existing continuous document-flow chapter and route behavior. Change only the freedom chapter's semantic composition and its scoped CSS: a compact manifesto on the left and an artwork-led collage on the right, with the two principles rendered as supporting labels instead of oversized cards.

**Tech Stack:** React, TypeScript, Framer Motion, CSS, Vitest, Testing Library, Playwright.

---

### Task 1: Lock the new freedom chapter structure

**Files:**
- Modify: `apps/web/src/test/home-scroll-story.test.tsx`
- Test: `apps/web/src/test/home-scroll-story.test.tsx`

- [ ] **Step 1: Write the failing test**

Add assertions that the freedom chapter exposes a `创作作品拼贴` region with three artwork images, retains `自由度高` and `综合性强`, and keeps the department link.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @guild/web exec vitest run src/test/home-scroll-story.test.tsx --maxWorkers=1 --minWorkers=1`

Expected: FAIL because the existing chapter has no artwork collage.

### Task 2: Build the artwork-led composition

**Files:**
- Modify: `apps/web/src/components/home/GuildScrollStory.tsx`
- Modify: `apps/web/src/home-scroll-story.css`

- [ ] **Step 1: Replace the two oversized word cards**

Use one panoramic hero artwork, two supporting artwork crops, a small mascot sticker, and two compact principle labels. Keep image alt text, reduced-motion behavior, and `/departments` navigation.

- [ ] **Step 2: Rebalance typography and spacing**

Constrain the manifesto to a readable two-to-three-line desktop title, strengthen the visual focal point, remove the clipped orbit, and provide one-column mobile layout without overflow.

- [ ] **Step 3: Run the focused test**

Run: `pnpm --filter @guild/web exec vitest run src/test/home-scroll-story.test.tsx --maxWorkers=1 --minWorkers=1`

Expected: PASS.

### Task 3: Browser and engineering verification

**Files:**
- Modify: `e2e/home-scroll-story.spec.ts`
- Update: `artifacts/qa/home-scroll-freedom-1440x900.png`
- Create: `artifacts/qa/home-scroll-freedom-mobile-390x844.png`

- [ ] **Step 1: Verify desktop and mobile composition**

Run the focused Playwright story test and capture the freedom chapter at 1440x900 and 390x844. Verify no horizontal overflow, all images are loaded, the heading is in the viewport, and the department link navigates.

- [ ] **Step 2: Run regression checks sequentially**

Run full Vitest, typecheck, lint, build, and `git diff --check`. Expected: zero failures; existing Vite chunk-size warnings may remain informational.
