import { ArrowRight, BookOpen, Camera, Castle, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

type CardVariant = 'history' | 'departments' | 'activities';

const cardMeta: Record<CardVariant, { title: string; subtitle: string; button: string; to: string; Icon: LucideIcon }> = {
  history: { title: '公会历史', subtitle: '记录我们的成长轨迹', button: '查看历史', to: '/chronicle', Icon: BookOpen },
  departments: { title: '职业大厅', subtitle: '了解各部门与职责', button: '探索部门', to: '/departments', Icon: Castle },
  activities: { title: '冒险档案', subtitle: '回顾精彩活动瞬间', button: '查看档案', to: '/activities', Icon: Camera },
};

function CardArtwork({ variant }: { variant: CardVariant }) {
  if (variant === 'history') return <div className="card-artwork history-art"><img className="portal-scene portal-history" src="/assets/background/portals/history-forest.png" alt="" aria-hidden="true" draggable={false} data-card-art-layer="licensed-backdrop"/><span className="card-skyline" data-card-art-layer="backdrop"/><span className="library-shelf" data-card-art-layer="midground"><i/><b/><em/></span><span className="history-desk" data-card-art-layer="foreground"/><span className="pixel-candle c1"/><span className="pixel-candle c2"/><div className="open-book"><i/><b/><span/><em/></div></div>;
  if (variant === 'departments') return <div className="card-artwork department-art"><img className="portal-scene portal-departments" src="/assets/background/portals/departments-town.png" alt="" aria-hidden="true" draggable={false} data-card-art-layer="licensed-backdrop"/><span className="hall-brick-wall" data-card-art-layer="backdrop"/><span className="guild-hall-crowd" data-card-art-layer="midground"><i/><b/><em/><strong/></span><div className="hall-table" data-card-art-layer="foreground"/><span className="mini-banner b1">✦</span><span className="mini-banner b2">♜</span><span className="mini-banner b3">♪</span><span className="mini-banner b4">✎</span><i className="mini-fire"/></div>;
  return <div className="card-artwork archive-art"><img className="portal-scene portal-activities" src="/assets/background/portals/activities-mountains.png" alt="" aria-hidden="true" draggable={false} data-card-art-layer="licensed-backdrop"/><span className="archive-shelves" data-card-art-layer="backdrop"><i/><b/></span><span className="archive-paper-stack" data-card-art-layer="midground"/><span className="archive-desk" data-card-art-layer="foreground"/><span className="photo photo-one"><i/></span><span className="photo photo-two"><i/></span><span className="pixel-camera"><b/><i/></span><em className="archive-scroll"/></div>;
}

export function AdventureCard({ variant }: { variant: CardVariant }) {
  const meta = cardMeta[variant];
  return <motion.article className={`adventure-entry-card ${variant}`} data-portal-art={variant} whileHover={{y:-9}} whileTap={{scale:.985}} transition={{type:'spring',stiffness:260,damping:20}}>
    <div className="adventure-card-heading"><meta.Icon/><div><h2>{meta.title}</h2><p>{meta.subtitle}</p></div></div>
    <CardArtwork variant={variant}/>
    <Link to={meta.to}>{meta.button}<ArrowRight/></Link>
  </motion.article>;
}
