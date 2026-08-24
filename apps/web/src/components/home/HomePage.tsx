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

export function HomePage() {
  const [speaker, setSpeaker] = useState<SceneSpeaker | null>(null);
  const home = useQuery({ queryKey: ['public-home'], queryFn: () => api<HomeData>('/api/public/home') });
  return <main className="reference-home">
    <GuildHero stats={home.data?.stats} loading={home.isLoading} onSelectSpeaker={setSpeaker} selectedSpeaker={speaker?.name}/>
    <MascotGuide speaker={speaker} onClearSpeaker={() => setSpeaker(null)}/>
    <GuildScrollStory />
    <HomeSocialOutposts />
    <BlogPostBoard />
    <section className="home-entry-zone" id="guild-passages">
      <header className="entry-zone-heading">
        <small>WELCOME TO ZOUYOU</small>
        <h2>慢慢逛，总会找到喜欢的角落</h2>
        <p>从社团往事、六个部门到最近的活动记录，先挑一处感兴趣的看看吧。</p>
      </header>
      <div className="entry-zone-content">
        <div className="entry-card-grid"><AdventureCard variant="history"/><AdventureCard variant="departments"/><AdventureCard variant="activities"/></div>
        <NoticeBoard announcements={home.data?.announcements} loading={home.isLoading} error={home.error}/>
      </div>
    </section>
  </main>;
}
