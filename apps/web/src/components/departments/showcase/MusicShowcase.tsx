import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Camera, Disc3, Music2, Play, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, entranceProps, useHeroParallax } from '../shared';
import { WordReveal } from '../WordReveal';
import { departmentMediaBySlug, type DepartmentVideo } from '../department-media';
import { departmentPhotosBySlug } from '../department-photos';
import { usePageContentConfig, usePageSectionItems, type PageContentItem } from '../../page-content/PageContentSurface';
import { musicLyrics } from '../showcase-data';

const LINE_MS = 3200;

const memberSeats = [
  { name: '成员 01', instrument: '主唱', note: '用歌声传递心情' },
  { name: '成员 02', instrument: '吉他', note: '旋律与节奏的火花' },
  { name: '成员 03', instrument: '贝斯', note: '低频，支撑起一切' },
  { name: '成员 04', instrument: '鼓手', note: '用节奏推动心跳' },
  { name: '成员 05', instrument: '键盘', note: '让音乐拥有更多色彩' },
] as const;

const instrumentMeta = {
  主唱: { en: 'VOCAL', tag: 'MELODY' },
  吉他: { en: 'GUITAR', tag: 'CHORD' },
  贝斯: { en: 'BASS', tag: 'GROOVE' },
  鼓手: { en: 'DRUMS', tag: 'RHYTHM' },
  键盘: { en: 'KEYBOARD', tag: 'HARMONY' },
} as const;

type MusicVideo = Pick<DepartmentVideo, 'title' | 'cover' | 'href' | 'publishedAt' | 'duration'> & { description?: string };

const managedVideo = (item: PageContentItem): MusicVideo | null => item.imageUrl && item.linkUrl ? {
  title: item.title || '轻音部视频记录',
  cover: item.imageUrl,
  href: item.linkUrl,
  publishedAt: 'NEW',
  duration: 'BILIBILI',
  description: item.body,
} : null;

function MusicSectionTitle({ icon: Icon, title, en, note }: {
  icon: typeof Music2;
  title: string;
  en: string;
  note: string;
}) {
  return <header className="music-section-title">
    <span><Icon aria-hidden="true" /></span>
    <div><h2>{title}</h2><small>{en}</small></div>
    <p>{note}</p>
  </header>;
}

function MusicCarousel({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (viewport && typeof viewport.scrollBy === 'function') viewport.scrollBy({
      left: direction * viewport.clientWidth * .82,
      behavior: 'smooth',
    });
  };
  return <div className={`music-carousel ${className}`} aria-label={label}>
    <button type="button" className="music-carousel-arrow is-prev" onClick={() => move(-1)} aria-label={`查看上一组${label}`}><ArrowLeft aria-hidden="true" /></button>
    <div className="music-carousel-viewport" ref={viewportRef} tabIndex={0}>
      <div className="music-carousel-track">{children}</div>
    </div>
    <button type="button" className="music-carousel-arrow is-next" onClick={() => move(1)} aria-label={`查看下一组${label}`}><ArrowRight aria-hidden="true" /></button>
  </div>;
}

