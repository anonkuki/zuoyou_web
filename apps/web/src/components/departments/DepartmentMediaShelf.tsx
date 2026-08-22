import { useState } from 'react';
import { BookOpen, Check, Copy, ExternalLink, MessageCircle, Play, Radio } from 'lucide-react';
import { departmentMediaBySlug, officialSocialLinks } from './department-media';

const formatViews = (views: number) => views >= 10000 ? `${(views / 10000).toFixed(1)}万` : String(views);

export function DepartmentMediaShelf({ slug }: { slug: string }) {
  const media = departmentMediaBySlug[slug];
  const [copied, setCopied] = useState(false);
  if (!media) return null;

  const copyChannel = async () => {
    await navigator.clipboard?.writeText(officialSocialLinks.qqChannelCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="department-media-shelf" aria-label="部门社团实录">
      <header className="department-media-head">
        <span><Radio aria-hidden="true" /> GUILD CHANNEL</span>
        <h2>{media.videos?.length ? '看看我们真的做过什么' : '读一读我们留下的记录'}</h2>
        <p>{media.videos?.length
          ? `收录清单中的 ${media.videos.length} 部部门作品，点击后前往 B站作品页观看。`
          : '外宣与幻想研的内容以公众号文章和年度总结网站为主。'}</p>
      </header>
      {media.videos && <div className="department-video-grid">
        {media.videos.map((item, index) => <a
          className={`department-video-card${index === 0 ? ' is-featured' : ''}`}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${item.title} · 在哔哩哔哩观看`}
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
            <b>{formatViews(item.views)} 次播放（采集时） <ExternalLink aria-hidden="true" /></b>
          </span>
        </a>)}
      </div>}

      {media.annualReport && <a
        className="annual-report-card"
        href={media.annualReport.href}
        target="_blank"
        rel="noreferrer"
        aria-label="打开佐佑动漫社 2025 年度总结网站"
      >
        <BookOpen aria-hidden="true" />
        <span><small>ANNUAL ARCHIVE · 2025</small><strong>{media.annualReport.title}</strong><p>{media.annualReport.description}</p></span>
        <b>进入年度总结 <ExternalLink aria-hidden="true" /></b>
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
    </section>
  );
}
