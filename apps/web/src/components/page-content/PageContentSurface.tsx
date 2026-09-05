import { createContext, useContext, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { ExternalLink, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

export interface PageContentItem {
  id: string;
  sectionId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
}

export interface PageContentConfig {
  hiddenSectionIds: string[];
  hiddenImageUrls: string[];
  items: PageContentItem[];
  imageLinks: Array<{ imageUrl: string; linkUrl: string }>;
}

export interface PageSectionDefinition { id: string; name: string; description?: string }

export interface PageContentResponse {
  pageKey: string;
  config: PageContentConfig;
  updatedAt: string | null;
}

export const emptyPageContentConfig = (): PageContentConfig => ({ hiddenSectionIds: [], hiddenImageUrls: [], items: [], imageLinks: [] });
export const pageContentQueryKey = (pageKey: string) => ['page-content', pageKey] as const;
const PageContentContext = createContext<PageContentConfig | null>(null);
export const usePageContentConfig = () => useContext(PageContentContext) ?? emptyPageContentConfig();
export const usePageSectionItems = (sectionId: string) => usePageContentConfig().items.filter(item => item.sectionId === sectionId);

const integratedImageSections = new Set([
  'department-photo-gallery',
  'publicity-show', 'publicity-films',
  'tech-sheet',
  'music-tracklist',
  'original-gallery',
  'dance-floor',
  'cos-henshin',
]);

function AddedItems({ items }: { items: PageContentItem[] }) {
  if (!items.length) return null;
  return <div className="page-managed-items" aria-label="页面新增内容">
    {items.map(item => <article className="page-managed-item" key={item.id}>
      {item.imageUrl && (item.linkUrl
        ? <a className="page-managed-image" href={item.linkUrl} target="_blank" rel="noreferrer"><img src={item.imageUrl} alt={item.title || '页面展示图片'} /><ExternalLink aria-hidden="true" /></a>
        : <figure className="page-managed-image"><img src={item.imageUrl} alt={item.title || '页面展示图片'} /></figure>)}
      <div>{item.title && <h3>{item.title}</h3>}{item.body && <p>{item.body}</p>}</div>
    </article>)}
  </div>;
}

function SectionAdditions({ sectionId, items }: { sectionId: string; items: PageContentItem[] }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const target = document.getElementById(sectionId);
    if (!target || !items.length) { setHost(null); return; }
    const node = document.createElement('div');
    node.className = 'page-managed-slot';
    target.appendChild(node);
    setHost(node);
    return () => { node.remove(); };
  }, [sectionId, items.length]);
  return host ? createPortal(<AddedItems items={items} />, host) : null;
}

