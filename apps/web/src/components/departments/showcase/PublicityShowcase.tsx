import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Camera, Clapperboard, ExternalLink, FileText, Image, MessageSquareText, Play, Projector } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ShowcaseProps } from '../DeptShowcasePage';
import { WordReveal } from '../WordReveal';
import { PixelDivider, PixelSprite } from '../pixel';
import { ChapterRail, entranceProps, useHeroParallax } from '../shared';
import { departmentPhotosBySlug, type DepartmentPhoto } from '../department-photos';
import { departmentMediaBySlug } from '../department-media';
import { usePageContentConfig, usePageSectionItems, type PageContentItem } from '../../page-content/PageContentSurface';

const reviewNotes = [
  ['为什么我们依然需要“随文字起便”？', '在不断定时的时代，重温成长的勇气。'],
  ['动画里那些没有说出口的告别', '从镜头、配乐与留白中寻找情绪。'],
  ['角色弧光：一次缓慢但真实的改变', '聊聊那些让人愿意反复观看的角色。'],
] as const;
const screenings = [
  ['2026.11.16', '秋季追番交流会', '图书馆放映厅', '32'], ['2026.10.19', '新海诚作品回顾', '团日活动室', '46'],
  ['2026.09.21', '经典作品鉴赏', '社团活动室', '28'], ['2026.06.15', '奇幻短片专题', '图书馆放映厅', '35'],
] as const;
const pressKit = [['选题参考', '从灵感到可执行的内容方向'], ['推文规范', '标题、配图与排版建议'], ['影评投稿', '幻想研文章投稿说明'], ['海报模板', '活动视觉素材与尺寸规范']] as const;

function PublicityTitle({ no, icon: Icon, title, en, note }: { no: string; icon: typeof Clapperboard; title: string; en: string; note: string }) {
  return <header className="publicity-archive-title"><span>{no}</span><i><Icon aria-hidden="true" /></i><div><h2>{title}</h2><small>{en}</small></div><p>{note}</p></header>;
}

