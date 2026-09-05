import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AudioLines, Disc3 } from 'lucide-react';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { ClosingPanel } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, entranceProps, SectionHead, useHeroParallax } from '../shared';
import { musicLyrics } from '../showcase-data';
import { usePageSectionItems } from '../../page-content/PageContentSurface';

const LINE_MS = 3200;

/** 轻音部 · 滚动歌词 LYRIC ROOM：自动滚动歌词 + 旋转黑胶 + 均衡器，流动长缓动入场 */
export function MusicShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % musicLyrics.length), LINE_MS);
    return () => window.clearInterval(timer);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const list = listRef.current;
    const line = list?.children[active] as HTMLElement | undefined;
    if (list && line) list.scrollTo({ top: line.offsetTop - list.clientHeight / 2 + line.clientHeight / 2, behavior: 'smooth' });
  }, [active, reduce]);

  const progress = active / (musicLyrics.length - 1);
  const vinylCover = show.films[active % show.films.length];
  const addedTracks = usePageSectionItems('music-tracklist').filter(item => item.imageUrl);

  return (
    <main className="dept-page dept-music">
      <ChapterRail items={[
        { id: 'music-playing', no: '01', label: show.sections[0].zh },
        { id: 'music-tracklist', no: '02', label: show.sections[1].zh },
        { id: 'music-rehearsal', no: '03', label: show.sections[2].zh },
      ]} />

      <section className="lyric-hero showcase-hero" ref={heroRef} id="music-playing">
        <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true">
          <img src={show.films[0].banner} alt="" fetchPriority="high" decoding="async" />
        </motion.div>
        <div className="hero-texture texture-soundwave" aria-hidden="true" />
        <span className="hero-vertical" aria-hidden="true">{show.vertical}</span>

        <div className="lyric-vinyl-wrap" aria-hidden="true">
          <motion.div className="lyric-vinyl" animate={reduce ? undefined : { rotate: 360 }} transition={reduce ? undefined : { duration: 9, ease: 'linear', repeat: Infinity }}>
            <img src={vinylCover.cover} alt="" loading="lazy" decoding="async" />
            <i className="vinyl-groove" /><i className="vinyl-label" />
          </motion.div>
          <span className="lyric-tonearm" style={{ transform: `rotate(${-26 + progress * 24}deg)` }}><i /></span>
        </div>

        <motion.div className="lyric-stage showcase-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
          <span className="dept-kicker"><Disc3 aria-hidden="true" /> {show.themeEn} · {dept.title}</span>
          <h1><WordReveal text={dept.name} /></h1>
          <p className="dept-tagline"><WordReveal text={show.tagline} /></p>
          <ol className="lyric-lines" ref={listRef} aria-label="轻音部歌词，自动滚动，点击任意行可跳转">
            {musicLyrics.map((line, index) => (
              <li key={line} className={index === active ? 'is-active' : index < active ? 'is-past' : ''}>
                <button type="button" onClick={() => setActive(index)} aria-current={index === active ? 'true' : undefined}>
                  <span className="lyric-text">{line}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="lyric-outro">{show.intro}</p>
          <PixelSprite slug="music" className="hero-sprite" />
        </motion.div>

        <div className="lyric-eq" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 8) * .11}s`, animationDuration: `${0.7 + (i % 5) * .13}s` }} />)}
        </div>
      </section>

      <PixelDivider />

      <section className="lyric-tracklist" aria-label="歌单" id="music-tracklist">
        <SectionHead no="02" zh={show.sections[1].zh} en={show.sections[1].en} />
        <ol className="lyric-tracks">
          {show.films.map((f, index) => (
            <motion.li key={f.cover} {...(reduce ? {} : entranceProps('music', index))}>
              <span className="track-no">{String(index + 1).padStart(2, '0')}</span>
              <img src={f.cover} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <div><strong>{f.title}</strong><em>{f.romaji}</em></div>
              <span className="track-year"><AudioLines aria-hidden="true" /> {f.year}</span>
            </motion.li>
          ))}
          {addedTracks.map((item, index) => <motion.li key={item.id} {...(reduce ? {} : entranceProps('music', show.films.length + index))}>
            <span className="track-no">N{String(index + 1).padStart(2, '0')}</span><img src={item.imageUrl!} alt={item.title || '新增轻音部记录'} loading="lazy" decoding="async" /><div><strong>{item.title || '新增记录'}</strong><em>{item.body || 'LIGHT MUSIC CLUB'}</em></div><span className="track-year"><AudioLines aria-hidden="true" /> NEW</span>
          </motion.li>)}
        </ol>
      </section>

      <PixelDivider flip />

      <ClosingPanel dept={dept} show={show} id="music-rehearsal" />
    </main>
  );
}
