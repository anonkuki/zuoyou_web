import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  Aperture, ArrowLeft, ArrowRight, BookOpen, Camera, Clapperboard,
  FileVideo, Lightbulb, Mic2, Play, Presentation, Scissors,
  SlidersHorizontal, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, useHeroParallax } from '../shared';
import { departmentMediaBySlug, type DepartmentVideo } from '../department-media';
import { departmentPhotosBySlug, type DepartmentPhoto } from '../department-photos';
import { usePageContentConfig, usePageSectionItems, type PageContentItem } from '../../page-content/PageContentSurface';
import { TechGuestbook } from '../TechGuestbook';

type TechVideo = Pick<DepartmentVideo, 'title' | 'cover' | 'href' | 'publishedAt' | 'duration'> & { description?: string };
type TechPhoto = Pick<DepartmentPhoto, 'src' | 'alt' | 'caption' | 'source'>;

const tutorialCards = [
  { icon: Camera, title: '摄影入门', note: '相机设置与构图基础', count: 12 },
  { icon: SlidersHorizontal, title: '机位与运镜', note: '镜头语言与稳定技巧', count: 8 },
  { icon: Lightbulb, title: '灯光基础', note: '布光思路与实战案例', count: 10 },
  { icon: Scissors, title: '剪辑工作流', note: '从素材到成片', count: 16 },
  { icon: Mic2, title: '收音与降噪', note: '让声音更干净', count: 7 },
  { icon: Presentation, title: '活动统筹清单', note: '前期准备与现场执行', count: 6 },
  { icon: FileVideo, title: '素材整理规范', note: '命名、分类与备份', count: 9 },
  { icon: Aperture, title: '调色入门', note: '从基础到风格化', count: 5 },
] as const;

const managedVideo = (item: PageContentItem): TechVideo | null => item.imageUrl && item.linkUrl ? {
  title: item.title || '技术部项目记录',
  cover: item.imageUrl,
  href: item.linkUrl,
  publishedAt: 'NEW',
  duration: 'BILIBILI',
  description: item.body,
} : null;

function TechSectionTitle({ no, icon: Icon, title, en, note }: {
  no: string;
  icon: typeof Camera;
  title: string;
  en: string;
  note: string;
}) {
  return <header className="tech-section-title">
    <span className="tech-section-no">{no}</span>
    <i><Icon aria-hidden="true" /></i>
    <div><h2>{title}</h2><small>{en}</small></div>
    <p>{note}</p>
  </header>;
}

function TechCarousel({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    viewport?.scrollBy({ left: direction * viewport.clientWidth * .84, behavior: 'smooth' });
  };
  return <div className={`tech-carousel ${className}`} aria-label={label}>
    <button type="button" className="tech-carousel-arrow is-prev" onClick={() => move(-1)} aria-label={`查看上一组${label}`}><ArrowLeft aria-hidden="true" /></button>
    <div className="tech-carousel-viewport" ref={viewportRef} tabIndex={0}><div className="tech-carousel-track">{children}</div></div>
    <button type="button" className="tech-carousel-arrow is-next" onClick={() => move(1)} aria-label={`查看下一组${label}`}><ArrowRight aria-hidden="true" /></button>
  </div>;
}

