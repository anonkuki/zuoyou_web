# Pixel Social Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished QQ-like member profile within the guild's pixel-art visual system, including avatar and cover uploads, an editable signature, a protected photo wall, and one-click direct chat from another member's page.

**Architecture:** Extend the existing member profile record with signature and cover storage fields, and add a dedicated `profile_photos` table for ordered member-only gallery images. Reuse the existing authenticated social repository and direct-conversation flow, keeping uploaded filenames out of storage paths and serving cover/gallery images through authorized API routes. Recompose the React profile page into a cover-led social card, a compact information deck, and responsive photo/works/activity sections.

**Tech Stack:** Fastify, SQLite/Drizzle migrations, Zod contracts, React, TanStack Query, TypeScript, CSS, Vitest/Testing Library.

---

### Task 1: Profile contract and persistence

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Create: `apps/api/drizzle/0024_social_profile_gallery.sql`
- Modify: `apps/api/src/schema.ts`
- Modify: `apps/api/src/social.ts`
- Test: `packages/contracts/test/contracts.test.ts`
- Test: `apps/api/test/api.integration.test.ts`

- [ ] Add failing contract assertions for a trimmed signature up to 120 characters and rejection beyond the limit.
- [ ] Run the focused contracts test and confirm it fails because `signature` is not accepted.
- [ ] Add optional `signature` to `memberProfileUpdateSchema`.
- [ ] Add migration fields `signature`, `profile_cover_storage_key`, and a `profile_photos` table with owner/time indexes.
- [ ] Extend the Drizzle schema and repository serialization so profiles expose `signature`, `coverUrl`, and ordered photo-wall items.
- [ ] Run focused contract tests and confirm they pass.

### Task 2: Protected cover and photo-wall API

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/social.ts`
- Test: `apps/api/test/api.integration.test.ts`

- [ ] Add failing API tests for cover upload, photo upload/list, gallery capacity, protected reads, ownership checks, deletion, and signature persistence.
- [ ] Run the focused API test and confirm it fails on missing routes/data.
- [ ] Add validated image upload helpers using UUID storage names, JPEG/PNG/WebP/GIF allow-list, and a 10 MB limit.
- [ ] Add authenticated cover and photo content routes that enforce profile visibility.
- [ ] Add owner-only photo deletion with file cleanup and audit entries.
- [ ] Run the focused API suite and confirm all cases pass.

### Task 3: QQ-inspired pixel social profile

**Files:**
- Modify: `apps/web/src/pages-social.tsx`
- Modify: `apps/web/src/social.css`
- Test: `apps/web/src/test/app.test.tsx`

- [ ] Add failing UI tests for cover, signature, photo-wall display, owner editing links, and another member's prominent `发消息` action.
- [ ] Run the focused test and confirm it fails because the new social layout is absent.
- [ ] Recompose `MemberHomepagePage` into a panoramic cover, overlapping avatar identity card, status/signature rows, social action bar, photo wall, works, and activity timeline.
- [ ] Keep direct-chat creation wired to `/api/member/conversations/direct` and route to the returned conversation.
- [ ] Add responsive pixel-frame styling at desktop, tablet, and narrow-mobile widths without copying QQ branding.
- [ ] Run the focused UI tests and confirm they pass.

### Task 4: Profile editor uploads and management

**Files:**
- Modify: `apps/web/src/pages-social.tsx`
- Modify: `apps/web/src/social.css`
- Test: `apps/web/src/test/app.test.tsx`

- [ ] Add failing UI tests for signature editing, cover upload, multi-photo upload, preview, and photo removal.
- [ ] Run the focused test and confirm it fails for the new controls.
- [ ] Add signature input, cover uploader, photo-wall uploader, upload progress/error feedback, and owner delete controls.
- [ ] Invalidate self-profile/member-homepage queries after successful changes.
- [ ] Run focused UI tests and confirm they pass.

### Task 5: Verification and release

**Files:**
- Modify only files required by fixes discovered during verification.

- [ ] Run lint, typecheck, contracts tests, API integration tests, constrained-worker Web tests, and production build.
- [ ] Start the local app and visually inspect `/portal/profile` and another member page at desktop and mobile widths.
- [ ] Check keyboard focus, empty states, upload errors, and reduced-motion behavior.
- [ ] Stage only intended source/tests/migration; exclude local plans, temporary previews, unused member-card assets, and account lists.
- [ ] Commit and push verified `main` to `origin/main`.
- [ ] Package the exact pushed commit, deploy to the scoped `C:\Services\zuoyou_web` release directory, and verify public health/version while leaving the server's default site untouched.
