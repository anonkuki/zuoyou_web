import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, MessageCircle, Play, Radio, X } from 'lucide-react';
import type { DepartmentVideo } from '../departments/department-media';
import { departmentMediaBySlug, officialSocialLinks } from '../departments/department-media';

const featuredVideos = [
  departmentMediaBySlug.dance.videos![0],
  departmentMediaBySlug.music.videos![0],
];

const featuredArticles = departmentMediaBySlug.publicity.wechatArticles!.slice(0, 3);

const bilibiliPlayerUrl = (bvid: string) =>
  `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`;

export function HomeSocialOutposts() {
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

  return (
    <section className="home-social-outposts" aria-label="社团宣传阵地">
      <header className="social-outposts-heading">
        <span><i /> SIGNAL 04 / KEEP IN TOUCH</span>
        <div>
          <h2>离开主页之后，<br />故事还在继续。</h2>
          <p>视频记录舞台与作品，长文留下观察与思考。沿着两个宣传阵地，继续认识佐佑。</p>
        </div>
      </header>

      <div className="social-outposts-grid">
        <article className="social-lane bilibili-lane">
          <header>
            <div className="social-platform-mark"><Radio aria-hidden="true" /><span>01</span></div>
            <div>
              <small>BILIBILI / MOTION</small>
              <h3>B站 · 动态影像阵地</h3>
              <p>社庆单品、舞台记录、原创音乐与部门作品，都在这里持续更新。</p>
            </div>
            <a
              href={officialSocialLinks.bilibili}
              target="_blank"
              rel="noreferrer"
              aria-label="访问佐佑动漫社哔哩哔哩主页"
            >
              进入官方空间 <ArrowUpRight aria-hidden="true" />
            </a>
          </header>

          <div className="home-video-list">
            {featuredVideos.map((video, index) => (
              <article className={index === 0 ? 'home-video-card is-featured' : 'home-video-card'} key={video.bvid}>
                <button
                  className="home-video-preview"
                  type="button"
                  onClick={() => setPreviewVideo(video)}
                  aria-label={`预览视频：${video.title}`}
                >
                  <img src={video.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  <span className="home-video-play"><Play aria-hidden="true" /></span>
                  <span className="home-video-duration">{video.duration}</span>
                  <span className="home-video-order">0{index + 1}</span>
                </button>
                <div className="home-video-copy">
                  <small>{video.publishedAt} · FEATURED WORK</small>
                  <h4>{video.title}</h4>
                  <a
                    href={video.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`在哔哩哔哩打开：${video.title}`}
                  >
                    直达作品页 <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="social-lane wechat-lane">
          <header>
            <div className="social-platform-mark"><MessageCircle aria-hidden="true" /><span>02</span></div>
            <div>
              <small>WECHAT / EDITORIAL</small>
              <h3>微信公众号 · 深度阅读阵地</h3>
              <p>影评、活动回顾和社团日常，用更完整的篇幅留下每次表达。</p>
            </div>
            <a
              href={officialSocialLinks.wechat}
              target="_blank"
              rel="noreferrer"
              aria-label="阅读佐佑动漫社微信公众号最新文章"
            >
              阅读最新推送 <ArrowUpRight aria-hidden="true" />
            </a>
          </header>

          <div className="home-wechat-list">
            {featuredArticles.map((article, index) => (
              <a
                className={index === 0 ? 'home-wechat-card is-featured' : 'home-wechat-card'}
                href={article.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${article.title} · 在微信公众号阅读`}
                key={article.href}
              >
                <span className="home-wechat-cover">
                  <img src={article.cover} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  <i>ARTICLE 0{index + 1}</i>
                </span>
                <span className="home-wechat-copy">
                  <small>{article.publishedAt}</small>
                  <strong>{article.title}</strong>
                  <b>阅读全文 <ArrowUpRight aria-hidden="true" /></b>
                </span>
              </a>
            ))}
          </div>
        </article>
      </div>

      {previewVideo && createPortal(
        <div
          className="home-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`正在预览：${previewVideo.title}`}
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
                title={`正在预览：${previewVideo.title}`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            <footer>
              <div><small>{previewVideo.publishedAt} · {previewVideo.duration}</small><strong>{previewVideo.title}</strong></div>
              <a href={previewVideo.href} target="_blank" rel="noreferrer">前往 B站观看完整视频 <ArrowUpRight aria-hidden="true" /></a>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
