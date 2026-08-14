import { Award, CalendarCheck, Flag, ScrollText, Users } from 'lucide-react';
import type { GuildHomeStats } from '@guild/contracts';

export function GuildStats({ stats, loading = false }: { stats?: GuildHomeStats; loading?: boolean }) {
  const items = [
    { label: '社团成长值', value: stats ? `Lv.${stats.guildLevel}` : '—', icon: ScrollText, level: true },
    { label: '成员数量', value: stats ? String(stats.memberCount) : '—', icon: Users, level: false },
    { label: '完成活动', value: stats ? String(stats.completedActivityCount) : '—', icon: CalendarCheck, level: false },
    { label: '荣誉记录', value: stats ? String(stats.honorCount) : '—', icon: Award, level: false },
    { label: '成立时间', value: stats ? `${stats.foundedYear}年` : '—', icon: Flag, level: false },
  ] as const;
  const progress = stats ? Math.min(100, Math.round(stats.levelProgress.current / stats.levelProgress.target * 100)) : 0;
  return <section className={`guild-hud${loading ? ' is-loading' : ''}`} aria-label="公会数据面板" aria-busy={loading}>
    {items.map(({ label, value, icon: Icon, level }) => <article key={label} className={level ? 'level-stat' : ''}>
      <Icon/><div><span>{label}</span><strong>{value}</strong>{level && <div className="level-progress"><i style={{ width: `${progress}%` }}/><small>{stats ? `${stats.levelProgress.current} / ${stats.levelProgress.target}` : '读取中'}</small></div>}</div>
    </article>)}
  </section>;
}
