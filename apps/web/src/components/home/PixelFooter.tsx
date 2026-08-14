import { BookOpen, CalendarDays, CircleHelp, ClipboardPen, MessageCircle, Radio, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const members = [
  ['绯羽', '#d74b70'], ['银铃', '#7288ad'], ['墨夜', '#8a6048'], ['森语', '#7e9b67'],
] as const;

export function PixelFooter() {
  return <footer className="pixel-footer">
    <div className="pixel-footer-main">
      <section><h2>快速入口</h2><div className="quick-entry-list">
        <Link to="/join"><ClipboardPen/>招新报名</Link><Link to="/activities"><CalendarDays/>活动日历</Link><Link to="/chronicle"><BookOpen/>新手指南</Link><Link to="/join"><CircleHelp/>常见问题</Link>
      </div></section>
      <section className="follow-us"><h2>关注我们</h2><div><button aria-label="哔哩哔哩" onClick={() => navigator.clipboard?.writeText('佐佑动漫社')}><Radio/></button><button aria-label="小红书" onClick={() => navigator.clipboard?.writeText('佐佑动漫社')}><span>小红书</span></button><button aria-label="微信公众号" onClick={() => navigator.clipboard?.writeText('佐佑动漫社')}><MessageCircle/></button><button aria-label="QQ群" onClick={() => navigator.clipboard?.writeText('佐佑动漫社新生群')}><UsersRound/></button></div></section>
      <section className="online-party"><h2>大厅在线成员 <span>● 128人在线</span></h2><div>{members.map(([name,color],index)=><span className={`footer-avatar avatar-${index+1}`} data-facing="visitor" style={{'--avatar-color': color} as React.CSSProperties} title={name} key={name}><i/><b>{name.slice(0,1)}</b><em/></span>)}</div></section>
    </div>
    <small>© 2018–2026 佐佑动漫社 | Adventurer Guild. All Rights Reserved.</small>
  </footer>;
}
