import { Link } from 'react-router-dom';
import type { Announcement } from '@guild/contracts';

const formatNoticeDate = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
}).format(new Date(value)).replace('/', '-');

export function NoticeBoard({ announcements, loading = false, error }: { announcements?: Announcement[]; loading?: boolean; error?: Error | null }) {
  return <aside className="notice-board" data-surface="wooden-quest-board">
    <div className="notice-board-title"><i/><div><small>NOTICE BOARD</small><h2>大厅告示板</h2></div><i/><Link to="/announcements">全部</Link></div>
    <div className="notice-list" aria-live="polite">
      {loading && <p className="notice-state">正在翻看最新消息…</p>}
      {error && <p className="notice-state error">公告暂时无法读取</p>}
      {!loading && !error && !announcements?.length && <p className="notice-state">目前没有新的公会公告</p>}
      {announcements?.map((notice)=><Link to={`/announcements/${notice.id}`} key={notice.id} title={notice.summary} aria-label={`${notice.title}，查看公告详情`}>{notice.pinned && <b>NEW</b>}<span>{notice.title}</span><time dateTime={notice.publishedAt}>{formatNoticeDate(notice.publishedAt)}</time></Link>)}
    </div>
    <div className="notice-mascot" aria-hidden="true"><span className="cat"><i/><b/><em/></span><p>本周也有不少<br/>新鲜事呢！</p></div>
    <i className="board-pin pin-a"/><i className="board-pin pin-b"/><i className="board-pin pin-c"/>
  </aside>;
}
