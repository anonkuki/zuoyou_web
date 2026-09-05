import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { ClosingPanel } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, DeptReveal, entranceProps, SectionHead, useHeroParallax } from '../shared';
import { usePageSectionItems } from '../../page-content/PageContentSurface';

const marqueeText = '佐佑舞装部 · STARDUST STAGE · ON STAGE · 星轨舞台 · ';

/** 舞装部 · 星轨舞台 STARDUST STAGE：110BPM 节拍入场（预备+弹跳落位+skew）+ 聚光灯 + 双行反向 marquee */
export function DanceShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const reduce = useReducedMotion();
  const addedPerformances = usePageSectionItems('dance-floor').filter(item => item.imageUrl);
  return (
    <main className="dept-page dept-dance">
      <ChapterRail items={[
        { id: 'dance-floor', no: '01', label: show.sections[0].zh },
        { id: 'dance-setlist', no: '02', label: show.sections[1].zh },
        { id: 'dance-backstage', no: '03', label: show.sections[2].zh },
      ]} />

      <section className="stage-hero showcase-hero" ref={heroRef} id="dance-stage">
        <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true">
          <img src={show.films[1].banner} alt="" fetchPriority="high" decoding="async" />
        </motion.div>
        <div className="hero-texture texture-stars" aria-hidden="true" />
        <div className="stage-stars" aria-hidden="true" />
        <div className="stage-beams" aria-hidden="true"><i className="beam b1" /><i className="beam b2" /><i className="beam b3" /></div>
        <span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
        <motion.div className="showcase-hero-copy stage-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
          <span className="dept-kicker"><Zap aria-hidden="true" /> {show.themeEn} · {dept.title}</span>
          <h1><WordReveal text={dept.name} /></h1>
          <p className="dept-tagline"><WordReveal text={show.tagline} /></p>
          <p className="dept-intro">{show.intro}</p>
          <div className="stage-beat" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <PixelSprite slug="dance" className="hero-sprite" />
        </motion.div>
        <div className="stage-marquee" aria-hidden="true">
          <div className="marquee-row row-a"><span>{marqueeText.repeat(4)}</span></div>
          <div className="marquee-row row-b"><span>{marqueeText.repeat(4)}</span></div>
        </div>
      </section>

      <section className="stage-floor-section" aria-label="演出中" id="dance-floor">
        <SectionHead no="01" zh={show.sections[0].zh} en={show.sections[0].en} note="封面卡立在倾斜的舞台地板上——灯光扫过时，跟着节拍一起弹起来。" />
        <div className="stage-floor">
          <div className="stage-floor-grid" aria-hidden="true" />
          <div className="stage-cards">
            {show.films.map((f, index) => (
              <DeptReveal key={f.cover} slug="dance" index={index} className="stage-card-wrap">
                <motion.figure className="stage-card" whileHover={{ y: -14, rotate: index % 2 ? 2.5 : -2.5 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}>
                  <img src={f.cover} alt={`${f.title} 节目海报`} loading="lazy" decoding="async" />
                  <figcaption><span>M{index + 1}</span>{f.romaji}</figcaption>
                </motion.figure>
              </DeptReveal>
            ))}
            {addedPerformances.map((item, index) => <DeptReveal key={item.id} slug="dance" index={show.films.length + index} className="stage-card-wrap">
              <motion.figure className="stage-card" whileHover={{ y: -14 }}><img src={item.imageUrl!} alt={item.title || '新增演出照片'} loading="lazy" decoding="async" /><figcaption><span>N{index + 1}</span>{item.title || '新增演出'}</figcaption></motion.figure>
            </DeptReveal>)}
          </div>
        </div>
      </section>

      <PixelDivider />

      <section className="stage-setlist" aria-label="节目单" id="dance-setlist">
        <SectionHead no="02" zh={show.sections[1].zh} en={show.sections[1].en} />
        <ol className="stage-setlist-rows">
          {show.films.map((f, index) => (
            <motion.li key={f.cover} {...(reduce ? {} : entranceProps('dance', index))}>
              <span className="setlist-no">{String(index + 1).padStart(2, '0')}</span>
              <strong>{f.title}</strong>
              <em>{f.romaji}</em>
              <span className="setlist-year">{f.year}</span>
            </motion.li>
          ))}
        </ol>
      </section>

      <PixelDivider flip />

      <ClosingPanel dept={dept} show={show} id="dance-backstage" />
    </main>
  );
}