function PublicityCarousel({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => viewportRef.current?.scrollBy({ left: direction * viewportRef.current.clientWidth * .82, behavior: 'smooth' });
  return <div className={`publicity-carousel ${className}`} aria-label={label}><button type="button" className="publicity-carousel-arrow is-prev" onClick={() => move(-1)} aria-label={`查看上一组${label}`}><ArrowLeft aria-hidden="true" /></button><div className="publicity-carousel-viewport" ref={viewportRef} tabIndex={0}><div className="publicity-carousel-track">{children}</div></div><button type="button" className="publicity-carousel-arrow is-next" onClick={() => move(1)} aria-label={`查看下一组${label}`}><ArrowRight aria-hidden="true" /></button></div>;
}

function PublicityPhotoLog({ photos }: { photos: DepartmentPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => setActiveIndex(index => Math.min(index, Math.max(photos.length - 1, 0))), [photos.length]);
  if (!photos.length) return <p className="publicity-empty">还没有社团现场照片，可在编辑页面中添加。</p>;
  const active = photos[activeIndex];
  const move = (direction: -1 | 1) => setActiveIndex(index => (index + direction + photos.length) % photos.length);
  return <div className="publicity-photo-log"><div className="publicity-photo-stage"><figure key={active.src}><img src={active.src} alt={active.alt} loading={activeIndex === 0 ? 'eager' : 'lazy'} decoding="async" /><figcaption><small>{active.source}</small><strong>{active.caption}</strong></figcaption></figure><button type="button" className="is-prev" aria-label="上一张社团现场照片" onClick={() => move(-1)}><ArrowLeft aria-hidden="true" /></button><button type="button" className="is-next" aria-label="下一张社团现场照片" onClick={() => move(1)}><ArrowRight aria-hidden="true" /></button></div><aside><small>CLUB PHOTO LOG</small><b>{String(activeIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</b><h3>{active.caption}</h3><p>放映、记录与交流，让每一次相聚都成为日后还能翻阅的社团记忆。</p></aside><div className="publicity-photo-thumbs" aria-label="社团现场缩略图">{photos.map((photo, index) => <button type="button" className={index === activeIndex ? 'is-active' : ''} aria-label={`查看第 ${index + 1} 张社团现场照片`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => setActiveIndex(index)} key={`${photo.src}-${index}`}><img src={photo.src} alt="" loading="lazy" decoding="async" /><b>{String(index + 1).padStart(2, '0')}</b></button>)}</div></div>;
}

const addedPhoto = (item: PageContentItem): DepartmentPhoto | null => item.imageUrl ? { src: item.imageUrl, alt: item.title || '新增外宣活动照片', caption: item.title || '新增社团现场记录', source: '本部门投稿' } : null;

/** 外宣&幻想研 · 保留原白箱影院版头，版头下重组为紧凑的放映与宣传档案。 */
export function PublicityShowcase({ dept, show }: ShowcaseProps) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useHeroParallax(heroRef);
  const reduce = useReducedMotion();
  const config = usePageContentConfig();
  const addedShowing = usePageSectionItems('publicity-show').filter(item => item.imageUrl);
  const addedFilms = usePageSectionItems('publicity-films').filter(item => item.imageUrl);
  const addedPhotos = usePageSectionItems('department-photo-gallery').map(addedPhoto).filter((item): item is DepartmentPhoto => Boolean(item));
  const addedMedia = usePageSectionItems('publicity-media-wall');
  const addedReviews = usePageSectionItems('publicity-reviews');
  const addedScreenings = usePageSectionItems('publicity-screenings');
  const addedPress = usePageSectionItems('publicity-press');
  const media = departmentMediaBySlug.publicity;
  const photos = useMemo(() => [...new Map([...(departmentPhotosBySlug.publicity ?? []), ...addedPhotos].filter(item => !config.hiddenImageUrls.includes(item.src)).map(item => [item.src, item])).values()], [addedPhotos, config.hiddenImageUrls]);
  const films = show.films.filter(item => !config.hiddenImageUrls.includes(item.cover));

  return <main className="dept-page dept-publicity publicity-archive-page">
    <ChapterRail accent={show.accent} items={[
      { id: 'publicity-show', no: '01', label: '正在上映' }, { id: 'publicity-films', no: '02', label: '年度片单' },
      { id: 'department-photo-gallery', no: '03', label: '社团现场' }, { id: 'publicity-media-wall', no: '04', label: '推文海报墙' },
      { id: 'publicity-reviews', no: '05', label: '影评专栏' }, { id: 'publicity-screenings', no: '06', label: '番看会记录' },
      { id: 'publicity-press', no: '07', label: '场刊' }, { id: 'department-post-board', no: '08', label: '外宣讨论区' },
    ]} />

    <section className="cinema-hero showcase-hero" ref={heroRef}>
      <motion.div className="hero-layer layer-far" style={{ y: parallax.far }} aria-hidden="true"><img src={show.films[0].banner} alt="" fetchPriority="high" decoding="async" /></motion.div>
      <motion.div className="hero-layer layer-near" style={{ y: parallax.near }} aria-hidden="true"><img src={show.films[7].banner} alt="" loading="lazy" decoding="async" /></motion.div>
      <div className="hero-texture texture-halftone" aria-hidden="true" /><div className="cinema-speedlines" aria-hidden="true" /><div className="projector-flicker" aria-hidden="true" /><span className="cinema-onoma onoma-don" aria-hidden="true">ドン</span><span className="cinema-onoma onoma-gogo" aria-hidden="true">ゴゴゴ</span><span className="hero-vertical" aria-hidden="true">{show.vertical}</span>
      <motion.div className="showcase-hero-copy cinema-hero-copy" style={{ y: parallax.copy, opacity: parallax.fade }}><div className="cinema-marquee" aria-hidden="true"><span className="cinema-bulbs"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span><strong>NOW SHOWING</strong><span className="cinema-bulbs"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span></div><span className="dept-kicker"><Clapperboard aria-hidden="true" /> {show.themeEn} · {dept.title}</span><h1><WordReveal text={dept.name} /></h1><p className="dept-tagline"><WordReveal text={show.tagline} /></p><p className="dept-intro">{show.intro}</p><PixelSprite slug="publicity" className="hero-sprite" /></motion.div>
    </section>

    <section className="publicity-dark-section publicity-now-showing" id="publicity-show"><PublicityTitle no="01" icon={Play} title="正在上映" en="NOW SHOWING" note="这一格胶片，正在播放我们最近共同看过的故事。" /><PublicityCarousel label="正在上映" className="publicity-filmstrip">{[...films, ...addedShowing.map((item, index) => ({ title: item.title || '新增放映记录', romaji: item.body || `NEW SCREENING ${index + 1}`, year: new Date().getFullYear(), cover: item.imageUrl!, banner: item.imageUrl! }))].map((film, index) => <motion.figure key={`${film.cover}-${index}`} whileHover={{ y: -5 }}><img src={film.cover} alt={`${film.title} 海报`} loading="lazy" decoding="async" /><figcaption><span>{String(index + 1).padStart(2, '0')}</span><strong>{film.title}</strong><small>{film.romaji}</small></figcaption></motion.figure>)}</PublicityCarousel></section>

    <section className="publicity-paper-section publicity-catalogue" id="publicity-films"><PublicityTitle no="02" icon={Projector} title="年度片单" en="FILM CATALOGUE" note="那些曾打开过我们的动画，也同样在未来与新成员相遇。" /><PublicityCarousel label="年度片单" className="publicity-catalogue-carousel">{[...films.map(item => ({ title: item.title, body: `${item.romaji} · ${item.year}`, imageUrl: item.cover, id: item.cover })), ...addedFilms].map((item, index) => <motion.figure key={`${item.id}-${index}`} {...(reduce ? {} : entranceProps('publicity', index))}><img src={item.imageUrl!} alt={`${item.title} 海报`} loading="lazy" decoding="async" /><figcaption><strong>{item.title}</strong><small>{item.body}</small></figcaption></motion.figure>)}</PublicityCarousel></section>

    <section className="publicity-photo-section" id="department-photo-gallery"><PublicityTitle no="03" icon={Camera} title="放映、记录与社团现场" en="CLUB PHOTO LOG" note="幻想研牵头协办组建了北京高校观影团，与各高校动漫爱好者一同走进院线观影。" /><PublicityPhotoLog photos={photos} /></section>

    <section className="publicity-paper-section publicity-media-section" id="publicity-media-wall"><PublicityTitle no="04" icon={Image} title="推文／海报墙" en="MEDIA WALL" note="用图像写文字，也是与人隔着屏幕打招呼。" />{media.annualReport && <a className="annual-report-card" href={media.annualReport.href} target="_blank" rel="noreferrer" aria-label="打开佐佑动漫社 2025 年度总结网站"><span className="annual-report-preview"><span className="annual-report-browser-bar" aria-hidden="true"><i /><i /><i /><em>2025.zuoyou-archive</em></span><iframe src={media.annualReport.href} title="佐佑动漫社 2025 年度报告首页预览" loading="lazy" tabIndex={-1} aria-hidden="true" sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" /><span className="annual-report-preview-shade" aria-hidden="true" /><span className="annual-report-preview-badge">网站首页实时预览</span></span><span className="annual-report-copy"><small>ANNUAL ARCHIVE · 2025</small><strong>{media.annualReport.title}</strong><p>{media.annualReport.description}</p><b>查看完整年度报告 <ExternalLink aria-hidden="true" /></b></span></a>}<PublicityCarousel label="推文与海报" className="publicity-media-carousel">{[...(media.wechatArticles ?? []).map(item => ({ id: item.href, title: item.title, body: item.publishedAt, imageUrl: item.cover, linkUrl: item.href })), ...addedMedia].map(item => <a href={item.linkUrl ?? undefined} target={item.linkUrl ? '_blank' : undefined} rel={item.linkUrl ? 'noreferrer' : undefined} aria-label={item.linkUrl?.startsWith('https://mp.weixin.qq.com/') ? `${item.title} · 在微信公众号阅读` : undefined} key={item.id}><img src={item.imageUrl ?? films[0]?.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /><span><strong>{item.title || '新增宣传记录'}</strong><small>{item.body || 'PUBLICITY ARCHIVE'}</small></span>{item.linkUrl && <ExternalLink aria-hidden="true" />}</a>)}</PublicityCarousel></section>

    <section className="publicity-paper-section publicity-review-section" id="publicity-reviews"><PublicityTitle no="05" icon={BookOpen} title="幻想研影评专栏" en="REVIEW COLUMN" note="在文字里重逢动画，也思考作品照亮的世界。" /><div className="publicity-review-grid"><article className="is-featured"><img src={films[8]?.cover} alt="" loading="lazy" decoding="async" /><div><small>专题影评</small><h3>{reviewNotes[0][0]}</h3><p>{reviewNotes[0][1]}我们记录的不只是结论，也是在观看中逐渐发生的理解。</p></div></article>{reviewNotes.slice(1).map(([title, body], index) => <article key={title}><img src={films[index + 1]?.cover} alt="" loading="lazy" decoding="async" /><div><small>幻想研</small><h3>{title}</h3><p>{body}</p></div></article>)}{addedReviews.map(item => <article key={item.id}><img src={item.imageUrl ?? films[3]?.cover} alt="" loading="lazy" decoding="async" /><div><small>新增专栏</small><h3>{item.title || '新的影评记录'}</h3><p>{item.body}</p>{item.linkUrl && <a href={item.linkUrl} target="_blank" rel="noreferrer">继续阅读 <ArrowRight aria-hidden="true" /></a>}</div></article>)}</div></section>

    <section className="publicity-screening-section" id="publicity-screenings"><PublicityTitle no="06" icon={CalendarDays} title="番看会放映记录" en="SCREENING LOG" note="在熟悉的放映厅里，我们共享同一段时间。" /><div className="publicity-screening-grid"><div className="publicity-screening-table"><div><b>日期</b><b>放映主题</b><b>地点</b><b>参与人数</b></div>{screenings.map(row => <div key={row[0]}>{row.map(cell => <span key={cell}>{cell}</span>)}</div>)}{addedScreenings.map(item => <div key={item.id}><span>NEW</span><span>{item.title || '新增放映记录'}</span><span>{item.body || '待定'}</span><span>—</span></div>)}</div><aside><small>NEXT SCREENING</small><h3>下次番看会</h3><strong>幻想研季度放映</strong><p>时间与片单将在讨论区公布。</p><a href="#department-post-board">参与讨论 <ArrowRight aria-hidden="true" /></a></aside></div></section>

    <section className="publicity-press-section" id="publicity-press"><PublicityTitle no="07" icon={FileText} title="场刊" en="BACKSTAGE" note="让热爱变成值得留下来的文字与图像。" /><div className="publicity-press-grid"><div>{pressKit.map(([title, note]) => <details key={title}><summary>{title}<b>＋</b></summary><p>{note}</p></details>)}{addedPress.map(item => item.linkUrl ? <a href={item.linkUrl} target="_blank" rel="noreferrer" key={item.id}><ExternalLink aria-hidden="true" /><span><strong>{item.title || '新增场刊资源'}</strong><small>{item.body}</small></span></a> : <details key={item.id}><summary>{item.title || '新增场刊内容'}<b>＋</b></summary><p>{item.body}</p></details>)}</div><aside><PixelSprite slug="publicity" /><h3>加入外宣／幻想研</h3><p>喜欢动画、文字、影像或设计，都可以在这里找到自己的位置。</p><strong>当前 {dept.memberCount ?? 0} 位在编成员</strong><Link to="/join?department=dept-publicity">申请加入 <ArrowRight aria-hidden="true" /></Link></aside></div></section>

    <section className="publicity-forum-lead"><MessageSquareText aria-hidden="true" /><div><small>08 · FORUM</small><h2>外宣＆幻想研讨论区</h2><p>分享番剧、交换影评，也欢迎带着新的选题来聊天。</p></div><a href="#department-post-board">进入讨论区 <ArrowRight aria-hidden="true" /></a></section><PixelDivider flip />
  </main>;
}
