import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, ExternalLink, Image, Play, Scissors, Sparkles, Ticket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, entranceProps, useHeroParallax } from '../shared';
import type { FilmEntry } from '../showcase-data';
import { departmentPhotosBySlug, type DepartmentPhoto } from '../department-photos';
import { departmentMediaBySlug, type DepartmentVideo } from '../department-media';
import { usePageContentConfig, usePageSectionItems, type PageContentItem } from '../../page-content/PageContentSurface';

type CosVideo = Pick<DepartmentVideo, 'title' | 'cover' | 'href' | 'publishedAt' | 'duration'> & { description?: string };

const wardrobeNotes = [
  ['服装分类', '版型、布料与角色服装资料'], ['妆造技巧', '化妆、假发与造型经验'],
  ['道具整理', '道具制作与收纳分类'], ['返图制作', '修图思路与作品归档'],
] as const;

const managedVideo = (item: PageContentItem): CosVideo | null => item.imageUrl && item.linkUrl ? {
  title: item.title || 'COS部作品记录', cover: item.imageUrl, href: item.linkUrl,
  publishedAt: 'NEW', duration: 'BILIBILI', description: item.body,
} : null;

function CosSectionTitle({ no, icon: Icon, title, en, note }: { no: string; icon: typeof Camera; title: string; en: string; note: string }) {
  return <header className="cos-archive-title"><span>{no}</span><i><Icon aria-hidden="true" /></i><div><h2>{title}</h2><small>{en}</small></div><p>{note}</p></header>;
}

function CosCarousel({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (viewport && typeof viewport.scrollBy === 'function') viewport.scrollBy({ left: direction * viewport.clientWidth * .82, behavior: 'smooth' });
  };
  return <div className={`cos-carousel ${className}`} aria-label={label}>
    <button type="button" className="cos-carousel-arrow is-prev" onClick={() => move(-1)} aria-label={`查看上一组${label}`}><ArrowLeft aria-hidden="true" /></button>
    <div className="cos-carousel-viewport" ref={viewportRef} tabIndex={0}><div className="cos-carousel-track">{children}</div></div>
    <button type="button" className="cos-carousel-arrow is-next" onClick={() => move(1)} aria-label={`查看下一组${label}`}><ArrowRight aria-hidden="true" /></button>
  </div>;
}

/** 变身卡：素颜（灰度剪影）⇢ 上妆（全彩），clip-path 圆形擦除 + 交叉溶解长缓动 */
function HenshinCard({ film, index }: { film: FilmEntry; index: number }) {
  return <motion.figure className="henshin-card" initial="before" whileInView="after" whileHover="after" viewport={{ once: true, margin: '-14% 0px' }}>
    <motion.img className="henshin-before" src={film.cover} alt="" aria-hidden="true" loading="lazy" decoding="async" variants={{ before: { opacity: 1 }, after: { opacity: .35, transition: { duration: 1.3, delay: index * .1, ease: [0.22, 1, 0.36, 1] } } }} />
    <motion.img className="henshin-after" src={film.cover} alt={`${film.title} 定妆照`} loading="lazy" decoding="async" variants={{ before: { clipPath: 'circle(0% at 50% 42%)' }, after: { clipPath: 'circle(78% at 50% 42%)', transition: { duration: 1.3, delay: index * .1, ease: [0.22, 1, 0.36, 1] } } }} />
    <motion.span className="henshin-ring" aria-hidden="true" variants={{ before: { opacity: .9, scale: .4 }, after: { opacity: 0, scale: 1.6, transition: { duration: 1.3, delay: index * .1 } } }} />
    <figcaption><span className="henshin-label label-before">BEFORE</span><span className="henshin-label label-after">AFTER</span><strong>{film.title}</strong><small>{film.romaji}</small></figcaption>
  </motion.figure>;
}

