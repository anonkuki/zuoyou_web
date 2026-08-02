# 素材与许可证记录

## 自制视觉

- 首页像素幻想天空、城堡、公会大厅、火把、NPC、状态牌、RPG 卡片、Logo 与装饰均以项目内 HTML/CSS/SVG 代码原创实现。
- 未调用图片生成工具，未下载第三方背景图、角色图或商业图标包；仅新增开源中文像素字体文件。
- 设计稿还原阶段将首页拆分为天空、云朵、山脉、远景城镇、公会建筑、人物、HUD 与前景装饰八个独立代码图层，没有把设计稿或相似背景图作为网页背景。
- 素材目录已按 `background/character/ui/icon/decoration` 建立；本阶段仅登记代码绘制方案，后续加入开源素材时必须逐项补充作者、URL 与许可证。

## 受保护的社团照片

经用户授权，从只读关联项目 `D:\codeC\python\zuoyou` 复制三张社团照片到 API 私有种子目录。原项目未被修改，照片不会进入 `apps/web/public`，仅登录用户可经权限接口读取。

| 交付文件 | 只读来源 | SHA-256 |
| --- | --- | --- |
| `club-anniversary.jpg` | `output/assets/08d8b02bbd2303592f1fab59e95eb88d.jpg` | `4248EA73BAE47F9C163C5F01532DE262E312EAD36F2F978386BB61B62AD6C5E5` |
| `club-memory-01.jpg` | `output/assets/4ea847a6d09555d742583fae589fcae1.jpg` | `C8B32C5C664E30D45871FB70D31A84B88E79C6AD747A5F3CAD9585E40F13B958` |
| `club-memory-02.jpg` | `output/assets/923b507d771dc140b3f59c8b2e2d965a.jpg` | `83F64D90DB5D9D8C2B59A9C900EB7671731A2B79073B4439271655B212A5794F` |

## 第三方软件与字体

| 包/素材 | 用途 | 许可证 |
| --- | --- | --- |
| React、React DOM、React Router、TanStack Query、Framer Motion、Recharts、Vite、Tailwind CSS、Fastify、better-sqlite3、Zod | 应用运行与开发 | MIT |
| Lucide React | 界面图标 | ISC |
| Press Start 2P（Fontsource 分发） | 像素标题字体 | SIL Open Font License 1.1 |
| Fusion Pixel Font 12px 简体中文（TakWolf） | 首页中文像素字体；版本 2026.07.20；[项目主页](https://github.com/TakWolf/fusion-pixel-font) | SIL Open Font License 1.1；许可证随文件保存于 `apps/web/public/assets/font/LICENSE-OFL` |
| Drizzle ORM | 数据访问与迁移结构 | Apache-2.0 |

实际安装版本以 `pnpm-lock.yaml` 为准，许可证字段已从本地安装包清单核对。
