import { ArrowRight, BookOpen, Camera, Castle, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

type CardVariant = 'history' | 'departments' | 'activities';

const cardMeta: Record<CardVariant, { title: string; subtitle: string; eyebrow: string; stamp: string; button: string; to: string; storyFormat: string; Icon: LucideIcon }> = {
  history: { title: '社团往事', subtitle: '从第一张招新海报开始，看看佐佑一路走来的小故事。', eyebrow: 'OUR STORY · 2018—2026', stamp: '旧相册', button: '从头看看', to: '/chronicle', storyFormat: 'chronicle', Icon: BookOpen },
  departments: { title: '六个部门', subtitle: '画画、舞台、音乐、技术……总有一处适合你的兴趣。', eyebrow: 'SIX CLUB ROOMS', stamp: '逛部门', button: '认识大家', to: '/departments', storyFormat: 'guild-roster', Icon: Castle },
  activities: { title: '最近在忙', subtitle: '漫展、Live、外拍与创作，每次相聚都有好好记录。', eyebrow: 'RECENT DAYS', stamp: '新记录', button: '看看近况', to: '/activities', storyFormat: 'field-report', Icon: Camera },
};

function CardArtwork({ variant }: { variant: CardVariant }) {
  if (variant === 'history') return <div className="card-artwork history-art"><img className="portal-scene portal-history" src="/assets/background/portals/history-forest.png" alt="" aria-hidden="true" draggable={false} data-card-art-layer="licensed-backdrop"/><span className="card-skyline" data-card-art-layer="backdrop"/><span className="library-shelf" data-card-art-layer="midground"><i/><b/><em/></span><span className="history-desk" data-card-art-layer="foreground"/><span className="pixel-candle c1"/><span className="pixel-candle c2"/><div className="open-book"><i/><b/><span/><em/></div></div>;
  if (variant === 'departments') return <div className="card-artwork department-art"><img className="portal-scene portal-departments" src="/assets/background/portals/departments-town.png" alt="" aria-hidden="true" draggable={false} data-card-art-layer="licensed-backdrop"/><span className="hall-brick-wall" data-card-art-layer="backdrop"/><span className="guild-hall-crowd" data-card-art-layer="midground"><i/><b/><em/><strong/></span><div className="hall-table" data-card-art-layer="foreground"/><span className="mini-banner b1">✦</span><span className="mini-banner b2">♜</span><span className="mini-banner b3">♪</span><span className="mini-banner b4">✎</span><i className="mini-fire"/></div>;
  return <div className="card-artwork archive-art"><img className="portal-scene portal-activities" src="/assets/background/portals/activities-mountains.png" alt="" aria-hidden="true" draggable={false} data-card-art-layer="licensed-backdrop"/><span className="archive-shelves" data-card-art-layer="backdrop"><i/><b/></span><span className="archive-paper-stack" data-card-art-layer="midground"/><span className="archive-desk" data-card-art-layer="foreground"/><span className="photo photo-one"><i/></span><span className="photo photo-two"><i/></span><span className="pixel-camera"><b/><i/></span><em className="archive-scroll"/></div>;
}

export function AdventureCard({ variant }: { variant: CardVariant }) {
  const meta = cardMeta[variant];
  return <motion.article className={`adventure-entry-card ${variant}`} data-portal-art={variant} data-story-format={meta.storyFormat} whileHover={{y:-7}} whileTap={{scale:.985}} transition={{type:'spring',stiffness:260,damping:20}}>
    <div className="adventure-card-heading"><meta.Icon/><div><small>{meta.eyebrow}</small><h2>{meta.title}</h2><p>{meta.subtitle}</p></div><span>{meta.stamp}</span></div>
    <CardArtwork variant={variant}/>
    <Link to={meta.to} aria-label={`查看${meta.title}`} data-card-link="full"><span className="adventure-card-cta">{meta.button}<ArrowRight/></span></Link>
  </motion.article>;
}
