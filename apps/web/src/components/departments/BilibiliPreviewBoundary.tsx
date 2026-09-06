import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Radio, X } from 'lucide-react';

interface PreviewVideo {
  bvid: string;
  href: string;
  title: string;
}

const readBvid = (href: string) => href.match(/\/video\/(BV[0-9A-Za-z]+)/)?.[1] ?? null;

/** Keeps the redesigned department cards while opening every Bilibili work in the in-site player. */
export function BilibiliPreviewBoundary({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<PreviewVideo | null>(null);

  useEffect(() => {
    if (!preview) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setPreview(null);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [preview]);

  const interceptBilibiliLink = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href*="bilibili.com/video/"]');
    if (!anchor) return;
    const bvid = readBvid(anchor.href);
    if (!bvid) return;
    event.preventDefault();
    const title = anchor.getAttribute('aria-label') || anchor.querySelector('strong')?.textContent || anchor.textContent || '部门视频作品';
    setPreview({ bvid, href: anchor.href, title: title.trim() });
  };

  return <>
    <div className="bilibili-preview-boundary" onClickCapture={interceptBilibiliLink}>{children}</div>
    {preview && createPortal(
      <div className="home-video-modal" role="dialog" aria-modal="true" aria-label={preview.title}
        onMouseDown={event => event.target === event.currentTarget && setPreview(null)}>
        <div className="home-video-modal-panel">
          <header><span><Radio aria-hidden="true" /> BILIBILI PREVIEW</span><button type="button" onClick={() => setPreview(null)} aria-label="关闭视频预览"><X aria-hidden="true" /></button></header>
          <div className="home-video-player"><iframe src={`https://player.bilibili.com/player.html?bvid=${preview.bvid}&autoplay=0`} title={`${preview.title} · B站播放器`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" /></div>
          <footer><div><small>部门作品 · 站内预览</small><strong>{preview.title}</strong></div><a href={preview.href} target="_blank" rel="noreferrer">仍要前往 B站作品页 <ExternalLink aria-hidden="true" /></a></footer>
        </div>
      </div>, document.body,
    )}
  </>;
}
