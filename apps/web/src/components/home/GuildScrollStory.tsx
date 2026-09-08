import { useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

const departmentNames = ['COS', '原创', '舞装', '轻音', '技术', '外宣&幻想研'] as const;

interface StoryPhoto { src: string; alt: string; label: string }

const storyImages: Record<'origin' | 'cosplay' | 'music' | 'dance' | 'publicity', StoryPhoto> = {
  origin: { src: '/assets/photos/homepage/history-anniversary.jpg', alt: '佐佑动漫社社庆成员合影', label: 'MEET / CREATE / REMEMBER' },
  cosplay: { src: '/assets/photos/homepage/department-cosplay.jpg', alt: 'COS部角色创作与成员合影', label: 'COSPLAY' },
  music: { src: '/assets/photos/homepage/department-music-stage.jpg', alt: '轻音部舞台演出', label: 'MUSIC' },
  dance: { src: '/assets/photos/homepage/department-dance-stage.jpg', alt: '舞装部舞台演出', label: 'STAGE' },
  publicity: { src: '/assets/photos/homepage/beaa9848eae182ff7dfc56e17a934e45_720.jpg', alt: '社团舞台活动现场', label: 'LIVE' },
};

const closingPhotos: StoryPhoto[] = [
  { src: '/assets/photos/homepage/15b8a918bcb5aea7fc45711763e291d0_720.jpg', alt: '社团成员在百团大战现场合影', label: 'CLUB DAY' },
  { src: '/assets/photos/homepage/55d0f7860a6e9866e520fcfa2a1e2543_720.jpg', alt: '社团舞台活动谢幕合影', label: 'CURTAIN CALL' },
  { src: '/assets/photos/homepage/85BC250F67B0837CD93D88AE8C556410.jpg', alt: '社团成员在林荫道合影', label: 'TOGETHER' },
  { src: '/assets/photos/homepage/9d6156ab37bfa8b54f5097ce7b13b02e_720.jpg', alt: '社团成员在校园活动现场合影', label: 'CAMPUS DAY' },
  { src: '/assets/photos/homepage/e4f65602cf9bfe0131781936ead9c20d_720.jpg', alt: '社团舞台角色活动合影', label: 'ON STAGE' },
  { src: '/assets/photos/homepage/f4e1e9e68a60f59d37b7490893385f2e_720.jpg', alt: '舞装部成员舞台合影', label: 'DANCE' },
  { src: '/assets/photos/homepage/friends-night.jpg', alt: '夜间活动结束后的成员合影', label: 'MEET' },
];

function StackedPhotoCarousel({ photos }: { photos: StoryPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const move = (direction: -1 | 1) => setActiveIndex(index => (index + direction + photos.length) % photos.length);
  return (
    <div className="story-photo-carousel" aria-label="首页活动照片轮播">
      <div className="story-photo-deck" aria-live="polite">
        {photos.map((photo, index) => {
          const offset = (index - activeIndex + photos.length) % photos.length;
          return (
            <figure
              className={`story-photo-card${offset === 0 ? ' is-active' : ''}`}
              style={{ '--photo-offset': Math.min(offset, 4) } as CSSProperties}
              aria-hidden={offset === 0 ? undefined : 'true'}
              key={photo.src}
            >
              <img src={photo.src} alt={offset === 0 ? photo.alt : ''} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
              <figcaption><small>{String(activeIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</small><strong>{photo.label}</strong></figcaption>
            </figure>
          );
        })}
      </div>
      <div className="story-carousel-controls">
        <button type="button" onClick={() => move(-1)} aria-label="上一张首页展示图"><ArrowLeft aria-hidden="true" /></button>
        <div className="story-carousel-dots" aria-label="选择首页展示图">
          {photos.map((photo, index) => <button type="button" className={index === activeIndex ? 'is-active' : ''} onClick={() => setActiveIndex(index)} aria-label={`查看首页展示图 ${index + 1}：${photo.alt}`} aria-current={index === activeIndex ? 'true' : undefined} key={photo.src} />)}
        </div>
        <button type="button" onClick={() => move(1)} aria-label="下一张首页展示图"><ArrowRight aria-hidden="true" /></button>
      </div>
    </div>
  );
}

export function GuildScrollStory() {
  const reduceMotion = useReducedMotion();
  const sectionReveal = reduceMotion ? {} : {
    initial: { opacity: 0, y: 72 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: .18 },
    transition: { duration: .8, ease: 'easeOut' as const },
  };
  const mediaFromRight = reduceMotion ? {} : {
    initial: { opacity: 0, x: 72, rotate: 2 },
    whileInView: { opacity: 1, x: 0, rotate: 0 },
    viewport: { once: true, amount: .28 },
    transition: { duration: .9, ease: 'easeOut' as const },
  };
  const mediaFromLeft = reduceMotion ? {} : {
    initial: { opacity: 0, x: -72 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, amount: .22 },
    transition: { duration: .9, ease: 'easeOut' as const },
  };

  return (
    <section className="guild-scroll-story" data-scroll-layout="continuous" aria-label="佐佑动漫社滚动介绍">
      <div className="story-grid-glow" aria-hidden="true" />

      <motion.article className="story-chapter story-origin" data-scroll-section="origin" {...sectionReveal}>
        <div className="story-section-index" aria-hidden="true"><span>01</span><i /><small>ORIGIN</small></div>
        <div className="story-copy">
          <small>CHAPTER 01 · OUR ORIGIN</small>
          <p className="story-year" aria-label="1999"><span>19</span><span>99</span></p>
          <h2>从 Virus 漫画社，<br />到佐佑动漫社</h2>
          <p className="story-body"><strong>1999年3月</strong>，北方交大 Virus 漫画社正式成立。<br /><strong>2013年</strong>，正式更名为佐佑动漫社 <span>(Sayuu Animation Club)</span>。</p>
          <Link className="story-text-link" to="/history">翻阅社团历史 <ArrowUpRight /></Link>
        </div>
        <motion.div className="story-origin-collage" {...mediaFromRight} aria-label="社团创作素材拼贴">
          <figure className="story-frame frame-origin"><img src={storyImages.origin.src} alt={storyImages.origin.alt} /><figcaption>{storyImages.origin.label}</figcaption></figure>
          <div className="mascot-card"><img className="story-mascot-cutout" src="/assets/brand/youzi-mascot.png" alt="佐佑动漫社柚子吉祥物" /><span>你好，新朋友</span></div>
          <span className="story-stamp">SINCE<br />1999</span>
        </motion.div>
      </motion.article>

      <motion.article className="story-chapter story-create" data-scroll-section="departments" {...sectionReveal}>
        <div className="story-section-index" aria-hidden="true"><span>02</span><i /><small>CREATE</small></div>
        <motion.div className="story-collage-wall" {...mediaFromLeft} aria-label="部门活动素材墙">
          <figure className="collage-tile tile-cos"><img src={storyImages.cosplay.src} alt={storyImages.cosplay.alt} /><span>{storyImages.cosplay.label}</span></figure>
          <figure className="collage-tile tile-music"><img src={storyImages.music.src} alt={storyImages.music.alt} /><span>{storyImages.music.label}</span></figure>
          <figure className="collage-tile tile-dance"><img src={storyImages.dance.src} alt={storyImages.dance.alt} /><span>{storyImages.dance.label}</span></figure>
          <figure className="collage-tile tile-publicity"><img src={storyImages.publicity.src} alt={storyImages.publicity.alt} /><span>{storyImages.publicity.label}</span></figure>
        </motion.div>
        <div className="story-copy story-copy-right">
          <small>CHAPTER 02 · CREATE TOGETHER</small>
          <p className="story-outline-word" aria-hidden="true">CREATE</p>
          <h2>创作，<br />不设边界。</h2>
          <p className="story-body">画面、舞台、声音、技术与记录彼此穿插。这里没有单一答案，只有把灵感认真做出来的人。</p>
          <div className="story-departments" aria-label="六个创作部门">
            {departmentNames.map((name, index) => <span key={name}><i>{String(index + 1).padStart(2, '0')}</i>{name}</span>)}
          </div>
        </div>
      </motion.article>

      <motion.article className="story-chapter story-freedom" data-scroll-section="freedom" {...sectionReveal}>
        <div className="story-section-index" aria-hidden="true"><span>03</span><i /><small>YOUR TURN</small></div>
        <div className="freedom-stage">
          <div className="freedom-note">
            <small>CHAPTER 03 · YOUR TURN</small>
            <p className="freedom-kicker">YOUR IDEA / OUR NEXT STORY</p>
            <h2>兴趣是入口，<br />作品让我们相遇。</h2>
            <p>从一个点子、一张草图、一段旋律开始。带着你喜欢的事，来和我们做点没做过的。</p>
            <Link className="story-primary-link" to="/departments">进入六个部门 <ArrowUpRight /></Link>
          </div>
          <motion.div className="freedom-gallery" aria-label="创作作品拼贴" {...mediaFromRight}>
            <StackedPhotoCarousel photos={closingPhotos} />
            <div className="freedom-principles" aria-label="创作原则">
              <span><b>自由度高</b><small>FOLLOW YOUR CURIOSITY</small></span>
              <span><b>综合性强</b><small>MAKE IT TOGETHER</small></span>
            </div>
            <img className="freedom-mascot" src="/assets/brand/youzi-mascot.png" alt="柚子吉祥物邀请你加入创作" />
            <span className="freedom-pixel-mark" aria-hidden="true">WE<br />CREATE</span>
          </motion.div>
        </div>
      </motion.article>
    </section>
  );
}
