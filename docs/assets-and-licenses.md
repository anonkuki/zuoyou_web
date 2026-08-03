# 素材与许可证记录

## 自制视觉

- 页面没有调用 DALL-E、Midjourney、Stable Diffusion 或其他生成式图像工具。
- CSS 绘制天空渐变、草地、道路、景深暗角、光束、萤火颗粒、HUD、按钮、卡片道具和公告板；SVG 绘制公会统一纹章。
- Hero 没有使用单张完整背景图，而是把云层、远山、城堡剪影、五层森林、地面、建筑、人物、光雾分别定位与动画。

## 首页开源像素素材

| 素材 | 作者与来源 | 许可证 | 项目内用途与修改 |
| --- | --- | --- | --- |
| Pixel Gloomy Fantasy Tileset | Loota；[itch.io 原始页面](https://loota9.itch.io/pixel-fantasy-tileset) | CC0 1.0；原页面标记 No generative AI | Hero 云层、城堡剪影、五层森林、树木；仅重命名，并通过 CSS 调色、缩放和视差动画组合 |
| Sideview Fantasy Patreon Collection | ansimuz；[OpenGameArt 原始页面](https://opengameart.org/content/sideview-fantasy-patreon-collection) | CC0 1.0 | Hero 日照山体以及历史、活动入口卡片场景；裁切与 CSS 调色 |
| Medieval town | Keith Karnage；[OpenGameArt 原始页面](https://opengameart.org/content/medieval-town-0) | CC BY 3.0 | 公会建筑与职业大厅卡片；从公开瓦片和示例图中裁出建筑立面、招牌、窗、门等组件，并以 CSS 叠加公会旗帜 |
| 32x32 RPG Character Sprites | Eldiran；[OpenGameArt 原始页面](https://opengameart.org/content/32x32-rpg-character-sprites) | CC0 1.0 | 四名公会人物；裁取静态帧并将原始纯洋红背景转为透明 |

以上素材均为传统像素素材库资源；其中 Loota 页面明确声明未使用生成式 AI，其余资源发布于 2014–2019 年的 OpenGameArt 条目。项目保留作者署名，即使 CC0 项目不强制要求。

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
