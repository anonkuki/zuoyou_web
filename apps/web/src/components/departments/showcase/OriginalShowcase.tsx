import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Brush, Camera, Lightbulb, Link2, MessageSquareText, Palette, Play, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { departmentPhotosBySlug, originalPortfolioPhotos, type DepartmentPhoto } from '../department-photos';
import { departmentMediaBySlug, type DepartmentVideo } from '../department-media';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, entranceProps, useHeroParallax } from '../shared';
import { usePageContentConfig, usePageSectionItems, type PageContentItem } from '../../page-content/PageContentSurface';
import { DepartmentGuestbook } from '../TechGuestbook';

type RefObject<T> = { current: T | null };
type OriginalVideo = Pick<DepartmentVideo, 'title' | 'cover' | 'href' | 'publishedAt' | 'duration'> & { description?: string };

const characterNotes = [
  ['流光', '旅行者', '把想象画成可以触摸的世界'], ['夜临', '故事作者', '故事还没结束'], ['桃枝', '角色设计', '花早见的日子'],
  ['黎序', '世界观设计', '无论世界如何，我都会继续创作'], ['青空', '插画创作', '天空之外仍有新的故事'], ['白墨', '漫画分镜', '把每一格都变成相遇'],
] as const;
const toolbox = [
  ['创作流程', '从灵感到完成的基本步骤'], ['投稿规范', '社团平台投稿要求'], ['社刊排版', '模板与排版参考'], ['合作招募', '寻找一起创作的伙伴'],
] as const;

const managedVideo = (item: PageContentItem): OriginalVideo | null => item.imageUrl && item.linkUrl ? {
  title: item.title || '原创部作品记录', cover: item.imageUrl, href: item.linkUrl,
  publishedAt: 'NEW', duration: 'BILIBILI', description: item.body,
} : null;

const formatRecordDate = (recordedAt: string) => new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'long',
  timeZone: 'Asia/Shanghai',
}).format(new Date(`${recordedAt}T00:00:00+08:00`));

function IsoGeometry() {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref as unknown as RefObject<HTMLElement>, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 18 });
  const islandAY = useTransform(smooth, [0, 1], [0, -34]);
  const islandBY = useTransform(smooth, [0, 1], [0, 26]);
  const triRotate = useTransform(smooth, [0, 1], [0, 120]);
  const morph = (value: MotionValue<number>) => (reduce ? undefined : value);
  return <svg ref={ref} className="atelier-iso" viewBox="0 0 420 360" aria-hidden="true">
    <motion.g style={{ rotate: morph(triRotate), transformOrigin: '210px 150px' }}><path d="M210 60 300 210 H120 Z" fill="none" stroke="#a0c4ff" strokeWidth="14" strokeLinejoin="round" /><path d="M210 60 300 210 H262 L210 142 Z" fill="#a0c4ff" opacity=".55" /><path d="M120 210 H300 L262 210 210 92 Z" fill="#f7a8b8" opacity=".4" /></motion.g>
    <motion.g style={{ y: morph(islandAY) }}><path d="M72 250 112 228 152 250 112 272 Z" fill="#a8e6cf" /><path d="M72 250 112 272 112 300 72 278 Z" fill="#7fcba8" /><path d="M152 250 112 272 112 300 152 278 Z" fill="#5fb58c" /></motion.g>
    <motion.g style={{ y: morph(islandBY) }}><path d="M288 236 322 218 356 236 322 254 Z" fill="#fdffb6" /><path d="M288 236 322 254 322 278 288 260 Z" fill="#e3dc8e" /><path d="M356 236 322 254 322 278 356 260 Z" fill="#c9c26e" /></motion.g>
    <path className="atelier-doodle" d="M40 90 q 30 -38 62 -6 t 66 -8" fill="none" stroke="#f7a8b8" strokeWidth="5" strokeLinecap="round" /><path className="atelier-doodle" d="M300 300 q 26 22 58 4" fill="none" stroke="#a8e6cf" strokeWidth="5" strokeLinecap="round" />
  </svg>;
}

function OriginalTitle({ no, icon: Icon, title, en, note }: { no: string; icon: typeof Brush; title: string; en: string; note: string }) {
  return <header className="original-archive-title"><span>{no}</span><i><Icon aria-hidden="true" /></i><div><h2>{title}</h2><small>{en}</small></div><p>{note}</p></header>;
}

function OriginalCarousel({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (viewport && typeof viewport.scrollBy === 'function') viewport.scrollBy({ left: direction * viewport.clientWidth * .82, behavior: 'smooth' });
  };
  return <div className={`original-carousel ${className}`} aria-label={label}><button type="button" className="original-carousel-arrow is-prev" onClick={() => move(-1)} aria-label={`查看上一组${label}`}><ArrowLeft aria-hidden="true" /></button><div className="original-carousel-viewport" ref={viewportRef} tabIndex={0}><div className="original-carousel-track">{children}</div></div><button type="button" className="original-carousel-arrow is-next" onClick={() => move(1)} aria-label={`查看下一组${label}`}><ArrowRight aria-hidden="true" /></button></div>;
}

