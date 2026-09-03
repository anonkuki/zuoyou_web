import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarDays, Camera, Castle, ChevronRight, Crown, FileQuestion, Flame, Map, Scroll, Shield, Sparkles, Users } from 'lucide-react';
import { api, json, type PageData } from './api';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero, RuneIcon, StatusBadge } from './components';
import { DepartmentsHub } from './components/departments/DepartmentsHub';
import { DeptShowcasePage } from './components/departments/DeptShowcasePage';
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
          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>佐佑动漫社<span>SAYUU ADVENTURER GUILD</span></motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>欢迎来到冒险者公会</motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}>
            <Link className="guild-button primary" to="/departments">探索公会 <ArrowRight /></Link>
            <Link className="guild-button ghost" to="/join">加入我们</Link>
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
    {query.isLoading ? <section className="shell department-grid"><LoadingPanel /></section> : query.error ? <section className="shell department-grid"><ErrorPanel error={query.error} /></section> : <DepartmentsHub items={query.data?.items ?? []} />}
  </main>;
}

export function DepartmentDetailPage() {
  const { slug = '' } = useParams();
  const query = useQuery({ queryKey: ['department', slug], queryFn: () => api<{ department: Department }>(`/api/public/departments/${slug}`) });
  if (query.isLoading) return <main><LoadingPanel /></main>;
  if (query.error || !query.data) return <main><ErrorPanel error={query.error} /></main>;
  return <DeptShowcasePage department={query.data.department} />;
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
      {item.content&&<div className="announcement-detail-content">{item.content.split(/\n{2,}/).map((paragraph,index)=><p key={index}>{paragraph.split('\n').map((line,lineIndex)=><span key={lineIndex}>{lineIndex>0&&<br/>}{line}</span>)}</p>)}</div>}
      <div className="announcement-detail-actions"><Link to="/announcements">返回全部公告</Link><Link className="guild-button primary" to={item.href}>查看相关页面 <ArrowRight /></Link></div>
    </article></section>
  </main>;
}

export function WorksPage() {
  const query=useQuery({queryKey:['works'],queryFn:()=>api<PageData<Work>>('/api/public/works?page=1&pageSize=20')});
  return <main><PageHero eyebrow="COLLECTION ATLAS" title="作品图鉴" description="收录绘画、COS、摄影、视频与舞台成果。"/><section className="shell">{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel/>:<div className="works-grid">{query.data.items.map((work,index)=><motion.article className="work-card" key={work.id} whileHover={{y:-8}}><div className={`work-art work-art-${index%4}`}><span>{index===0?'SSR':index%2?'SR':'R'}</span><Sparkles/></div><div><small>GUILD CREATION</small><h2>{work.title}</h2><p>{work.description}</p><button onClick={()=>navigator.clipboard?.writeText(`${location.origin}/works#${work.id}`)}>收藏链接</button></div></motion.article>)}</div>}</section></main>;
}

