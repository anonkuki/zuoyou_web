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
        <small className="hero-season">A NEW DAY AT ZOUYOU · 2026</small>
        <h1>佐佑动漫社</h1>
        <div className="hero-title-plaque">今天也在公会集合</div>
        <b>ZOUYOU ANIME GUILD</b>
        <p><span>有人负责舞台，有人守着画板，</span><span>也有人把每次相聚好好记录下来。</span><span>欢迎来看看，我们今天正在忙什么。</span></p>
        <div><Link className="hero-pixel-button gold" to="/departments">逛逛各部门 <ArrowRight /></Link><Link className="hero-pixel-button blue" to="/join">来认识我们 <ArrowRight /></Link></div>
      </motion.div>
      <a className="hero-scroll-cue" href="#guild-passages" data-scroll-cue="continue" aria-label="继续查看公会入口">
        <span>SCROLL TO EXPLORE</span><i />
      </a>
      <GuildStats stats={stats} loading={loading} />
    </section>
  );
}
