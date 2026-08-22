import { useState } from 'react';
import { BookOpen, CalendarDays, Check, CircleHelp, ClipboardPen, Copy, MessageCircle, Radio, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { officialSocialLinks } from '../departments/department-media';

const members = [
  ['绯羽', '#d74b70'], ['银铃', '#7288ad'], ['墨夜', '#8a6048'], ['森语', '#7e9b67'],
] as const;

export function PixelFooter() {
  const [copied, setCopied] = useState(false);
  const copyChannel = async () => {
    await navigator.clipboard?.writeText(officialSocialLinks.qqChannelCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return <footer className="pixel-footer">
    <div className="pixel-footer-main">
      <section><h2>快速入口</h2><div className="quick-entry-list">
        <Link to="/join"><ClipboardPen/>招新报名</Link><Link to="/activities"><CalendarDays/>活动日历</Link><Link to="/chronicle"><BookOpen/>新手指南</Link><Link to="/join"><CircleHelp/>常见问题</Link>
      </div></section>
      <section className="follow-us"><h2>关注我们</h2><div>
        <a aria-label="访问佐佑动漫社哔哩哔哩主页" href={officialSocialLinks.bilibili} target="_blank" rel="noreferrer" title="哔哩哔哩"><Radio/></a>
        <a aria-label="阅读佐佑动漫社微信公众号" href={officialSocialLinks.wechat} target="_blank" rel="noreferrer" title="微信公众号"><MessageCircle/></a>
        <button aria-label={`复制 QQ 频道号 ${officialSocialLinks.qqChannelCode}`} onClick={copyChannel} title={`QQ频道 ${officialSocialLinks.qqChannelCode}`}>{copied ? <Check/> : <UsersRound/>}<span>{copied ? '已复制' : 'QQ频道'}</span></button>
      </div>{copied && <small className="footer-copy-feedback"><Copy/>频道号已复制</small>}</section>
      <section className="online-party"><h2>大厅在线成员 <span>● 128人在线</span></h2><div>{members.map(([name,color],index)=><span className={`footer-avatar avatar-${index+1}`} data-facing="visitor" style={{'--avatar-color': color} as React.CSSProperties} title={name} key={name}><i/><b>{name.slice(0,1)}</b><em/></span>)}</div></section>
    </div>
    <small>© 2018–2026 佐佑动漫社 | Adventurer Guild. All Rights Reserved.</small>
  </footer>;
}
