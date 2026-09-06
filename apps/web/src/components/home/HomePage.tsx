import { useQuery } from '@tanstack/react-query';
import type { HomeData } from '@guild/contracts';
import { api } from '../../api';
import { AdventureCard } from './AdventureCard';
import { GuildHero } from './GuildHero';
import { NoticeBoard } from './NoticeBoard';
import { MascotGuide, type SceneSpeaker } from './MascotGuide';
import { useState } from 'react';
import { GuildScrollStory } from './GuildScrollStory';
import { HomeSocialOutposts } from './HomeSocialOutposts';
import { BlogPostBoard } from '../blog/BlogPostBoard';
import { isExecutiveRole } from '@guild/contracts';
import { useAuth } from '../../auth';
import { PageContentSurface } from '../page-content/PageContentSurface';
import { homePageSections } from '../../pages-page-editor';

export function HomePage() {
  const [speaker, setSpeaker] = useState<SceneSpeaker | null>(null);
  const { user } = useAuth();
  const home = useQuery({ queryKey: ['public-home'], queryFn: () => api<HomeData>('/api/public/home') });
  return <PageContentSurface pageKey="home" sections={homePageSections} editTo="/admin/page-editor/home" canEdit={Boolean(user && isExecutiveRole(user.role))}><main className="reference-home">
    <div className="page-section-boundary" id="home-hero"><GuildHero stats={home.data?.stats} loading={home.isLoading} onSelectSpeaker={setSpeaker} selectedSpeaker={speaker?.name}/></div>
    <MascotGuide speaker={speaker} onClearSpeaker={() => setSpeaker(null)}/>
    <div className="page-section-boundary" id="home-story"><GuildScrollStory /></div>
    <div className="page-section-boundary" id="home-social"><HomeSocialOutposts /></div>
    <div className="page-section-boundary" id="home-tavern"><BlogPostBoard compact sections={['pinned', 'latest']} title="冒险者酒馆" /></div>
    <section className="home-entry-zone" id="home-entry">
      <header className="entry-zone-heading">
        <small>WELCOME TO SAYUU</small>
        <h2>慢慢逛，总会找到喜欢的角落</h2>
        <p>从社团往事、六个部门到最近的活动记录，先挑一处感兴趣的看看吧。</p>
      </header>
      <div className="entry-zone-content">
        <div className="entry-card-grid"><AdventureCard variant="history"/><AdventureCard variant="departments"/><AdventureCard variant="activities"/></div>
        <NoticeBoard announcements={home.data?.announcements} loading={home.isLoading} error={home.error}/>
      </div>
    </section>
  </main></PageContentSurface>;
}
