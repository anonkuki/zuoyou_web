import { describe, expect, it } from 'vitest';
import { calculateLayerParallax, calculateSceneScrollProgress, chooseAtmosphereMode } from './guild-atmosphere-profile';

describe('guild atmosphere quality profile', () => {
  it('uses the cinematic renderer on capable desktop screens', () => {
    expect(chooseAtmosphereMode({ width: 1440, webgl: true, reducedMotion: false })).toEqual({
      enabled: true,
      quality: 'cinematic',
      particleCount: 84,
      maxPixelRatio: 1.6,
      animateCamera: true,
    });
  });

  it('keeps a lightweight atmosphere on mobile without stretching the composition', () => {
    expect(chooseAtmosphereMode({ width: 390, webgl: true, reducedMotion: false })).toEqual({
      enabled: true,
      quality: 'mobile',
      particleCount: 26,
      maxPixelRatio: 1,
      animateCamera: false,
    });
  });

  it('uses the existing artwork as a complete fallback when motion is reduced', () => {
    expect(chooseAtmosphereMode({ width: 1440, webgl: true, reducedMotion: true })).toEqual({
      enabled: false,
      quality: 'static',
      particleCount: 0,
      maxPixelRatio: 1,
      animateCamera: false,
    });
  });

  it('does not mount WebGL when the browser cannot provide it', () => {
    expect(chooseAtmosphereMode({ width: 1440, webgl: false, reducedMotion: false }).enabled).toBe(false);
  });

  it('maps only the hero travel distance to a stable zero-to-one camera path', () => {
    expect(calculateSceneScrollProgress({ scrollY: -20, heroTop: 0, heroHeight: 690, viewportHeight: 900 })).toBe(0);
    expect(calculateSceneScrollProgress({ scrollY: 345, heroTop: 0, heroHeight: 690, viewportHeight: 900 })).toBeCloseTo(0.5);
    expect(calculateSceneScrollProgress({ scrollY: 1200, heroTop: 0, heroHeight: 690, viewportHeight: 900 })).toBe(1);
  });

  it('separates foreground motion from distant scenery strongly enough to read as depth', () => {
    const offsets = calculateLayerParallax({ pointerX: 1, pointerY: -1, scrollProgress: 0.5 });
    expect(offsets.cloud).toEqual({ x: -10, y: 4 });
    expect(offsets.mountain).toEqual({ x: -6, y: 1 });
    expect(offsets.farForest).toEqual({ x: -4, y: -1 });
    expect(offsets.nearForest).toEqual({ x: -13, y: -3 });
    expect(offsets.building).toEqual({ x: -19, y: -11 });
    expect(offsets.party).toEqual({ x: -25, y: -15 });
    expect(Math.abs(offsets.party.x)).toBeGreaterThan(Math.abs(offsets.cloud.x) * 2);
  });
});
