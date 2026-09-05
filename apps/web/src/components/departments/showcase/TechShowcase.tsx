import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Aperture } from 'lucide-react';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { ClosingPanel } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, SectionHead, useHeroParallax } from '../shared';
import type { FilmEntry } from '../showcase-data';
import { usePageSectionItems } from '../../page-content/PageContentSurface';

/** 快门显影照片：快门叶片合拢→白闪帧→从模糊灰度显影为清晰彩色 */
function DevelopPhoto({ film, index }: { film: FilmEntry; index: number }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <figure className="vf-photo"><img src={film.cover} alt={`${film.title} 照片`} loading="lazy" decoding="async" /><figcaption><span>FA{String(index + 1).padStart(2, '0')}</span>{film.romaji} · {film.year}</figcaption></figure>;
  }
  return (
    <motion.figure className="vf-photo" initial="shut" whileInView="develop" viewport={{ once: true, margin: '-12% 0px' }} whileHover="focus">
      <motion.div className="vf-photo-window" variants={{ shut: { clipPath: 'inset(50% 0 50% 0)' }, develop: { clipPath: 'inset(0% 0 0% 0)', transition: { duration: .32, delay: index * .06, ease: [0.2, 0.9, 0.25, 1] } } }}>
        <motion.img
          src={film.cover} alt={`${film.title} 照片`} loading="lazy" decoding="async"
          variants={{
            shut: { filter: 'blur(14px) grayscale(1) brightness(.7)', scale: 1.08 },
            develop: { filter: 'blur(0px) grayscale(0) brightness(1)', scale: 1, transition: { duration: 1.6, delay: .3 + index * .06, ease: 'easeOut' } },
          }}
        />
        <motion.i className="vf-flash" aria-hidden="true" variants={{ shut: { opacity: 0 }, develop: { opacity: [0, .95, 0], transition: { duration: .42, delay: .26 + index * .06, times: [0, .14, 1] } } }} />
        <motion.span className="vf-photo-frame" aria-hidden="true" variants={{ focus: { opacity: 1, scale: 1 }, shut: { opacity: 0, scale: 1.15 }, develop: { opacity: 0, scale: 1.15 } }} transition={{ duration: .22, ease: [0.2, 0.9, 0.25, 1] }} />
      </motion.div>
      <figcaption><span>FA{String(index + 1).padStart(2, '0')}</span>{film.romaji} · {film.year}</figcaption>
    </motion.figure>
  );
}

/** 技术部 · 取景器 VIEWFINDER：机械快门入场 + 白闪帧 + 滚动驱动焦距参数 */
export function TechShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const wallRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: wallRef, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const focal = useTransform(smooth, [0, 1], [24, 85]);
  const focalText = useTransform(focal, value => `${Math.round(value)}mm`);
  const shutterText = useTransform(smooth, [0, 1], ['1/250', '1/60']);
  const addedPhotos = usePageSectionItems('tech-sheet').filter(item => item.imageUrl);

  return (
    <main className="dept-page dept-tech">
      <ChapterRail accent={show.accent} items={[
        { id: 'tech-focus', no: '01', label: show.sections[0].zh },
        { id: 'tech-sheet', no: '02', label: show.sections[1].zh },
        { id: 'tech-exif', no: '03', label: show.sections[2].zh },
      ]} />

      <section className="vf-hero showcase-hero" ref={heroRef} id="tech-focus">
        <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true">
          <img src={show.films[4].banner} alt="" fetchPriority="high" decoding="async" />
        </motion.div>
        <div className="hero-texture texture-scanlines" aria-hidden="true" />
        <div className="vf-thirds" aria-hidden="true"><i /><i /><b /><b /></div>
        <i className="vf-corner tl" aria-hidden="true" /><i className="vf-corner tr" aria-hidden="true" />
        <i className="vf-corner bl" aria-hidden="true" /><i className="vf-corner br" aria-hidden="true" />
        <div className="vf-hud vf-hud-top" aria-hidden="true">
          <span className="vf-rec-dot" /> REC
          <em>ISO 400</em><em>f/1.8</em><em>{reduce ? '1/250' : <motion.span>{shutterText}</motion.span>}</em><em>AWB</em>
        </div>
        <span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
        <motion.div className="showcase-hero-copy vf-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
          <span className="dept-kicker"><Aperture aria-hidden="true" /> {show.themeEn} · {dept.title}</span>
          <h1><WordReveal text={dept.name} /></h1>
          <p className="dept-tagline"><WordReveal text={show.tagline} /></p>
          <p className="dept-intro">{show.intro}</p>
          <PixelSprite slug="tech" className="hero-sprite" />
        </motion.div>
        <div className="vf-focus-box" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="vf-hud vf-hud-bottom" aria-hidden="true">
          <span>FOCUS {reduce ? '85mm' : <motion.span>{focalText}</motion.span>}</span>
          <span className="vf-level"><i /></span>
          <span>AF · SINGLE</span>
        </div>
      </section>

      <PixelDivider />

      <section className="vf-sheet-section" aria-label="底片夹" id="tech-sheet" ref={wallRef}>
        <SectionHead no="02" zh={show.sections[1].zh} en={show.sections[1].en} note="滚动时取景器持续对焦——每一张照片都从显影液里慢慢浮出颜色。" />
        <div className="vf-sheet">
          {show.films.map((f, index) => <DevelopPhoto key={f.cover} film={f} index={index} />)}
          {addedPhotos.map((item, index) => <figure className="vf-photo" key={item.id}><div className="vf-photo-window"><img src={item.imageUrl!} alt={item.title || '新增技术部照片'} loading="lazy" decoding="async" /></div><figcaption><span>NEW{String(index + 1).padStart(2, '0')}</span>{item.title || '新增照片'}{item.body && ` · ${item.body}`}</figcaption></figure>)}
        </div>
      </section>

      <PixelDivider flip />

      <ClosingPanel dept={dept} show={show} id="tech-exif" />
    </main>
  );
}
