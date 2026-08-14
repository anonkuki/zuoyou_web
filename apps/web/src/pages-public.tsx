import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarDays, Camera, Castle, Check, ChevronRight, Compass, Crown, FileQuestion, Flame, Map, Music, Palette, Scroll, Shield, Sparkles, Users, WandSparkles, Wrench } from 'lucide-react';
import { api, json, type PageData } from './api';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero, RuneIcon, StatusBadge } from './components';
import type { Announcement } from '@guild/contracts';

export interface Department {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  memberCount?: number;
  leader_id?: string | null;
}

interface Summary { memberCount: number; departmentCount: number; activityCount: number; workCount: number }
interface Chronicle { id: string; title: string; content: string; occurred_at: string }
export interface Activity { id: string; department_id: string; title: string; description: string; location: string; status: string; capacity: number; result_summary?: string; starts_at: string }
interface Work { id: string; title: string; description: string; status: string; department_id: string }

const deptMeta: Record<string, { icon: typeof WandSparkles; motto: string; color: string; duties: string[] }> = {
  cos: { icon: WandSparkles, motto: '以形塑魂，让角色走入现实', color: '#e78ab5', duties: ['妆造与服装', '角色演绎', '漫展协作'] },
  tech: { icon: Wrench, motto: '把灵感锻造成可运行的作品', color: '#62c9d8', duties: ['摄影摄像', '后期制作', '技术支持'] },
  music: { icon: Music, motto: '让旋律成为共同的冒险记忆', color: '#e8c55b', duties: ['乐队排练', '舞台演出', '音乐交流'] },
  original: { icon: Palette, motto: '在空白绘卷上创造新的世界', color: '#96c47a', duties: ['绘画创作', '文字设定', '原创交流'] },
  dance: { icon: Sparkles, motto: '用每一步点亮舞台', color: '#b69ae8', duties: ['宅舞排练', 'WOTA艺', '舞台编排'] },
  publicity: { icon: Compass, motto: '把公会的故事传到更远处', color: '#ec8b53', duties: ['活动宣传', '新媒体运营', '内容策划'] },
};

function PixelGuildScene() {
  return (
    <div className="pixel-scene" aria-label="像素幻想公会大厅动态场景">
      <div className="sunset-glow" />
      <div className="cloud cloud-one"><i /><i /><i /></div>
      <div className="cloud cloud-two"><i /><i /><i /></div>
      <div className="mountain mountain-back" /><div className="mountain mountain-front" />
      <div className="castle-silhouette"><span /><span /><span /></div>
      <div className="guild-hall">
        <div className="hall-roof" />
        <div className="hall-sign">Z · G</div>
        <div className="hall-window left-window" /><div className="hall-window right-window" />
        <div className="hall-door" />
        <div className="torch torch-left"><Flame /></div><div className="torch torch-right"><Flame /></div>
      </div>
      <div className="pixel-npc npc-one"><span className="npc-head"/><span className="npc-body"/></div>
      <div className="pixel-npc npc-two"><span className="npc-head"/><span className="npc-body"/></div>
      <div className="scene-ground" />
    </div>
  );
}

function SummaryStats() {
  const query = useQuery({ queryKey: ['public', 'summary'], queryFn: () => api<Summary>('/api/public/summary') });
  if (query.isLoading) return <LoadingPanel label="正在读取公会状态" />;
  if (query.error) return <ErrorPanel error={query.error} />;
  const stats = [
    ['正式成员', query.data!.memberCount, Users], ['职业分部', query.data!.departmentCount, Shield],
    ['开放档案', query.data!.activityCount, CalendarDays], ['作品收录', query.data!.workCount, Camera],
  ] as const;
  return <div className="guild-stats">{stats.map(([label, value, Icon]) => <div className="stat-block" key={label}><Icon/><strong>{value}</strong><span>{label}</span></div>)}</div>;
}

