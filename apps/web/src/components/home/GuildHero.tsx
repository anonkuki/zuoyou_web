import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { GuildHomeStats } from '@guild/contracts';
import { GuildStats } from './GuildStats';
import { LuminousGuildScene } from './LuminousGuildScene';

export function GuildHero({ stats, loading = false }: { stats?: GuildHomeStats; loading?: boolean }) {
  return (
    <section className="guild-hero luminous-guild-hero">
      <LuminousGuildScene />
      <aside className="hero-chapter-rail" data-hero-chapter="guild-arrival" aria-label="首页章节">
        <span>01</span><i /><small>公会抵达</small>
      </aside>
      <motion.div className="guild-hero-copy" data-surface="open-landscape-overlay" data-visual-priority="primary" initial={{ x: -28 }} animate={{ x: 0 }} transition={{ duration: .7 }}>
        <span className="hero-mini-crest">✦</span>
        <small className="hero-season">MORNING OF ADVENTURE · 2026</small>
        <h1>佐佑动漫社</h1>
        <div className="hero-title-plaque">冒险者公会</div>
        <b>ZOUYOU ANIME GUILD</b>
        <p><span>我们是来自不同世界的冒险者，</span><span>因为热爱动漫而相聚，</span><span>在晨光里书写属于我们的故事。</span></p>
        <div><Link className="hero-pixel-button gold" to="/departments">探索公会 <ArrowRight /></Link><Link className="hero-pixel-button blue" to="/join">加入冒险 <ArrowRight /></Link></div>
      </motion.div>
      <a className="hero-scroll-cue" href="#guild-passages" data-scroll-cue="continue" aria-label="继续查看公会入口">
        <span>SCROLL TO EXPLORE</span><i />
      </a>
      <GuildStats stats={stats} loading={loading} />
    </section>
  );
}
