import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

const departmentNames = ['COS', '原创', '舞装', '轻音', '技术', '外宣&幻想研'] as const;

const storyImages = {
  origin: '/assets/departments/original/01-banner.jpg',
  cosplay: '/assets/departments/cos/03-banner.jpg',
  music: '/assets/departments/music/02-banner.jpg',
  dance: '/assets/departments/dance/03-banner.jpg',
  publicity: '/assets/departments/publicity/05-banner.jpg',
  sketch: '/assets/departments/original/06-banner.jpg',
  ensemble: '/assets/departments/music/05-banner.jpg',
  encounter: '/assets/departments/dance/06-banner.jpg',
};

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
          <figure className="story-frame frame-origin"><img src={storyImages.origin} alt="原创部绘画作品" /><figcaption>DRAW / CREATE / SHARE</figcaption></figure>
          <div className="mascot-card"><img className="story-mascot-cutout" src="/assets/brand/youzi-mascot.png" alt="佐佑动漫社柚子吉祥物" /><span>你好，新朋友</span></div>
          <span className="story-stamp">SINCE<br />1999</span>
        </motion.div>
      </motion.article>

      <motion.article className="story-chapter story-create" data-scroll-section="departments" {...sectionReveal}>
        <div className="story-section-index" aria-hidden="true"><span>02</span><i /><small>CREATE</small></div>
        <motion.div className="story-collage-wall" {...mediaFromLeft} aria-label="部门活动素材墙">
          <figure className="collage-tile tile-cos"><img src={storyImages.cosplay} alt="COS部角色创作" /><span>COSPLAY</span></figure>
          <figure className="collage-tile tile-music"><img src={storyImages.music} alt="轻音部音乐活动" /><span>MUSIC</span></figure>
          <figure className="collage-tile tile-dance"><img src={storyImages.dance} alt="舞装部舞台活动" /><span>STAGE</span></figure>
          <figure className="collage-tile tile-publicity"><img src={storyImages.publicity} alt="外宣与幻想研作品" /><span>MEDIA</span></figure>
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
            <figure className="freedom-main-art">
              <img src={storyImages.sketch} alt="从草图开始的原创绘画" />
              <figcaption><small>01 / START WITH A LINE</small><strong>把喜欢的事<br />做成作品</strong></figcaption>
            </figure>
            <div className="freedom-art-strip">
              <figure><img src={storyImages.ensemble} alt="音乐创作与合奏" /><figcaption>SOUND</figcaption></figure>
              <figure><img src={storyImages.encounter} alt="伙伴相遇与共同创作" /><figcaption>MEET</figcaption></figure>
            </div>
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
