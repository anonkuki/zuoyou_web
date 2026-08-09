import { useEffect, useMemo, useRef } from 'react';
import { calculateSceneScrollProgress, chooseAtmosphereMode } from './guild-atmosphere-profile';

function supportsWebGL() {
  if (typeof window === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

function readProfile() {
  if (typeof window === 'undefined') {
    return chooseAtmosphereMode({ width: 1440, webgl: false, reducedMotion: true });
  }
  return chooseAtmosphereMode({
    width: window.innerWidth,
    webgl: supportsWebGL(),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
}

export function GuildAtmosphereCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const profile = useMemo(readProfile, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile.enabled) return;

    let disposed = false;
    let animationFrame = 0;
    let visible = true;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let renderer: import('three').WebGLRenderer | undefined;
    let scene: import('three').Scene | undefined;

    void import('three').then((THREE) => {
      if (disposed) return;

      const host = canvas.parentElement;
      const hero = canvas.closest<HTMLElement>('.guild-hero');
      if (!host || !hero) return;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.maxPixelRatio));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x315e5d, profile.quality === 'mobile' ? 0.035 : 0.026);
      const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 50);
      camera.position.set(0, 0.15, 10);

      const world = new THREE.Group();
      scene.add(world);

      const positions = new Float32Array(profile.particleCount * 3);
      const colors = new Float32Array(profile.particleCount * 3);
      const particlePhases = new Float32Array(profile.particleCount);
      const gold = new THREE.Color(0xffd77b);
      const mint = new THREE.Color(0xa6e5be);
      for (let index = 0; index < profile.particleCount; index += 1) {
        const offset = index * 3;
        positions[offset] = (Math.random() - 0.5) * 15;
        positions[offset + 1] = (Math.random() - 0.5) * 7;
        positions[offset + 2] = -Math.random() * 7;
        particlePhases[index] = Math.random() * Math.PI * 2;
        const color = index % 4 === 0 ? mint : gold;
        colors[offset] = color.r;
        colors[offset + 1] = color.g;
        colors[offset + 2] = color.b;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
        size: profile.quality === 'mobile' ? 0.055 : 0.072,
        transparent: true,
        opacity: 0.74,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }));
      world.add(particles);

      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 128;
      glowCanvas.height = 128;
      const glowContext = glowCanvas.getContext('2d');
      if (glowContext) {
        const gradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255,245,176,.95)');
        gradient.addColorStop(.16, 'rgba(255,197,88,.55)');
        gradient.addColorStop(1, 'rgba(255,167,50,0)');
        glowContext.fillStyle = gradient;
        glowContext.fillRect(0, 0, 128, 128);
      }
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      const glowMaterial = new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false });
      const lanternGlows = [
        { x: 2.83, y: 0.03, scale: 1.35 },
        { x: 4.08, y: 0.03, scale: 1.25 },
        { x: 3.47, y: 1.62, scale: 1.1 },
      ].map(({ x, y, scale }) => {
        const sprite = new THREE.Sprite(glowMaterial.clone());
        sprite.position.set(x, y, -1.2);
        sprite.scale.setScalar(scale);
        world.add(sprite);
        return sprite;
      });

      const rayCanvas = document.createElement('canvas');
      rayCanvas.width = 64;
      rayCanvas.height = 256;
      const rayContext = rayCanvas.getContext('2d');
      if (rayContext) {
        const rayGradient = rayContext.createLinearGradient(0, 0, 0, 256);
        rayGradient.addColorStop(0, 'rgba(255,248,185,.38)');
        rayGradient.addColorStop(.45, 'rgba(255,236,151,.12)');
        rayGradient.addColorStop(1, 'rgba(255,229,134,0)');
        rayContext.fillStyle = rayGradient;
        rayContext.fillRect(0, 0, 64, 256);
      }
      const rayTexture = new THREE.CanvasTexture(rayCanvas);
      const rayMaterial = new THREE.MeshBasicMaterial({ map: rayTexture, transparent: true, opacity: profile.quality === 'mobile' ? 0.14 : 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 10), rayMaterial);
      ray.position.set(-3.45, 1.65, -2.6);
      ray.rotation.z = -0.31;
      world.add(ray);

      const mouse = { x: 0, y: 0 };
      let targetProgress = 0;
      let smoothProgress = 0;
      let lastTime = performance.now();

      const resize = () => {
        if (!renderer) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.fov = width <= 640 ? 52 : 43;
        camera.updateProjectionMatrix();
      };
      const updateProgress = () => {
        const rect = hero.getBoundingClientRect();
        targetProgress = calculateSceneScrollProgress({
          scrollY: window.scrollY,
          heroTop: rect.top + window.scrollY,
          heroHeight: rect.height,
          viewportHeight: window.innerHeight,
        });
      };
      const updatePointer = (event: PointerEvent) => {
        if (!profile.animateCamera || event.pointerType === 'touch') return;
        mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
      };

      const renderFrame = (now: number) => {
        if (disposed) return;
        const delta = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        smoothProgress += (targetProgress - smoothProgress) * Math.min(1, delta * 4.2);
        const time = now * 0.001;

        const positionAttribute = particleGeometry.getAttribute('position') as import('three').BufferAttribute;
        const particlePositions = positionAttribute.array as Float32Array;
        for (let index = 0; index < profile.particleCount; index += 1) {
          const offset = index * 3;
          particlePositions[offset + 1] += Math.sin(time * 0.72 + particlePhases[index]) * delta * 0.025;
          particlePositions[offset] += Math.cos(time * 0.3 + particlePhases[index]) * delta * 0.014;
        }
        positionAttribute.needsUpdate = true;
        particles.rotation.y = time * 0.012;
        particles.material.opacity = 0.64 + Math.sin(time * 0.55) * 0.1;
        ray.material.opacity = (profile.quality === 'mobile' ? 0.12 : 0.22) + Math.sin(time * 0.24) * 0.035;
        lanternGlows.forEach((sprite, index) => {
          const pulse = 1 + Math.sin(time * (2.1 + index * 0.27) + index) * 0.08;
          sprite.scale.setScalar((index === 2 ? 1.1 : 1.3) * pulse);
        });

        camera.position.x += (mouse.x * 0.18 + smoothProgress * 0.12 - camera.position.x) * Math.min(1, delta * 2.8);
        camera.position.y += (-mouse.y * 0.1 + smoothProgress * 0.34 + 0.15 - camera.position.y) * Math.min(1, delta * 2.8);
        camera.position.z += (10 - smoothProgress * 0.9 - camera.position.z) * Math.min(1, delta * 2.4);
        world.rotation.y += (mouse.x * 0.018 - world.rotation.y) * Math.min(1, delta * 2.2);
        world.position.y = smoothProgress * 0.22;
        camera.lookAt(0, 0.15 + smoothProgress * 0.12, 0);

        renderer?.render(scene!, camera);
        if (visible) animationFrame = window.requestAnimationFrame(renderFrame);
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      intersectionObserver = new IntersectionObserver(([entry]) => {
        const nextVisible = entry.isIntersecting;
        if (nextVisible && !visible) {
          visible = true;
          lastTime = performance.now();
          animationFrame = window.requestAnimationFrame(renderFrame);
        } else if (!nextVisible) {
          visible = false;
          window.cancelAnimationFrame(animationFrame);
        }
      }, { threshold: 0.01 });
      intersectionObserver.observe(hero);
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('pointermove', updatePointer, { passive: true });
      resize();
      updateProgress();
      animationFrame = window.requestAnimationFrame(renderFrame);

      const disposeScene = () => {
        window.cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', updateProgress);
        window.removeEventListener('pointermove', updatePointer);
        scene?.traverse((object) => {
          const mesh = object as import('three').Mesh;
          mesh.geometry?.dispose?.();
          const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
          materials.forEach((material) => {
            const textured = material as import('three').Material & { map?: import('three').Texture };
            textured.map?.dispose();
            material.dispose();
          });
        });
        renderer?.dispose();
      };
      canvas.dataset.disposeReady = 'true';
      canvas.addEventListener('guild-atmosphere-dispose', disposeScene, { once: true });
    }).catch(() => {
      canvas.parentElement?.setAttribute('data-renderer', 'static-fallback');
    });

    return () => {
      disposed = true;
      canvas.dispatchEvent(new Event('guild-atmosphere-dispose'));
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      renderer?.dispose();
    };
  }, [profile]);

  return (
    <div
      className="guild-atmosphere-canvas"
      data-testid="guild-atmosphere-canvas"
      data-renderer={profile.enabled ? 'three' : 'static-fallback'}
      data-quality={profile.quality}
      aria-hidden="true"
    >
      {profile.enabled ? <canvas ref={canvasRef} data-three-layer="guild-light-and-air" /> : null}
    </div>
  );
}
