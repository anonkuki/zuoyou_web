import type { AvatarConfig } from '@guild/contracts';

/**
 * 像素小人部件数据：16×20 逻辑网格（大头小身 Q 版比例）。
 * 每个部件输出一组轴对齐 run-rect（x,y,w,h + fill），由 PixelAvatar 分层叠放：
 * 皮肤 → 服装（含腿/鞋）→ 头发 → 五官 → 配饰。
 * 行走动画通过两腿/鞋的两帧交替实现（frame 0/1）。
 */

export interface AvatarRun { x: number; y: number; w: number; h: number; fill: string }

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
const outfitPalette: Record<AvatarConfig['outfit'], { main: string; light: string; legs: string | null }> = {
  adventurer: { main: '#8a6a42', light: '#d9c9a8', legs: '#4a3b2c' },
  hoodie: { main: '#4f6d8f', light: '#6f8dad', legs: '#3a4a5c' },
  maid: { main: '#2b2b33', light: '#fff8ee', legs: null },
  cloak: { main: '#3d4a3a', light: '#55684f', legs: null },
  band: { main: '#26232b', light: '#8f8a96', legs: '#3e5a80' },
  hanfu: { main: '#7286b8', light: '#fff8ee', legs: null },
  workwear: { main: '#4a6b8a', light: '#d9c9a8', legs: '#4a6b8a' },
  dress: { main: '#6d4a7d', light: '#8a6a9d', legs: null },
};

const INK = '#26232b';
const PAPER = '#fff8ee';
const BLUSH = '#f2a0aa';

