import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { ClosingPanel } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, DeptReveal, SectionHead, useHeroParallax } from '../shared';
import { usePageSectionItems } from '../../page-content/PageContentSurface';

/** 外宣&幻想研 · 白箱影院 SHIROBAKO CINEMA：黑白漫画影院 + 逐帧跳进 + 胶片条 scroll-snap + 放映机闪烁 */
export function PublicityShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const addedShowing = usePageSectionItems('publicity-show').filter(item => item.imageUrl);
  const addedFilms = usePageSectionItems('publicity-films').filter(item => item.imageUrl);
  return (
    <main className="dept-page dept-publicity">
      <ChapterRail accent={show.accent} items={[
        { id: 'publicity-show', no: '01', label: show.sections[0].zh },
        { id: 'publicity-films', no: '02', label: show.sections[1].zh },
        { id: 'publicity-press', no: '03', label: show.sections[2].zh },
      ]} />

      <section className="cinema-hero showcase-hero" ref={heroRef}>
        <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true">
          <img src={show.films[0].banner} alt="" fetchPriority="high" decoding="async" />
        </motion.div>
        <motion.div className="hero-layer layer-near" style={{ y: parallax.near }} aria-hidden="true">
          <img src={show.films[7].banner} alt="" loading="lazy" decoding="async" />
        </motion.div>
        <div className="hero-texture texture-halftone" aria-hidden="true" />
        <div className="cinema-speedlines" aria-hidden="true" />
        <div className="projector-flicker" aria-hidden="true" />
        <span className="cinema-onoma onoma-don" aria-hidden="true">ドン</span>
        <span className="cinema-onoma onoma-gogo" aria-hidden="true">ゴゴゴ</span>
        <span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
        <motion.div className="showcase-hero-copy cinema-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
          <div className="cinema-marquee" aria-hidden="true">
            <span className="cinema-bulbs"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
            <strong>NOW SHOWING</strong>
            <span className="cinema-bulbs"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
          </div>
          <span className="dept-kicker"><Clapperboard aria-hidden="true" /> {show.themeEn} · {dept.title}</span>
          <h1><WordReveal text={dept.name} /></h1>
          <p className="dept-tagline"><WordReveal text={show.tagline} /></p>
          <p className="dept-intro">{show.intro}</p>
          <PixelSprite slug="publicity" className="hero-sprite" />
        </motion.div>
      </section>

      <section className="cinema-strip-section" aria-label="正在上映" id="publicity-show">
        <SectionHead no="01" zh={show.sections[0].zh} en={show.sections[0].en} note="胶片条上的每一格，都是被我们点亮的故事—— hover 让它们褪去黑白。" />
        <div className="cinema-strip" tabIndex={0} aria-label="横向胶片条，可横向滚动浏览十二张海报">
          {show.films.map((f, index) => (
            <DeptReveal key={f.cover} slug="publicity" index={index % 4} className="cinema-frame-wrap">
              <motion.figure className="cinema-frame" whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }}>
                <img src={f.cover} alt={`${f.romaji}（${f.year}）海报`} loading="lazy" decoding="async" />
                <figcaption><span>{String(index + 1).padStart(2, '0')}</span>{f.romaji}</figcaption>
              </motion.figure>
            </DeptReveal>
          ))}
          {addedShowing.map((item, index) => <DeptReveal key={item.id} slug="publicity" index={index % 4} className="cinema-frame-wrap">
            <motion.figure className="cinema-frame" whileHover={{ y: -8 }}><img src={item.imageUrl!} alt={item.title || '新增放映记录'} loading="lazy" decoding="async" /><figcaption><span>N{String(index + 1).padStart(2, '0')}</span>{item.title || '新增内容'}</figcaption></motion.figure>
          </DeptReveal>)}
        </div>
      </section>

      <PixelDivider />

      <section className="cinema-panels" aria-label="年度片单" id="publicity-films">
        <SectionHead no="02" zh={show.sections[1].zh} en={show.sections[1].en} />
        <div className="cinema-panel-grid">
          {show.films.map((f, index) => (
            <DeptReveal key={f.cover} slug="publicity" index={index % 3} className={`cinema-panel panel-tilt-${index % 3}`}>
              <figure>
                <img src={f.cover} alt={`${f.title} 海报`} loading="lazy" decoding="async" />
                <figcaption><strong>{f.title}</strong><span>{f.romaji} · {f.year}</span></figcaption>
              </figure>
            </DeptReveal>
          ))}
          {addedFilms.map((item, index) => <DeptReveal key={item.id} slug="publicity" index={index % 3} className={`cinema-panel panel-tilt-${index % 3}`}>
            <figure><img src={item.imageUrl!} alt={item.title || '新增年度片单'} loading="lazy" decoding="async" /><figcaption><strong>{item.title || '新增内容'}</strong><span>{item.body || 'PUBLICITY ARCHIVE'}</span></figcaption></figure>
          </DeptReveal>)}
        </div>
      </section>

      <PixelDivider flip />

      <ClosingPanel dept={dept} show={show} id="publicity-press" />
    </main>
  );
}
