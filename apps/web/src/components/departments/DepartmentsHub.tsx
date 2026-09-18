import { motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Pencil, Save, Shield, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { isDepartmentManagementRole, isExecutiveRole } from '@guild/contracts';
import { api, json } from '../../api';
import { useAuth } from '../../auth';
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

function EditButton({ dept, onEdit }: { dept: DepartmentInfo; onEdit?: () => void }) {
  return onEdit ? <button type="button" className="department-card-edit" aria-label={`编辑 ${dept.name}部门卡片`} onClick={onEdit}><Pencil aria-hidden="true" /> 编辑</button> : null;
}

function ChapterCard({ dept, show, flip, onEdit }: { dept: DepartmentInfo; show: DeptShowcase; flip: boolean; onEdit?: () => void }) {
  const reduce = useReducedMotion();
  const covers = show.hubCovers ?? show.films.slice(0, 4).map(film => ({ src: film.cover, alt: `${film.romaji} 封面` }));
  return (
    <motion.article
      className={`department-card dept-chapter dept-theme-${show.slug}${flip ? ' is-flip' : ''}`}
      style={{ '--dept-color': show.accent, '--dept-accent': show.accent } as CSSProperties}
      {...(reduce ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true } } : entranceProps(show.slug))}
    >
      <span className="dept-chapter-no" aria-hidden="true">{String(show.order).padStart(2, '0')}</span>
      <EditButton dept={dept} onEdit={onEdit} />
      <div className="dept-chapter-copy">
        <small>{show.themeEn} · {dept.title}</small>
        <h2><WordReveal text={dept.name} /></h2>
        <p className="dept-chapter-theme">{show.theme} <em>{dept.description || show.tagline}</em></p>
        <div className="duty-tags">{show.duties.map(duty => <span key={duty}>{duty}</span>)}</div>
        <div className="department-foot">
          <span><Users /> {dept.memberCount ?? 0} 位成员</span>
          <Link to={`/departments/${dept.slug}`}>进入驻地 <ArrowRight /></Link>
        </div>
      </div>
      <div className="dept-chapter-visual">
        <MiniVisual slug={show.slug} />
        <div className="dept-chapter-covers">
          {covers.slice(0, 4).map(cover => <img key={cover.src} src={cover.src} alt={cover.alt} loading="lazy" decoding="async" />)}
        </div>
        <PixelSprite slug={show.slug} className="dept-chapter-sprite" />
      </div>
    </motion.article>
  );
}

function GenericCard({ dept, index, onEdit }: { dept: DepartmentInfo; index: number; onEdit?: () => void }) {
  return (
    <motion.article
      className="department-card dept-chapter is-generic"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="dept-chapter-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <EditButton dept={dept} onEdit={onEdit} />
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<DepartmentInfo | null>(null);
  const update = useMutation({
    mutationFn: (department: DepartmentInfo) => api(`/api/admin/departments/${department.id}`, json('PATCH', { title: department.title, description: department.description })),
    onSuccess: (_data, department) => {
      queryClient.setQueryData<{ items: DepartmentInfo[] }>(['departments'], (current) => current ? {
        items: current.items.map((item) => item.id === department.id ? { ...item, title: department.title, description: department.description } : item),
      } : current);
      setEditing(null);
    },
  });
  const canEdit = (dept: DepartmentInfo) => Boolean(user && dept.id && (
    isExecutiveRole(user.role) || (isDepartmentManagementRole(user.role) && user.departmentId === dept.id)
  ));
  const sorted = [...items].sort((a, b) => (showcaseBySlug[a.slug]?.order ?? 99) - (showcaseBySlug[b.slug]?.order ?? 99));
  return (
    <>
      <section className="shell department-grid dept-hub" aria-label="六个职业部门索引">
        {sorted.map((dept, index) => {
          const show = showcaseBySlug[dept.slug];
          const onEdit = canEdit(dept) ? () => { update.reset(); setEditing({ ...dept }); } : undefined;
          return show
            ? <ChapterCard key={dept.slug} dept={dept} show={show} flip={show.order % 2 === 0} onEdit={onEdit} />
            : <GenericCard key={dept.slug} dept={dept} index={index} onEdit={onEdit} />;
        })}
      </section>
      {editing && createPortal(<div className="department-card-editor-backdrop" role="presentation">
        <form className="department-card-editor" role="dialog" aria-modal="true" aria-labelledby="department-card-editor-title" onSubmit={(event) => { event.preventDefault(); update.mutate(editing); }}>
          <button type="button" className="department-card-editor-close" aria-label="关闭编辑器" onClick={() => setEditing(null)}><X aria-hidden="true" /></button>
          <small>DEPARTMENT CARD</small>
          <h2 id="department-card-editor-title">编辑 {editing.name}部门卡片</h2>
          <p>修改后会立即显示在职业大厅和公开部门信息中。</p>
          <label>职业称号<input required minLength={2} maxLength={40} value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
          <label>部门简介<textarea required minLength={2} maxLength={200} rows={4} value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label>
          {update.error && <p className="form-error">{update.error.message}</p>}
          <div className="form-actions">
            <button type="button" onClick={() => setEditing(null)}>取消</button>
            <button className="guild-button primary" disabled={update.isPending}><Save aria-hidden="true" /> {update.isPending ? '保存中…' : '保存部门卡片'}</button>
          </div>
        </form>
      </div>, document.body)}
    </>
  );
}