function CosMemoryGallery({ photos }: { photos: DepartmentPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => setActiveIndex(index => Math.min(index, Math.max(photos.length - 1, 0))), [photos.length]);
  if (!photos.length) return <p className="cos-empty">还没有角色与活动照片，可在编辑页面中添加。</p>;
  const active = photos[activeIndex];
  const move = (direction: -1 | 1) => setActiveIndex(index => (index + direction + photos.length) % photos.length);
  return <div className="cos-memory-gallery">
    <div className="cos-memory-stage"><figure key={active.src}><img src={active.src} alt={active.alt} loading={activeIndex === 0 ? 'eager' : 'lazy'} decoding="async" /><figcaption><small>MEMORY {String(activeIndex + 1).padStart(2, '0')}</small><strong>{active.caption}</strong></figcaption></figure><button type="button" className="is-prev" onClick={() => move(-1)} aria-label="上一张角色与伙伴照片"><ArrowLeft aria-hidden="true" /></button><button type="button" className="is-next" onClick={() => move(1)} aria-label="下一张角色与伙伴照片"><ArrowRight aria-hidden="true" /></button></div>
    <aside><small>角色与活动记录</small><b>{String(activeIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</b><h3>{active.caption}</h3><p>镜头记录的不只是造型完成的一刻，还有准备、相聚与共同把角色带进现实的过程。</p><span>{active.source}</span></aside>
    <div className="cos-memory-thumbs" aria-label="角色与伙伴缩略图">{photos.map((photo, index) => <button type="button" className={index === activeIndex ? 'is-active' : ''} aria-label={`查看第 ${index + 1} 张角色与伙伴照片`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => setActiveIndex(index)} key={`${photo.src}-${index}`}><img src={photo.src} alt="" loading="lazy" decoding="async" /><b>{String(index + 1).padStart(2, '0')}</b></button>)}</div>
  </div>;
}

/** COS部 · 保留原镜中变身版头，版头下重组为紧凑的角色、作品与漫展档案。 */
export function CosShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const reduce = useReducedMotion();
  const config = usePageContentConfig();
  const addedTransformations = usePageSectionItems('cos-henshin').filter(item => item.imageUrl);
  const addedPhotos = usePageSectionItems('department-photo-gallery').filter(item => item.imageUrl);
  const addedVideos = usePageSectionItems('department-media-shelf').map(managedVideo).filter((item): item is CosVideo => Boolean(item));
  const addedConventions = usePageSectionItems('cos-conventions');
  const addedWardrobe = usePageSectionItems('cos-wardrobe');
  const photos = useMemo(() => [...new Map([...(departmentPhotosBySlug.cos ?? []), ...addedPhotos.map(item => ({ src: item.imageUrl!, alt: item.title || 'COS部新增活动照片', caption: item.title || '新增角色与活动记录', source: '本部门投稿' as const }))].filter(item => !config.hiddenImageUrls.includes(item.src)).map(item => [item.src, item])).values()], [addedPhotos, config.hiddenImageUrls]);
  const videos: CosVideo[] = [...(departmentMediaBySlug.cos.videos ?? []).filter(item => !config.hiddenImageUrls.includes(item.cover)).map(item => ({ ...item, description: item.note })), ...addedVideos];

  return <main className="dept-page dept-cos cos-archive-page">
    <ChapterRail accent={show.accent} items={[
      { id: 'cos-henshin', no: '01', label: '变身记录' }, { id: 'department-photo-gallery', no: '02', label: '角色与伙伴' },
      { id: 'department-media-shelf', no: '03', label: '作品记录' }, { id: 'cos-conventions', no: '04', label: '漫展出展' },
      { id: 'cos-wardrobe', no: '05', label: '衣装间' }, { id: 'department-post-board', no: '06', label: 'COS部讨论区' },
    ]} />

    <section className="mirror-hero showcase-hero" ref={heroRef} id="cos-mirror">
      <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true"><img src={show.films[0].banner} alt="" fetchPriority="high" decoding="async" /></motion.div>
      <div className="hero-texture texture-mirror" aria-hidden="true" />
      <div className="mirror-blob blob-a" aria-hidden="true" /><div className="mirror-blob blob-b" aria-hidden="true" />
      <span className="mirror-butterfly" aria-hidden="true" /><span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
      <div className="mirror-frame" aria-hidden="true"><div className="mirror-glass"><span className="mirror-sweep" /><em>HENSHIN</em></div></div>
      <motion.div className="showcase-hero-copy mirror-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}><span className="dept-kicker"><Sparkles aria-hidden="true" /> {show.themeEn} · {dept.title}</span><h1><WordReveal text={dept.name} /></h1><p className="dept-tagline"><WordReveal text={show.tagline} /></p><p className="dept-intro">{show.intro}</p><PixelSprite slug="cos" className="hero-sprite" /></motion.div>
    </section>

    <PixelDivider />

    <section className="cos-paper-section cos-transform-section" id="cos-henshin"><CosSectionTitle no="01" icon={Sparkles} title="变身记录" en="TRANSFORMATION" note="妆造、服装与角色演绎，记录每一次成为角色的瞬间。" /><CosCarousel label="变身记录" className="cos-henshin-carousel">{show.films.filter(item => !config.hiddenImageUrls.includes(item.cover)).map((film, index) => <HenshinCard key={film.cover} film={film} index={index} />)}{addedTransformations.map(item => <motion.figure className="henshin-card" whileHover={{ y: -5 }} key={item.id}><img className="henshin-after" src={item.imageUrl!} alt={item.title || '新增变身记录'} loading="lazy" decoding="async" /><figcaption><span className="henshin-label label-after">NEW</span><strong>{item.title || '新增变身记录'}</strong>{item.body && <small>{item.body}</small>}</figcaption></motion.figure>)}</CosCarousel></section>

    <section className="cos-memory-section" id="department-photo-gallery"><CosSectionTitle no="02" icon={Camera} title="镜头里的角色与伙伴" en="LIVE MEMORIES" note="拍摄的不只是角色，也是一起准备、一起闪耀的伙伴。" /><CosMemoryGallery photos={photos} /></section>

    <section className="cos-paper-section cos-work-section" id="department-media-shelf"><CosSectionTitle no="03" icon={Play} title="看看我们真的做过什么" en="OUR WORKS" note="从舞台剧到接力企划，完整记录 COS 部完成的作品。" /><CosCarousel label="COS部视频作品" className="cos-video-carousel">{videos.map((video, index) => <motion.a href={video.href} target="_blank" rel="noreferrer" className="cos-video-card" key={`${video.href}-${index}`} {...(reduce ? {} : entranceProps('cos', index))}><figure><img src={video.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /><i><Play aria-hidden="true" /></i><em>{video.duration}</em></figure><div><strong>{video.title}</strong><small>{video.publishedAt}</small>{video.description && <p>{video.description}</p>}</div></motion.a>)}</CosCarousel></section>

    <section className="cos-convention-section" id="cos-conventions"><CosSectionTitle no="04" icon={Ticket} title="漫展出展" en="CONVENTION BOOTH" note="每一次出展，都是和更多同好见面的机会。" /><div className="cos-convention-grid"><figure>{photos[1] && <img src={photos[1].src} alt={photos[1].alt} loading="lazy" decoding="async" />}<figcaption>相遇，在更大的世界</figcaption></figure><div className="cos-convention-schedule"><small>UPCOMING SCHEDULE</small><h3>近期出展计划</h3>{['社团招新 · 角色返图交流', '校园漫展 · 社团摊位', '主题摄影 · 外景协作'].map((item, index) => <p key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span><em>{index === 0 ? '筹备中' : '计划中'}</em></p>)}{addedConventions.map(item => item.linkUrl ? <a href={item.linkUrl} target="_blank" rel="noreferrer" key={item.id}><ExternalLink aria-hidden="true" /><span><strong>{item.title || '新增出展信息'}</strong><small>{item.body}</small></span></a> : <p key={item.id}><b>NEW</b><span>{item.title || '新增出展信息'}<small>{item.body}</small></span><em>更新</em></p>)}</div><div className="cos-convention-strip">{photos.slice(2).map(photo => <figure key={photo.src}><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" /><figcaption>{photo.caption}</figcaption></figure>)}</div></div></section>

    <section className="cos-paper-section cos-wardrobe-section" id="cos-wardrobe"><CosSectionTitle no="05" icon={Scissors} title="衣装间" en="WARDROBE" note="服装、妆造、道具与返图，是角色诞生背后的功课。" /><div className="cos-wardrobe-grid"><div>{wardrobeNotes.map(([title, note], index) => <details key={title}><summary><span>{index % 2 ? <Sparkles aria-hidden="true" /> : <Scissors aria-hidden="true" />}{title}</span><b>＋</b></summary><p>{note}</p></details>)}{addedWardrobe.map(item => item.linkUrl ? <a href={item.linkUrl} target="_blank" rel="noreferrer" key={item.id}><ExternalLink aria-hidden="true" /><span><strong>{item.title || '新增衣装资源'}</strong><small>{item.body || '打开资源'}</small></span></a> : <details key={item.id}><summary><span><Image aria-hidden="true" />{item.title || '新增衣装资源'}</span><b>＋</b></summary><p>{item.body || '由 COS 部成员整理。'}</p></details>)}</div><aside id="cos-join"><PixelSprite slug="cos" /><h3>加入 COS 部</h3><p>不论是 Coser、摄影、妆造、后勤，欢迎一起让喜欢的角色走进现实。</p><strong>当前 {dept.memberCount ?? 0} 位在编成员</strong><Link to="/join?department=dept-cos">申请加入 COS 部 <ArrowRight aria-hidden="true" /></Link></aside></div></section>

    <section className="cos-forum-lead"><Users aria-hidden="true" /><div><small>06 · FORUM</small><h2>COS部讨论区</h2><p>分享作品、交流经验，也可以寻找下一次合作的伙伴。</p></div><a href="#department-post-board">进入讨论区 <ArrowRight aria-hidden="true" /></a></section>
    <PixelDivider flip />
  </main>;
}
