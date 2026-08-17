import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { showcaseBySlug, type DepartmentInfo, type DeptShowcase } from './showcase-data';
import { WordReveal } from './WordReveal';
import { PixelSprite } from './pixel';
import { entranceProps } from './shared';

/** 每个部门主题的索引卡微型视觉（纯 CSS/SVG 的简化主题符号） */
function MiniVisual({ slug }: { slug: string }) {
  switch (slug) {
    case 'publicity':
      return <div className="mini-visual mini-cinema" aria-hidden="true"><i className="mini-marquee">NOW SHOWING</i><span className="mini-film"><b /><b /><b /></span></div>;
    case 'tech':
      return <div className="mini-visual mini-viewfinder" aria-hidden="true"><i className="vf-corner tl" /><i className="vf-corner tr" /><i className="vf-corner bl" /><i className="vf-corner br" /><span className="vf-focus-box" /><em className="vf-rec">REC</em></div>;
    case 'original':
      return <div className="mini-visual mini-atelier" aria-hidden="true"><i className="iso-cube c1" /><i className="iso-cube c2" /><i className="iso-cube c3" /><span className="iso-stair" /></div>;
    case 'dance':
      return <div className="mini-visual mini-stage" aria-hidden="true"><i className="mini-beam b1" /><i className="mini-beam b2" /><span className="mini-floor" /></div>;
    case 'cos':
      return <div className="mini-visual mini-mirror" aria-hidden="true"><span className="mini-mirror-glass" /><i className="mini-mirror-spark s1">✦</i><i className="mini-mirror-spark s2">✧</i></div>;
    case 'music':
      return <div className="mini-visual mini-vinyl" aria-hidden="true"><span className="mini-disc" /><i className="mini-eq"><b /><b /><b /><b /></i></div>;
    default:
      return <div className="mini-visual mini-generic" aria-hidden="true"><Shield /></div>;
  }
}

function ChapterCard({ dept, show, flip }: { dept: DepartmentInfo; show: DeptShowcase; flip: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      className={`department-card dept-chapter dept-theme-${show.slug}${flip ? ' is-flip' : ''}`}
      style={{ '--dept-color': show.accent, '--dept-accent': show.accent } as CSSProperties}
      {...(reduce ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true } } : entranceProps(show.slug))}
    >
      <span className="dept-chapter-no" aria-hidden="true">{String(show.order).padStart(2, '0')}</span>
      <div className="dept-chapter-copy">
        <small>{show.themeEn} · {dept.title}</small>
        <h2><WordReveal text={dept.name} /></h2>
        <p className="dept-chapter-theme">{show.theme} <em>{show.tagline}</em></p>
        <div className="duty-tags">{show.duties.map(duty => <span key={duty}>{duty}</span>)}</div>
        <div className="department-foot">
          <span><Users /> {dept.memberCount ?? 0} 位成员</span>
          <Link to={`/departments/${dept.slug}`}>进入驻地 <ArrowRight /></Link>
        </div>
      </div>
      <div className="dept-chapter-visual">
        <MiniVisual slug={show.slug} />
        <div className="dept-chapter-covers">
          {show.films.slice(0, 4).map(f => <img key={f.cover} src={f.cover} alt={`${f.romaji} 封面`} loading="lazy" decoding="async" />)}
        </div>
        <PixelSprite slug={show.slug} className="dept-chapter-sprite" />
      </div>
    </motion.article>
  );
}

function GenericCard({ dept, index }: { dept: DepartmentInfo; index: number }) {
  return (
    <motion.article
      className="department-card dept-chapter is-generic"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="dept-chapter-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className="dept-chapter-copy">
        <small>{dept.title || 'GUILD CLASS'}</small>
        <h2><WordReveal text={dept.name} /></h2>
        <p className="dept-chapter-theme"><em>{dept.description}</em></p>
        <div className="department-foot">
          <span><Users /> {dept.memberCount ?? 0} 位成员</span>
          <Link to={`/departments/${dept.slug}`}>进入驻地 <ArrowRight /></Link>
        </div>
      </div>
      <div className="dept-chapter-visual"><MiniVisual slug={dept.slug} /></div>
    </motion.article>
  );
}

export function DepartmentsHub({ items }: { items: DepartmentInfo[] }) {
  const sorted = [...items].sort((a, b) => (showcaseBySlug[a.slug]?.order ?? 99) - (showcaseBySlug[b.slug]?.order ?? 99));
  return (
    <section className="shell department-grid dept-hub" aria-label="六个职业部门索引">
      {sorted.map((dept, index) => {
        const show = showcaseBySlug[dept.slug];
        return show
          ? <ChapterCard key={dept.slug} dept={dept} show={show} flip={show.order % 2 === 0} />
          : <GenericCard key={dept.slug} dept={dept} index={index} />;
      })}
    </section>
  );
}
