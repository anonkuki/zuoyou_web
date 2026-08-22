import type { AvatarConfig } from '@guild/contracts';

/**
 * 像素小人部件数据：24×28 逻辑网格，DND 职业制。
 * 两个正交维度：
 * - style（chibi/mame/sharp）决定脸型、头身比与五官画法；
 * - klass（8 职业）决定服装、头饰与手持物（武器/盾/琴直接画进 sprite，含行走两帧）。
 * 分层：地影 → 背挂道具 → 皮肤 → 盔甲/长袍（含四肢）→ 头发（按职业 full/fringe/hood 模式防穿模）
 *       → 头饰 → 五官 → 职业面部附加（蒙面巾/战纹）→ 通用配饰。
 */

export interface AvatarRun { x: number; y: number; w: number; h: number; fill: string; o?: number }
type Style = AvatarConfig['style'];
type Klass = AvatarConfig['klass'];

export const avatarSkinColors: Record<AvatarConfig['skin'], string> = {
  porcelain: '#ffdfd0', light: '#f6c9a8', warm: '#e0a878', tan: '#b97a4e', deep: '#7d4a2d',
};
export const avatarHairColorMap: Record<AvatarConfig['hairColor'], string> = {
  black: '#2b2b33', brown: '#6b4423', blonde: '#e8c46a', red: '#c14736',
  pink: '#f2a0bd', blue: '#5b7fd4', purple: '#8a5fc0', white: '#efeee9',
};
export const avatarAccentColors: Record<AvatarConfig['accent'], string> = {
  red: '#e0342f', orange: '#ff9f43', gold: '#f5c96b', teal: '#2a9d8f',
  blue: '#5279a8', purple: '#8a5fc0', pink: '#f7a8b8', rose: '#d6336c',
};

const INK = '#26232b';
const WHITE = '#ffffff';
const PAPER = '#fff8ee';
const BLUSH = '#f2a0aa';
const MOUTH_SOFT = '#c25e64';
const MOUTH_FLAT = '#7a464c';
const STEEL = '#9aa7b4';
const STEEL_DARK = '#5d6873';
const WOOD = '#7a5230';
const GOLD = '#d9a83c';

