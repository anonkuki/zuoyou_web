import { worldMapHeight, worldMapWidth, type WorldDirection } from '@guild/contracts';

export interface WorldPoint { x: number; y: number }
export interface WorldRect { x: number; y: number; w: number; h: number }

export interface MoveResult extends WorldPoint {
  dir: WorldDirection;
  moving: boolean;
}

/** 每个区域的固定障碍物（逻辑坐标 960×540）：公会小屋与两棵大树 */
export const worldObstacles: WorldRect[] = [
  { x: 380, y: 40, w: 200, h: 150 },
  { x: 60, y: 300, w: 110, h: 110 },
  { x: 790, y: 280, w: 120, h: 120 },
];

export const worldBounds: WorldRect = { x: 0, y: 0, w: worldMapWidth, h: worldMapHeight };

export const WORLD_SPEED = 190; // 逻辑像素 / 秒
export const SPRITE_RADIUS = 16; // 小人的近似碰撞半径

const keyAliases: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  w: 'up', arrowup: 'up',
  s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left',
  d: 'right', arrowright: 'right',
};

export const normalizeKey = (key: string): 'up' | 'down' | 'left' | 'right' | null => keyAliases[key.toLowerCase()] ?? null;

export function directionLabel(keys: ReadonlySet<string>): { dx: number; dy: number; dir: WorldDirection; moving: boolean } {
  const dx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
  const dy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
  if (!dx && !dy) return { dx: 0, dy: 0, dir: 'down', moving: false };
  const horizontal = dx > 0 ? 'right' : 'left';
  const vertical = dy > 0 ? 'down' : 'up';
  const dir = (dx && dy ? `${vertical}-${horizontal}` : dx ? horizontal : vertical) as WorldDirection;
  return { dx, dy, dir, moving: true };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hitsObstacle = (x: number, y: number, radius: number, obstacles: WorldRect[]): boolean =>
  obstacles.some((rect) => x + radius > rect.x && x - radius < rect.x + rect.w && y + radius > rect.y && y - radius < rect.y + rect.h);

/**
 * 按按键集合推进一帧：速度归一化（斜向不加速）、边界钳制、障碍物按轴滑动。
 * dtSeconds 为距上一帧的秒数。
 */
export function applyMovement(
  position: WorldPoint,
  keys: ReadonlySet<string>,
  dtSeconds: number,
  bounds: WorldRect = worldBounds,
  obstacles: WorldRect[] = worldObstacles,
  radius: number = SPRITE_RADIUS,
): MoveResult {
  const { dx, dy, dir, moving } = directionLabel(keys);
  if (!moving) return { x: position.x, y: position.y, dir: 'down', moving: false };
  const scale = (WORLD_SPEED * dtSeconds) / Math.hypot(dx, dy);
  let nextX = clamp(position.x + dx * scale, bounds.x + radius, bounds.x + bounds.w - radius);
  let nextY = position.y;
  if (hitsObstacle(nextX, nextY, radius, obstacles)) nextX = position.x;
  nextY = clamp(position.y + dy * scale, bounds.y + radius, bounds.y + bounds.h - radius);
  if (hitsObstacle(nextX, nextY, radius, obstacles)) nextY = position.y;
  return { x: nextX, y: nextY, dir, moving: true };
}
