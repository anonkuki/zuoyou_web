# Luminous Pixel Valley Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark, heavy homepage art direction with an original luminous pixel-valley guild scene inspired by atmospheric pixel-game composition without copying protected game artwork.

**Architecture:** Move the hero illustration into a focused `LuminousGuildScene` component built only from SVG and CSS layers. Keep routing, live data, business interactions, and existing semantic components unchanged; load a final homepage art-direction stylesheet after the shared system so the visual overhaul remains isolated and reversible.

**Tech Stack:** React 19, TypeScript, SVG, CSS, Framer Motion, Vitest, Testing Library, Playwright.

---

### Task 1: Lock the new scene contract

**Files:**
- Modify: `apps/web/src/test/app.test.tsx`
- Test: `apps/web/src/test/app.test.tsx`

- [ ] **Step 1: Write the failing layer test**

Assert that the hero contains exactly the ordered layers `sky-light`, `cloudscape`, `far-mountains`, `valley`, `guild-lodge`, `foreground-garden`, `adventurer-party`; assert a `data-lighting="golden-hour"` pass, at least three cloud masses, at least 28 pixel details, four accessible characters, and no raster `<img>`.

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @guild/web test -- --run src/test/app.test.tsx`

Expected: FAIL because the existing scene still exposes `sky`, `distant-town`, `guild-building`, `architectural-lighting`, and `foreground`.

### Task 2: Build the luminous valley scene

**Files:**
- Create: `apps/web/src/components/home/LuminousGuildScene.tsx`
- Modify: `apps/web/src/components/home/GuildHero.tsx`

- [ ] **Step 1: Implement the SVG scene**

Create a 1600×760 composition with a teal-to-aqua sky, three cream/gold cloud masses, misted mountain silhouettes, a green valley and stream, a smaller timber-and-stone guild lodge on the right third, warm windows, a flowered foreground, and four original CSS pixel members. Every visual group receives the test contract attributes from Task 1.

- [ ] **Step 2: Keep the content hierarchy functional**

Retain the real heading, description, `/departments` and `/join` links, live guild HUD, accessible scene label, and Framer Motion entry behavior. Replace only the old scene implementation.

- [ ] **Step 3: Verify GREEN**

Run: `pnpm --filter @guild/web test -- --run src/test/app.test.tsx`

Expected: all web tests pass.

### Task 3: Apply the luminous homepage art system

**Files:**
- Modify: `apps/web/src/home-responsive.css`

- [ ] **Step 1: Redesign hero and navigation treatment**

Use translucent deep-teal navigation, soft cream typography, a left-aligned editorial hero panel with reduced outlines, warm cream/green calls to action, subtle bloom, moving clouds, rays, mist, particles, and `prefers-reduced-motion` fallbacks.

- [ ] **Step 2: Redesign HUD and content modules**

Replace black RPG slabs with parchment-glass panels, forest/sky colors, thin bronze edges, softer shadows, landscape card art, and a garden notice board. Preserve every link and button.

- [ ] **Step 3: Preserve responsive proportions**

Keep the established maximum page heights: desktop at most 1160px and 390px mobile at most 2000px; maintain landscape card ratios and the 768px same-row card/footer assertions.

### Task 4: Visual and functional verification

**Files:**
- Modify: `e2e/guild.spec.ts` only if the new visual contract requires additional stable assertions
- Refresh: `artifacts/qa/home-1440x900.png`
- Refresh: `artifacts/qa/home-768x1024.png`
- Refresh: `artifacts/qa/home-390x844.png`

- [ ] **Step 1: Run the homepage Playwright test**

Run: `pnpm exec playwright test e2e/guild.spec.ts --grep "游客端所有页面可访问且三种尺寸视觉完整"`

Expected: PASS with no console errors, overflow, blank regions, or broken routes.

- [ ] **Step 2: Inspect all three screenshots**

Check focal hierarchy, cloud/lighting balance, readable copy, lodge scale, HUD overlap, card consistency, mobile cropping, and reduced-motion compatibility.

- [ ] **Step 3: Run full quality gates**

Run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

Expected: all commands exit 0; 46 or more unit/API tests and all four E2E flows pass.

- [ ] **Step 4: Commit and push**

Stage only implementation, tests, plan, and QA evidence; keep `prd.txt` untracked. Commit with `重绘晨光山谷像素公会首页` and push `feature/adventurer-guild`.