export const shade = (hex: string, factor: number): string => {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((value >> shift) & 0xff) * factor)));
  return `#${[channel(16), channel(8), channel(0)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

const run = (x: number, y: number, w: number, h: number, fill: string, o?: number): AvatarRun => ({ x, y, w, h, fill, ...(o === undefined ? {} : { o }) });

/** 三风格在 24×28 网格上的脸型/比例坐标（cx=12 居中） */
interface Geom {
  headX: number; headY: number; headW: number; headH: number;
  chinX: number; chinY: number; chinW: number; // chinY < 0 表示圆脸无独立下巴
  neckY: number;
  torsoX: number; torsoY: number; torsoW: number; torsoH: number;
  legY: number; shoeY: number;
  eyeY: number; eyeLX: number; eyeRX: number;
  browY: number | null;
  blushY: number | null;
  mouthY: number;
  hairBase: number;
  hairTipY: number;
  outline: string;
  mouth: string;
}

const GEOM: Record<Style, Geom> = {
  chibi: {
    headX: 7, headY: 4, headW: 10, headH: 7, chinX: 10, chinY: 11, chinW: 4, neckY: 12,
    torsoX: 8, torsoY: 13, torsoW: 8, torsoH: 5, legY: 18, shoeY: 23,
    eyeY: 7, eyeLX: 9, eyeRX: 13, browY: null, blushY: 9, mouthY: 10,
    hairBase: 3, hairTipY: 14, outline: '#5a4147', mouth: MOUTH_SOFT,
  },
  mame: {
    headX: 6, headY: 5, headW: 12, headH: 8, chinX: 0, chinY: -1, chinW: 0, neckY: 13,
    torsoX: 8, torsoY: 14, torsoW: 8, torsoH: 4, legY: 18, shoeY: 23,
    eyeY: 8, eyeLX: 9, eyeRX: 14, browY: null, blushY: 10, mouthY: 11,
    hairBase: 4, hairTipY: 14, outline: '#5a4147', mouth: MOUTH_SOFT,
  },
  sharp: {
    headX: 8, headY: 3, headW: 8, headH: 7, chinX: 11, chinY: 10, chinW: 2, neckY: 11,
    torsoX: 8, torsoY: 12, torsoW: 8, torsoH: 5, legY: 17, shoeY: 23,
    eyeY: 6, eyeLX: 9, eyeRX: 13, browY: 5, blushY: null, mouthY: 9,
    hairBase: 2, hairTipY: 12, outline: INK, mouth: MOUTH_FLAT,
  },
};

const CX = 12;

interface Ctx {
  skin: string;
  skinShade: string;
  hair: string;
  hairDark: string;
  hairLight: string;
  accent: string;
  accentDark: string;
  frame: 0 | 1;
}

const ctxOf = (config: AvatarConfig, frame: 0 | 1): Ctx => {
  const skin = avatarSkinColors[config.skin];
  const hair = avatarHairColorMap[config.hairColor];
  const accent = avatarAccentColors[config.accent];
  return {
    skin, skinShade: shade(skin, 0.84),
    hair, hairDark: shade(hair, 0.68), hairLight: shade(hair, 1.25),
    accent, accentDark: shade(accent, 0.72),
    frame,
  };
};

/* ---------------- 皮肤层：头部（描边+下颌阴影）+ 脖子 ---------------- */
function skinRuns(g: Geom, c: Ctx): AvatarRun[] {
  const { headX: hx, headY: hy, headW: hw, headH: hh } = g;
  const runs = [
    run(hx + 1, hy, hw - 2, 1, g.outline),
    run(hx, hy + 1, 1, hh - 1, g.outline),
    run(hx + hw - 1, hy + 1, 1, hh - 1, g.outline),
    run(hx + 1, hy + 1, hw - 2, hh - 1, c.skin),
    run(hx + 2, hy + hh - 1, hw - 4, 1, c.skinShade),
    run(CX - 1, g.neckY, 2, 1, c.skinShade),
  ];
  if (g.chinY >= 0) runs.push(run(g.chinX, g.chinY, g.chinW, 1, c.skin));
  return runs;
}

/* ---------------- 头发层：full / fringe / hood 三种模式防穿模 ---------------- */
function hairRuns(g: Geom, config: AvatarConfig, c: Ctx, mode: 'full' | 'fringe' | 'hood'): AvatarRun[] {
  if (config.hairStyle === 'bald') return [];
  const { headX: hx, headW: hw, hairBase: hb } = g;
  const { hair, hairDark, hairLight, accent } = c;
  const bangsEnd = g.eyeY - 1;
  if (mode === 'hood') {
    // 兜帽遮住头顶：只露出耳侧发绺，长度随发型
    const len = config.hairStyle === 'long' || config.hairStyle === 'twintails' ? 5 : config.hairStyle === 'short' ? 2 : 3;
    return [
      run(hx + 1, g.eyeY + 1, 1, len, hair),
      run(hx + hw - 2, g.eyeY + 1, 1, len, hair),
      run(hx + 1, g.eyeY + len, 1, 1, hairDark),
      run(hx + hw - 2, g.eyeY + len, 1, 1, hairDark),
    ];
  }
  if (mode === 'fringe') {
    // 头盔/宽檐帽遮住发冠：只画盔檐下的刘海与鬓发
    if (config.hairStyle === 'curtain') {
      return [run(hx + 1, g.headY + 1, hw - 2, g.eyeY + 1 - g.headY, hair), run(hx + 1, g.eyeY + 1, hw - 2, 1, hairDark)];
    }
    const lockLen = config.hairStyle === 'long' || config.hairStyle === 'twintails' ? g.hairTipY - g.eyeY : config.hairStyle === 'short' ? 2 : 4;
    return [
      run(hx + 1, g.headY + 1, hw - 2, g.eyeY - g.headY - 1, hair),
      run(hx + 2, g.headY + 1, 2, 1, hairLight),
      run(hx + 1, g.eyeY - 1, hw - 2, 1, hairDark),
      run(hx, g.eyeY, 1, lockLen, hair),
      run(hx + hw - 1, g.eyeY, 1, lockLen, hair),
      run(hx, g.eyeY + lockLen, 1, 1, hairDark),
      run(hx + hw - 1, g.eyeY + lockLen, 1, 1, hairDark),
    ];
  }
  // full：完整发型
  const crown = [
    run(hx + 1, hb, hw - 2, 1, hair),
    run(hx + 2, hb, 3, 1, hairLight),
    run(hx, hb + 1, hw, bangsEnd - hb - 1, hair),
    run(hx + 2, hb + 1, 2, 1, hairLight),
    run(hx + 1, bangsEnd, hw - 2, 1, hairDark),
  ];
  const sideburns = [run(hx, bangsEnd + 1, 1, 2, hair), run(hx + hw - 1, bangsEnd + 1, 1, 2, hair)];
  switch (config.hairStyle) {
    case 'short':
      return [...crown, ...sideburns];
    case 'long': {
      const len = g.hairTipY - bangsEnd - 1;
      return [...crown, run(hx, bangsEnd + 1, 1, len, hair), run(hx + hw - 1, bangsEnd + 1, 1, len, hair), run(hx, g.hairTipY - 1, 1, 1, hairDark), run(hx + hw - 1, g.hairTipY - 1, 1, 1, hairDark)];
    }
    case 'twintails':
      return [...crown, run(hx - 1, hb + 1, 1, 1, accent), run(hx + hw, hb + 1, 1, 1, accent), run(hx - 1, hb + 2, 1, 6, hair), run(hx + hw, hb + 2, 1, 6, hair), run(hx - 1, hb + 7, 1, 1, hairDark), run(hx + hw, hb + 7, 1, 1, hairDark)];
    case 'bun':
      return [...crown, ...sideburns, run(hx - 2, hb, 2, 2, hair), run(hx + hw, hb, 2, 2, hair), run(hx - 1, hb + 1, 1, 1, accent), run(hx + hw, hb + 1, 1, 1, accent)];
    case 'ahoge':
      return [...crown, ...sideburns, run(CX - 1, hb - 1, 2, 1, hair), run(CX, hb - 1, 1, 1, hairLight)];
    case 'curtain':
      return [
        run(hx + 1, hb, hw - 2, 1, hair), run(hx + 2, hb, 3, 1, hairLight),
        run(hx, hb + 1, hw, g.eyeY + 1 - hb, hair),
        run(CX - 1, hb + 2, 2, g.eyeY - hb - 1, hairDark),
        run(hx, g.eyeY + 1, hw, 1, hairDark),
        run(hx, g.eyeY + 2, 1, 3, hair), run(hx + hw - 1, g.eyeY + 2, 1, 3, hair),
      ];
    case 'afro':
      return [
        run(hx + 2, hb, hw - 4, 1, hair),
        run(hx - 1, hb + 1, hw + 2, 3, hair),
        run(hx + 2, hb + 1, 3, 1, hairLight),
        run(hx - 1, hb + 4, 1, 2, hairDark), run(hx + hw, hb + 4, 1, 2, hairDark),
        run(hx, hb + 4, 1, 1, hair), run(hx + hw - 1, hb + 4, 1, 1, hair),
      ];
    default:
      return crown;
  }
}

/* ---------------- 五官层 ---------------- */
function faceRuns(g: Geom, config: AvatarConfig, c: Ctx): AvatarRun[] {
  const runs: AvatarRun[] = [];
  const { eyeY: ey, eyeLX: lx, eyeRX: rx } = g;
  if (g.blushY !== null) {
    const bw = config.style === 'mame' ? 2 : 1;
    runs.push(run(g.headX + (bw === 2 ? 0 : 1), g.blushY, bw, 1, BLUSH), run(g.headX + g.headW - 2, g.blushY, bw, 1, BLUSH));
  }
  if (g.browY !== null) runs.push(run(lx, g.browY, 2, 1, c.hairDark), run(rx, g.browY, 2, 1, c.hairDark));
  if (config.style === 'mame') runs.push(run(CX, g.mouthY, 1, 1, g.mouth));
  else runs.push(run(CX - 1, g.mouthY, 2, 1, g.mouth));
  if (config.hairStyle === 'curtain') return runs; // 刘海遮眼
  switch (config.style) {
    case 'chibi':
      switch (config.eyes) {
        case 'round':
          runs.push(run(lx, ey, 2, 3, INK), run(rx, ey, 2, 3, INK), run(lx, ey, 1, 1, WHITE), run(rx, ey, 1, 1, WHITE));
          break;
        case 'sparkle':
          runs.push(run(lx, ey, 2, 3, INK), run(rx, ey, 2, 3, INK), run(lx, ey, 1, 1, WHITE), run(rx, ey, 1, 1, WHITE), run(lx + 1, ey + 2, 1, 1, WHITE), run(rx + 1, ey + 2, 1, 1, WHITE));
          break;
        case 'sharp':
          runs.push(run(lx, ey, 2, 1, INK), run(rx, ey, 2, 1, INK), run(lx, ey + 1, 1, 1, INK), run(rx + 1, ey + 1, 1, 1, INK), run(lx, ey, 1, 1, WHITE), run(rx, ey, 1, 1, WHITE));
          break;
        case 'closed':
          runs.push(run(lx, ey + 1, 2, 1, INK), run(rx, ey + 1, 2, 1, INK), run(lx - 1, ey, 1, 1, INK), run(rx + 2, ey, 1, 1, INK));
          break;
      }
      break;
    case 'mame':
      switch (config.eyes) {
        case 'closed':
          runs.push(run(lx - 1, ey + 1, 2, 1, INK), run(rx, ey + 1, 2, 1, INK));
          break;
        case 'sharp':
          runs.push(run(lx - 1, ey, 2, 1, INK), run(rx, ey, 2, 1, INK), run(lx - 1, ey, 1, 1, WHITE), run(rx, ey, 1, 1, WHITE));
          break;
        default:
          runs.push(run(lx, ey, 1, 2, INK), run(rx, ey, 1, 2, INK), run(lx, ey, 1, 1, WHITE), run(rx, ey, 1, 1, WHITE));
          if (config.eyes === 'sparkle') runs.push(run(lx + 1, ey + 1, 1, 1, WHITE), run(rx + 1, ey + 1, 1, 1, WHITE));
          break;
      }
      break;
    case 'sharp':
      switch (config.eyes) {
        case 'sharp':
          runs.push(run(lx, ey, 2, 1, INK), run(rx, ey, 2, 1, INK), run(lx, ey + 1, 1, 1, INK), run(rx + 1, ey + 1, 1, 1, INK), run(lx + 1, ey, 1, 1, WHITE), run(rx + 1, ey, 1, 1, WHITE));
          break;
        case 'closed':
          runs.push(run(lx, ey, 2, 1, INK), run(rx, ey, 2, 1, INK));
          break;
        default:
          runs.push(run(lx, ey, 2, 2, INK), run(rx, ey, 2, 2, INK), run(lx, ey, 1, 1, WHITE), run(rx, ey, 1, 1, WHITE));
          if (config.eyes === 'sparkle') runs.push(run(lx + 1, ey + 1, 1, 1, WHITE), run(rx + 1, ey + 1, 1, 1, WHITE));
          break;
      }
      break;
  }
  return runs;
}

/* ---------------- 职业定义 ---------------- */
interface Palette { main: string; light: string; dark: string }
interface KlassDef {
  hairMode: 'full' | 'fringe' | 'hood';
  robed: boolean;
  palette: Palette;
  back?: (g: Geom, c: Ctx) => AvatarRun[];
  armor: (g: Geom, c: Ctx) => AvatarRun[];
  headgear?: (g: Geom, c: Ctx) => AvatarRun[];
  front?: (g: Geom, c: Ctx) => AvatarRun[];
  faceExtra?: (g: Geom, c: Ctx) => AvatarRun[];
}

/** 通用手臂 + 手部（frame 1 双臂下摆 1px 简化摆动） */
function armRuns(g: Geom, sleeve: string, sleeveDark: string, hand: string, frame: 0 | 1): AvatarRun[] {
  const drop = frame;
  const lx = g.torsoX - 2;
  const rx = g.torsoX + g.torsoW;
  return [
    run(lx, g.torsoY + drop, 2, 3, sleeve), run(rx, g.torsoY + drop, 2, 3, sleeve),
    run(lx, g.torsoY + 2 + drop, 2, 1, sleeveDark), run(rx, g.torsoY + 2 + drop, 2, 1, sleeveDark),
    run(lx, g.torsoY + 3 + drop, 2, 1, hand), run(rx, g.torsoY + 3 + drop, 2, 1, hand),
  ];
}

/** 通用腿部两帧走路 + 靴子 */
function legRuns(g: Geom, legs: string, boot: string, frame: 0 | 1): AvatarRun[] {
  const legH = g.shoeY - g.legY;
  const lx = g.torsoX + 1;
  const rx = g.torsoX + g.torsoW - 3;
  const liftLeft = frame === 1;
  return [
    run(lx, g.legY, 2, liftLeft ? legH - 1 : legH, legs),
    run(rx, g.legY, 2, liftLeft ? legH : legH - 1, legs),
    run(lx, (liftLeft ? g.shoeY - 1 : g.shoeY), 2, 3, boot),
    run(rx, (liftLeft ? g.shoeY : g.shoeY - 1), 2, 3, boot),
    run(lx, (liftLeft ? g.shoeY - 1 : g.shoeY), 2, 1, shade(boot, 1.2)),
    run(rx, (liftLeft ? g.shoeY : g.shoeY - 1), 2, 1, shade(boot, 1.2)),
  ];
}

/** 长袍下摆（遮腿，鞋两帧交替） */
function robeHem(g: Geom, p: Palette, frame: 0 | 1): AvatarRun[] {
  const runs = [
    run(g.torsoX - 1, g.legY, g.torsoW + 2, g.shoeY - g.legY, p.main),
    run(g.torsoX - 1, g.shoeY - 1, g.torsoW + 2, 1, p.dark),
    run(g.torsoX + g.torsoW, g.legY, 1, g.shoeY - g.legY, p.dark),
  ];
  const liftLeft = frame === 1;
  runs.push(
    run(g.torsoX + 1, liftLeft ? g.shoeY - 1 : g.shoeY, 2, 3, INK),
    run(g.torsoX + g.torsoW - 3, liftLeft ? g.shoeY : g.shoeY - 1, 2, 3, INK),
  );
  return runs;
}

/** 躯干底色 + 右侧阴影列 + 下摆阴影 */
function torsoBase(g: Geom, p: Palette, height = g.torsoH): AvatarRun[] {
  return [
    run(g.torsoX, g.torsoY, g.torsoW, height, p.main),
    run(g.torsoX + g.torsoW - 1, g.torsoY + 1, 1, height - 1, p.dark),
    run(g.torsoX, g.torsoY + height - 1, g.torsoW, 1, p.dark),
    run(g.torsoX + 1, g.torsoY, 2, 1, p.light),
  ];
}

const KLASS: Record<Klass, KlassDef> = {
  /* 骑士：钢银全身甲 + 护肩 + 盔缨头盔 + 剑与纹章盾 */
  knight: {
    hairMode: 'fringe', robed: false,
    palette: { main: STEEL, light: '#c8d2dc', dark: STEEL_DARK },
    armor: (g, c) => {
      const p = KLASS.knight.palette;
      return [
        ...torsoBase(g, p),
        // 胸甲中线与纹章色胸徽
        run(CX - 1, g.torsoY, 2, g.torsoH, p.dark),
        run(CX - 1, g.torsoY + 1, 2, 2, c.accent),
        // 双肩甲
        run(g.torsoX - 3, g.torsoY, 3, 2, p.main), run(g.torsoX + g.torsoW, g.torsoY, 3, 2, p.main),
        run(g.torsoX - 3, g.torsoY, 3, 1, p.light), run(g.torsoX + g.torsoW, g.torsoY, 3, 1, p.light),
        run(g.torsoX - 3, g.torsoY + 1, 3, 1, p.dark), run(g.torsoX + g.torsoW, g.torsoY + 1, 3, 1, p.dark),
        ...armRuns(g, p.main, p.dark, p.dark, c.frame),
        ...legRuns(g, p.dark, STEEL_DARK, c.frame),
      ];
    },
    headgear: (g, c) => {
      const p = KLASS.knight.palette;
      const { headX: hx, headY: hy, headW: hw, hairBase: hb } = g;
      return [
        // 盔顶 + 盔缨
        run(hx, hb, hw, 2, p.main),
        run(hx + 1, hb, hw - 2, 1, p.light),
        run(CX - 1, hb - 2, 2, 2, c.accent),
        // 缨尖仅在头顶空间足够时绘制（sharp 风格 hairBase=2）
        ...(hb >= 3 ? [run(CX, hb - 3, 1, 1, c.accent)] : []),
        // 眉梁 + 颊甲
        run(hx, hy + 1, hw, 1, p.dark),
        run(hx, hy + 2, 1, g.headH - 3, p.main),
        run(hx + hw - 1, hy + 2, 1, g.headH - 3, p.main),
      ];
    },
    front: (g, c) => {
      const dy = c.frame;
      const t = g.torsoY;
      return [
        // 纹章盾（画面左侧）
        run(3, t + 1 - dy, 4, 4, c.accentDark),
        run(4, t + 1 - dy, 2, 4, STEEL),
        run(3, t + 5 - dy, 3, 1, c.accentDark),
        run(5, t + 2 - dy, 1, 2, c.accent),
        run(4, t + 3 - dy, 2, 1, c.accent),
        // 长剑（画面右侧）
        run(19, t - 3 - dy, 1, 6, '#d6dde4'),
        run(18, t + 2 - dy, 3, 1, GOLD),
        run(19, t + 3 - dy, 1, 2, WOOD),
      ];
    },
  },
  /* 法师：尖顶宽檐帽 + 星光长袍 + 宝石法杖 */
  mage: {
    hairMode: 'fringe', robed: true,
    palette: { main: '#33407a', light: '#4a5a9e', dark: '#222b52' },
    armor: (g, c) => {
      const p = KLASS.mage.palette;
      return [
        ...torsoBase(g, p),
        // 星光点缀 + 腰带
        run(g.torsoX + 2, g.torsoY + 2, 1, 1, p.light),
        run(g.torsoX + 5, g.torsoY + 1, 1, 1, '#8fa4e8'),
        run(g.torsoX + 3, g.torsoY + 4, 1, 1, '#8fa4e8'),
        run(g.torsoX, g.torsoY + g.torsoH - 1, g.torsoW, 1, c.accent),
        ...armRuns(g, p.main, p.dark, c.skin, c.frame),
        ...robeHem(g, p, c.frame),
      ];
    },
    headgear: (g, c) => {
      const p = KLASS.mage.palette;
      const { headX: hx, headW: hw, hairBase: hb } = g;
      return [
        // 宽檐 + 帽带（主题色）
        run(hx - 2, hb + 3, hw + 4, 1, p.main),
        run(hx - 2, hb + 4, hw + 4, 1, p.dark),
        run(hx + 1, hb + 2, hw - 2, 1, p.main),
        run(hx + 1, hb + 2, hw - 2, 1, c.accent),
        // 尖顶（微弯）
        run(hx + 2, hb + 1, hw - 4, 1, p.main),
        run(hx + 3, hb, hw - 6, 1, p.main),
        run(hx + 4, hb - 1, 2, 1, p.main),
        run(hx + 5, hb - 2, 1, 1, p.light),
        run(hx + 2, hb + 1, 2, 1, p.light),
      ];
    },
    front: (g, c) => {
      const dy = c.frame;
      const t = g.torsoY;
      return [
        // 法杖 + 顶端宝石（四角星芒微光，避免读成旗帜）
        run(19, t - 4 - dy, 1, 11, WOOD),
        run(18, t - 7 - dy, 3, 3, c.accent),
        run(19, t - 6 - dy, 1, 1, WHITE),
        run(17, t - 8 - dy, 1, 1, c.accent, 0.45),
        run(21, t - 8 - dy, 1, 1, c.accent, 0.45),
        run(17, t - 4 - dy, 1, 1, c.accent, 0.45),
        run(21, t - 4 - dy, 1, 1, c.accent, 0.45),
      ];
    },
  },
  /* 刺客：兜帽遮半脸 + 蒙面巾 + 双匕 + 夜行衣 */
  assassin: {
    hairMode: 'hood', robed: false,
    palette: { main: '#33333c', light: '#4a4a56', dark: '#1f1f26' },
    armor: (g, c) => {
      const p = KLASS.assassin.palette;
      const trim = '#8e2f38';
      return [
        ...torsoBase(g, p),
        // 暗红领巾 + 束带
        run(g.torsoX - 1, g.torsoY - 1, g.torsoW + 2, 1, trim),
        run(g.torsoX, g.torsoY + g.torsoH - 1, g.torsoW, 1, shade(trim, 0.8)),
        ...armRuns(g, p.main, p.dark, p.dark, c.frame),
        ...legRuns(g, p.dark, INK, c.frame),
        // 腰间双匕
        run(g.torsoX + 1, g.legY - 1, 1, 2, '#c8d2dc'),
        run(g.torsoX + g.torsoW - 2, g.legY - 1, 1, 2, '#c8d2dc'),
        run(g.torsoX + 1, g.legY + 1, 1, 1, GOLD),
        run(g.torsoX + g.torsoW - 2, g.legY + 1, 1, 1, GOLD),
      ];
    },
    headgear: (g) => {
      const p = KLASS.assassin.palette;
      const { headX: hx, headW: hw, hairBase: hb } = g;
      return [
        // 兜帽（尖顶 + 两侧垂落 + 眉际阴影）
        run(CX - 1, hb - 1, 2, 1, p.main),
        run(hx - 1, hb, hw + 2, 2, p.main),
        run(hx, hb, 3, 1, p.light),
        run(hx - 1, hb + 2, 2, g.headH - 1, p.main),
        run(hx + hw - 1, hb + 2, 2, g.headH - 1, p.main),
        run(hx + 1, g.eyeY - 1, hw - 2, 1, p.dark),
        run(hx - 1, hb + 2 + g.headH - 2, 2, 1, p.dark),
        run(hx + hw - 1, hb + 2 + g.headH - 2, 2, 1, p.dark),
      ];
    },
    faceExtra: (g) => {
      // 蒙面巾盖住口鼻
      return [
        run(g.headX + 2, g.mouthY - 1, g.headW - 4, 2, '#26262e'),
        run(g.headX + 2, g.mouthY - 1, g.headW - 4, 1, '#3a3a44'),
      ];
    },
  },
  /* 游侠：绿斗篷 + 箭袋 + 短弓 */
  ranger: {
    hairMode: 'hood', robed: false,
    palette: { main: '#42603c', light: '#5a7a52', dark: '#2e452b' },
    back: (g) => {
      // 背后箭袋（右肩后）+ 箭羽
      const t = g.torsoY;
      return [
        run(g.torsoX + g.torsoW, t - 3, 2, 6, '#6b4a2d'),
        run(g.torsoX + g.torsoW, t - 3, 2, 1, '#54401f'),
        run(g.torsoX + g.torsoW, t - 5, 1, 2, WOOD),
        run(g.torsoX + g.torsoW + 1, t - 4, 1, 2, WOOD),
        run(g.torsoX + g.torsoW, t - 5, 1, 1, PAPER),
        run(g.torsoX + g.torsoW + 1, t - 4, 1, 1, PAPER),
      ];
    },
    armor: (g, c) => {
      const p = KLASS.ranger.palette;
      return [
        ...torsoBase(g, { ...p, main: '#6b4a2d' }),
        // 斗篷披肩
        run(g.torsoX - 1, g.torsoY - 1, g.torsoW + 2, 2, p.main),
        run(g.torsoX - 1, g.torsoY + 1, 2, 3, p.main),
        run(g.torsoX + g.torsoW - 1, g.torsoY + 1, 2, 3, p.main),
        run(g.torsoX - 1, g.torsoY + 3, 1, 1, p.dark),
        // 皮质胸带
        run(CX - 1, g.torsoY, 1, g.torsoH, '#54401f'),
        run(CX, g.torsoY + 2, 1, 1, GOLD),
        ...armRuns(g, p.main, p.dark, '#54401f', c.frame),
        ...legRuns(g, '#4a3b2c', '#54401f', c.frame),
      ];
    },
    headgear: (g) => {
      const p = KLASS.ranger.palette;
      const { headX: hx, headW: hw, hairBase: hb } = g;
      return [
        run(hx - 1, hb, hw + 2, 2, p.main),
        run(hx, hb, 3, 1, p.light),
        run(hx - 1, hb + 2, 2, g.headH - 2, p.main),
        run(hx + hw - 1, hb + 2, 2, g.headH - 2, p.main),
        run(hx + 1, g.eyeY - 1, hw - 2, 1, p.dark),
      ];
    },
    front: (g) => {
      const t = g.torsoY;
      // 短弓（画面左侧）：弓臂弧 + 弓弦
      return [
        run(5, t - 3, 1, 1, WOOD),
        run(4, t - 2, 1, 2, WOOD),
        run(4, t + 2, 1, 2, WOOD),
        run(5, t + 4, 1, 1, WOOD),
        run(5, t - 2, 1, 6, PAPER),
        run(3, t, 2, 2, WOOD),
      ];
    },
  },
  /* 吟游诗人：羽饰软帽 + 华丽短披风 + 鲁特琴 */
  bard: {
    hairMode: 'full', robed: false,
    palette: { main: '#7d3a4e', light: '#9e5568', dark: '#5c2a3a' },
    armor: (g, c) => {
      const p = KLASS.bard.palette;
      return [
        ...torsoBase(g, p),
        // 奶油色衣襟 + 蓬袖
        run(CX - 1, g.torsoY, 2, g.torsoH, '#f2e4c8'),
        run(CX - 1, g.torsoY + 2, 2, 1, c.accent),
        run(g.torsoX - 2, g.torsoY, 2, 2, p.light),
        run(g.torsoX + g.torsoW, g.torsoY, 2, 2, p.light),
        ...armRuns(g, p.main, p.dark, c.skin, c.frame),
        // 短披风（肩后两片）
        run(g.torsoX - 3, g.torsoY + 1, 1, 4, p.dark),
        run(g.torsoX + g.torsoW + 2, g.torsoY + 1, 1, 4, p.dark),
        ...legRuns(g, '#3a2f3a', '#2a222a', c.frame),
      ];
    },
    headgear: (g, c) => {
      const p = KLASS.bard.palette;
      const { headX: hx, headW: hw, hairBase: hb } = g;
      return [
        // 软帽 + 主题色帽羽（sharp 风格头顶空间不足时省略羽尖）
        run(hx, hb, hw, 1, p.main),
        run(hx - 1, hb + 1, hw + 2, 1, p.main),
        run(hx, hb, 3, 1, p.light),
        run(hx + hw, Math.max(hb - 3, 0), 1, Math.min(3, hb + 1), c.accent),
        ...(hb >= 3 ? [run(hx + hw, hb - 3, 1, 1, shade(c.accent, 1.25))] : []),
      ];
    },
    front: (g) => {
      const t = g.torsoY;
      // 鲁特琴：琴身 + 琴颈斜上
      return [
        run(3, t + 2, 4, 4, '#a87b4f'),
        run(4, t + 1, 2, 6, '#a87b4f'),
        run(4, t + 3, 2, 2, '#5f4326'),
        run(3, t + 2, 4, 1, '#c89860'),
        run(6, t - 1, 1, 3, '#5f4326'),
        run(7, t - 2, 1, 1, '#5f4326'),
        run(6, t - 1, 1, 1, GOLD),
      ];
    },
  },
  /* 佣兵：皮甲 + 单肩甲 + 头带 + 背挂巨剑 */
  mercenary: {
    hairMode: 'full', robed: false,
    palette: { main: '#7a5a38', light: '#9c7848', dark: '#54401f' },
    back: (g, c) => {
      // 巨剑背挂：剑柄探出右肩，剑尖露出左胯
      return [
        run(g.torsoX + g.torsoW + 1, g.hairBase - 1, 1, 4, '#3a3a44'),
        run(g.torsoX + g.torsoW, g.hairBase + 2, 3, 1, GOLD),
        run(g.torsoX + g.torsoW + 1, g.hairBase - 2, 1, 1, c.accent),
        run(g.torsoX - 1, g.legY + 1, 1, 3, '#6d7986'),
        run(g.torsoX - 1, g.legY + 4, 1, 1, '#4a545e'),
      ];
    },
    armor: (g, c) => {
      const p = KLASS.mercenary.palette;
      return [
        ...torsoBase(g, p),
        // 交叉皮带 + 单肩甲（右肩钢甲）
        run(CX - 2, g.torsoY, 1, g.torsoH, p.dark),
        run(CX + 1, g.torsoY, 1, g.torsoH, p.dark),
        run(CX - 1, g.torsoY + 2, 2, 1, GOLD),
        run(g.torsoX + g.torsoW, g.torsoY, 3, 2, STEEL),
        run(g.torsoX + g.torsoW, g.torsoY, 3, 1, '#c8d2dc'),
        run(g.torsoX + g.torsoW, g.torsoY + 1, 3, 1, STEEL_DARK),
        ...armRuns(g, p.main, p.dark, c.skin, c.frame),
        ...legRuns(g, '#4a3b2c', '#33291c', c.frame),
      ];
    },
    headgear: (g, c) => {
      // 头带（主题色）
      return [run(g.headX, g.eyeY - 2, g.headW, 1, c.accent), run(g.headX + g.headW - 1, g.eyeY - 1, 1, 2, c.accentDark)];
    },
  },
  /* 神官：白金祭袍 + 圣印吊坠 + 光环 */
  cleric: {
    hairMode: 'full', robed: true,
    palette: { main: '#f2ead2', light: '#fffdf4', dark: '#d8cba6' },
    armor: (g, c) => {
      const p = KLASS.cleric.palette;
      return [
        ...torsoBase(g, p),
        // 金色祭袍中缝 + 圣印吊坠
        run(CX - 1, g.torsoY, 2, g.torsoH, GOLD),
        run(CX - 1, g.torsoY + 2, 2, 2, c.accent),
        run(CX - 1, g.torsoY, 2, 1, shade(GOLD, 0.85)),
        ...armRuns(g, p.main, p.dark, c.skin, c.frame),
        ...robeHem(g, p, c.frame),
      ];
    },
    headgear: (g, c) => {
      const { headX: hx, headW: hw, hairBase: hb } = g;
      return [
        // 圣冠（金环 + 中央宝石）
        run(hx + 1, g.eyeY - 2, hw - 2, 1, GOLD),
        run(CX - 1, g.eyeY - 3, 2, 1, c.accent),
        // 悬浮光环（sharp 风格头顶空间不足时下沉收起）
        run(CX - 2, Math.max(hb - 2, 0), 4, 1, '#f5c96b', 0.9),
        ...(hb >= 3 ? [run(CX - 1, hb - 3, 2, 1, '#f5c96b', 0.9)] : []),
        run(CX - 3, Math.max(hb - 2, 0), 1, 1, '#f5c96b', 0.55),
        run(CX + 2, Math.max(hb - 2, 0), 1, 1, '#f5c96b', 0.55),
      ];
    },
  },
  /* 狂战士：兽皮肩甲 + 战纹面绘 + 战斧 */
  berserker: {
    hairMode: 'full', robed: false,
    palette: { main: '#6b4f35', light: '#8a6a4a', dark: '#453220' },
    armor: (g, c) => {
      const p = KLASS.berserker.palette;
      return [
        ...torsoBase(g, p),
        // 露肤胸腹 + 皮索
        run(CX - 1, g.torsoY + 1, 2, 2, c.skin),
        run(CX - 2, g.torsoY, 1, g.torsoH, p.dark),
        run(CX + 1, g.torsoY, 1, g.torsoH, p.dark),
        // 兽皮双肩甲（毛边）
        run(g.torsoX - 3, g.torsoY, 3, 2, '#a8896a'),
        run(g.torsoX + g.torsoW, g.torsoY, 3, 2, '#a8896a'),
        run(g.torsoX - 3, g.torsoY + 2, 2, 1, '#8a6a4a'),
        run(g.torsoX + g.torsoW + 1, g.torsoY + 2, 2, 1, '#8a6a4a'),
        ...armRuns(g, c.skin, c.skinShade, c.skin, c.frame),
        ...legRuns(g, '#4a3b2c', '#5f4930', c.frame),
      ];
    },
    faceExtra: (g, c) => {
      // 战纹面绘（主题色双颊条纹）
      const y = (g.blushY ?? g.mouthY - 1);
      return [
        run(g.headX + 1, y, 2, 1, c.accent),
        run(g.headX + g.headW - 3, y, 2, 1, c.accent),
        run(CX - 1, g.eyeY - 2, 2, 1, c.accentDark),
      ];
    },
    front: (g, c) => {
      const dy = c.frame;
      const t = g.torsoY;
      return [
        // 战斧：木柄 + 双侧斧刃
        run(19, t - 2 - dy, 1, 10, WOOD),
        run(17, t - 4 - dy, 5, 2, '#aeb9c4'),
        run(17, t - 4 - dy, 1, 2, '#d6dde4'),
        run(21, t - 4 - dy, 1, 2, '#d6dde4'),
        run(18, t - 2 - dy, 3, 1, STEEL_DARK),
      ];
    },
  },
};

/* ---------------- 通用配饰层（面部级，不与职业头饰冲突） ---------------- */
function accessoryRuns(g: Geom, config: AvatarConfig, c: Ctx): AvatarRun[] {
  const { headX: hx, headW: hw, hairBase: hb, eyeY: ey } = g;
  switch (config.accessory) {
    case 'glasses':
      return [run(g.eyeLX - 1, ey, 3, 1, INK), run(g.eyeRX - 1, ey, 3, 1, INK), run(CX - 1, ey, 2, 1, INK)];
    case 'cat-ears':
      return [run(hx + 1, hb, 2, 1, c.hair), run(hx + hw - 3, hb, 2, 1, c.hair), run(hx + 1, hb, 1, 1, c.accent), run(hx + hw - 2, hb, 1, 1, c.accent)];
    case 'headphones':
      return [run(hx + 2, hb, hw - 4, 1, c.accentDark), run(hx - 1, ey - 1, 1, 3, c.accent), run(hx + hw, ey - 1, 1, 3, c.accent)];
    case 'mask':
      return [run(CX - 3, g.mouthY, 6, 1, PAPER), run(CX - 3, g.mouthY + 1, 6, 1, shade(PAPER, 0.88))];
    default:
      return [];
  }
}

export function buildAvatarRuns(config: AvatarConfig, frame: 0 | 1 = 0): AvatarRun[] {
  const g = GEOM[config.style] ?? GEOM.chibi;
  const k = KLASS[config.klass] ?? KLASS.knight;
  const c = ctxOf(config, frame);
  return [
    run(CX - 4, 26, 8, 1, INK, 0.22), // 地影
    ...(k.back?.(g, c) ?? []),
    ...skinRuns(g, c),
    ...k.armor(g, c),
    ...hairRuns(g, config, c, k.hairMode),
    ...(k.headgear?.(g, c) ?? []),
    ...faceRuns(g, config, c),
    ...(k.faceExtra?.(g, c) ?? []),
    ...accessoryRuns(g, config, c),
    ...(k.front?.(g, c) ?? []),
  ];
}
