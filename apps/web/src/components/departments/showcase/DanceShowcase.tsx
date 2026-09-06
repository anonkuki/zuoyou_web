import { type ReactNode, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, ClipboardList, Film, Music2, Play, Sparkles, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, entranceProps, useHeroParallax } from '../shared';
import { departmentMediaBySlug, type DepartmentVideo } from '../department-media';
import { departmentPhotosBySlug } from '../department-photos';
import { usePageContentConfig, usePageSectionItems, type PageContentItem } from '../../page-content/PageContentSurface';

const marqueeText = '佐佑舞装部 · STARDUST STAGE · ON STAGE · 星轨舞台 · ';
const memberSeats = [
  { name: '成员 01', role: '舞台表演', note: '在聚光灯下传递热爱' },
  { name: '成员 02', role: '服装制作', note: '让每一个造型拥有故事' },
  { name: '成员 03', role: '编舞排练', note: '把节拍变成整齐的舞步' },
  { name: '成员 04', role: '舞台统筹', note: '守护演出前后的每个细节' },
  { name: '成员 05', role: '妆造设计', note: '让角色在舞台上闪闪发光' },
  { name: '成员 06', role: '后期记录', note: '把精彩瞬间留在影像里' },
] as const;

type DanceVideo = Pick<DepartmentVideo, 'title' | 'cover' | 'href' | 'publishedAt' | 'duration'> & { description?: string };
const managedVideo = (item: PageContentItem): DanceVideo | null => item.imageUrl && item.linkUrl ? {
  title: item.title || '舞装部作品记录', cover: item.imageUrl, href: item.linkUrl,
  publishedAt: 'NEW', duration: 'BILIBILI', description: item.body,
} : null;

function DanceSectionTitle({ no, icon: Icon, title, en, note }: { no: string; icon: typeof Users; title: string; en: string; note: string }) {
  return <header className="dance-archive-title"><span>{no}</span><i><Icon aria-hidden="true" /></i><div><h2>{title}</h2><small>{en}</small></div><p>{note}</p></header>;
}

function DanceCarousel({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (viewport && typeof viewport.scrollBy === 'function') viewport.scrollBy({ left: direction * viewport.clientWidth * .82, behavior: 'smooth' });
  };
  return <div className={`dance-carousel ${className}`} aria-label={label}>
    <button type="button" className="dance-carousel-arrow is-prev" onClick={() => move(-1)} aria-label={`查看上一组${label}`}><ArrowLeft aria-hidden="true" /></button>
    <div className="dance-carousel-viewport" ref={viewportRef} tabIndex={0}><div className="dance-carousel-track">{children}</div></div>
    <button type="button" className="dance-carousel-arrow is-next" onClick={() => move(1)} aria-label={`查看下一组${label}`}><ArrowRight aria-hidden="true" /></button>
  </div>;
}

