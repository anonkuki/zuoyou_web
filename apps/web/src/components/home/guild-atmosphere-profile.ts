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
