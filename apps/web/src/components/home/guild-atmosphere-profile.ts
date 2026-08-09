export type AtmosphereQuality = 'cinematic' | 'mobile' | 'static';

export type AtmosphereProfile = {
  enabled: boolean;
  quality: AtmosphereQuality;
  particleCount: number;
  maxPixelRatio: number;
  animateCamera: boolean;
};

export function chooseAtmosphereMode({
  width,
  webgl,
  reducedMotion,
}: {
  width: number;
  webgl: boolean;
  reducedMotion: boolean;
}): AtmosphereProfile {
  if (!webgl || reducedMotion) {
    return { enabled: false, quality: 'static', particleCount: 0, maxPixelRatio: 1, animateCamera: false };
  }

  if (width <= 640) {
    return { enabled: true, quality: 'mobile', particleCount: 26, maxPixelRatio: 1, animateCamera: false };
  }

  return { enabled: true, quality: 'cinematic', particleCount: 84, maxPixelRatio: 1.6, animateCamera: true };
}

export function calculateSceneScrollProgress({
  scrollY,
  heroTop,
  heroHeight,
}: {
  scrollY: number;
  heroTop: number;
  heroHeight: number;
  viewportHeight: number;
}) {
  const progress = (scrollY - heroTop) / Math.max(1, heroHeight);
  return Math.min(1, Math.max(0, progress));
}

export type ParallaxOffset = { x: number; y: number };

export function calculateLayerParallax({
  pointerX,
  pointerY,
  scrollProgress,
}: {
  pointerX: number;
  pointerY: number;
  scrollProgress: number;
}) {
  const x = Math.min(1, Math.max(-1, pointerX));
  const y = Math.min(1, Math.max(-1, pointerY));
  const scroll = Math.min(1, Math.max(0, scrollProgress));
  const offset = (xDepth: number, yDepth: number, scrollDepth: number): ParallaxOffset => ({
    x: Math.round(-x * xDepth),
    y: Math.round(-y * yDepth - scroll * scrollDepth),
  });

  return {
    cloud: offset(10, 4, 0),
    mountain: offset(6, 3, 4),
    farForest: offset(4, 2, 6),
    nearForest: offset(13, 5, 16),
    building: offset(19, 7, 36),
    party: offset(25, 8, 46),
  };
}