/** 舞装部：保留原星轨舞台版头，版头下改为紧凑的成员、节目、舞台记忆与作品档案。 */
export function DanceShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const reduce = useReducedMotion();
  const config = usePageContentConfig();
  const addedMembers = usePageSectionItems('dance-floor').filter(item => item.imageUrl);
  const addedSetlist = usePageSectionItems('dance-setlist');
  const addedPhotos = usePageSectionItems('department-photo-gallery').filter(item => item.imageUrl);
  const addedProjects = usePageSectionItems('department-media-shelf').map(managedVideo).filter((item): item is DanceVideo => Boolean(item));
  const addedSongs = usePageSectionItems('dance-backstage');
  const members = show.films.filter(item => !config.hiddenImageUrls.includes(item.cover));
  const photos = useMemo(() => [
    ...(departmentPhotosBySlug.dance ?? []),
    ...addedPhotos.map(item => ({ src: item.imageUrl!, alt: item.title || '舞装部新增活动照片', caption: item.title || '新增舞台记录', source: '本部门投稿' as const })),
  ].filter(item => !config.hiddenImageUrls.includes(item.src)), [addedPhotos, config.hiddenImageUrls]);
  const projects: DanceVideo[] = [
    ...(departmentMediaBySlug.dance.videos ?? []).filter(item => !config.hiddenImageUrls.includes(item.cover)).map(item => ({ ...item, description: item.note })),
    ...addedProjects,
  ];

  return <main className="dept-page dept-dance dance-archive-page">
    <ChapterRail accent={show.accent} items={[
      { id: 'dance-floor', no: '01', label: '成员介绍' }, { id: 'dance-setlist', no: '02', label: '节目单' },
      { id: 'department-photo-gallery', no: '03', label: '舞台记忆' }, { id: 'department-media-shelf', no: '04', label: '作品记录' },
      { id: 'dance-backstage', no: '05', label: '演出曲目库' }, { id: 'dance-join', no: '06', label: '加入舞装部' },
      { id: 'department-post-board', no: '07', label: '舞装部讨论区' },
    ]} />

    <section className="stage-hero showcase-hero" ref={heroRef} id="dance-stage">
      <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true"><img src={show.films[1].banner} alt="" fetchPriority="high" decoding="async" /></motion.div>
      <div className="hero-texture texture-stars" aria-hidden="true" /><div className="stage-stars" aria-hidden="true" />
      <div className="stage-beams" aria-hidden="true"><i className="beam b1" /><i className="beam b2" /><i className="beam b3" /></div><span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
      <motion.div className="showcase-hero-copy stage-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
        <span className="dept-kicker"><Zap aria-hidden="true" /> {show.themeEn} · {dept.title}</span><h1><WordReveal text={dept.name} /></h1>
        <p className="dept-tagline"><WordReveal text={show.tagline} /></p><p className="dept-intro">{show.intro}</p><div className="stage-beat" aria-hidden="true"><i /><i /><i /><i /><i /></div><PixelSprite slug="dance" className="hero-sprite" />
      </motion.div>
      <div className="stage-marquee" aria-hidden="true"><div className="marquee-row row-a"><span>{marqueeText.repeat(4)}</span></div><div className="marquee-row row-b"><span>{marqueeText.repeat(4)}</span></div></div>
    </section>

    <section className="dance-member-section dance-paper-section" id="dance-floor">
      <DanceSectionTitle no="01" icon={Users} title="成员介绍" en="MEMBERS" note="不同的角色、服装与舞步，因为同一份热爱站上同一个舞台。" />
      <DanceCarousel label="舞装部成员" className="dance-member-carousel">
        {members.map((film, index) => <motion.article className="dance-member-card" key={film.cover} {...(reduce ? {} : entranceProps('dance', index))}>
          <img src={film.cover} alt={`${memberSeats[index].name}的成员照片`} loading="lazy" decoding="async" /><div><strong>{memberSeats[index].name}</strong><span>{memberSeats[index].role}</span><p>{memberSeats[index].note}</p></div>
        </motion.article>)}
        {addedMembers.map(item => {
          const content = <><img src={item.imageUrl!} alt={item.title || '新增成员'} loading="lazy" decoding="async" /><div><strong>{item.title || '新增成员'}</strong><span>舞装部成员</span><p>{item.body || '这位成员还没有填写个人介绍。'}</p></div></>;
          return item.linkUrl ? <a className="dance-member-card" href={item.linkUrl} target="_blank" rel="noreferrer" key={item.id}>{content}</a> : <article className="dance-member-card" key={item.id}>{content}</article>;
        })}
      </DanceCarousel>
    </section>

    <section className="dance-setlist-section dance-paper-section" id="dance-setlist">
      <DanceSectionTitle no="02" icon={ClipboardList} title="节目单" en="SETLIST" note="今夜的舞台，也有你的一份光芒。" />
      <ol className="dance-compact-setlist">
        {show.films.map((film, index) => <li key={film.cover}><b>{String(index + 1).padStart(2, '0')}</b><strong>{film.title}</strong><span>{film.romaji}</span><small>{film.year}</small></li>)}
        {addedSetlist.map((item, index) => <li key={item.id}><b>{String(show.films.length + index + 1).padStart(2, '0')}</b><strong>{item.title || '新增节目'}</strong><span>{item.body || '舞装部节目记录'}</span><small>NEW</small></li>)}
      </ol>
    </section>

    <section className="dance-memory-section" id="department-photo-gallery">
      <DanceSectionTitle no="03" icon={Camera} title="舞台亮起的瞬间" en="STAGE MEMORIES" note="排练、演出和谢幕合影，记录每一次从练习室走到聚光灯下的时刻。" />
      <DanceCarousel label="舞台记忆" className="dance-memory-carousel">
        {photos.map((photo, index) => <figure className={index === 0 ? 'is-featured' : ''} key={`${photo.src}-${index}`}><img src={photo.src} alt={photo.alt} loading={index < 4 ? 'eager' : 'lazy'} decoding="async" /><figcaption><small>{photo.source}</small><strong>{photo.caption}</strong></figcaption></figure>)}
      </DanceCarousel>
    </section>

    <section className="dance-work-section dance-paper-section" id="department-media-shelf">
      <DanceSectionTitle no="04" icon={Film} title="看看我们真的做过什么" en="OUR WORKS" note="从排练到正式舞台，从服装制作到影像记录，这里是属于舞装部的作品档案。" />
      <DanceCarousel label="舞装部作品" className="dance-work-carousel">
        {projects.map((project, index) => <a className="dance-work-card" href={project.href} target="_blank" rel="noreferrer" key={`${project.href}-${index}`}>
          <figure><img src={project.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /><i><Play aria-hidden="true" /></i><em>{project.duration}</em></figure>
          <div><strong>{project.title}</strong><small>{project.publishedAt}</small>{project.description && <p>{project.description}</p>}</div>
        </a>)}
      </DanceCarousel>
    </section>

    <section className="dance-library-section" id="dance-backstage">
      <DanceSectionTitle no="05" icon={Music2} title="演出曲目库" en="PERFORMANCE LIBRARY" note="收录我们跳过、排练过和仍在准备中的每一首歌。" />
      <div className="dance-song-table" role="table" aria-label="舞装部演出曲目库"><div role="row"><b>曲目名</b><b>作品 / 出处</b><b>状态</b><b>记录</b></div>
        {show.films.map((film, index) => <div role="row" key={film.cover}><strong><Music2 aria-hidden="true" /> {film.title}</strong><span>{film.romaji}</span><em>{index % 3 === 2 ? '排练中' : '已完成'}</em><small>{film.year}</small></div>)}
        {addedSongs.map(item => <div role="row" key={item.id}><strong><Music2 aria-hidden="true" /> {item.title || '新增曲目'}</strong><span>{item.body || '舞装部曲目'}</span><em>筹备中</em><small>NEW</small></div>)}
      </div>
    </section>

    <section className="dance-join-section" id="dance-join"><div><span><Sparkles aria-hidden="true" /> JOIN US</span><h2>加入舞装部</h2><p>{dept.description}</p><strong>当前 {dept.memberCount ?? 0} 位在编成员</strong><Link to="/join?department=dept-dance">立即加入我们 <ArrowRight aria-hidden="true" /></Link></div>
      <div className="dance-faq"><small>FAQ</small><h2>常见问题</h2>{['没有舞蹈基础可以加入吗？', '需要自己准备服装吗？', '平时的训练频率是多少？', '除了跳舞还可以做什么？'].map(question => <details key={question}><summary>{question}</summary><p>基础不是门槛，欢迎先来活动现场体验；部门会提供排练、服装和舞台协作方面的帮助。</p></details>)}</div>
    </section>
    <PixelDivider flip />
  </main>;
}