function TechLiveArchive({ photos }: { photos: TechPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => setActiveIndex(index => Math.min(index, Math.max(photos.length - 1, 0))), [photos.length]);
  useEffect(() => {
    const viewport = thumbnailsRef.current;
    const thumbnail = thumbnailRefs.current[activeIndex];
    if (!viewport || !thumbnail) return;
    const left = thumbnail.offsetLeft - (viewport.clientWidth - thumbnail.clientWidth) / 2;
    viewport.scrollTo?.({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
  }, [activeIndex, reduce]);
  useEffect(() => {
    if (reduce || paused || photos.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex(index => (index + 1) % photos.length), 4800);
    return () => window.clearInterval(timer);
  }, [paused, photos.length, reduce]);
  if (!photos.length) return <p className="tech-empty">还没有现场记录，可在“编辑页面”中添加。</p>;
  const active = photos[activeIndex];
  const move = (direction: -1 | 1) => setActiveIndex(index => (index + direction + photos.length) % photos.length);
  return <div className="tech-live-archive" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    <div className="tech-live-copy">
      <small>LIVE RECORDS · {String(activeIndex + 1).padStart(2, '0')}</small>
      <h3>{active.caption}</h3>
      <p>从活动现场、拍摄机位到后期工作台，每一次按下快门，都是社团故事的一部分。</p>
      <span>{active.source}</span>
    </div>
    <div className="tech-live-stage">
      <motion.figure key={active.src} initial={reduce ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <img src={active.src} alt={active.alt} loading={activeIndex === 0 ? 'eager' : 'lazy'} decoding="async" />
        <figcaption>{active.caption}</figcaption>
      </motion.figure>
      <button type="button" className="is-prev" onClick={() => move(-1)} aria-label="上一张现场记录"><ArrowLeft aria-hidden="true" /></button>
      <button type="button" className="is-next" onClick={() => move(1)} aria-label="下一张现场记录"><ArrowRight aria-hidden="true" /></button>
      <b>{activeIndex + 1} / {photos.length}</b>
      <span className="tech-live-auto">{paused ? '已暂停' : '自动播放'}</span>
    </div>
    <div className="tech-live-thumbs" aria-label="现场记录缩略图" ref={thumbnailsRef}>
      {photos.map((photo, index) => <button
        type="button"
        key={`${photo.src}-${index}`}
        className={index === activeIndex ? 'is-active' : ''}
        aria-label={`查看第 ${index + 1} 张现场记录`}
        aria-current={index === activeIndex ? 'true' : undefined}
        ref={element => { thumbnailRefs.current[index] = element; }}
        onClick={() => setActiveIndex(index)}
      ><img src={photo.src} alt="" loading="lazy" decoding="async" /></button>)}
    </div>
  </div>;
}

/** 技术部 · 影像工作室档案：底片、现场记录、项目作品与教程资源。 */
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
  const config = usePageContentConfig();
  const addedContactPhotos = usePageSectionItems('tech-sheet').filter(item => item.imageUrl);
  const addedLivePhotos = [
    ...usePageSectionItems('department-photo-gallery'),
    ...usePageSectionItems('tech-live-records'),
  ].filter(item => item.imageUrl);
  const addedProjects = usePageSectionItems('department-media-shelf').map(managedVideo).filter((item): item is TechVideo => Boolean(item));
  const addedTutorials = usePageSectionItems('tech-tutorials');

  const contactPhotos = useMemo<TechPhoto[]>(() => [
    ...show.films.map(film => ({ src: film.cover, alt: `${film.title} 底片`, caption: film.romaji, source: `${film.year} / 技术部档案` as DepartmentPhoto['source'] })),
    ...addedContactPhotos.map(item => ({ src: item.imageUrl!, alt: item.title || '新增技术部底片', caption: item.title || '新增底片', source: '本部门投稿' as const })),
  ].filter(photo => !config.hiddenImageUrls.includes(photo.src)), [addedContactPhotos, config.hiddenImageUrls, show.films]);

  const livePhotos = useMemo<TechPhoto[]>(() => [
    ...(departmentPhotosBySlug.tech ?? []),
    ...addedLivePhotos.map(item => ({ src: item.imageUrl!, alt: item.title || '新增技术部现场照片', caption: item.title || '新增现场记录', source: '本部门投稿' as const })),
  ].filter(photo => !config.hiddenImageUrls.includes(photo.src)), [addedLivePhotos, config.hiddenImageUrls]);

  const projects: TechVideo[] = [...(departmentMediaBySlug.tech.videos ?? []), ...addedProjects];

  return <main className="dept-page dept-tech tech-archive-page">
    <ChapterRail accent={show.accent} items={[
      { id: 'tech-sheet', no: '01', label: '底片夹' },
      { id: 'department-photo-gallery', no: '02', label: '现场记录' },
      { id: 'department-media-shelf', no: '03', label: '项目作品' },
      { id: 'tech-tutorials', no: '04', label: '教程资源库' },
      { id: 'tech-guestbook', no: '05', label: '留言板' },
      { id: 'tech-exif', no: '06', label: '加入我们' },
      { id: 'department-post-board', no: '07', label: '技术部讨论区' },
    ]} />

    <section className="vf-hero showcase-hero" ref={heroRef} id="tech-focus">
      <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true"><img src={show.films[4].banner} alt="" fetchPriority="high" decoding="async" /></motion.div>
      <div className="hero-texture texture-scanlines" aria-hidden="true" />
      <div className="vf-thirds" aria-hidden="true"><i /><i /><b /><b /></div>
      <i className="vf-corner tl" aria-hidden="true" /><i className="vf-corner tr" aria-hidden="true" /><i className="vf-corner bl" aria-hidden="true" /><i className="vf-corner br" aria-hidden="true" />
      <div className="vf-hud vf-hud-top" aria-hidden="true"><span className="vf-rec-dot" /> REC <em>ISO 400</em><em>f/1.8</em><em>{reduce ? '1/250' : <motion.span>{shutterText}</motion.span>}</em><em>AWB</em></div>
      <span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
      <motion.div className="showcase-hero-copy vf-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}>
        <span className="dept-kicker"><Aperture aria-hidden="true" /> {show.themeEn} · {dept.title}</span>
        <h1><WordReveal text={dept.name} /></h1>
        <p className="dept-tagline"><WordReveal text={show.tagline} /></p>
        <p className="dept-intro">{show.intro}</p>
        <PixelSprite slug="tech" className="hero-sprite" />
      </motion.div>
      <div className="vf-focus-box" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="vf-hud vf-hud-bottom" aria-hidden="true"><span>FOCUS {reduce ? '85mm' : <motion.span>{focalText}</motion.span>}</span><span className="vf-level"><i /></span><span>AF · SINGLE</span></div>
    </section>

    <section className="tech-contact-section tech-paper-section" id="tech-sheet" ref={wallRef}>
      <TechSectionTitle no="01" icon={Camera} title="底片夹" en="CONTACT SHEET" note="定格那些值得被记住的瞬间——每一张照片都是我们共同制作过的时光。" />
      <TechCarousel label="底片夹" className="tech-contact-carousel">
        {contactPhotos.map((photo, index) => <figure className="tech-contact-card" key={`${photo.src}-${index}`}>
          <div><img src={photo.src} alt={photo.alt} loading={index < 6 ? 'eager' : 'lazy'} decoding="async" /></div>
          <figcaption><strong>{photo.caption}</strong><small>{photo.source}</small></figcaption>
        </figure>)}
      </TechCarousel>
    </section>

    <section className="tech-live-section" id="department-photo-gallery">
      <TechSectionTitle no="02" icon={Clapperboard} title="取景器后的现场记录" en="LIVE RECORDS" note="从活动现场、拍摄花絮到正式演出，镜头之下是热爱，也是技术部的生活日常。" />
      <TechLiveArchive photos={livePhotos} />
    </section>

    <section className="tech-project-section tech-paper-section" id="department-media-shelf">
      <TechSectionTitle no="03" icon={FileVideo} title="看看我们真的做过什么" en="OUR PROJECTS" note="从拍摄、后期剪辑、活动支持到创意企划，这些都是技术部的实践作品。" />
      {projects.length ? <TechCarousel label="技术部项目" className="tech-project-carousel">
        {projects.map((project, index) => <a className="tech-project-card" href={project.href} target="_blank" rel="noreferrer" key={`${project.href}-${index}`}>
          <figure><img src={project.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /><i><Play aria-hidden="true" /></i><em>{project.duration}</em></figure>
          <div><small>{project.publishedAt} · 技术部项目</small><strong>{project.title}</strong>{project.description && <p>{project.description}</p>}</div>
        </a>)}
      </TechCarousel> : <p className="tech-empty">还没有项目作品，管理者可在编辑页面粘贴 B站链接添加。</p>}
    </section>

    <section className="tech-tutorial-section tech-paper-section" id="tech-tutorials">
      <TechSectionTitle no="04" icon={BookOpen} title="教程资源库" en="TUTORIAL LIBRARY" note="从入门到进阶，整理我们在实践中积累的经验与资料，欢迎一起学习与分享。" />
      <TechCarousel label="教程资源" className="tech-tutorial-carousel">
        {tutorialCards.map(({ icon: Icon, title, note, count }) => <article className="tech-tutorial-card" key={title}><Icon aria-hidden="true" /><strong>{title}</strong><p>{note}</p><small>{count} 篇文章</small></article>)}
        {addedTutorials.map(item => {
          const content = <><Lightbulb aria-hidden="true" />{item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}<strong>{item.title || '新增教程'}</strong><p>{item.body || '由技术部成员整理的教程资源。'}</p><small>NEW RESOURCE</small></>;
          return item.linkUrl
            ? <a className="tech-tutorial-card" href={item.linkUrl} target={item.linkUrl.startsWith('/api/files/') ? undefined : '_blank'} rel="noreferrer" download={item.linkUrl.startsWith('/api/files/') || undefined} key={item.id}>{content}</a>
            : <article className="tech-tutorial-card" key={item.id}>{content}</article>;
        })}
      </TechCarousel>
    </section>

    <TechGuestbook />

    <section className="tech-join-section" id="tech-exif">
      <div className="tech-faq"><small>06 / FAQ</small><h2>常见问题</h2>{['如何加入技术部？', '需要具备专业设备吗？', '没有经验可以报名吗？', '技术部主要做哪些工作？'].map(question => <details key={question}><summary>{question}</summary><p>欢迎先来活动现场体验；设备和经验都不是门槛，技术部会提供基础教学与实践机会。</p></details>)}</div>
      <div className="tech-join-card"><span><Users aria-hidden="true" /> JOIN US</span><h2>加入我们</h2><p>{dept.description}</p><strong>当前 {dept.memberCount ?? 0} 位在编成员</strong><Link className="tech-join-action" to="/join?department=dept-tech">提交技术部加入申请 <ArrowRight aria-hidden="true" /></Link><small>申请将同步给技术部部长与副部长查看。</small></div>
    </section>

    <PixelDivider flip />
  </main>;
}
