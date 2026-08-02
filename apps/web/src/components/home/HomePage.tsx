import { AdventureCard } from './AdventureCard';
import { GuildHero } from './GuildHero';
import { NoticeBoard } from './NoticeBoard';

export function HomePage() {
  return <main className="reference-home">
    <GuildHero/>
    <section className="home-entry-zone">
      <div className="entry-card-grid"><AdventureCard variant="history"/><AdventureCard variant="departments"/><AdventureCard variant="activities"/></div>
      <NoticeBoard/>
    </section>
  </main>;
}
