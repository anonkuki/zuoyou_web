# 佐佑动漫社 Adventurer Guild

面向真实动漫社团运营的全栈管理系统。界面用 DND/RPG 冒险公会与像素动漫风格包装社团业务，但不包含战斗、抽卡、货币等游戏系统。

## 功能范围

- 游客端：公会大厅、编年史、六部门与详情、活动档案与详情、作品图鉴、分步招新申请、进度查询、激活与登录。
- 成员中心：可配置个人主页、成员名录与隐私、部门频道/一对一聊天、未读与回复，以及活动、作品、任务、贡献和内部文件。
- 负责人后台：本部门成员、活动全生命周期、作品审核、任务指派/确认、分级文件管理。
- 管理员后台：数据总览、成员与负责人维护、部门、历史、招新、作品、文件、统计报表、系统设置与审计日志。
- 业务闭环：申请→审批→激活→登录；筹备→报名→签到→成果→归档；上传→审核→发布；指派→完成→确认贡献；上传→分类/授权→预览/下载→回收/恢复。

## 技术架构

pnpm Workspace，包含 React 19 + TypeScript + Vite + Tailwind CSS 4 前端、Fastify + Drizzle ORM + SQLite API，以及 `packages/contracts` 共享校验契约。生产模式由 Fastify 同源托管构建后的网页和 `/api`。

## 本机开发

Node.js 24 与 pnpm 11 已用于本项目验证。依赖缓存建议放到 D 盘：

```powershell
$env:PNPM_HOME='D:\Caches\pnpm-home'
$env:PNPM_STORE_DIR='D:\Caches\pnpm-store'
corepack pnpm install
corepack pnpm dev
```

浏览器访问 `http://127.0.0.1:5173`，API 健康检查为 `http://127.0.0.1:3100/api/health`。首次启动会创建数据库并写入 84 名虚构成员与完整演示数据。每个账号会获得唯一的五位数字 UID，可在成员名录和管理任命等账号检索场景中使用。

开发演示账号：

| 身份 | 用户名 | 密码 |
| --- | --- | --- |
| 社长 | `admin` | `DemoAdmin!2026` |
| 副社长 | `vice.president` | `DemoVice!2026` |
| 副社长 2-5 | `vice.president2` ～ `vice.president5` | `DemoVice2!2026` ～ `DemoVice5!2026` |
| COS部部长 | `cos.lead` | `DemoLead!2026` |
| COS部副部长 | `cos.deputy` | `DemoDeputy!2026` |
| COS部副部长 2-5 | `cos.deputy2` ～ `cos.deputy5` | `DemoDeputy2!2026` ～ `DemoDeputy5!2026` |
| 技术部部长 | `tech.lead` | `DemoLead!2026` |
| 技术部副部长 | `tech.deputy` | `DemoDeputy!2026` |
| 技术部副部长 2-5 | `tech.deputy2` ～ `tech.deputy5` | `DemoDeputy2!2026` ～ `DemoDeputy5!2026` |
| 轻音部部长 | `music.lead` | `DemoLead!2026` |
| 轻音部副部长 | `music.deputy` | `DemoDeputy!2026` |
| 轻音部副部长 2-5 | `music.deputy2` ～ `music.deputy5` | `DemoDeputy2!2026` ～ `DemoDeputy5!2026` |
| 原创部部长 | `original.lead` | `DemoLead!2026` |
| 原创部副部长 | `original.deputy` | `DemoDeputy!2026` |
| 原创部副部长 2-5 | `original.deputy2` ～ `original.deputy5` | `DemoDeputy2!2026` ～ `DemoDeputy5!2026` |
| 舞装部部长 | `dance.lead` | `DemoLead!2026` |
| 舞装部副部长 | `dance.deputy` | `DemoDeputy!2026` |
| 舞装部副部长 2-5 | `dance.deputy2` ～ `dance.deputy5` | `DemoDeputy2!2026` ～ `DemoDeputy5!2026` |
| 外宣&幻想研部长 | `publicity.lead` | `DemoLead!2026` |
| 外宣&幻想研副部长 | `publicity.deputy` | `DemoDeputy!2026` |
| 外宣&幻想研副部长 2-5 | `publicity.deputy2` ～ `publicity.deputy5` | `DemoDeputy2!2026` ～ `DemoDeputy5!2026` |
| 普通成员 | `cos.member` | `DemoMember!2026` |

演示凭据只在开发种子中存在。生产模式要求至少 24 字符的 `SESSION_SECRET` 和非占位、至少 12 字符的 `ADMIN_PASSWORD`，并拒绝复用开发种子数据库。

## 质量门禁

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
$env:PLAYWRIGHT_BROWSERS_PATH='D:\Caches\ms-playwright'
corepack pnpm test:e2e
```

Playwright 使用独立的 `D:\Temp\zuoyou-dndweb-e2e-runtime` 数据库与上传目录，每轮自动重建，不污染开发数据。测试证据见 [验收矩阵](docs/acceptance-matrix.md) 和 [QA 证据](artifacts/qa/README.md)。

## 生产与 Docker

复制 `.env.example` 并设置真实密钥。本机生产构建：

```powershell
corepack pnpm build
$env:NODE_ENV='production'
$env:SESSION_SECRET='replace-with-at-least-24-random-characters'
$env:ADMIN_PASSWORD='replace-with-a-strong-initial-password'
corepack pnpm start
```

Docker 环境可执行 `docker compose up --build -d`。`compose.yml` 将 SQLite 与上传目录持久化到命名卷，并配置健康检查；当前交付电脑未安装 Docker，因此容器启动不属于本机已执行验证边界。

## 数据与安全

- 数据库存储 UTC ISO-8601，界面按 Asia/Shanghai 显示。
- 会话 Cookie 为 HttpOnly、SameSite=Strict，生产环境启用 Secure。
- 激活码只存哈希，七天过期且使用后立即失效；进度链接使用不可猜测随机令牌。
- 上传采用随机 UUID 存储键，校验图片 10MB、文档 30MB、视频 200MB 上限。
- 真人照片仅导入受保护文件区，不位于前端静态目录；游客无法读取。
- 成员采用停用/恢复，文件采用回收站/恢复，关键操作进入审计日志。
- 个人主页只对登录成员开放，并支持仅自己与管理员可见；聊天会话按参与者或所属部门授权，消息编辑与撤回仅限发送者。
- 聊天采用两秒增量轮询实现同源近实时同步，无需外部消息中间件；消息、已读位置和未读计数均持久化到 SQLite。

第三方与素材来源见 [素材与许可证](docs/assets-and-licenses.md)。