export function JoinPage() {
  const navigate=useNavigate();
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({displayName:'',email:'',college:'',departmentIds:[] as string[],reason:''});
  const departments=useQuery({queryKey:['departments'],queryFn:()=>api<{items:Department[]}>('/api/public/departments')});
  const mutation=useMutation({mutationFn:()=>api<{id:string;statusToken:string;status:string}>('/api/public/applications',json('POST',form)),onSuccess:data=>{localStorage.setItem('guild_application_token',data.statusToken);navigate(`/application/${data.statusToken}`);}});
  const submit=(e:FormEvent)=>{e.preventDefault();if(step===1){setStep(2);return;}mutation.mutate();};
  const toggleDepartment=(id:string)=>setForm((current)=>({...current,departmentIds:current.departmentIds.includes(id)?current.departmentIds.filter(value=>value!==id):[...current.departmentIds,id]}));
  return <main><PageHero eyebrow="MEMBERSHIP APPLICATION" title="加入佐佑动漫社" description="先填写社员申请，再选择你感兴趣的部门。部门可以多选，加入后也可以根据实际参与情况调整。"/>
    <section className="shell join-shell">
      <div className="join-steps"><span className="done">1 社员申请</span><i/><span className={step===2?'done':''}>2 意向部门</span><i/><span>3 审核结果</span></div>
      <form className="parchment-form" onSubmit={submit}>
        {step===1?<>
          <header className="form-intro"><span>MEMBER APPLICATION</span><h2>填写社员申请</h2><p>请留下基本信息和加入理由。资料仅用于社团招新审核与后续联系。</p></header>
          <label>称呼<input required minLength={2} value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})}/></label>
          <label>学院与年级<input required minLength={2} value={form.college} onChange={e=>setForm({...form,college:e.target.value})}/></label>
          <label>联系邮箱<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>自我介绍与加入理由<textarea required minLength={5} rows={6} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></label>
          <button className="guild-button primary" type="submit">选择意向部门</button>
        </>:<>
          <header className="form-intro"><span>DEPARTMENT INTERESTS</span><h2>选择感兴趣的部门</h2><p>可多选。这只是参与意向，不影响社员申请；通过后可再与各部门负责人沟通。</p></header>
          {departments.isLoading?<LoadingPanel label="正在读取部门信息"/>:departments.error?<ErrorPanel error={departments.error}/>:<div className="class-options department-checklist">{departments.data?.items.map(d=>{
            const selected=form.departmentIds.includes(d.id);
            return <label className={selected?'selected':''} key={d.id}><input type="checkbox" name="departments" value={d.id} checked={selected} onChange={()=>toggleDepartment(d.id)}/><strong>{d.name}</strong><span>{d.description}</span>{selected&&<small>已选择</small>}</label>;
          })}</div>}
          <p className="selection-summary" aria-live="polite">{form.departmentIds.length?`已选择 ${form.departmentIds.length} 个部门`:'请至少选择一个感兴趣的部门'}</p>
          {mutation.error&&<p className="form-error">{mutation.error.message}</p>}
          <div className="form-actions"><button type="button" onClick={()=>setStep(1)} className="text-button">返回修改资料</button><button className="guild-button primary" disabled={mutation.isPending||!form.departmentIds.length} type="submit">{mutation.isPending?'正在提交…':'提交社员申请'}</button></div>
        </>}
      </form>
    </section>
  </main>;
}

export function ApplicationStatusPage() {
  const {token=''}=useParams(); const query=useQuery({queryKey:['application',token],queryFn:()=>api<{id:string;status:string;rejectionReason?:string;activationCode?:string}>(`/api/public/applications/status/${token}`),enabled:Boolean(token)});
  return <main><PageHero eyebrow="APPLICATION STATUS" title="社员申请进度" description="通过提交申请后生成的私密链接查看审核结果。"/><section className="shell narrow">{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<article className="parchment-panel status-card"><StatusBadge status={query.data!.status}/><h2>申请编号 {query.data!.id}</h2>{query.data!.status==='PENDING'&&<p>申请已经提交，请等待社团管理员审核。</p>}{query.data!.rejectionReason&&<p>审核意见：{query.data!.rejectionReason}</p>}{query.data!.activationCode&&<><p>申请已通过，请使用一次性激活码创建社员账号。</p><code>{query.data!.activationCode}</code><Link className="guild-button primary" to={`/activate?token=${encodeURIComponent(query.data!.activationCode)}`}>激活社员账号</Link></>}</article>}</section></main>;
}

export function NotFoundPage(){return <main><section className="not-found"><FileQuestion/><span className="eyebrow">404 · LOST SCROLL</span><h1>这份卷宗不在公会档案里</h1><p>可能是路径错误，或档案已经被移入其他区域。</p><Link className="guild-button" to="/">返回公会大厅</Link></section></main>}
