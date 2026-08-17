# 职业大厅 · 六部门沉浸式展示设计规范

> 版本：v1 · 2026-08-15
> 基准：动效水准对齐 careers.kimi.com / Awwwards 级滚动叙事；运动语言参考 MengTo/kage（章节化滚动、逐词显现、视差、模糊+淡出的章节交接、reduced-motion 完整可读）。
> 约束：全站像素 RPG 基调不破——每个主题内保留像素元素（像素字体标签、8px 阶梯描边、像素 sprite 点缀、`image-rendering: pixelated`）。

## 一、信息架构

- `/departments`（职业大厅）：保留统一 `PageHero`（`data-visual="guild-page-v2"` + 星座/章节标记），下方改为**章节式滚动索引**：每个部门一个全宽编辑式章节卡（保留 `.department-grid` 容器与 `.department-card` 类名以兼容 E2E），含主题微型视觉、超大标题、封面预览条、「进入驻地」链接。
- `/departments/:slug`：每部门一个**独立美术指导的沉浸式详情页**。数据仍来自 `/api/public/departments/:slug`（名称、职业称号、描述、成员数），设计层内容按 slug 从 `showcase-data.ts` 合并。
- 图片素材：`apps/web/public/assets/departments/<slug>/`（AniList 爬取的番剧封面+横幅 + manifest.json），前端运行时 fetch manifest 或使用内嵌清单。主题片单：
  - publicity 外宣部：链锯人/蓦然回首/铃芽之旅/巨人/鬼灭/咒术/间谍/芙莉莲/君名/千寻/海贼/紫罗兰（12 部）
  - tech 技术部：玉响/多田君/Just Because!/声之形/天气之子/言叶之庭/秒五/紫罗兰（8 部）
  - original 原创部：蓝色时期/月刊少女/白箱/蜂蜜与四叶草/樱花庄/别对映像研出手（6 部）
  - dance 舞装部：舞动青春/Love Live!/佐贺偶像/冰上的尤里/偶像大师/吹响吧上低音号（6 部）
  - cos COS部：更衣人偶/2.5次元的诱惑/我太受欢迎了/宅男腐女/齐木楠雄/水果篮子（6 部）
  - music 轻音部：K-ON!/孤独摇滚/BanG Dream!/Given/四月是你的谎言/卡罗尔与星期二（6 部）

## 二、全局运动语言（所有页面共享）

1. 章节进入：标题**逐词显现**（y+blur+opacity，stagger 60ms），支持元素依次淡入。
2. 滚动驱动：framer-motion `useScroll`/`useTransform`/`useSpring` 做视差与进度；章节交接用「淡出+轻微模糊」。
3. 交互反馈：封面/卡片 hover 有物理感（spring），磁吸式轻微跟随可选。
4. 动效预算：首屏动画 ≤ 1.2s 完成；长动画只用于背景氛围。
5. `useReducedMotion` + `@media (prefers-reduced-motion: reduce)`：关闭位移/视差/自动播放，内容全部静态可读。
6. 响应式：1440 / 768 / 390 三档无横向溢出（E2E 硬性断言 `scrollWidth <= innerWidth+1`）。
7. 图片全部 `loading="lazy"` `decoding="async"`，首屏关键图除外。

## 三、六部门美术指导

### 1. 外宣部 publicity ——「白箱影院 SHIROBAKO CINEMA」
- **风格**：藤本树漫画式黑白色调 + 电影院排版。纸白 `#f4f1ea` 底、纯黑 `#111` 粗描边、唯一强调色红 `#e0342f`（票根/REC/拟声词）。
- **排版**：电影院 marquee——顶部「NOW SHOWING」灯牌（灯泡点阵闪烁）；片单用**横向胶片条**（sprocket holes 齿孔上下边）承载 12 张封面，滚动/拖拽浏览；封面默认 `grayscale(1) contrast(1.1)` + 网点（halftone radial-gradient 叠加），hover 时褪去黑白露出彩色并浮起——寓意「宣传让故事有了颜色」。
- **元素**：漫画分镜框（不规则 panel）、速度线（repeating-conic-gradient 缓旋）、拟声词「ドン」「ゴゴゴ」红色描边字、竖排日文装饰、票根式 CTA（锯齿边）。
- **像素锚点**：章节编号用像素字体；胶片齿孔用像素方块。
- **文案**：
  - 标语：「把每一次热爱，都剪成值得一看再看的上映。」
  - 简介：推文、海报、摄影、公众号与 B 站——外宣部是公会的放映厅。我们负责让每一次活动被看见、被记住、被反复提起。
  - 职责：新媒体运营 / 视觉设计 / 宣传策划 / 影像记录
  - 板块标题：正在上映 NOW SHOWING / 年度片单 FILMOGRAPHY / 场刊 PRESS KIT

