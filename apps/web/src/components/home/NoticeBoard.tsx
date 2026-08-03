import { Link } from 'react-router-dom';

const notices = [
  ['2026春季招新开启！', '05-20', true, '/join'],
  ['6月漫展活动报名中！', '05-18', true, '/activities'],
  ['社团聚餐通知', '05-15', false, '/activities'],
  ['摄影部外拍活动回顾', '05-10', false, '/activities'],
] as const;

export function NoticeBoard() {
  return <aside className="notice-board" data-surface="wooden-quest-board">
    <div className="notice-board-title"><i/><div><small>QUEST BOARD</small><h2>公会公告</h2></div><i/><span>更多</span></div>
    <div className="notice-list">{notices.map(([title,date,isNew,to])=><Link to={to} key={title}>{isNew && <b>NEW</b>}<span>{title}</span><time>{date}</time></Link>)}</div>
    <div className="notice-mascot" aria-hidden="true"><span className="cat"><i/><b/><em/></span><p>有新的冒险在<br/>等着你哦!</p></div>
    <i className="board-pin pin-a"/><i className="board-pin pin-b"/><i className="board-pin pin-c"/>
  </aside>;
}
