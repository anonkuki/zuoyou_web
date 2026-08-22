import type { ReactNode } from 'react';
import type { WorldRect } from './world-movement';

/**
 * 七区域主题美术：与六部门展示页共享视觉语言。
 * 每区域 = CSS 背景层（调色板 + 纹理）+ 装饰层（不参与碰撞）+ 像素道具（参与碰撞）。
 * 道具一律用内联 SVG 网格像素绘制（crispEdges），坐标系为 960×540 逻辑尺寸。
 */

export interface AreaProp {
  id: string;
  rect: WorldRect;
  label: string;
  art: ReactNode;
}

interface AreaThemeDef {
  backdrop: ReactNode;
  props: AreaProp[];
}

const px = { shapeRendering: 'crispEdges' } as const;

/* ---------- 公会大厅：金色山谷（沿用现有大图素材） ---------- */
const hallBackdrop = (
  <div className="world-backdrop" aria-hidden="true">
    <img className="layer mountains" src="/assets/background/golden-valley/sunlit-mountains.png" alt="" />
    <img className="layer forest-far" src="/assets/background/golden-valley/forest-far.png" alt="" />
    <img className="layer forest-mid" src="/assets/background/golden-valley/forest-mid-a.png" alt="" />
    <img className="layer lodge" src="/assets/architecture/guild/guild-lodge-cutout.png" alt="" />
    <i className="world-tint" />
  </div>
);
const hallTrees: AreaProp[] = [
  { id: 'tree-left', label: '左侧大树', rect: { x: 60, y: 300, w: 110, h: 110 }, art: <img src="/assets/background/golden-valley/tree-left.png" alt="" draggable={false} /> },
  { id: 'tree-right', label: '右侧大树', rect: { x: 790, y: 280, w: 120, h: 120 }, art: <img src="/assets/background/golden-valley/tree-left.png" alt="" draggable={false} /> },
];

/* ---------- 外宣&幻想研：黑白漫画影院 ---------- */
const publicityScreen = (
  <svg viewBox="0 0 48 26" {...px} aria-hidden="true">
    <rect x="0" y="0" width="48" height="26" fill="#17150f" />
    <rect x="2" y="3" width="44" height="20" fill="#fdfaf1" />
    <rect x="2" y="3" width="44" height="2" fill="#e0342f" />
    <rect x="6" y="9" width="14" height="10" fill="#17150f" />
    <rect x="23" y="9" width="19" height="2" fill="#17150f" />
    <rect x="23" y="13" width="19" height="2" fill="#17150f" />
    <rect x="23" y="17" width="12" height="2" fill="#e0342f" />
  </svg>
);
const publicityProjector = (
  <svg viewBox="0 0 18 16" {...px} aria-hidden="true">
    <rect x="2" y="4" width="14" height="8" fill="#17150f" />
    <rect x="5" y="1" width="4" height="4" fill="#17150f" />
    <rect x="10" y="1" width="4" height="4" fill="#17150f" />
    <rect x="6" y="2" width="2" height="2" fill="#fdfaf1" />
    <rect x="11" y="2" width="2" height="2" fill="#fdfaf1" />
    <rect x="14" y="6" width="4" height="4" fill="#e0342f" />
    <rect x="4" y="12" width="2" height="4" fill="#17150f" />
    <rect x="12" y="12" width="2" height="4" fill="#17150f" />
  </svg>
);

/* ---------- 技术部：相机取景器 ---------- */
const techMonitor = (
  <svg viewBox="0 0 40 26" {...px} aria-hidden="true">
    <rect x="0" y="0" width="40" height="22" fill="#101418" />
    <rect x="2" y="2" width="36" height="18" fill="#1f2a30" />
    <rect x="4" y="4" width="14" height="10" fill="#3fd08c" />
    <rect x="20" y="4" width="14" height="2" fill="#3fd08c" />
    <rect x="20" y="8" width="10" height="2" fill="#7ee2b0" />
    <rect x="20" y="12" width="14" height="2" fill="#3fd08c" />
    <rect x="16" y="22" width="8" height="2" fill="#101418" />
    <rect x="12" y="24" width="16" height="2" fill="#101418" />
  </svg>
);
const techTripod = (
  <svg viewBox="0 0 16 18" {...px} aria-hidden="true">
    <rect x="4" y="0" width="8" height="5" fill="#2c343c" />
    <rect x="10" y="1" width="4" height="3" fill="#ff9f43" />
    <rect x="7" y="5" width="2" height="4" fill="#2c343c" />
    <rect x="3" y="9" width="2" height="9" fill="#2c343c" transform="skewX(-12)" />
    <rect x="11" y="9" width="2" height="9" fill="#2c343c" transform="skewX(12)" />
    <rect x="7" y="9" width="2" height="9" fill="#1d232a" />
  </svg>
);

