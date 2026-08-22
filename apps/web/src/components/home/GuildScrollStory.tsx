import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

const departmentNames = ['COS', '原创', '舞装', '轻音', '技术', '外宣&幻想研'] as const;

const storyImages = {
  origin: '/assets/departments/original/01-banner.jpg',
  cosplay: '/assets/departments/cos/03-banner.jpg',
  music: '/assets/departments/music/02-banner.jpg',
  dance: '/assets/departments/dance/03-banner.jpg',
  publicity: '/assets/departments/publicity/05-banner.jpg',
};

export function GuildScrollStory() {
  const storyRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ['start start', 'end end'] });

  const chapterOneOpacity = useTransform(scrollYProgress, [0, .04, .25, .34], [1, 1, 1, 0]);
  const chapterOneY = useTransform(scrollYProgress, [0, .34], ['0vh', '-15vh']);
  const chapterTwoOpacity = useTransform(scrollYProgress, [.25, .36, .58, .68], [0, 1, 1, 0]);
  const chapterTwoY = useTransform(scrollYProgress, [.25, .68], ['16vh', '-12vh']);
  const chapterThreeOpacity = useTransform(scrollYProgress, [.6, .72, 1], [0, 1, 1]);
  const chapterThreeY = useTransform(scrollYProgress, [.6, 1], ['16vh', '0vh']);
  const collageShift = useTransform(scrollYProgress, [0, 1], ['5vh', '-8vh']);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const motionStyle = (opacity: typeof chapterOneOpacity, y: typeof chapterOneY) => reduceMotion ? undefined : { opacity, y };

  return (
    <section ref={storyRef} className="guild-scroll-story" data-scroll-story="three-chapter" aria-label="佐佑动漫社滚动介绍">
      <div className="scroll-story-sticky">
        <div className="story-grid-glow" aria-hidden="true" />
        <aside className="story-progress" aria-hidden="true">
          <span>01</span><i><motion.b style={reduceMotion ? undefined : { scaleY: progressScale }} /></i><span>03</span>
        </aside>

        <motion.article className="story-chapter story-origin" style={motionStyle(chapterOneOpacity, chapterOneY)}>
          <div className="story-copy">
            <small>CHAPTER 01 · OUR ORIGIN</small>
            <p className="story-year"><span>19</span><span>99</span></p>
            <h2>从 Virus 漫画社，<br />到佐佑动漫社</h2>
            <p className="story-body"><strong>1999年3月</strong>，北方交大 Virus 漫画社正式成立。<br /><strong>2013年</strong>，正式更名为佐佑动漫社 <span>(Sayuu Animation Club)</span>。</p>
            <Link className="story-text-link" to="/history">翻阅社团历史 <ArrowUpRight /></Link>
          </div>
          <motion.div className="story-origin-collage" style={reduceMotion ? undefined : { y: collageShift }} aria-label="社团创作素材拼贴">
            <figure className="story-frame frame-origin"><img src={storyImages.origin} alt="原创部绘画作品" /><figcaption>DRAW / CREATE / SHARE</figcaption></figure>
            <img className="story-mascot-cutout" src="/assets/brand/youzi-mascot.png" alt="佐佑动漫社柚子吉祥物" />
            <span className="story-stamp">SINCE<br />1999</span>
          </motion.div>
        </motion.article>

        <motion.article className="story-chapter story-create" style={motionStyle(chapterTwoOpacity, chapterTwoY)}>
          <div className="story-collage-wall" aria-label="部门活动素材墙">
            <figure className="collage-tile tile-cos"><img src={storyImages.cosplay} alt="COS部角色创作" /><span>COSPLAY</span></figure>
            <figure className="collage-tile tile-music"><img src={storyImages.music} alt="轻音部音乐活动" /><span>MUSIC</span></figure>
            <figure className="collage-tile tile-dance"><img src={storyImages.dance} alt="舞装部舞台活动" /><span>STAGE</span></figure>
            <figure className="collage-tile tile-publicity"><img src={storyImages.publicity} alt="外宣与幻想研作品" /><span>MEDIA</span></figure>
          </div>
          <div className="story-copy story-copy-right">
            <small>CHAPTER 02 · CREATE TOGETHER</small>
            <p className="story-outline-word" aria-hidden="true">CREATE</p>
            <h2>创作，不设边界。</h2>
            <p className="story-body">画面、舞台、声音、技术与记录彼此穿插。这里没有单一答案，只有把灵感做出来的人。</p>
            <div className="story-departments" aria-label="六个创作部门">
              {departmentNames.map((name, index) => <span key={name}><i>{String(index + 1).padStart(2, '0')}</i>{name}</span>)}
            </div>
          </div>
        </motion.article>

        <motion.article className="story-chapter story-freedom" style={motionStyle(chapterThreeOpacity, chapterThreeY)}>
          <div className="freedom-type" aria-label="自由度高，综合性强">
            <span>自由度高</span>
            <span>综合性强</span>
          </div>
          <div className="freedom-note">
            <small>CHAPTER 03 · YOUR TURN</small>
            <h2>兴趣是入口，<br />作品是我们相遇的方式。</h2>
            <p>从一个点子、一张草图、一段旋律开始。带着你喜欢的事，来和我们做点没做过的。</p>
            <Link className="story-primary-link" to="/departments">进入六个部门 <ArrowUpRight /></Link>
          </div>
          <div className="freedom-orbit" aria-hidden="true"><i /><i /><i /><span>WE<br />CREATE</span></div>
        </motion.article>
      </div>
    </section>
  );
}
