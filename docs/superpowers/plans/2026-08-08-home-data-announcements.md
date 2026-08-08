# 首页数据与公会公告闭环实施计划

> 执行方式：在现有 `feature/adventurer-guild` 分支内按测试优先逐步实现，不读取或导入关联项目中的姓名、照片与个人答卷内容。

## 目标

将首页目前写死的公会状态栏和任务公告板改为数据库驱动，并增加管理员可维护的公告后台。开发阶段使用虚构种子数据；参考项目仅用于确认 82 人规模、六部门分类和活动内容主题。

## 数据与契约

- 在 `packages/contracts/src/index.ts` 增加公告分类、公告表单、首页摘要响应的 Zod 契约。
- 新增 `apps/api/drizzle/0004_announcements.sql`：公告包含标题、摘要、分类、站内链接、置顶、发布状态、发布时间和审计时间。
- 在 `apps/api/src/schema.ts` 注册公告表；在 `apps/api/src/database.ts` 应用迁移并写入虚构公告种子。
- 站点设置补充 `guildLevel`、`guildLevelCurrent`、`guildLevelTarget`、`honorCount`、`foundedYear`；成员数和完成活动数始终从业务表聚合。

## API 闭环

- 新增 `GET /api/public/home`，一次返回数据库聚合状态和公开公告，避免首页多次请求。
- 新增管理员公告接口：列表、创建、修改、发布/下架；所有写操作校验站内链接并记录审计日志。
- 部门负责人和普通成员不可维护全站公告；公开接口不返回未发布公告。

## 前端闭环

- `HomePage` 通过 TanStack Query 请求 `/api/public/home`，将数据传入 `GuildHero`、`GuildStats` 和 `NoticeBoard`。
- 保留当前像素场景与版式，新增不跳版的加载态、错误态和公告空状态。
- 新增 `AnnouncementsAdminPage`，提供创建、编辑、置顶、发布和下架操作；在后台导航与路由中只对管理员开放。
- 写操作成功后同时失效后台公告列表与首页查询，保证后台修改后游客端刷新即可看到。

## 测试顺序

1. 共享契约测试：公告分类、站内链接、首页数据边界。
2. API 集成测试：数据库聚合、未发布隔离、401/403、管理员创建与下架、审计记录。
3. React 测试：首页渲染接口返回值、公告后台提交及状态切换。
4. 完成实现后执行 lint、typecheck、全部单元/集成测试、生产构建与现有 Playwright 流程。

## 文档与交付

- 更新 `docs/acceptance-matrix.md` 与 `docs/home-stage1-acceptance.md`，明确首页数据来源与公告闭环证据。
- 保持 `prd.txt` 未跟踪且不进入提交。
- 验证通过后提交并推送到当前远端分支，更新现有 Draft PR。
