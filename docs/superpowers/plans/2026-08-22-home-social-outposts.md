# Homepage Social Outposts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a high-design homepage section introducing the club's Bilibili and WeChat publicity channels with playable video previews, article cards, and direct external links.

**Architecture:** Create a homepage-only component that reads the existing reviewed `departmentMediaBySlug` and `officialSocialLinks` snapshots without modifying department media behavior. Video cover buttons open an accessible modal using the official Bilibili player URL, while dedicated anchors open the original Bilibili video or WeChat article in a new tab.

**Tech Stack:** React 19, TypeScript, Framer Motion, Lucide, CSS, Vitest, Testing Library, Playwright.

---

### Task 1: Specify homepage publicity behavior

**Files:**
- Create: `apps/web/src/test/home-social-outposts.test.tsx`

- [ ] **Step 1: Write the failing rendering test**

Render `HomeSocialOutposts` in `MemoryRouter` and assert:

```tsx
expect(screen.getByRole('region', { name: '社团宣传阵地' })).toBeInTheDocument();
expect(screen.getByRole('link', { name: '访问佐佑动漫社哔哩哔哩主页' })).toHaveAttribute('href', officialSocialLinks.bilibili);
expect(screen.getAllByRole('button', { name: /预览视频/ })).toHaveLength(2);
expect(screen.getAllByRole('link', { name: /在哔哩哔哩打开/ })).toHaveLength(2);
expect(screen.getAllByRole('link', { name: /在微信公众号阅读/ })).toHaveLength(3);
```

- [ ] **Step 2: Write the failing interaction test**

Click the first preview button and require a dialog with an iframe URL of:

```text
https://player.bilibili.com/player.html?bvid=<BVID>&autoplay=0
```

Then close the dialog and assert it is removed.

- [ ] **Step 3: Verify RED**

Run: `pnpm --filter @guild/web exec vitest run src/test/home-social-outposts.test.tsx --maxWorkers=1 --minWorkers=1`

Expected: FAIL because `HomeSocialOutposts` does not exist.

### Task 2: Implement the homepage section

**Files:**
- Create: `apps/web/src/components/home/HomeSocialOutposts.tsx`
- Create: `apps/web/src/home-social-outposts.css`
- Modify: `apps/web/src/components/home/HomePage.tsx`
- Modify: `apps/web/src/main.tsx`

- [ ] **Step 1: Build the Bilibili cards**

Select the newest reviewed dance and music videos. Each card must show its real cover, date, duration, title, preview button, and direct video anchor; the section header links to `officialSocialLinks.bilibili`.

- [ ] **Step 2: Build the official-player preview dialog**

Use component state for the selected video, an iframe with `title`, `allowFullScreen`, and the official player URL, an explicit close button, Escape handling, and body-scroll restoration.

- [ ] **Step 3: Build the WeChat article cards**

Render the three newest reviewed publicity articles with cover, date, title, and direct `mp.weixin.qq.com` anchors. Use the latest article as the channel entry link because WeChat does not expose a stable public account-profile URL.

- [ ] **Step 4: Add high-pixel responsive styling**

Create two visually distinct signal lanes using Bilibili pink and WeChat green, editorial cover crops, pixel borders, hover/focus states, a responsive single-column layout, and a mobile-safe modal.

- [ ] **Step 5: Verify GREEN**

Run the focused Vitest command from Task 1. Expected: both tests PASS.

### Task 3: Verify actual browser behavior

**Files:**
- Create: `e2e/home-social-outposts.spec.ts`
- Create: `artifacts/qa/home-social-outposts-1440x900.png`
- Create: `artifacts/qa/home-social-outposts-mobile-390x844.png`

- [ ] **Step 1: Test preview and direct links**

Open the homepage, scroll the publicity section into view, click one preview card, assert the iframe uses `player.bilibili.com`, close it, and assert Bilibili/WeChat anchors have the reviewed destinations.

- [ ] **Step 2: Verify desktop and mobile composition**

At 1440x900 and 390x844, assert no horizontal overflow and capture the section screenshots.

- [ ] **Step 3: Run full regression**

Run full web Vitest sequentially with one worker, typecheck, lint, production build, focused Playwright, and `git diff --check`.