### 2. 技术部 tech ——「取景器 VIEWFINDER」
- **风格**：相机/摄影美术。深炭黑 `#0d0f12` 底 + 冷白 + 信号橙 `#ff9f43`（对焦框）。
- **核心交互**：页面是一台相机——hero 为全屏取景器（四角对焦框、REC 红点、参数条 ISO/光圈/快门、中央对焦方框呼吸）；封面以**快门动画**出现：黑色快门叶片合拢→闪光→照片如拍立得滑出，从模糊+灰度「显影」为清晰彩色（develop 动画 1.6s）。
- **滚动**：封面排列成「照片墙/底片夹」，滚动时相机参数随进度变化（如焦距数字滚动）；hover 照片出现对焦框「合焦」音效感缩放。
- **元素**：网格三分线、水平仪、像素相机 sprite。
- **文案**：
  - 标语：「世界在快门落下的一瞬成为永恒。」
  - 简介：摄影、直播、灯光、后期——技术部躲在取景器后面，把公会的每个高光时刻收进底片。我们不出现在照片里，但每张照片都是我们的签名。
  - 职责：摄影摄像 / 直播推流 / 后期制作 / 舞台技术
  - 板块标题：取景中 FOCUSING / 底片夹 CONTACT SHEET / 参数 EXIF

### 3. 原创部 original ——「梦色画室 ATELIER」
- **风格**：可爱绘画风 + 纪念碑谷式形状切换。奶油底 `#fdf6ec`、 pastel 粉 `#f7a8b8` / 薄荷 `#a8e6cf` / 淡蓝 `#a0c4ff` / 鹅黄 `#fdffb6`。
- **核心交互**：纪念碑谷式**等距不可能几何**（SVG 彭罗斯三角/悬浮阶梯/方块岛屿），随滚动做**形状切换**——clip-path/rotate/scale 缓动 morph，岛屿错位滑动重组；封面陈列在悬浮画框里，画框随视差漂浮。
- **元素**：涂鸦曲线、蜡笔下划线、纸胶带贴纸卡、水彩晕染背景（多层 radial-gradient + blur 呼吸）、像素画笔 sprite。
- **文案**：
  - 标语：「空白的画布，是宇宙开始的地方。」
  - 简介：插画、漫画、设定、手书——原创部的人相信，每一笔线条都是在给世界增加新的可能性。在这里，脑洞是硬通货。
  - 职责：绘画创作 / 漫画与手书 / 世界观设定 / 合志企划
  - 板块标题：画室里 IN THE ATELIER / 作品集锦 GALLERY / 画具箱 TOOLBOX

### 4. 舞装部 dance ——「星轨舞台 STARDUST STAGE」
- **风格**：活力感。午夜蓝黑 `#0a0a18` + 品红 `#ff4d8d` / 电光紫 `#8b5cf6` / 柠檬黄 `#faff70` 撞色；斜切构图。
- **核心交互**：舞台聚光灯（conic-gradient 灯锥随滚动/指针摇摆）；**节拍脉冲**——装饰元素按 ~100-120BPM scale 脉冲；封面卡在倾斜的「舞台地板」（perspective 网格）上，hover 弹跳+ tilt；入场用 motion-blur 式快速滑入；双行反向 marquee 文字带。
- **元素**：星场（box-shadow 星点）、彩带粒子、equalizer 底纹、像素舞者 sprite。
- **文案**：
  - 标语：「地板记得每一次练习，舞台记得每一次绽放。」
  - 简介：宅舞、WOTA 艺、舞台编排——舞装部是公会的引擎室。音乐一响，所有人都会跟着我们动起来。
  - 职责：宅舞编排 / WOTA 艺 / 舞台演出 / 快闪企划
  - 板块标题：演出中 ON STAGE / 节目单 SETLIST / 后台 BACKSTAGE

