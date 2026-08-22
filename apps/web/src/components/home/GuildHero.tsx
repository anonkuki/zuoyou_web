import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { GuildHomeStats } from '@guild/contracts';
import { GuildStats } from './GuildStats';
import { LuminousGuildScene } from './LuminousGuildScene';
import type { SceneSpeaker } from './MascotGuide';

export function GuildHero({ stats, loading = false, onSelectSpeaker, selectedSpeaker }: { stats?: GuildHomeStats; loading?: boolean; onSelectSpeaker?: (speaker: SceneSpeaker) => void; selectedSpeaker?: string | null }) {
  return (
    <section className="guild-hero luminous-guild-hero">
      <LuminousGuildScene onSelectSpeaker={onSelectSpeaker} selectedSpeaker={selectedSpeaker}/>
      <aside className="hero-chapter-rail" data-hero-chapter="guild-arrival" aria-label="首页章节">
        <span>01</span><i /><small>清晨到访</small>
      </aside>
      <motion.div className="guild-hero-copy" data-surface="open-landscape-overlay" data-visual-priority="primary" initial={{ x: -28 }} animate={{ x: 0 }} transition={{ duration: .7 }}>
        <span className="hero-mini-crest">✦</span>
        <small className="hero-season">SAYUU ANIMATION CLUB · SINCE 1999</small>
        <strong className="hero-we-are">WE ARE</strong>
        <h1 className="hero-creative-title">创作型社团</h1>
        <div className="hero-title-plaque">自由度高 · 综合性强</div>
        <b>ZOUYOU ANIME GUILD</b>
        <p><span>画面、舞台、声音、技术与记录在这里交织，</span><span>每一种兴趣，都能成为共同创作的起点。</span></p>
        <div><Link className="hero-pixel-button gold" to="/departments">逛逛各部门 <ArrowRight /></Link><Link className="hero-pixel-button blue" to="/join">来认识我们 <ArrowRight /></Link></div>
      </motion.div>
      <a className="hero-scroll-cue" href="#guild-passages" data-scroll-cue="continue" aria-label="继续查看公会入口">
        <span>SCROLL TO EXPLORE</span><i />
      </a>
      <GuildStats stats={stats} loading={loading} />
    </section>
  );
}
