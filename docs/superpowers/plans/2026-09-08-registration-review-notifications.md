# Registration Review Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新用户提交注册请求后，社长与副社长在管理台看到待办红点，并在公会通讯收到不含敏感信息的系统提醒。

**Architecture:** 沿用现有 SQLite 会话、参与者和消息表，为每位社长或副社长创建一条与停用内部账号“注册审核助手”的私有系统会话。管理台继续从 `/api/admin/dashboard` 轮询聚合数字，待注册数在批准或拒绝后自然归零。

**Tech Stack:** Fastify、SQLite/better-sqlite3、React、TanStack Query、Vitest、Testing Library。

---

### Task 1: 注册提交产生管理待办和通讯提醒

**Files:**
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/api.integration.test.ts`

- [ ] **Step 1: Write the failing integration assertions**

在现有访客注册测试中断言：提交后 `pendingRegistrations` 增加；社长和副社长都能看到“注册审核助手”未读私聊；普通成员看不到；消息正文只包含注册用户名和审核入口提示。

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @guild/api exec vitest run test/api.integration.test.ts -t "lets guests request accounts"`

Expected: FAIL，因为 dashboard 尚无 `pendingRegistrations`，也没有系统提醒会话。

- [ ] **Step 3: Implement the transactional notification**

注册请求写入事务同时：创建内部停用系统账号、为每个有效社长/副社长创建私有提醒会话、写入系统消息并更新会话时间。Dashboard 返回 `registration_requests.status='PENDING'` 的计数。

- [ ] **Step 4: Run the focused API test**

Run: `pnpm --filter @guild/api exec vitest run test/api.integration.test.ts -t "lets guests request accounts"`

Expected: PASS。

### Task 2: 管理台顶部红点与首页待办卡片

**Files:**
- Modify: `apps/web/src/layouts.tsx`
- Modify: `apps/web/src/pages-admin.tsx`
- Modify: `apps/web/src/guild-polish.css`
- Test: `apps/web/src/test/app.test.tsx`

- [ ] **Step 1: Write the failing UI test**

以社长身份打开 `/admin`，模拟 dashboard 返回两个待注册请求，断言顶部存在“2 个待审核注册”入口醒和“待审注册”统计卡，并都指向招新管理语义。

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @guild/web exec vitest run src/test/app.test.tsx -t "highlights pending registrations"`

Expected: FAIL，因为管理台尚未渲染注册红点和统计卡。

- [ ] **Step 3: Implement polling and presentation**

社长层管理台布局每 15 秒读取 dashboard；待注册大于零时在顶部显示带红点的招新管理链接。数据总览增加“待审注册”卡片，并在管理提醒中提供进入招新管理的链接。

- [ ] **Step 4: Run focused and full verification**

Run: `pnpm --filter @guild/web exec vitest run src/test/app.test.tsx -t "highlights pending registrations"`

Run: `pnpm --filter @guild/api test`

Run: `pnpm --filter @guild/web test`

Run: `pnpm --filter @guild/web typecheck && pnpm --filter @guild/web lint && pnpm build`

Expected: 全部退出码为 0。

### Self-review

- [x] 覆盖提交提醒、社长和副社长可见、普通成员隔离、管理台红点、待办数字、审核后数字自然消除。
- [x] 不在通知里泄露密码哈希、密码或联系方式。
- [x] 不新增外部通知依赖，不改变部长/副部长权限。
