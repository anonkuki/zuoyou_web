import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { ExternalLink, Pencil, X } from 'lucide-react';
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

function AddedItems({ items, onPreview }: { items: PageContentItem[]; onPreview: (src: string, alt: string) => void }) {
  if (!items.length) return null;
  return <div className="page-managed-items" aria-label="页面新增内容">
    {items.map(item => <article className="page-managed-item" key={item.id}>
      {item.imageUrl && (item.linkUrl
        ? <a className="page-managed-image" href={item.linkUrl} target="_blank" rel="noreferrer"><img src={item.imageUrl} alt={item.title || '页面展示图片'} /><ExternalLink aria-hidden="true" /></a>
        : <button className="page-managed-image" type="button" onClick={() => onPreview(item.imageUrl!, item.title || '页面展示图片')}><img src={item.imageUrl} alt={item.title || '页面展示图片'} /></button>)}
      <div>{item.title && <h3>{item.title}</h3>}{item.body && <p>{item.body}</p>}</div>
    </article>)}
  </div>;
}

function SectionAdditions({ sectionId, items, onPreview }: { sectionId: string; items: PageContentItem[]; onPreview: (src: string, alt: string) => void }) {
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
  return host ? createPortal(<AddedItems items={items} onPreview={onPreview} />, host) : null;
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
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);
  const links = useMemo(() => new Map(config.imageLinks.map(item => [item.imageUrl, item.linkUrl])), [config.imageLinks]);
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

  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    const image = event.target instanceof HTMLImageElement ? event.target : null;
    if (!image || image.closest('.page-managed-image')) return;
    const source = image.getAttribute('src') ?? '';
    const link = links.get(source);
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(link);
      return;
    }
    if (image.closest('a,button') || !image.alt) return;
    event.preventDefault();
    setPreview({ src: image.currentSrc || source, alt: image.alt });
  };

  const itemsBySection = sections.map(section => ({ section, items: config.items.filter(item => item.sectionId === section.id) }));
  const unmatched = config.items.filter(item => !sectionIds.includes(item.sectionId));

  return <div ref={surfaceRef} className="page-content-surface" onClickCapture={handleImageClick}>
    {children}
    {itemsBySection.map(({ section, items }) => <SectionAdditions key={section.id} sectionId={section.id} items={items} onPreview={(src, alt) => setPreview({ src, alt })} />)}
    {unmatched.length > 0 && <section className="page-managed-fallback shell"><AddedItems items={unmatched} onPreview={(src, alt) => setPreview({ src, alt })} /></section>}
    {canEdit && <div className="page-edit-entry shell"><Link className="guild-button" to={editTo}><Pencil aria-hidden="true" /> 编辑页面</Link></div>}
    {preview && <div className="page-image-lightbox" role="dialog" aria-modal="true" aria-label="图片预览" onClick={() => setPreview(null)}>
      <button type="button" aria-label="关闭图片预览" onClick={() => setPreview(null)}><X aria-hidden="true" /></button>
      <img src={preview.src} alt={preview.alt} onClick={event => event.stopPropagation()} />
    </div>}
  </div>;
}