### 5. COS部 cos ——「镜中变身 HENSHIN MIRROR」
- **风格**：「变化 / 蜕变」。象牙白与雾粉 `#f3d9e4` 起，落版到浓艳玫瑰 `#d6336c` / 深紫 `#5f2b7b`——整页做一次「从素颜到上妆」的渐变旅程。
- **核心交互**：**变身序列**——hero 是一面镜子（椭圆镜框+镜光扫过）；封面 hover/进入视口时做 before→after 切换：剪影/灰度（素颜）→ 全彩（上妆），用 clip-path 圆形展开或垂直擦除；形态 morph 的柔边 blob 背景缓缓变形；蝴蝶/面具像素元素飞过留下轨迹。
- **文案**：
  - 标语：「每一次穿上，都是一次成为。」
  - 简介：服装、妆造、道具、演绎——COS 部相信角色不止存在于屏幕里。量体、裁剪、上妆、定妆，我们在镜子前完成一次次小小的蜕变。
  - 职责：服装制作 / 妆造设计 / 角色演绎 / 漫展协作
  - 板块标题：镜前 BEFORE THE MIRROR / 变身记录 TRANSFORMATIONS / 衣装间 WARDROBE

### 6. 轻音部 music ——「滚动歌词 LYRIC ROOM」
- **风格**：网易云音乐式深色沉浸。墨蓝黑 `#101018` + 暖黄 `#f5c96b` / 白；衬线感大字号歌词排版。
- **核心交互**：部门介绍文案写成**歌词**，垂直居中一栏**自动滚动**（网易云式）：当前行放大+高亮+卡拉 OK 式渐变填充，已过行变淡，未到行更淡；点击任意行跳转到该行；右侧/背景是**旋转黑胶**（封面拼成唱片），唱针臂随进度摆动；底部均衡器竖条跳动；行与行切换带轻微 y 位移缓动。
- **歌词文案**（部门介绍改写，10 行）：
  1. 前奏响起的瞬间 世界就安静下来
  2. 排练室的灯 被我们一盏一盏唱亮
  3. 跑调也没关系 青春本来就没有标准音
  4. 琴弦上住着 那些没说完的话
  5. 副歌要一起唱 才叫做轻音部
  6. 把每一次舞台 都当作最后一场来演
  7. 汗水落在鼓面上 也会开出花来
  8. 从放课后的教室 到音乐节的灯光
  9. 当最后一个音符落下
  10. 掌声 就是我们的银河
  - 简介尾注：乐队排练 / 舞台演出 / 声乐交流 / 原创编曲
  - 板块标题：正在播放 NOW PLAYING / 歌单 TRACKLIST / 排练室 REHEARSAL

## 四、职业大厅索引页（hub）

- 顶部 PageHero 保持统一视觉系统。
- 下方六个章节卡按 01-06 编号（像素字体序号），每个章节卡：
  - 左侧超大中文部名 + 英文主题名 + 职业称号；右侧该主题微型视觉（胶片条/取景框/几何岛/聚光灯/镜面/黑胶的简化静态或轻动画版本）+ 3-4 张封面预览。
  - 章节卡交替左右布局（偶数反转），`whileInView` 逐词显现。
  - 保留类名契约：外层 `.shell.department-grid`，每卡 `article.department-card`，卡内含 `heading` 级部名（如「外宣部」），卡片入场后 opacity 必须为 1（E2E `revealScrollMotion` 会逐卡 scrollIntoView 并断言 opacity>0.99——入场动画用 whileInView + once 且最终态 opacity 1）。
  - 底部「进入驻地 →」Link 到 `/departments/<slug>`。
- 移动端：章节卡单列，视觉块缩小，无横滚。

## 五、工程约束

- 不新增 npm 依赖；framer-motion + CSS 完成一切。Three.js 不用于本页（控制包体）。
- 新代码放 `apps/web/src/components/departments/`，样式 `departments.css`（或按部门拆分），在 `pages-public.tsx` 中替换 `DepartmentsPage` / `DepartmentDetailPage` 实现，路由不变。
- API 数据仍是真源：部名/职业称号/描述/成员数来自接口；slug 不在六部主题内时回退到现有通用卡片样式。
- 必须通过：`pnpm lint`、`pnpm typecheck`、`pnpm test`（现有单测断言 PageHero 与「职业大厅」heading，勿破坏）、`pnpm build`；E2E 相关断言见 `e2e/guild.spec.ts`（`.department-grid`、`.department-card`、heading「外宣部」、无横向溢出）。
- 可访问性：语义化 heading 层级、aria-label、focus 可见、对比度达标。