/* ---------- 原创部：pastel 画室 ---------- */
const originalEasel = (
  <svg viewBox="0 0 22 28" {...px} aria-hidden="true">
    <rect x="4" y="2" width="14" height="12" fill="#f7a8b8" />
    <rect x="5" y="3" width="12" height="10" fill="#fff6ea" />
    <rect x="7" y="5" width="8" height="3" fill="#8fc7c0" />
    <rect x="7" y="9" width="5" height="3" fill="#f2c14e" />
    <rect x="2" y="14" width="18" height="2" fill="#a87b4f" />
    <rect x="4" y="16" width="2" height="12" fill="#a87b4f" />
    <rect x="16" y="16" width="2" height="12" fill="#a87b4f" />
    <rect x="9" y="16" width="2" height="8" fill="#8a613c" />
  </svg>
);
const originalBuckets = (
  <svg viewBox="0 0 26 12" {...px} aria-hidden="true">
    <rect x="1" y="3" width="7" height="8" fill="#e2839a" />
    <rect x="1" y="3" width="7" height="2" fill="#f7a8b8" />
    <rect x="10" y="3" width="7" height="8" fill="#5fa8a0" />
    <rect x="10" y="3" width="7" height="2" fill="#8fc7c0" />
    <rect x="19" y="3" width="7" height="8" fill="#d9a83c" />
    <rect x="19" y="3" width="7" height="2" fill="#f2c14e" />
  </svg>
);

/* ---------- 舞装部：星轨舞台 ---------- */
const danceSpeaker = (
  <svg viewBox="0 0 18 26" {...px} aria-hidden="true">
    <rect x="0" y="0" width="18" height="26" fill="#171a2e" />
    <rect x="2" y="2" width="14" height="10" fill="#232742" />
    <rect x="5" y="4" width="8" height="6" fill="#0d0f1d" />
    <rect x="7" y="6" width="4" height="2" fill="#ff4d8d" />
    <rect x="2" y="14" width="14" height="10" fill="#232742" />
    <rect x="5" y="16" width="8" height="6" fill="#0d0f1d" />
    <rect x="7" y="18" width="4" height="2" fill="#8f7bd8" />
  </svg>
);
const danceTruss = (
  <svg viewBox="0 0 12 30" {...px} aria-hidden="true">
    <rect x="5" y="0" width="2" height="30" fill="#3a3f5c" />
    <rect x="2" y="4" width="8" height="3" fill="#3a3f5c" />
    <rect x="1" y="7" width="4" height="5" fill="#ff4d8d" />
    <rect x="7" y="7" width="4" height="5" fill="#f5c96b" />
    <rect x="2" y="18" width="8" height="3" fill="#3a3f5c" />
    <rect x="3" y="21" width="6" height="4" fill="#8f7bd8" />
  </svg>
);

/* ---------- COS部：镜中变身 ---------- */
const cosMirror = (
  <svg viewBox="0 0 18 32" {...px} aria-hidden="true">
    <rect x="2" y="0" width="14" height="30" fill="#a34a68" />
    <rect x="4" y="2" width="10" height="24" fill="#f3dfe6" />
    <rect x="5" y="3" width="3" height="20" fill="#ffffff" opacity="0.75" />
    <rect x="1" y="30" width="16" height="2" fill="#7d3450" />
    <rect x="7" y="6" width="4" height="2" fill="#f7a8b8" />
  </svg>
);
const cosWardrobe = (
  <svg viewBox="0 0 28 30" {...px} aria-hidden="true">
    <rect x="0" y="0" width="28" height="28" fill="#8a4a5e" />
    <rect x="2" y="2" width="11" height="24" fill="#a75c72" />
    <rect x="15" y="2" width="11" height="24" fill="#a75c72" />
    <rect x="12" y="12" width="2" height="4" fill="#f5c96b" />
    <rect x="14" y="12" width="2" height="4" fill="#f5c96b" />
    <rect x="4" y="4" width="7" height="2" fill="#f3dfe6" />
    <rect x="17" y="4" width="7" height="2" fill="#f3dfe6" />
    <rect x="0" y="28" width="28" height="2" fill="#5e3241" />
  </svg>
);

