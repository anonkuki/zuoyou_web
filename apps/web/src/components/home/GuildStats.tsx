import { Award, CalendarCheck, Flag, ScrollText, Users } from 'lucide-react';

const stats = [
  { label: '公会等级', value: 'Lv.12', icon: ScrollText, level: true },
  { label: '成员数量', value: '1524', icon: Users, level: false },
  { label: '完成活动', value: '328', icon: CalendarCheck, level: false },
  { label: '获得荣誉', value: '56', icon: Award, level: false },
  { label: '成立时间', value: '2018年', icon: Flag, level: false },
] as const;

export function GuildStats() {
  return <section className="guild-hud" aria-label="公会数据面板">
    {stats.map(({ label, value, icon: Icon, level }) => <article key={label} className={level ? 'level-stat' : ''}>
      <Icon/><div><span>{label}</span><strong>{value}</strong>{level && <div className="level-progress"><i/><small>2390 / 3000</small></div>}</div>
    </article>)}
  </section>;
}