export function HomePage() {
  return (
    <main>
      <section className="home-hero">
        <PixelGuildScene />
        <div className="home-hero-content">
          <motion.span className="hero-kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>FANTASY ANIME GUILD</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>佐佑动漫社<span>ZOUYOU ADVENTURER GUILD</span></motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>欢迎来到冒险者公会</motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}>
            <Link className="guild-button primary" to="/departments">探索公会 <ArrowRight /></Link>
            <Link className="guild-button ghost" to="/join">加入公会</Link>
          </motion.div>
        </div>
        <div className="scroll-rune">SCROLL TO ENTER <ChevronRight /></div>
      </section>
      <section className="status-section shell">
        <div className="section-title-row"><div><span className="eyebrow">LIVE GUILD STATUS</span><h2>Lv.12 公会状态</h2></div><Crown /></div>
        <SummaryStats />
      </section>
      <section className="portal-section shell">
        <span className="eyebrow">CHOOSE YOUR PATH</span><h2>从这里开始认识佐佑</h2>
        <div className="portal-grid">
          {[
            { to: '/chronicle', title: '公会编年史', text: '翻阅一代代佑子留下的社团记忆', icon: BookOpen, tag: 'HISTORY' },
            { to: '/departments', title: '职业大厅', text: '了解六个部门的职责与文化', icon: Shield, tag: 'DEPARTMENTS' },
            { to: '/activities', title: '冒险档案馆', text: '查看正在发生与已经完成的活动', icon: Map, tag: 'ACTIVITIES' },
          ].map(({ to, title, text, icon: Icon, tag }, index) => (
            <motion.article className="rpg-portal-card" key={to} whileHover={{ y: -10 }} transition={{ type: 'spring', stiffness: 280 }}>
              <span className="card-number">0{index + 1}</span><RuneIcon><Icon /></RuneIcon><small>{tag}</small><h3>{title}</h3><p>{text}</p><Link to={to}>开启档案 <ArrowRight /></Link>
            </motion.article>
          ))}
        </div>
      </section>
      <section className="guild-quote"><Scroll/><blockquote>“这里不是虚构的游戏世界，而是我们把热爱变成协作、作品与共同记忆的地方。”</blockquote></section>
    </main>
  );
}

export function ChroniclePage() {
  const query = useQuery({ queryKey: ['chronicles'], queryFn: () => api<PageData<Chronicle>>('/api/public/chronicles?page=1&pageSize=20') });
  return <main><PageHero eyebrow="GUILD CHRONICLE" title="公会编年史" description="每一个年份都是公会地图上的一枚坐标。" />
    <section className="shell chronicle-wrap">{query.isLoading ? <LoadingPanel /> : query.error ? <ErrorPanel error={query.error} /> : !query.data?.items.length ? <EmptyPanel /> : <div className="chronicle-line">{query.data.items.map((item, index) => <motion.article className="chronicle-entry" key={item.id} initial={{ opacity: 0, x: index % 2 ? 20 : -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}><time>{new Date(item.occurred_at).getFullYear()}</time><div><span>CHAPTER {String(index + 1).padStart(2, '0')}</span><h2>{item.title}</h2><p>{item.content}</p></div></motion.article>)}</div>}</section>
  </main>;
}

export function DepartmentsPage() {
  const query = useQuery({ queryKey: ['departments'], queryFn: () => api<{ items: Department[] }>('/api/public/departments') });
  return <main><PageHero eyebrow="CLASS HALL" title="职业大厅" description="RPG 职业是视觉称号，背后是六个真实协作部门。" />
    <section className="shell department-grid">{query.isLoading ? <LoadingPanel /> : query.error ? <ErrorPanel error={query.error} /> : query.data?.items.map((department, index) => {
      const meta = deptMeta[department.slug] ?? { icon: Shield, motto: department.description, color: '#c89b3c', duties: [] }; const Icon = meta.icon;
      return <motion.article className="department-card" style={{ '--dept-color': meta.color } as React.CSSProperties} key={department.id} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }}><div className="class-emblem"><Icon /></div><small>{department.title}</small><h2>{department.name}</h2><p>{meta.motto}</p><div className="duty-tags">{meta.duties.map(d => <span key={d}>{d}</span>)}</div><div className="department-foot"><span><Users/> {department.memberCount ?? 0} 位成员</span><Link to={`/departments/${department.slug}`}>进入驻地 <ArrowRight/></Link></div></motion.article>;
    })}</section>
  </main>;
}

export function DepartmentDetailPage() {
  const { slug = '' } = useParams();
  const query = useQuery({ queryKey: ['department', slug], queryFn: () => api<{ department: Department }>(`/api/public/departments/${slug}`) });
  if (query.isLoading) return <main><LoadingPanel /></main>;
  if (query.error || !query.data) return <main><ErrorPanel error={query.error} /></main>;
  const department = query.data.department; const meta = deptMeta[slug] ?? { icon: Shield, motto: department.description, color: '#c89b3c', duties: [] }; const Icon = meta.icon;
  return <main><section className="department-detail-hero" style={{ '--dept-color': meta.color } as React.CSSProperties}><div className="shell"><RuneIcon><Icon /></RuneIcon><span className="eyebrow">{department.title} · CLASS PROFILE</span><h1>{department.name}</h1><p>{meta.motto}</p></div></section><section className="shell detail-columns"><article className="parchment-panel"><h2>部门职责</h2>{meta.duties.map((d, i) => <div className="quest-row" key={d}><Check/><span>职责 {i + 1}</span><strong>{d}</strong></div>)}</article><article className="dark-panel"><h2>驻地说明</h2><p>{department.description}</p><Link className="guild-button" to="/join">选择该职业申请加入</Link></article></section></main>;
}

