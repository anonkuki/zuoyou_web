import { useEffect, type RefObject } from 'react';
import { calculateLayerParallax, calculateSceneScrollProgress, type ParallaxOffset } from './guild-atmosphere-profile';

const mixOffset = (from: ParallaxOffset, to: ParallaxOffset, amount: number): ParallaxOffset => ({
  x: Math.round(from.x + (to.x - from.x) * amount),
  y: Math.round(from.y + (to.y - from.y) * amount),
});

export function useGuildSceneParallax(sceneRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const scene = sceneRef.current;
    const hero = scene?.closest<HTMLElement>('.guild-hero');
    if (!scene || !hero) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      scene.dataset.motion = 'static-reduced-motion';
      return;
    }

    const targets = {
      cloud: scene.querySelector<HTMLElement>('.clouds-layer'),
      mountain: [scene.querySelector<HTMLElement>('.sunlit-mountains-layer'), scene.querySelector<HTMLElement>('.castle-layer')],
      farForest: scene.querySelector<HTMLElement>('.forest-far'),
      midForestA: scene.querySelector<HTMLElement>('.forest-mid-a'),
      midForestB: scene.querySelector<HTMLElement>('.forest-mid-b'),
      nearForest: [scene.querySelector<HTMLElement>('.forest-near-a'), scene.querySelector<HTMLElement>('.forest-near-b')],
      ground: scene.querySelector<HTMLElement>('.valley-floor'),
      trees: Array.from(scene.querySelectorAll<HTMLElement>('.scene-tree')),
      approach: scene.querySelector<HTMLElement>('.guild-approach'),
      building: scene.querySelector<HTMLElement>('.guild-building-art'),
      culture: scene.querySelector<HTMLElement>('.anime-culture-props'),
      party: scene.querySelector<HTMLElement>('.licensed-party'),
    };
    const allTargets = [
      targets.cloud,
      ...targets.mountain,
      targets.farForest,
      targets.midForestA,
      targets.midForestB,
      ...targets.nearForest,
      targets.ground,
      ...targets.trees,
      targets.approach,
      targets.building,
      targets.culture,
      targets.party,
    ].filter((target): target is HTMLElement => Boolean(target));

    let frame = 0;
    let visible = true;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollProgress = 0;

    const writeOffset = (target: HTMLElement | null, offset: ParallaxOffset, intensity = 1) => {
      if (!target) return;
      target.style.translate = `${Math.round(offset.x * intensity)}px ${Math.round(offset.y * intensity)}px`;
    };
    const writeMany = (elements: Array<HTMLElement | null>, offset: ParallaxOffset, intensity = 1) => {
      elements.forEach((element) => writeOffset(element, offset, intensity));
    };
    const updateScroll = () => {
      const rect = hero.getBoundingClientRect();
      scrollProgress = calculateSceneScrollProgress({
        scrollY: window.scrollY,
        heroTop: rect.top + window.scrollY,
        heroHeight: rect.height,
        viewportHeight: window.innerHeight,
      });
    };
    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = scene.getBoundingClientRect();
      targetX = Math.min(1, Math.max(-1, ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2));
      targetY = Math.min(1, Math.max(-1, ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2));
    };
    const resetPointer = () => {
      targetX = 0;
      targetY = 0;
    };
    const renderMotion = (now: number) => {
      if (!visible) return;
      const ambientX = Math.sin(now * 0.00034) * 0.32;
      const ambientY = Math.cos(now * 0.00027) * 0.16;
      pointerX += (targetX + ambientX - pointerX) * 0.055;
      pointerY += (targetY + ambientY - pointerY) * 0.055;
      const offsets = calculateLayerParallax({ pointerX, pointerY, scrollProgress });
      const mobileIntensity = window.innerWidth <= 640 ? 0.42 : 1;
      const midA = mixOffset(offsets.farForest, offsets.nearForest, 0.34);
      const midB = mixOffset(offsets.farForest, offsets.nearForest, 0.68);

      writeOffset(targets.cloud, offsets.cloud, mobileIntensity);
      writeMany(targets.mountain, offsets.mountain, mobileIntensity);
      writeOffset(targets.farForest, offsets.farForest, mobileIntensity);
      writeOffset(targets.midForestA, midA, mobileIntensity);
      writeOffset(targets.midForestB, midB, mobileIntensity);
      writeMany(targets.nearForest, offsets.nearForest, mobileIntensity);
      writeOffset(targets.ground, offsets.nearForest, mobileIntensity * 0.88);
      writeMany(targets.trees, offsets.nearForest, mobileIntensity * 1.08);
      writeOffset(targets.approach, offsets.building, mobileIntensity * 0.78);
      writeOffset(targets.building, offsets.building, mobileIntensity);
      writeOffset(targets.culture, offsets.building, mobileIntensity * 1.08);
      writeOffset(targets.party, offsets.party, mobileIntensity);
      scene.style.setProperty('--scene-motion-x', pointerX.toFixed(3));
      scene.style.setProperty('--scene-motion-y', pointerY.toFixed(3));
      frame = window.requestAnimationFrame(renderMotion);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        frame = window.requestAnimationFrame(renderMotion);
      } else if (!entry.isIntersecting) {
        visible = false;
        window.cancelAnimationFrame(frame);
      }
    }, { threshold: 0.01 });
    observer.observe(hero);
    window.addEventListener('scroll', updateScroll, { passive: true });
    hero.addEventListener('pointermove', updatePointer, { passive: true });
    hero.addEventListener('pointerleave', resetPointer, { passive: true });
    updateScroll();
    allTargets.forEach((target) => { target.style.translate = '0px'; });
    scene.dataset.motion = 'parallax-ready';
    frame = window.requestAnimationFrame(renderMotion);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', updateScroll);
      hero.removeEventListener('pointermove', updatePointer);
      hero.removeEventListener('pointerleave', resetPointer);
      allTargets.forEach((target) => { target.style.translate = ''; });
      delete scene.dataset.motion;
      scene.style.removeProperty('--scene-motion-x');
      scene.style.removeProperty('--scene-motion-y');
    };
  }, [sceneRef]);
}