function MusicVideoCards({ videos, wide = false }: { videos: MusicVideo[]; wide?: boolean }) {
  const reduce = useReducedMotion();
  if (!videos.length) return <div className="music-video-empty"><Disc3 aria-hidden="true" /><p>这一页还没有归档视频，管理者可以从“编辑页面”中粘贴 B 站链接添加。</p></div>;
  return <MusicCarousel className={`music-video-cards${wide ? ' is-wide' : ''}`} label={wide ? '排练视频' : '原创曲目'}>
    {videos.map((video, index) => <motion.a
      href={video.href}
      target="_blank"
      rel="noreferrer"
      className="music-video-card"
      key={`${video.href}-${index}`}
      {...(reduce ? {} : entranceProps('music', index))}
    >
      <figure>
        <img src={video.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <i><Play aria-hidden="true" /></i>
        <em>{video.duration}</em>
      </figure>
      <div><strong>{video.title}</strong><small>{video.publishedAt}</small>{video.description && <p>{video.description}</p>}</div>
    </motion.a>)}
  </MusicCarousel>;
}

function MusicPhotoMemories() {
  const config = usePageContentConfig();
  const photos = useMemo(() => [
    ...(departmentPhotosBySlug.music ?? []),
    ...config.items.filter(item => item.sectionId === 'department-photo-gallery' && item.imageUrl).map(item => ({
      src: item.imageUrl!, alt: item.title || '轻音部新增活动照片', caption: item.title || '新增活动记录', source: '本部门投稿' as const,
    })),
  ].filter(photo => !config.hiddenImageUrls.includes(photo.src)), [config.hiddenImageUrls, config.items]);
  if (!photos.length) return null;
  return <section className="music-photo-memories" id="department-photo-gallery" aria-label="轻音部活动影像">
    <MusicSectionTitle icon={Camera} title="活动影像" en="PHOTO MEMORIES" note="定格下的，是音乐和伙伴们的闪闪发光时刻。" />
    <MusicCarousel className="music-photo-strip" label="活动影像">
      {photos.map((photo, index) => <figure className={index === 0 ? 'is-featured' : ''} key={photo.src}>
        <img src={photo.src} alt={photo.alt} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
        <figcaption><small>{photo.source}</small><strong>{photo.caption}</strong></figcaption>
      </figure>)}
    </MusicCarousel>
  </section>;
}

/** 轻音部 · 复古唱片社团档案：成员、原创曲目、排练视频与活动影像。 */
export function MusicShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const config = usePageContentConfig();
  const addedMembers = usePageSectionItems('music-members').filter(item => item.imageUrl);
  const addedTracks = usePageSectionItems('music-tracklist').map(managedVideo).filter((item): item is MusicVideo => Boolean(item));
  const addedRehearsals = usePageSectionItems('music-rehearsal').map(managedVideo).filter((item): item is MusicVideo => Boolean(item));
  const officialTracks = (departmentMediaBySlug.music.videos ?? []).filter(video => !config.hiddenImageUrls.includes(video.cover));
  const progress = active / (musicLyrics.length - 1);
  const vinylCover = show.films[active % show.films.length];

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % musicLyrics.length), LINE_MS);
    return () => window.clearInterval(timer);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const list = listRef.current;
    const line = list?.children[active] as HTMLElement | undefined;
    if (list && line && typeof list.scrollTo === 'function') list.scrollTo({ top: line.offsetTop - list.clientHeight / 2 + line.clientHeight / 2, behavior: 'smooth' });
  }, [active, reduce]);

  return <main className="dept-page dept-music music-club-page">
    <ChapterRail accent={show.accent} items={[
      { id: 'music-playing', no: '01', label: '轻音部' },
      { id: 'music-members', no: '02', label: '成员' },
      { id: 'music-tracklist', no: '03', label: '原创曲目' },
      { id: 'music-rehearsal', no: '04', label: '排练视频' },
      { id: 'department-photo-gallery', no: '05', label: '活动影像' },
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
          {musicLyrics.map((line, index) => <li key={line} className={index === active ? 'is-active' : index < active ? 'is-past' : ''}>
            <button type="button" onClick={() => setActive(index)} aria-current={index === active ? 'true' : undefined}><span className="lyric-text">{line}</span></button>
          </li>)}
        </ol>
        <p className="lyric-outro">{show.intro}</p>
        <PixelSprite slug="music" className="hero-sprite" />
      </motion.div>
      <div className="lyric-eq" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => <i key={index} style={{ animationDelay: `${(index % 8) * .11}s`, animationDuration: `${0.7 + (index % 5) * .13}s` }} />)}
      </div>
    </section>

    <PixelDivider />

    <section className="music-members" id="music-members">
      <MusicSectionTitle icon={Users} title="成员配置卡" en="MEMBERS" note="不同的声音，组成同一个乐队。" />
      <MusicCarousel className="music-member-grid" label="成员配置卡">
        {memberSeats.map((member, index) => {
          const meta = instrumentMeta[member.instrument];
          return <article className="music-member-card" key={member.instrument}>
            <img src={show.films[index % show.films.length].cover} alt={`${member.name}的成员照片`} loading="lazy" decoding="async" />
            <strong className="music-member-name">{member.name}</strong>
            <div className="music-member-details">
              <strong className="music-member-instrument">{member.instrument} <small>{meta.en}</small></strong>
              <p>{member.note}</p>
            </div>
            <span className="music-member-tag">{meta.tag}</span>
          </article>;
        })}
        {addedMembers.map(item => {
          const instrument = item.instrument ?? '主唱';
          const meta = instrumentMeta[instrument];
          return <article className="music-member-card is-managed" key={item.id}>
            <img src={item.imageUrl!} alt={item.title || '新增成员'} loading="lazy" decoding="async" />
            <strong className="music-member-name">{item.title || '新增成员'}</strong>
            <div className="music-member-details">
              <strong className="music-member-instrument">{instrument} <small>{meta.en}</small></strong>
              <p>{item.body || '这位成员还没有填写个人介绍。'}</p>
            </div>
            <span className="music-member-tag">{meta.tag}</span>
          </article>;
        })}
      </MusicCarousel>
    </section>

    <section className="music-original-tracks" id="music-tracklist">
      <MusicSectionTitle icon={Music2} title="原创曲目" en="ORIGINAL TRACKS" note="我们的声音，也在不断生长。" />
      <MusicVideoCards videos={[...addedTracks, ...officialTracks]} />
    </section>

    <section className="music-rehearsal-archive" id="music-rehearsal">
      <MusicSectionTitle icon={CalendarDays} title="排练视频" en="REHEARSAL ARCHIVE" note="从排练室到舞台，每一次练习都促成成长。" />
      <MusicVideoCards videos={addedRehearsals} wide />
    </section>

    <MusicPhotoMemories />

    <section className="music-recruitment" id="music-recruitment">
      <div><PixelSprite slug="music" /><span><small>RECRUITMENT</small><strong>一起奏响下一个章节</strong></span></div>
      <p>{dept.description}</p>
      <p><Users aria-hidden="true" /> 当前 {dept.memberCount ?? 0} 位在编成员</p>
      <Link to="/join">加入我们 <ArrowRight aria-hidden="true" /></Link>
    </section>
  </main>;
}
