# Homepage Scroll Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing pixel-art homepage into a high-impact, scroll-led club introduction inspired by Moonshot's editorial pacing while preserving the site's own visual identity and functional routes.

**Architecture:** Keep the existing interactive hero and data-driven entry grid. Add one isolated sticky scroll-story component between them, driven by Framer Motion scroll progress and composed from existing local department artwork; adjust the hero copy to establish the supplied “WE ARE / 创作型社团” message. A dedicated stylesheet owns the new presentation, responsive layout, and reduced-motion fallback.

**Tech Stack:** React 19, TypeScript, Framer Motion, React Router, Vitest, Testing Library, Playwright, CSS.

---

### Task 1: Lock the new homepage narrative contract

**Files:**
- Create: `apps/web/src/test/home-scroll-story.test.tsx`

- [ ] **Step 1: Write the failing component test**

Assert the story exposes the supplied origin copy, three labelled chapters, six department labels, and working links to the history and departments routes.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @guild/web test -- home-scroll-story.test.tsx`

Expected: FAIL because `GuildScrollStory` does not exist.

### Task 2: Build the sticky editorial scroll story

**Files:**
- Create: `apps/web/src/components/home/GuildScrollStory.tsx`
- Create: `apps/web/src/home-scroll-story.css`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/components/home/HomePage.tsx`

- [ ] **Step 1: Implement the component**

Create a sticky, three-chapter narrative using `useScroll`, `useTransform`, and local pixel/department images. Keep semantic headings and meaningful links.

- [ ] **Step 2: Implement the visual system**

Add oversized outlined type, image masks, collage depth, scroll progress, responsive stacking, and a `prefers-reduced-motion` fallback.

- [ ] **Step 3: Run the focused test**

Run: `pnpm --filter @guild/web test -- home-scroll-story.test.tsx`

Expected: PASS.

### Task 3: Retune the opening statement

**Files:**
- Modify: `apps/web/src/components/home/GuildHero.tsx`
- Modify: `apps/web/src/home-scroll-story.css`

- [ ] **Step 1: Replace the hero brand statement**

Use “WE ARE / 创作型社团 / 自由度高 · 综合性强” as the opening hierarchy while retaining both functional calls to action.

- [ ] **Step 2: Verify homepage tests**

Run: `pnpm --filter @guild/web test -- home-scroll-story.test.tsx app.test.tsx`

Expected: PASS.

### Task 4: Visual and interaction acceptance

**Files:**
- Modify if needed: `apps/web/src/home-scroll-story.css`
- Create: `artifacts/qa/home-scroll-story-1440x900.png`
- Create: `artifacts/qa/home-scroll-story-mobile-390x844.png`

- [ ] **Step 1: Run typecheck and production build**

Run: `pnpm --filter @guild/web typecheck` and `pnpm --filter @guild/web build`.

- [ ] **Step 2: Run browser acceptance**

Verify the homepage at desktop and mobile sizes, scroll across all three chapters, click the story routes, inspect console errors, and capture screenshots.

- [ ] **Step 3: Run focused E2E**

Run the homepage-related Playwright case after confirming the local API and web server are healthy.