export function PageContentSurface({ pageKey, sections, editTo, canEdit, children }: {
  pageKey: string;
  sections: PageSectionDefinition[];
  editTo: string;
  canEdit: boolean;
  children: ReactNode;
}) {
  const query = useQuery({ queryKey: pageContentQueryKey(pageKey), queryFn: () => api<PageContentResponse>(`/api/public/page-content/${encodeURIComponent(pageKey)}`) });
  const config = query.data?.config ?? emptyPageContentConfig();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [linkPreview, setLinkPreview] = useState<{ url: string; left: number; top: number } | null>(null);
  const [imagePreview, setImagePreview] = useState<{ src: string; alt: string; left: number; top: number; width: number; height: number } | null>(null);
  const links = useMemo(() => {
    const result = new Map<string, string>();
    const add = (imageUrl: string, linkUrl: string) => {
      result.set(imageUrl, linkUrl);
      try { result.set(new URL(imageUrl, window.location.href).href, linkUrl); } catch { /* Keep the original key. */ }
    };
    config.imageLinks.forEach(item => add(item.imageUrl, item.linkUrl));
    config.items.forEach(item => { if (item.imageUrl && item.linkUrl) add(item.imageUrl, item.linkUrl); });
    return result;
  }, [config.imageLinks, config.items]);
  const sectionIds = useMemo(() => sections.map(section => section.id), [sections]);

  useEffect(() => {
    const hidden = new Set(config.hiddenSectionIds);
    const changed: Array<{ element: HTMLElement; display: string }> = [];
    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (!element) continue;
      changed.push({ element, display: element.style.display });
      if (hidden.has(id)) element.style.display = 'none';
      else element.style.removeProperty('display');
    }
    return () => changed.forEach(({ element, display }) => { element.style.display = display; });
  }, [config.hiddenSectionIds, sectionIds]);

  useEffect(() => {
    const hidden = new Set(config.hiddenImageUrls);
    const changed: Array<{ element: HTMLElement; display: string }> = [];
    surfaceRef.current?.querySelectorAll('img').forEach(image => {
      if (!hidden.has(image.getAttribute('src') ?? '')) return;
      const element = (image.closest('figure,.page-managed-item') ?? image) as HTMLElement;
      if (changed.some(entry => entry.element === element)) return;
      changed.push({ element, display: element.style.display });
      element.style.display = 'none';
    });
    return () => changed.forEach(({ element, display }) => { element.style.display = display; });
  }, [config.hiddenImageUrls, config.items]);

  const linkForImage = (image: HTMLImageElement) => links.get(image.getAttribute('src') ?? '') ?? links.get(image.currentSrc);

  useEffect(() => {
    if (!imagePreview) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setImagePreview(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [imagePreview]);

  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    const image = event.target instanceof HTMLImageElement ? event.target : null;
    if (!image) return;
    if (image.closest('.page-image-float-zoom')) {
      event.preventDefault();
      event.stopPropagation();
      setImagePreview(null);
      return;
    }
    const link = linkForImage(image);
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(link);
      return;
    }
    if (image.closest('a,button') || !image.alt) return;
    event.preventDefault();
    const bounds = image.getBoundingClientRect();
    const ratio = bounds.width / Math.max(bounds.height, 1);
    let width = Math.min(Math.max(bounds.width * 1.36, bounds.width + 120), window.innerWidth - 32, 980);
    let height = width / ratio;
    if (height > window.innerHeight - 32) {
      height = window.innerHeight - 32;
      width = height * ratio;
    }
    const left = Math.max(16, Math.min(bounds.left + (bounds.width - width) / 2, window.innerWidth - width - 16));
    const top = Math.max(16, Math.min(bounds.top + (bounds.height - height) / 2, window.innerHeight - height - 16));
    const src = image.currentSrc || image.getAttribute('src') || '';
    setImagePreview(current => current?.src === src ? null : { src, alt: image.alt, left, top, width, height });
  };

  const showLinkPreview = (event: MouseEvent<HTMLDivElement>) => {
    const image = event.target instanceof HTMLImageElement ? event.target : null;
    if (!image) { if (linkPreview) setLinkPreview(null); return; }
    const url = linkForImage(image);
    if (!url) { if (linkPreview) setLinkPreview(null); return; }
    const bounds = image.getBoundingClientRect();
    const width = 294;
    const left = Math.max(12, window.innerWidth - width - 22);
    const top = Math.max(86, Math.min(bounds.top, window.innerHeight - 178));
    setLinkPreview(current => current?.url === url && current.left === left && current.top === top ? current : { url, left, top });
  };

  const itemsBySection = sections.map(section => ({ section, items: config.items.filter(item => item.sectionId === section.id && !(integratedImageSections.has(section.id) && item.imageUrl)) }));
  const unmatched = config.items.filter(item => !sectionIds.includes(item.sectionId));

  let linkDetails: URL | null = null;
  try { linkDetails = linkPreview ? new URL(linkPreview.url) : null; } catch { linkDetails = null; }

  return <PageContentContext.Provider value={config}><div ref={surfaceRef} className="page-content-surface" onClickCapture={handleImageClick} onMouseMove={showLinkPreview} onMouseLeave={() => setLinkPreview(null)}>
    {children}
    {itemsBySection.map(({ section, items }) => <SectionAdditions key={section.id} sectionId={section.id} items={items} />)}
    {unmatched.length > 0 && <section className="page-managed-fallback shell"><AddedItems items={unmatched} /></section>}
    {canEdit && <div className="page-edit-entry shell"><Link className="guild-button" to={editTo}><Pencil aria-hidden="true" /> 编辑页面</Link></div>}
    {linkPreview && linkDetails && <aside className="page-link-preview" style={{ left: linkPreview.left, top: linkPreview.top }} role="status">
      <span><ExternalLink aria-hidden="true" /> EXTERNAL LINK</span>
      <strong>{linkDetails.hostname.replace(/^www\./, '')}</strong>
      <p>{linkDetails.pathname === '/' ? '网站首页' : decodeURIComponent(linkDetails.pathname).slice(0, 90)}</p>
      <small>点击图片前往目标页面</small>
    </aside>}
    {imagePreview && <button
      type="button"
      className="page-image-float-zoom"
      role="dialog"
      aria-label="图片悬浮预览"
      style={{ left: imagePreview.left, top: imagePreview.top, width: imagePreview.width, height: imagePreview.height }}
      onClick={() => setImagePreview(null)}
    ><img src={imagePreview.src} alt={imagePreview.alt} /></button>}
  </div></PageContentContext.Provider>;
}