function OriginalDailyGallery({ photos }: { photos: DepartmentPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => setActiveIndex(index => Math.min(index, Math.max(photos.length - 1, 0))), [photos.length]);
  useEffect(() => {
    const viewport = thumbsRef.current;
    const thumbnail = thumbRefs.current[activeIndex];
    if (!viewport || !thumbnail) return;
    viewport.scrollTo?.({ left: Math.max(0, thumbnail.offsetLeft - (viewport.clientWidth - thumbnail.clientWidth) / 2), behavior: 'smooth' });
  }, [activeIndex]);
  if (!photos.length) return <p className="original-empty">还没有创作日常照片，可在编辑页面中添加。</p>;
  const active = photos[activeIndex];
  const move = (direction: -1 | 1) => setActiveIndex(index => (index + direction + photos.length) % photos.length);
  return <div className="original-daily-gallery">
    <div className="original-daily-stage">
      <figure key={active.src}><img src={active.src} alt={active.alt} loading={activeIndex === 0 ? 'eager' : 'lazy'} decoding="async" /><figcaption><small>{active.source}</small><strong>{active.caption}</strong></figcaption></figure>
      <button type="button" className="is-prev" onClick={() => move(-1)} aria-label="上一张创作日常"><ArrowLeft aria-hidden="true" /></button>
      <button type="button" className="is-next" onClick={() => move(1)} aria-label="下一张创作日常"><ArrowRight aria-hidden="true" /></button>
    </div>
    <aside><small>CREATIVE LOG</small><b>{String(activeIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</b><h3>{active.caption}</h3><p>灵感不是独自发生的。一次讨论、一张草图和一段共同创作的时间，都会成为作品的一部分。</p><span>{active.source}</span></aside>
    <div className="original-daily-thumbs" ref={thumbsRef} aria-label="创作日常缩略图">
      {photos.map((photo, index) => <button type="button" key={`${photo.src}-${index}`} ref={element => { thumbRefs.current[index] = element; }} className={index === activeIndex ? 'is-active' : ''} aria-label={`查看第 ${index + 1} 张创作日常`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => setActiveIndex(index)}><img src={photo.src} alt="" loading="lazy" decoding="async" /><b>{String(index + 1).padStart(2, '0')}</b></button>)}
    </div>
  </div>;
}

/** 原创部 · 保留原梦色画室版头，版头下为作品、设定、日常和创作资源档案。 */
export function OriginalShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const reduce = useReducedMotion();
  const config = usePageContentConfig();
  const addedWorks = usePageSectionItems('original-gallery').filter(item => item.imageUrl);
  const addedCharacters = usePageSectionItems('original-characters').filter(item => item.imageUrl);
  const addedDaily = usePageSectionItems('department-photo-gallery').filter(item => item.imageUrl);
  const addedVideos = usePageSectionItems('department-media-shelf').map(managedVideo).filter((item): item is OriginalVideo => Boolean(item));
  const addedTools = usePageSectionItems('original-toolbox');
  const works: DepartmentPhoto[] = [...originalPortfolioPhotos, ...addedWorks.map(item => ({ src: item.imageUrl!, alt: item.title || '原创部新增作品', caption: item.title || '新增作品', source: '本部门投稿' as const }))].filter(item => !config.hiddenImageUrls.includes(item.src));
  const daily = useMemo(() => [...(departmentPhotosBySlug.original ?? []), ...addedDaily.map(item => ({ src: item.imageUrl!, alt: item.title || '原创部新增周常照片', caption: item.title || '新增创作日常', source: '本部门投稿' as const }))].filter(item => !config.hiddenImageUrls.includes(item.src)), [addedDaily, config.hiddenImageUrls]);
  const videos: OriginalVideo[] = [...(departmentMediaBySlug.original.videos ?? []).filter(item => !config.hiddenImageUrls.includes(item.cover)).map(item => ({ ...item, description: item.note })), ...addedVideos];

  return <main className="dept-page dept-original original-archive-page">
    <ChapterRail accent={show.accent} items={[
      { id: 'original-gallery', no: '01', label: '作品集锦' }, { id: 'original-characters', no: '02', label: '创作设定' },
      { id: 'department-photo-gallery', no: '03', label: '创作日常' }, { id: 'department-media-shelf', no: '04', label: '作品记录' },
      { id: 'original-toolbox', no: '05', label: '画具箱' }, { id: 'original-guestbook', no: '06', label: '留言板' },
      { id: 'department-post-board', no: '07', label: '原创讨论区' },
    ]} />

    <section className="atelier-hero showcase-hero" ref={heroRef} id="original-atelier">
      <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true"><img src={show.films[0].banner} alt="" fetchPriority="high" decoding="async" /></motion.div>
      <div className="hero-texture texture-paper" aria-hidden="true" /><div className="atelier-wash" aria-hidden="true"><i className="wash w1" /><i className="wash w2" /><i className="wash w3" /></div><span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
      <motion.div className="showcase-hero-copy atelier-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}><span className="dept-kicker"><Brush aria-hidden="true" /> {show.themeEn} · {dept.title}</span><h1><WordReveal text={dept.name} /></h1><p className="dept-tagline atelier-crayon"><WordReveal text={show.tagline} /></p><p className="dept-intro">{show.intro}</p><PixelSprite slug="original" className="hero-sprite" /></motion.div><IsoGeometry />
    </section>
    <PixelDivider />

    <section className="original-work-section original-paper-section" id="original-gallery"><OriginalTitle no="01" icon={Palette} title="作品集锦" en="FEATURED WORKS" note="小小的创作，也能照亮某个人的未来。" />
      <OriginalCarousel label="原创作品" className="original-work-carousel">{works.map((photo, index) => <motion.figure key={`${photo.src}-${index}`} {...(reduce ? {} : entranceProps('original', index))}><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" /><figcaption><strong>{photo.caption}</strong><small>{photo.recordedAt ? formatRecordDate(photo.recordedAt) : 'ORIGINAL CLUB WORKS'}</small></figcaption></motion.figure>)}</OriginalCarousel>
    </section>

    <section className="original-character-section original-paper-section" id="original-characters"><OriginalTitle no="02" icon={Users} title="OC / 设定集" en="ORIGINAL CHARACTER ARCHIVE" note="每一个角色，都是一个未完的故事。" />
      <OriginalCarousel label="原创角色与设定" className="original-character-carousel">{show.films.filter(item => !config.hiddenImageUrls.includes(item.cover)).map((film, index) => <article className="original-character-card" key={film.cover}><img src={film.cover} alt={`${characterNotes[index][0]}的设定图`} loading="lazy" decoding="async" /><strong>{characterNotes[index][0]}</strong><span>{characterNotes[index][1]}</span><p>{characterNotes[index][2]}</p></article>)}{addedCharacters.map(item => <article className="original-character-card" key={item.id}><img src={item.imageUrl!} alt={item.title || '新增原创设定'} loading="lazy" decoding="async" /><strong>{item.title || '新增角色'}</strong><span>原创设定</span><p>{item.body || '这个角色的故事仍在书写。'}</p></article>)}</OriginalCarousel>
    </section>

    <section className="original-daily-section" id="department-photo-gallery"><OriginalTitle no="03" icon={Camera} title="一起创作的日常" en="OUR DAILY LIFE" note="画画、写作、讨论、分享——和喜欢创作的人在一起，就是最平稳的日常。" />
      <OriginalDailyGallery photos={daily} />
    </section>

    <section className="original-video-section original-paper-section" id="department-media-shelf"><OriginalTitle no="04" icon={Play} title="看看我们真的做过什么" en="OUR WORKS" note="从原创手书、漫画到设定企划，这里留下原创部完成的作品。" />
      <OriginalCarousel label="原创部视频作品" className="original-video-carousel">{videos.map((video, index) => <a className="original-video-card" href={video.href} target="_blank" rel="noreferrer" key={`${video.href}-${index}`}><figure><img src={video.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /><i><Play aria-hidden="true" /></i><em>{video.duration}</em></figure><div><strong>{video.title}</strong><small>{video.publishedAt}</small>{video.description && <p>{video.description}</p>}</div></a>)}</OriginalCarousel>
    </section>

    <section className="original-toolbox-section" id="original-toolbox"><OriginalTitle no="05" icon={BookOpen} title="画具箱" en="TOOLBOX" note="一些创作路上的小工具，希望能够帮到你。" /><div className="original-toolbox-grid"><div>{toolbox.map(([title, note], index) => <details key={title}><summary><span>{index % 2 ? <Link2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}{title}</span><b>＋</b></summary><p>{note}</p></details>)}{addedTools.map(item => item.linkUrl ? <a href={item.linkUrl} target="_blank" rel="noreferrer" key={item.id}><Link2 aria-hidden="true" /><span><strong>{item.title || '新增创作资源'}</strong><small>{item.body || '打开资源'}</small></span></a> : <details key={item.id}><summary><span><Lightbulb aria-hidden="true" />{item.title || '新增创作资源'}</span><b>＋</b></summary><p>{item.body || '由原创部成员整理。'}</p></details>)}</div><aside id="original-join"><PixelSprite slug="original" /><p>加入原创部，和我们一起创造更多可能。</p><strong>当前 {dept.memberCount ?? 0} 位在编成员</strong><Link to="/join?department=dept-original">申请加入原创部 <ArrowRight aria-hidden="true" /></Link></aside></div></section>

    <DepartmentGuestbook slug="original" departmentId="dept-original" departmentName="原创部" number="06" />
    <section className="original-message-lead"><MessageSquareText aria-hidden="true" /><div><small>07 · CREATIVE FORUM</small><h2>把作品、灵感与问题带到讨论区</h2></div><a href="#department-post-board">前往原创讨论区 <ArrowRight aria-hidden="true" /></a></section>
    <PixelDivider flip />
  </main>;
}