export function ActivitiesPage() {
  const [status, setStatus] = useState('ALL');
  const query = useQuery({ queryKey: ['activities'], queryFn: () => api<PageData<Activity>>('/api/public/activities?page=1&pageSize=20') });
  const filtered = useMemo(() => query.data?.items.filter(item => status === 'ALL' || item.status === status) ?? [], [query.data, status]);
  return <main><PageHero eyebrow="QUEST ARCHIVE" title="冒险档案馆" description="从筹备、报名、签到、成果到归档，每项活动都有完整记录。" />
    <section className="shell"><div className="filter-bar" aria-label="活动状态筛选">{[['ALL','全部'],['REGISTRATION','报名中'],['IN_PROGRESS','进行中'],['ENDED','已结束'],['ARCHIVED','已归档']].map(([v,l])=><button className={status===v?'active':''} onClick={()=>setStatus(v)} key={v}>{l}</button>)}</div>{query.isLoading ? <LoadingPanel /> : query.error ? <ErrorPanel error={query.error}/> : !filtered.length ? <EmptyPanel label="当前筛选下没有活动"/> : <div className="activity-grid">{filtered.map((activity,index)=><motion.article className="activity-card" key={activity.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:index*.05}}><div className="activity-cover"><span>QUEST {String(index+1).padStart(2,'0')}</span><Castle/></div><div className="activity-body"><StatusBadge status={activity.status}/><h2>{activity.title}</h2><p>{activity.description}</p><dl><div><dt>时间</dt><dd>{formatDate(activity.starts_at)}</dd></div><div><dt>地点</dt><dd>{activity.location}</dd></div><div><dt>人数上限</dt><dd>{activity.capacity} 人</dd></div></dl><Link to={`/activities/${activity.id}`}>查看任务详情 <ArrowRight/></Link></div></motion.article>)}</div>}</section>
  </main>;
}

export function ActivityDetailPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: ['activity',id], queryFn:()=>api<{activity:Activity}>(`/api/public/activities/${id}`) });
  if(query.isLoading)return <main><LoadingPanel/></main>; if(query.error||!query.data)return <main><ErrorPanel error={query.error}/></main>;
  const a=query.data.activity;
  return <main><PageHero eyebrow="QUEST DETAIL" title={a.title} description={a.description}><StatusBadge status={a.status}/></PageHero><section className="shell detail-columns"><article className="parchment-panel"><h2>活动卷宗</h2><div className="info-list"><span>活动时间<strong>{formatDate(a.starts_at)}</strong></span><span>活动地点<strong>{a.location}</strong></span><span>人数上限<strong>{a.capacity} 人</strong></span><span>当前阶段<strong>{a.status}</strong></span></div></article><article className="dark-panel"><h2>成员行动</h2><p>登录成员账号后可报名、取消报名，并在活动进行时输入签到码。</p><Link className="guild-button" to="/portal/activities">进入成员活动中心</Link></article></section></main>;
}

const announcementCategory = {
  RECRUITMENT: '招新信息',
  ACTIVITY: '活动公告',
  NOTICE: '社团通知',
} as const;

export function AnnouncementsPage() {
  const query = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api<PageData<Announcement>>('/api/public/announcements?page=1&pageSize=20'),
  });
  return <main><PageHero eyebrow="GUILD BULLETIN" title="大厅告示板" description="招新、活动与社团近况都在这里留有完整内容。" />
    <section className="shell announcement-archive">{query.isLoading ? <LoadingPanel /> : query.error ? <ErrorPanel error={query.error} /> : !query.data?.items.length ? <EmptyPanel label="目前没有公开公告" /> : <div className="announcement-archive-list">{query.data.items.map((item, index) => <motion.article key={item.id} className="announcement-paper" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}>
      <div><span>{announcementCategory[item.category]}</span><time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time></div>
      <h2>{item.title}</h2><p>{item.summary}</p>
      <Link to={`/announcements/${item.id}`}>阅读完整公告 <ArrowRight /></Link>
    </motion.article>)}</div>}</section>
  </main>;
}

export function AnnouncementDetailPage() {
  const { id = '' } = useParams();
  const query = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => api<{ announcement: Announcement }>(`/api/public/announcements/${id}`),
    enabled: Boolean(id),
  });
  if (query.isLoading) return <main><LoadingPanel /></main>;
  if (query.error || !query.data) return <main><ErrorPanel error={query.error} /></main>;
  const item = query.data.announcement;
  return <main><PageHero eyebrow="BULLETIN DETAIL" title={item.title} description={announcementCategory[item.category]} />
    <section className="shell announcement-detail-shell"><article className="announcement-detail-paper">
      <header><span>{announcementCategory[item.category]}</span><time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time></header>
      <p>{item.summary}</p>
      <div className="announcement-detail-actions"><Link to="/announcements">返回全部公告</Link><Link className="guild-button primary" to={item.href}>查看相关页面 <ArrowRight /></Link></div>
    </article></section>
  </main>;
}

