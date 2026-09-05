import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { ClosingPanel } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, SectionHead, useHeroParallax } from '../shared';
import type { FilmEntry } from '../showcase-data';
import { usePageSectionItems } from '../../page-content/PageContentSurface';

/** 变身卡：素颜（灰度剪影）⇢ 上妆（全彩），clip-path 圆形擦除 + 交叉溶解长缓动 */
function HenshinCard({ film, index }: { film: FilmEntry; index: number }) {
  return (
    <motion.figure
      className="henshin-card"
      initial="before"
      whileInView="after"
      whileHover="after"
      viewport={{ once: true, margin: '-14% 0px' }}
    >
      <motion.img
        className="henshin-before" src={film.cover} alt="" aria-hidden="true" loading="lazy" decoding="async"
        variants={{ before: { opacity: 1 }, after: { opacity: .35, transition: { duration: 1.3, delay: index * .1, ease: [0.22, 1, 0.36, 1] } } }}
      />
      <motion.img
        className="henshin-after" src={film.cover} alt={`${film.title} 定妆照`} loading="lazy" decoding="async"
        variants={{
          before: { clipPath: 'circle(0% at 50% 42%)' },
          after: { clipPath: 'circle(78% at 50% 42%)', transition: { duration: 1.3, delay: index * .1, ease: [0.22, 1, 0.36, 1] } },
        }}
      />
      <motion.span className="henshin-ring" aria-hidden="true" variants={{ before: { opacity: .9, scale: .4 }, after: { opacity: 0, scale: 1.6, transition: { duration: 1.3, delay: index * .1 } } }} />
      <figcaption>
        <span className="henshin-label label-before">BEFORE</span>
        <span className="henshin-label label-after">AFTER</span>
        <strong>{film.title}</strong>
      </figcaption>
    </motion.figure>
  );
}

/** COS部 · 镜中变身 HENSHIN MIRROR：镜面 hero + before→after 丝滑变身序列 + 柔边 blob 渐变旅程 */
export function CosShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const addedTransformations = usePageSectionItems('cos-henshin').filter(item => item.imageUrl);
  return (
    <main className="dept-page dept-cos">
      <ChapterRail accent={show.accent} items={[
        { id: 'cos-mirror', no: '01', label: show.sections[0].zh },
        { id: 'cos-henshin', no: '02', label: show.sections[1].zh },
        { id: 'cos-wardrobe', no: '03', label: show.sections[2].zh },
      ]} />

      <section className="mirror-hero showcase-hero" ref={heroRef} id="cos-mirror">
        <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true">
          <img src={show.films[0].banner} alt="" fetchPriority="high" decoding="async" />
        </motion.div>
        <div className="hero-texture texture-mirror" aria-hidden="true" />
        <div className="mirror-blob blob-a" aria-hidden="true" /><div className="mirror-blob blob-b" aria-hidden="true" />
        <span className="mirror-butterfly" aria-hidden="true" />
        <span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
        <div className="mirror-frame" aria-hidden="true">
          <div className="mirror-glass">
            <span className="mirror-sweep" />
            <em>HENSHIN</em>
          </div>
        </div>
        <motion.div className="showcase-hero-copy mirror-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
          <span className="dept-kicker"><Sparkles aria-hidden="true" /> {show.themeEn} · {dept.title}</span>
          <h1><WordReveal text={dept.name} /></h1>
          <p className="dept-tagline"><WordReveal text={show.tagline} /></p>
          <p className="dept-intro">{show.intro}</p>
          <PixelSprite slug="cos" className="hero-sprite" />
        </motion.div>
      </section>

      <PixelDivider />

      <section className="mirror-transformations" aria-label="变身记录" id="cos-henshin">
        <SectionHead no="02" zh={show.sections[1].zh} en={show.sections[1].en} note="进入视口或 hover，看它们从素颜剪影变成全彩的「成为」。" />
        <div className="henshin-grid">
          {show.films.map((f, index) => <HenshinCard key={f.cover} film={f} index={index} />)}
          {addedTransformations.map(item => <motion.figure className="henshin-card" whileHover={{ y: -8 }} key={item.id}>
            <img className="henshin-after" src={item.imageUrl!} alt={item.title || '新增变身记录'} loading="lazy" decoding="async" />
            <figcaption><span className="henshin-label label-after">NEW</span><strong>{item.title || '新增变身记录'}</strong>{item.body && <small>{item.body}</small>}</figcaption>
          </motion.figure>)}
        </div>
      </section>

      <PixelDivider flip />

      <ClosingPanel dept={dept} show={show} id="cos-wardrobe" />
    </main>
  );
}
