import type { ComponentType } from 'react';
import { ArrowRight, Check, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showcaseBySlug, type DepartmentInfo, type DeptShowcase } from './showcase-data';
import { WordReveal } from './WordReveal';
import { PixelFrame } from './pixel';
import { PublicityShowcase } from './showcase/PublicityShowcase';
import { TechShowcase } from './showcase/TechShowcase';
import { OriginalShowcase } from './showcase/OriginalShowcase';
import { DanceShowcase } from './showcase/DanceShowcase';
import { CosShowcase } from './showcase/CosShowcase';
import { MusicShowcase } from './showcase/MusicShowcase';
import { DepartmentMediaShelf } from './DepartmentMediaShelf';
import { DepartmentPhotoGallery } from './DepartmentPhotoGallery';
import { BlogPostBoard } from '../blog/BlogPostBoard';
import { useAuth } from '../../auth';
import { isExecutiveRole } from '@guild/contracts';
import { PageContentSurface, type PageSectionDefinition } from '../page-content/PageContentSurface';
import { departmentPageSections } from '../../pages-page-editor';
import { BilibiliPreviewBoundary } from './BilibiliPreviewBoundary';

export interface ShowcaseProps { dept: DepartmentInfo; show: DeptShowcase }

/** 每个详情页收尾板块：职责清单 + API 真源简介 + 招新 CTA */
export function ClosingPanel({ dept, show, id }: ShowcaseProps & { id?: string }) {
  const section = show.sections[2];
  return (
    <><DepartmentPhotoGallery slug={show.slug} /><DepartmentMediaShelf slug={show.slug} /><section className="dept-closing" aria-label={section.zh} id={id}>
      <div className="dept-closing-inner">
        <header className="dept-section-head">
          <span className="dept-section-no">03</span>
          <h2><WordReveal text={section.zh} /> <em>{section.en}</em></h2>
        </header>
        <div className="dept-closing-grid">
          <ul className="dept-duty-list">
            {show.duties.map((duty, index) => <li key={duty}><Check aria-hidden="true" /><span>职责 {index + 1}</span><strong>{duty}</strong></li>)}
          </ul>
          <PixelFrame className="dept-closing-frame">
            <div className="dept-closing-note">
              <p>{dept.description}</p>
              <p className="dept-closing-members"><Users aria-hidden="true" /> 当前 {dept.memberCount ?? 0} 位在编成员</p>
              <Link className="dept-cta" to="/join">选择该职业申请加入 <ArrowRight aria-hidden="true" /></Link>
            </div>
          </PixelFrame>
        </div>
      </div>
    </section></>
  );
}

const themed: Record<string, ComponentType<ShowcaseProps>> = {
  publicity: PublicityShowcase,
  tech: TechShowcase,
  original: OriginalShowcase,
  dance: DanceShowcase,
  cos: CosShowcase,
  music: MusicShowcase,
};

function GenericShowcase({ dept }: { dept: DepartmentInfo }) {
  return (
    <main className="dept-page dept-generic">
      <section className="dept-generic-hero">
        <span className="eyebrow">{dept.title} · CLASS PROFILE</span>
        <h1><WordReveal text={dept.name} /></h1>
        <p>{dept.description}</p>
      </section>
      <section className="dept-closing"><div className="dept-closing-inner">
        <div className="dept-closing-grid">
          <div className="dept-closing-note">
            <p className="dept-closing-members"><Users aria-hidden="true" /> 当前 {dept.memberCount ?? 0} 位在编成员</p>
            <Link className="dept-cta" to="/join">选择该职业申请加入 <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </div></section>
      <BlogPostBoard departmentSlug={dept.slug} />
    </main>
  );
}

export function DeptShowcasePage({ department }: { department: DepartmentInfo }) {
  const { user } = useAuth();
  const show = showcaseBySlug[department.slug];
  const sections: PageSectionDefinition[] = departmentPageSections(department.slug);
  const canEdit = Boolean(user && (isExecutiveRole(user.role) || (user.role !== 'MEMBER' && user.departmentId === (department.id ?? `dept-${department.slug}`))));
  if (!show) return <PageContentSurface pageKey={`department:${department.slug}`} sections={sections} editTo={`/admin/page-editor/department/${department.slug}`} historyTo={`/page-history/department/${department.slug}`} canEdit={canEdit}><GenericShowcase dept={department} /></PageContentSurface>;
  const Themed = themed[show.slug];
  return <BilibiliPreviewBoundary><PageContentSurface pageKey={`department:${department.slug}`} sections={sections} editTo={`/admin/page-editor/department/${department.slug}`} historyTo={`/page-history/department/${department.slug}`} canEdit={canEdit}><Themed dept={department} show={show} /><div className="page-section-boundary" id="department-post-board"><BlogPostBoard departmentSlug={department.slug} /></div></PageContentSurface></BilibiliPreviewBoundary>;
}
