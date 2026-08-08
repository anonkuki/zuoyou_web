import { useQuery } from '@tanstack/react-query';
import type { HomeData } from '@guild/contracts';
import { api } from '../../api';
import { AdventureCard } from './AdventureCard';
import { GuildHero } from './GuildHero';
import { NoticeBoard } from './NoticeBoard';

export function HomePage() {
  const home = useQuery({ queryKey: ['public-home'], queryFn: () => api<HomeData>('/api/public/home') });
  return <main className="reference-home">
    <GuildHero stats={home.data?.stats} loading={home.isLoading}/>
    <section className="home-entry-zone">
      <header className="entry-zone-heading">
        <small>ADVENTURER'S GUIDE</small>
        <h2>从这里，走进我们的故事</h2>
        <p>查阅公会编年史、认识六大职业部门，或翻开最近一次冒险的记录。</p>
      </header>
      <div className="entry-zone-content">
        <div className="entry-card-grid"><AdventureCard variant="history"/><AdventureCard variant="departments"/><AdventureCard variant="activities"/></div>
        <NoticeBoard announcements={home.data?.announcements} loading={home.isLoading} error={home.error}/>
      </div>
    </section>
  </main>;
}