export function WorksPage() {
  const query=useQuery({queryKey:['works'],queryFn:()=>api<PageData<Work>>('/api/public/works?page=1&pageSize=20')});
  return <main><PageHero eyebrow="COLLECTION ATLAS" title="作品图鉴" description="收录绘画、COS、摄影、视频与舞台成果。"/><section className="shell">{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel/>:<div className="works-grid">{query.data.items.map((work,index)=><motion.article className="work-card" key={work.id} whileHover={{y:-8}}><div className={`work-art work-art-${index%4}`}><span>{index===0?'SSR':index%2?'SR':'R'}</span><Sparkles/></div><div><small>GUILD CREATION</small><h2>{work.title}</h2><p>{work.description}</p><button onClick={()=>navigator.clipboard?.writeText(`${location.origin}/works#${work.id}`)}>收藏链接</button></div></motion.article>)}</div>}</section></main>;
}

export function JoinPage() {
  const navigate=useNavigate(); const [step,setStep]=useState(1); const [form,setForm]=useState({displayName:'',email:'',college:'',departmentId:'dept-cos',reason:''});
  const departments=useQuery({queryKey:['departments'],queryFn:()=>api<{items:Department[]}>('/api/public/departments')});
  const mutation=useMutation({mutationFn:()=>api<{id:string;statusToken:string;status:string}>('/api/public/applications',json('POST',form)),onSuccess:data=>{localStorage.setItem('guild_application_token',data.statusToken);navigate(`/application/${data.statusToken}`);}});
  const submit=(e:FormEvent)=>{e.preventDefault();if(step===1){setStep(2);return;}mutation.mutate();};
  return <main><PageHero eyebrow="RECRUITMENT BOARD" title="加入公会" description="选择你的协作方向，向佐佑递交一份真实的社团申请。"/><section className="shell join-shell"><div className="join-steps"><span className="done">1 选择职业</span><i/><span className={step===2?'done':''}>2 填写资料</span><i/><span>3 等待审核</span></div><form className="parchment-form" onSubmit={submit}>{step===1?<><h2>选择意向职业</h2><div className="class-options">{departments.data?.items.map(d=><label className={form.departmentId===d.id?'selected':''} key={d.id}><input type="radio" name="department" value={d.id} checked={form.departmentId===d.id} onChange={()=>setForm({...form,departmentId:d.id})}/><strong>{d.title}</strong><span>{d.name}</span></label>)}</div><button className="guild-button primary" type="submit">继续填写资料</button></>:<><h2>冒险者资料</h2><label>称呼<input required minLength={2} value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})}/></label><label>学院与年级<input required minLength={2} value={form.college} onChange={e=>setForm({...form,college:e.target.value})}/></label><label>联系邮箱<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>自我介绍与加入理由<textarea required minLength={5} rows={6} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></label>{mutation.error&&<p className="form-error">{mutation.error.message}</p>}<div className="form-actions"><button type="button" onClick={()=>setStep(1)} className="text-button">返回选择</button><button className="guild-button primary" disabled={mutation.isPending} type="submit">{mutation.isPending?'正在递交…':'提交加入申请'}</button></div></>}</form></section></main>;
}

export function ApplicationStatusPage() {
  const {token=''}=useParams(); const query=useQuery({queryKey:['application',token],queryFn:()=>api<{id:string;status:string;rejectionReason?:string;activationCode?:string}>(`/api/public/applications/status/${token}`),enabled:Boolean(token)});
  return <main><PageHero eyebrow="APPLICATION TRACKER" title="申请进度" description="凭此私密链接查看审核结果与账号激活信息。"/><section className="shell narrow">{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<article className="parchment-panel status-card"><StatusBadge status={query.data!.status}/><h2>申请编号 {query.data!.id}</h2>{query.data!.status==='PENDING'&&<p>档案已进入审核队列，请耐心等待管理员处理。</p>}{query.data!.rejectionReason&&<p>审核意见：{query.data!.rejectionReason}</p>}{query.data!.activationCode&&<><p>申请已通过，请使用一次性激活码建立成员账号。</p><code>{query.data!.activationCode}</code><Link className="guild-button primary" to={`/activate?token=${encodeURIComponent(query.data!.activationCode)}`}>激活成员身份</Link></>}</article>}</section></main>;
}

export function NotFoundPage(){return <main><section className="not-found"><FileQuestion/><span className="eyebrow">404 · LOST SCROLL</span><h1>这份卷宗不在公会档案里</h1><p>可能是路径错误，或档案已经被移入其他区域。</p><Link className="guild-button" to="/">返回公会大厅</Link></section></main>}