export const shade = (hex: string, factor: number): string => {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((value >> shift) & 0xff) * factor)));
  return `#${[channel(16), channel(8), channel(0)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

const run = (x: number, y: number, w: number, h: number, fill: string): AvatarRun => ({ x, y, w, h, fill });

function skinRuns(config: AvatarConfig): AvatarRun[] {
  const skin = avatarSkinColors[config.skin];
  const skinShade = shade(skin, 0.86);
  const runs = [
    run(4, 2, 8, 5, skin),        // 头部
    run(5, 7, 6, 1, skin),        // 下巴
    run(6, 8, 4, 1, skinShade),   // 脖子
  ];
  if (config.outfit !== 'cloak' && config.outfit !== 'hanfu') {
    runs.push(run(3, 12, 1, 1, skin), run(12, 12, 1, 1, skin)); // 双手
  }
  if (config.outfit === 'maid' || config.outfit === 'dress') {
    runs.push(run(5, 16, 2, 2, skin), run(9, 16, 2, 2, skin)); // 裙摆下的小腿
  }
  return runs;
}

/** 双腿 + 鞋的两帧走路循环（frame 0：左腿前右腿收；frame 1 镜像） */
function legRuns(legsColor: string, shoe: string, frame: 0 | 1): AvatarRun[] {
  const lift = frame === 0 ? 'right' : 'left';
  return [
    run(5, 14, 2, lift === 'left' ? 3 : 4, legsColor),
    run(9, 14, 2, lift === 'right' ? 3 : 4, legsColor),
    run(5, lift === 'left' ? 17 : 18, 2, 2, shoe),
    run(9, lift === 'right' ? 17 : 18, 2, 2, shoe),
  ];
}

function outfitRuns(config: AvatarConfig, frame: 0 | 1): AvatarRun[] {
  const palette = outfitPalette[config.outfit];
  const { main, light } = palette;
  const dark = shade(main, 0.72);
  const shoe = shade(avatarAccentColors[config.accent], 0.8);
  const torso: AvatarRun[] = [];
  switch (config.outfit) {
    case 'adventurer':
      torso.push(run(4, 9, 8, 4, main), run(6, 9, 4, 3, light), run(6, 9, 4, 1, shade(light, 0.9)), run(4, 13, 8, 1, shade(avatarAccentColors[config.accent], 0.9)), run(3, 9, 1, 3, main), run(12, 9, 1, 3, main));
      break;
    case 'hoodie':
      torso.push(run(4, 9, 8, 5, main), run(5, 12, 6, 2, light), run(6, 10, 1, 2, PAPER), run(9, 10, 1, 2, PAPER), run(3, 9, 1, 3, main), run(12, 9, 1, 3, main));
      break;
    case 'maid':
      torso.push(run(4, 9, 8, 4, main), run(5, 9, 6, 1, PAPER), run(5, 10, 6, 6, PAPER), run(3, 9, 1, 3, main), run(12, 9, 1, 3, main), run(3, 13, 3, 3, main), run(10, 13, 3, 3, main), run(3, 15, 10, 1, dark));
      break;
    case 'cloak':
      torso.push(run(4, 8, 8, 2, dark), run(3, 9, 10, 8, main), run(7, 10, 2, 6, dark), run(7, 8, 2, 1, avatarAccentColors[config.accent]));
      break;
    case 'band':
      torso.push(run(4, 9, 8, 5, main), run(6, 10, 4, 2, avatarAccentColors[config.accent]), run(3, 9, 1, 2, main), run(12, 9, 1, 2, main));
      break;
    case 'hanfu':
      torso.push(run(4, 9, 8, 8, main), run(5, 9, 2, 1, light), run(9, 9, 2, 1, light), run(6, 10, 2, 1, light), run(8, 10, 2, 1, light), run(4, 12, 8, 1, avatarAccentColors[config.accent]), run(2, 9, 2, 4, main), run(12, 9, 2, 4, main), run(2, 12, 2, 1, light), run(12, 12, 2, 1, light));
      break;
    case 'workwear':
      torso.push(run(4, 9, 8, 2, light), run(3, 9, 1, 3, light), run(12, 9, 1, 3, light), run(5, 9, 1, 2, main), run(10, 9, 1, 2, main), run(4, 11, 8, 3, main), run(7, 11, 2, 1, shade(avatarAccentColors[config.accent], 0.9)));
      break;
    case 'dress':
      torso.push(run(4, 9, 8, 4, main), run(5, 9, 6, 1, light), run(7, 12, 2, 1, avatarAccentColors[config.accent]), run(3, 13, 10, 3, main), run(3, 15, 10, 1, dark), run(3, 13, 1, 3, dark), run(12, 13, 1, 3, dark));
      break;
  }
  if (palette.legs) {
    return [...torso, ...legRuns(palette.legs, shoe, frame)];
  }
  // 裙/袍装：腿被遮住，只让鞋交替
  const liftRight = frame === 0;
  return [...torso, run(5, liftRight ? 18 : 17, 2, 2, shoe), run(9, liftRight ? 17 : 18, 2, 2, shoe)];
}

function hairRuns(config: AvatarConfig): AvatarRun[] {
  if (config.hairStyle === 'bald') return [];
  const main = avatarHairColorMap[config.hairColor];
  const dark = shade(main, 0.72);
  const light = shade(main, 1.22);
  const accent = avatarAccentColors[config.accent];
  const crown = [run(4, 1, 8, 1, main), run(3, 2, 10, 1, main), run(3, 3, 1, 1, main), run(12, 3, 1, 1, main), run(4, 3, 8, 1, dark)];
  const sides = [run(3, 4, 1, 2, main), run(12, 4, 1, 2, main)];
  switch (config.hairStyle) {
    case 'short':
      return [...crown, ...sides];
    case 'long':
      return [...crown, ...sides, run(3, 6, 1, 4, main), run(12, 6, 1, 4, main), run(3, 10, 1, 1, dark), run(12, 10, 1, 1, dark)];
    case 'twintails':
      return [...crown, ...sides, run(2, 3, 1, 1, accent), run(13, 3, 1, 1, accent), run(2, 4, 1, 5, main), run(13, 4, 1, 5, main), run(2, 9, 1, 1, dark), run(13, 9, 1, 1, dark)];
    case 'bun':
      return [...crown, ...sides, run(2, 0, 2, 2, main), run(12, 0, 2, 2, main), run(3, 1, 1, 1, accent), run(12, 1, 1, 1, accent)];
    case 'ahoge':
      return [...crown, ...sides, run(7, 0, 2, 1, main), run(8, 0, 1, 1, light)];
    case 'curtain':
      return [run(4, 1, 8, 1, main), run(3, 2, 10, 3, main), run(3, 5, 10, 1, dark), run(3, 6, 1, 3, main), run(12, 6, 1, 3, main)];
    case 'afro':
      return [run(4, 0, 8, 1, main), run(2, 1, 12, 3, main), run(2, 4, 1, 2, main), run(13, 4, 1, 2, main), run(5, 1, 3, 1, light)];
    default:
      return crown;
  }
}

function faceRuns(config: AvatarConfig): AvatarRun[] {
  const skinShade = shade(avatarSkinColors[config.skin], 0.86);
  const runs: AvatarRun[] = [run(4, 6, 1, 1, BLUSH), run(11, 6, 1, 1, BLUSH), run(7, 6, 2, 1, skinShade)];
  if (config.hairStyle === 'curtain') return runs; // 刘海遮眼：不画眼睛
  switch (config.eyes) {
    case 'round':
      runs.push(run(5, 5, 2, 2, INK), run(9, 5, 2, 2, INK), run(5, 5, 1, 1, PAPER), run(9, 5, 1, 1, PAPER));
      break;
    case 'sharp':
      runs.push(run(5, 5, 2, 1, INK), run(9, 5, 2, 1, INK), run(5, 6, 1, 1, INK), run(10, 6, 1, 1, INK));
      break;
    case 'closed':
      runs.push(run(5, 6, 2, 1, INK), run(9, 6, 2, 1, INK));
      break;
    case 'sparkle':
      runs.push(run(5, 5, 2, 2, INK), run(9, 5, 2, 2, INK), run(5, 5, 1, 1, PAPER), run(9, 5, 1, 1, PAPER), run(6, 6, 1, 1, PAPER), run(10, 6, 1, 1, PAPER));
      break;
  }
  return runs;
}

function accessoryRuns(config: AvatarConfig): AvatarRun[] {
  const accent = avatarAccentColors[config.accent];
  const hair = avatarHairColorMap[config.hairColor];
  switch (config.accessory) {
    case 'glasses':
      return [run(4, 4, 3, 1, INK), run(9, 4, 3, 1, INK), run(7, 4, 2, 1, INK)];
    case 'cat-ears':
      return [run(4, 0, 2, 1, hair), run(10, 0, 2, 1, hair), run(4, 0, 1, 1, accent), run(11, 0, 1, 1, accent)];
    case 'headphones':
      return [run(4, 0, 8, 1, shade(accent, 0.7)), run(3, 4, 1, 3, accent), run(12, 4, 1, 3, accent)];
    case 'cap':
      return [run(4, 0, 8, 2, accent), run(3, 2, 10, 1, shade(accent, 0.7))];
    case 'mask':
      return [run(5, 6, 6, 1, PAPER), run(5, 7, 6, 1, shade(PAPER, 0.88))];
    default:
      return [];
  }
}

export function buildAvatarRuns(config: AvatarConfig, frame: 0 | 1 = 0): AvatarRun[] {
  return [
    ...skinRuns(config),
    ...outfitRuns(config, frame),
    ...hairRuns(config),
    ...faceRuns(config),
    ...accessoryRuns(config),
  ];
}
