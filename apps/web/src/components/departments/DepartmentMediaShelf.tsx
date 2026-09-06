import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, ExternalLink, MessageCircle, Play, Radio, X } from 'lucide-react';
import type { DepartmentVideo } from './department-media';
import { departmentMediaBySlug, officialSocialLinks } from './department-media';

const formatViews = (views: number) => views >= 10000 ? `${(views / 10000).toFixed(1)}万` : String(views);
const bilibiliPlayerUrl = (bvid: string) => `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`;

export function DepartmentMediaShelf({ slug }: { slug: string }) {
  const media = departmentMediaBySlug[slug];
  const [copied, setCopied] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<DepartmentVideo | null>(null);

  useEffect(() => {
    if (!previewVideo) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewVideo(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [previewVideo]);

  if (!media) return null;

  const copyChannel = async () => {
    await navigator.clipboard?.writeText(officialSocialLinks.qqChannelCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="department-media-shelf" className="department-media-shelf" aria-label="部门社团实录">
      <header className="department-media-head">
        <span><Radio aria-hidden="true" /> GUILD CHANNEL</span>
        <h2>{media.videos?.length ? '看看我们真的做过什么' : '读一读我们留下的记录'}</h2>
        <p>{media.videos?.length
          ? `收录清单中的 ${media.videos.length} 部部门作品，点击即可在站内预览，也可前往 B站作品页。`
          : '外宣与幻想研的内容以公众号文章和年度总结网站为主。'}</p>
      </header>
      {media.videos && <div className="department-video-grid">
        {media.videos.map((item, index) => <button
          type="button"
          className={`department-video-card${index === 0 ? ' is-featured' : ''}`}
          onClick={() => setPreviewVideo(item)}
          aria-label={`${item.title} · 站内预览`}
          key={item.bvid}
        >
          <span className="department-video-cover">
            <img src={item.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            <i><Play aria-hidden="true" /></i>
            <em>{item.duration}</em>
          </span>
          <span className="department-video-copy">
            <small>BILIBILI · {item.publishedAt}</small>
            <strong>{item.title}</strong>
            <span>{item.note}</span>
            <b>{formatViews(item.views)} 次播放（采集时） <Play aria-hidden="true" /></b>
          </span>
        </button>)}
      </div>}

      {media.annualReport && <a
        className="annual-report-card"
        href={media.annualReport.href}
        target="_blank"
        rel="noreferrer"
        aria-label="打开佐佑动漫社 2025 年度总结网站"
      >
        <span className="annual-report-preview">
          <span className="annual-report-browser-bar" aria-hidden="true"><i /><i /><i /><em>2025.zuoyou-archive</em></span>
          <iframe src={media.annualReport.href} title="佐佑动漫社 2025 年度报告首页预览" loading="lazy" tabIndex={-1} aria-hidden="true" sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" />
          <span className="annual-report-preview-shade" aria-hidden="true" /><span className="annual-report-preview-badge">网站首页实时预览</span>
        </span>
        <span className="annual-report-copy"><small>ANNUAL ARCHIVE · 2025</small><strong>{media.annualReport.title}</strong><p>{media.annualReport.description}</p><b>查看完整年度报告 <ExternalLink aria-hidden="true" /></b></span>
      </a>}

      {media.wechatArticles && <div className="publicity-feed">
        <div className="publicity-feed-title">
          <MessageCircle aria-hidden="true" />
          <div><h3>外宣&amp;幻想研近期推送</h3><p>影评、活动回顾与社团日常，都收在这里。</p></div>
        </div>
        <div className="publicity-article-grid">
          {media.wechatArticles.map((article) => <a
            key={article.href}
            href={article.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${article.title} · 在微信公众号阅读`}
          >
            <img src={article.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            <span><small>{article.publishedAt}</small><strong>{article.title}</strong></span>
            <ExternalLink aria-hidden="true" />
          </a>)}
        </div>
        <div className="qq-channel-card">
          <span><strong>QQ 频道</strong><small>频道号 {officialSocialLinks.qqChannelCode}</small></span>
          <button type="button" onClick={copyChannel} aria-label={`复制 QQ 频道号 ${officialSocialLinks.qqChannelCode}`}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? '频道号已复制' : '复制频道号'}
          </button>
        </div>
      </div>}

      {previewVideo && createPortal(
        <div
          className="home-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={previewVideo.title}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewVideo(null);
          }}
        >
          <div className="home-video-modal-panel">
            <header>
              <span><Radio aria-hidden="true" /> BILIBILI PREVIEW</span>
              <button type="button" onClick={() => setPreviewVideo(null)} aria-label="关闭视频预览"><X aria-hidden="true" /></button>
            </header>
            <div className="home-video-player">
              <iframe
                src={bilibiliPlayerUrl(previewVideo.bvid)}
                title={`${previewVideo.title} · B站播放器`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            </div>
            <footer>
              <div><small>{previewVideo.publishedAt} · {previewVideo.duration}</small><strong>{previewVideo.title}</strong></div>
              <a href={previewVideo.href} target="_blank" rel="noreferrer">仍要前往 B站作品页 <ExternalLink aria-hidden="true" /></a>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