/* ---------- 轻音部：黑胶歌词房 ---------- */
const musicCase = (
  <svg viewBox="0 0 28 14" {...px} aria-hidden="true">
    <rect x="0" y="2" width="28" height="11" fill="#1d2438" />
    <rect x="0" y="2" width="28" height="3" fill="#2c3550" />
    <rect x="2" y="6" width="4" height="2" fill="#f5c96b" />
    <rect x="22" y="6" width="4" height="2" fill="#f5c96b" />
    <rect x="12" y="5" width="4" height="4" fill="#0f1424" />
    <rect x="0" y="13" width="28" height="1" fill="#0f1424" />
  </svg>
);
const musicMic = (
  <svg viewBox="0 0 10 30" {...px} aria-hidden="true">
    <rect x="3" y="0" width="4" height="6" fill="#c8cede" />
    <rect x="3" y="2" width="4" height="1" fill="#8f96ac" />
    <rect x="4" y="6" width="2" height="18" fill="#8f96ac" />
    <rect x="1" y="24" width="8" height="2" fill="#8f96ac" />
    <rect x="0" y="26" width="10" height="2" fill="#5c6274" />
  </svg>
);

/* ---------- 主题注册表 ---------- */
const prop = (id: string, label: string, rect: WorldRect, art: ReactNode): AreaProp => ({ id, label, rect, art });

export const areaThemes: Record<string, AreaThemeDef> = {
  hall: {
    backdrop: hallBackdrop,
    props: [
      prop('lodge', '公会小屋', { x: 380, y: 40, w: 200, h: 150 }, <span className="world-prop-ghost" />),
      ...hallTrees,
    ],
  },
  publicity: {
    backdrop: (
      <div className="world-backdrop theme-decor" aria-hidden="true">
        <i className="decor-speedlines" />
        <i className="decor-halftone" />
      </div>
    ),
    props: [
      prop('screen', '放映幕布', { x: 340, y: 50, w: 280, h: 150 }, publicityScreen),
      prop('projector', '老式放映机', { x: 130, y: 330, w: 100, h: 90 }, publicityProjector),
    ],
  },
  tech: {
    backdrop: (
      <div className="world-backdrop theme-decor" aria-hidden="true">
        <i className="decor-scanlines" />
        <i className="decor-focus-frame" />
      </div>
    ),
    props: [
      prop('monitor', '监视器', { x: 370, y: 60, w: 220, h: 140 }, techMonitor),
      prop('tripod', '三脚架相机', { x: 140, y: 320, w: 90, h: 100 }, techTripod),
    ],
  },
  original: {
    backdrop: (
      <div className="world-backdrop theme-decor" aria-hidden="true">
        <i className="decor-watercolor" />
        <i className="decor-tape" />
      </div>
    ),
    props: [
      prop('easel', '画架', { x: 200, y: 80, w: 120, h: 150 }, originalEasel),
      prop('buckets', '颜料桶', { x: 620, y: 340, w: 140, h: 70 }, originalBuckets),
    ],
  },
  dance: {
    backdrop: (
      <div className="world-backdrop theme-decor" aria-hidden="true">
        <i className="decor-starfield" />
        <i className="decor-spotlights" />
      </div>
    ),
    props: [
      prop('speaker', '音箱堆', { x: 90, y: 290, w: 100, h: 140 }, danceSpeaker),
      prop('truss', '舞台灯柱', { x: 790, y: 270, w: 70, h: 160 }, danceTruss),
    ],
  },
  cos: {
    backdrop: (
      <div className="world-backdrop theme-decor" aria-hidden="true">
        <i className="decor-blobs" />
        <i className="decor-sparkles" />
      </div>
    ),
    props: [
      prop('mirror', '变身椭圆镜', { x: 180, y: 70, w: 110, h: 180 }, cosMirror),
      prop('wardrobe', '幻装衣柜', { x: 660, y: 80, w: 160, h: 170 }, cosWardrobe),
    ],
  },
  music: {
    backdrop: (
      <div className="world-backdrop theme-decor" aria-hidden="true">
        <i className="decor-vinyl" />
        <i className="decor-soundwave" />
      </div>
    ),
    props: [
      prop('case', '乐器箱', { x: 150, y: 340, w: 150, h: 80 }, musicCase),
      prop('mic', '麦克风架', { x: 740, y: 260, w: 60, h: 170 }, musicMic),
    ],
  },
};

export const areaObstacles = (areaId: string): WorldRect[] =>
  (areaThemes[areaId] ?? areaThemes.hall).props.map((item) => item.rect);
