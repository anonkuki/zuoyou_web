import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { Brush } from 'lucide-react';
import { originalPortfolioPhotos } from '../department-photos';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { ClosingPanel } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, DeptReveal, SectionHead, useHeroParallax } from '../shared';
import { usePageSectionItems } from '../../page-content/PageContentSurface';

/** 纪念碑谷式等距几何：彭罗斯三角 + 悬浮方块岛屿，随滚动缓慢 morph 重组 */
function IsoGeometry() {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref as unknown as RefObject<HTMLElement>, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 18 });
  const islandAY = useTransform(smooth, [0, 1], [0, -34]);
  const islandBY = useTransform(smooth, [0, 1], [0, 26]);
  const triRotate = useTransform(smooth, [0, 1], [0, 120]);
  const morph = (value: MotionValue<number>) => (reduce ? undefined : value);
  return (
    <svg ref={ref} className="atelier-iso" viewBox="0 0 420 360" aria-hidden="true">
      <motion.g style={{ rotate: morph(triRotate), transformOrigin: '210px 150px' }}>
        <path d="M210 60 300 210 H120 Z" fill="none" stroke="#a0c4ff" strokeWidth="14" strokeLinejoin="round" />
        <path d="M210 60 300 210 H262 L210 142 Z" fill="#a0c4ff" opacity=".55" />
        <path d="M120 210 H300 L262 210 210 92 Z" fill="#f7a8b8" opacity=".4" />
      </motion.g>
      <motion.g style={{ y: morph(islandAY) }}>
        <path d="M72 250 112 228 152 250 112 272 Z" fill="#a8e6cf" />
        <path d="M72 250 112 272 112 300 72 278 Z" fill="#7fcba8" />
        <path d="M152 250 112 272 112 300 152 278 Z" fill="#5fb58c" />
      </motion.g>
      <motion.g style={{ y: morph(islandBY) }}>
        <path d="M288 236 322 218 356 236 322 254 Z" fill="#fdffb6" />
        <path d="M288 236 322 254 322 278 288 260 Z" fill="#e3dc8e" />
        <path d="M356 236 322 254 322 278 356 260 Z" fill="#c9c26e" />
      </motion.g>
      <path className="atelier-doodle" d="M40 90 q 30 -38 62 -6 t 66 -8" fill="none" stroke="#f7a8b8" strokeWidth="5" strokeLinecap="round" />
      <path className="atelier-doodle" d="M300 300 q 26 22 58 4" fill="none" stroke="#a8e6cf" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

type RefObject<T> = { current: T | null };

/** 原创部 · 梦色画室 ATELIER：overshoot spring 回弹入场 + 多层漂浮视差 + 等距几何 morph */
export function OriginalShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const galleryRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: galleryRef, offset: ['start end', 'end start'] });
  const driftSlow = useTransform(scrollYProgress, [0, 1], [0, -46]);
  const driftFast = useTransform(scrollYProgress, [0, 1], [0, -104]);
  const drift = (index: number) => (reduce ? undefined : index % 2 ? driftFast : driftSlow);
  const addedWorks = usePageSectionItems('original-gallery').filter(item => item.imageUrl);

  return (
    <main className="dept-page dept-original">
      <ChapterRail items={[
        { id: 'original-atelier', no: '01', label: show.sections[0].zh },
        { id: 'original-gallery', no: '02', label: show.sections[1].zh },
        { id: 'original-toolbox', no: '03', label: show.sections[2].zh },
      ]} />

      <section className="atelier-hero showcase-hero" ref={heroRef} id="original-atelier">
        <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true">
          <img src={show.films[0].banner} alt="" fetchPriority="high" decoding="async" />
        </motion.div>
        <div className="hero-texture texture-paper" aria-hidden="true" />
        <div className="atelier-wash" aria-hidden="true"><i className="wash w1" /><i className="wash w2" /><i className="wash w3" /></div>
        <span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
        <motion.div className="showcase-hero-copy atelier-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
          <span className="dept-kicker"><Brush aria-hidden="true" /> {show.themeEn} · {dept.title}</span>
          <h1><WordReveal text={dept.name} /></h1>
          <p className="dept-tagline atelier-crayon"><WordReveal text={show.tagline} /></p>
          <p className="dept-intro">{show.intro}</p>
          <PixelSprite slug="original" className="hero-sprite" />
        </motion.div>
        <IsoGeometry />
      </section>

      <PixelDivider />

      <section className="atelier-gallery" aria-label="作品集锦" id="original-gallery" ref={galleryRef}>
        <SectionHead no="02" zh={show.sections[1].zh} en={show.sections[1].en} note="原创作品被装进悬浮画框，记录每一份从灵感走向成稿的创作。" />
        <div className="atelier-frames">
          {originalPortfolioPhotos.map((photo, index) => (
            <DeptReveal key={photo.src} slug="original" index={index} className={`atelier-frame frame-float-${index % 3}`}>
              <motion.figure style={{ y: drift(index) }}>
                <i className="washi-tape" aria-hidden="true" />
                <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
                <figcaption><strong>{photo.caption}</strong><span>ORIGINAL CLUB WORKS · 2026</span></figcaption>
              </motion.figure>
            </DeptReveal>
          ))}
          {addedWorks.map((item, index) => (
            <DeptReveal key={item.id} slug="original" index={originalPortfolioPhotos.length + index} className={`atelier-frame frame-float-${index % 3}`}>
              <figure><i className="washi-tape" aria-hidden="true" /><img src={item.imageUrl!} alt={item.title || '新增作品'} loading="lazy" decoding="async" /><figcaption><strong>{item.title || '新增作品'}</strong><span>{item.body || 'ORIGINAL CLUB WORKS'}</span></figcaption></figure>
            </DeptReveal>
          ))}
        </div>
      </section>

      <PixelDivider flip />

      <ClosingPanel dept={dept} show={show} id="original-toolbox" />
    </main>
  );
}
