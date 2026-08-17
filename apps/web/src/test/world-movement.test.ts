import { describe, expect, it } from 'vitest';
import { applyMovement, directionLabel, normalizeKey, worldBounds, worldObstacles, WORLD_SPEED } from '../world-movement';

describe('world movement', () => {
  it('normalizes WASD and arrow keys', () => {
    expect(normalizeKey('w')).toBe('up');
    expect(normalizeKey('ArrowDown')).toBe('down');
    expect(normalizeKey('A')).toBe('left');
    expect(normalizeKey('ArrowRight')).toBe('right');
    expect(normalizeKey('x')).toBeNull();
  });

  it('derives eight-way directions from key sets', () => {
    expect(directionLabel(new Set()).moving).toBe(false);
    expect(directionLabel(new Set(['up']))).toMatchObject({ dx: 0, dy: -1, dir: 'up', moving: true });
    expect(directionLabel(new Set(['down', 'right']))).toMatchObject({ dir: 'down-right', moving: true });
    expect(directionLabel(new Set(['up', 'left']))).toMatchObject({ dir: 'up-left', moving: true });
  });

  it('moves at constant speed and normalizes diagonals', () => {
    const straight = applyMovement({ x: 480, y: 430 }, new Set(['right']), 1, worldBounds, []);
    expect(straight.x).toBeCloseTo(480 + WORLD_SPEED, 5);
    const diagonal = applyMovement({ x: 480, y: 430 }, new Set(['right', 'up']), 1, worldBounds, []);
    expect(Math.hypot(diagonal.x - 480, diagonal.y - 430)).toBeCloseTo(WORLD_SPEED, 5);
  });

  it('clamps movement at the map boundary', () => {
    const result = applyMovement({ x: worldBounds.w - 20, y: 100 }, new Set(['right']), 1, worldBounds, []);
    expect(result.x).toBe(worldBounds.w - 16);
    const top = applyMovement({ x: 100, y: 20 }, new Set(['up']), 1, worldBounds, []);
    expect(top.y).toBe(16);
  });

  it('blocks obstacle entry per axis while allowing sliding', () => {
    const lodge = worldObstacles[0];
    const fromLeft = { x: lodge.x - 30, y: lodge.y + lodge.h / 2 };
    const blocked = applyMovement(fromLeft, new Set(['right']), 1, worldBounds, [lodge]);
    expect(blocked.x).toBe(fromLeft.x);
    const sliding = applyMovement(fromLeft, new Set(['right', 'up']), 0.5, worldBounds, [lodge]);
    expect(sliding.x).toBe(fromLeft.x);
    expect(sliding.y).toBeLessThan(fromLeft.y);
  });

  it('stays in place when no keys are pressed', () => {
    const idle = applyMovement({ x: 300, y: 300 }, new Set(), 0.016, worldBounds, []);
    expect(idle).toMatchObject({ x: 300, y: 300, moving: false });
  });
});
