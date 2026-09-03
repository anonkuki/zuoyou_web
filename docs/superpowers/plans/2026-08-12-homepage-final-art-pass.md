# Homepage Final Art Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the official Sayuu logo and mascot into the homepage, add game-like character dialogue, improve pixel-character presentation, and replace overdramatic copy with warm fantasy-flavoured Chinese.

**Architecture:** Keep the existing layered guild scene and parallax hook intact. Add deterministic, non-AI processed brand assets under the public asset tree, introduce a focused `MascotGuide` interaction component, and connect scene characters to it through accessible buttons. Put the final visual overrides in a dedicated CSS file loaded last so the previous responsive system remains recoverable.

**Tech Stack:** React 19, TypeScript, Framer Motion, Vitest/Testing Library, Playwright, CSS, PowerShell System.Drawing for deterministic transparent crop and nearest-neighbour pixel processing.

---

### Task 1: Define the mascot interaction contract

**Files:**
- Create: `apps/web/src/components/home/MascotGuide.test.tsx`
- Create: `apps/web/src/components/home/MascotGuide.tsx`

- [ ] Write a failing test asserting that Youzi introduces herself, cycles dialogue, closes, reopens, and exposes a real join link.
- [ ] Run `pnpm --filter @guild/web test -- MascotGuide.test.tsx` and confirm failure because the component is absent.
- [ ] Implement the smallest accessible dialogue component that satisfies the interaction contract.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Produce approved non-AI brand assets

**Files:**
- Create: `scripts/process-brand-assets.ps1`
- Create: `apps/web/public/assets/brand/youzi-mascot.png`
- Create: `apps/web/public/assets/brand/zuoyou-logo-pixel.png`
- Create: `apps/web/public/assets/brand/README.md`

- [ ] Read the source PNG alpha bounds from `data/uploads`.
- [ ] Crop transparent padding, reduce the logo to a restrained indexed-looking colour range, resize with nearest-neighbour sampling, and preserve alpha.
- [ ] Keep the mascot's authored pixels intact while cropping and exporting a web-sized transparent copy.
- [ ] Record that both assets are club-provided and processed deterministically without generative imagery.

### Task 3: Integrate branding and character dialogue

**Files:**
- Modify: `apps/web/src/components/home/PixelNavbar.tsx`
- Modify: `apps/web/src/components/home/GuildHero.tsx`
- Modify: `apps/web/src/components/home/LuminousGuildScene.tsx`
- Modify: `apps/web/src/components/home/HomePage.tsx`
- Modify: `apps/web/src/components/home/AdventureCard.tsx`
- Modify: `apps/web/src/components/home/NoticeBoard.tsx`
- Modify: `apps/web/src/components/home/PixelFooter.tsx`
- Modify: `apps/web/src/components/home/GuildStats.tsx`

- [ ] Replace the generic crest in the public navigation and lodge banner with the processed official mark.
- [ ] Mount Youzi as the homepage guide and make each foreground character select a natural dialogue line.
- [ ] Add character nameplates and department roles without turning the site into a combat game.
- [ ] Rewrite homepage copy to sound welcoming, practical, and lightly fantastical.
- [ ] Preserve every existing route and button destination.

### Task 4: Final responsive art direction

**Files:**
- Create: `apps/web/src/home-final-art.css`
- Modify: `apps/web/src/main.tsx`
- Modify: `e2e/guild.spec.ts`

- [ ] Add final logo, banner, character, portrait-dialogue, hover, focus, and reduced-motion styling.
- [ ] Keep desktop cinematic width, use a two-row tablet composition, and avoid an excessively tall mobile hero.
- [ ] Add E2E assertions for official branding, mascot dialogue interaction, real navigation, and no horizontal overflow.
- [ ] Capture 1440x900, 768x1024, and 390x844 evidence and inspect all three.

### Task 5: Full verification

**Files:**
- Update only generated QA screenshots under `artifacts/qa` during evidence capture.

- [ ] Run focused unit tests.
- [ ] Run `pnpm lint` and `pnpm typecheck`.
- [ ] Run `pnpm test` and `pnpm build`.
- [ ] Run the homepage Playwright scenarios at all three viewports.
- [ ] Inspect browser console errors, image loading, dialogue controls, reduced-motion behavior, and route navigation.
