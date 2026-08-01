import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Award, CalendarCheck, CheckCircle2, ClipboardCheck, Download, FileArchive, Sparkles, Upload, UserRound } from 'lucide-react';
import { api, json, type PageData } from './api';
import { useAuth } from './auth';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero, StatusBadge } from './components';
import type { Activity } from './pages-public';

interface Work { id:string; title:string; description:string; status:string; created_at:string }
interface Task { id:string; title:string; description:string; due_at?:string; completed_at?:string; confirmed_at?:string }
interface GuildFile { id:string; name:string; mime_type:string; size:number; visibility:string; department_id?:string }
interface Contribution { points:number; events:Array<{action:string;entityType:string;entityId:string;createdAt:string;points:number}> }

function useRefresh(key: unknown[]) {
  const client=useQueryClient();
  return ()=>client.invalidateQueries({queryKey:key});
}

export function PortalHomePage(){
  const {user}=useAuth();
  const tasks=useQuery({queryKey:['member','tasks'],queryFn:()=>api<PageData<Task>>('/api/member/tasks?page=1&pageSize=20')});
  const works=useQuery({queryKey:['member','works'],queryFn:()=>api<PageData<Work>>('/api/member/works?page=1&pageSize=20')});
  const contribution=useQuery({queryKey:['member','contributions'],queryFn:()=>api<Contribution>('/api/member/contributions')});
  const contributionLabel:Record<string,string>={ACTIVITY_CHECK_IN:'活动签到',WORK_PUBLISHED:'作品发布',TASK_CONFIRMED:'任务确认'};
  return <main><PageHero eyebrow="MEMBER LODGE" title={`欢迎回来，${user?.displayName ?? '冒险者'}`} description="这里记录你在真实社团协作中的活动、作品与任务。"/><section className="shell dashboard-cards"><article><UserRound/><span>当前身份</span><strong>{user?.role==='ADMIN'?'社长 / 管理员':user?.role==='DEPARTMENT_LEAD'?'部门负责人':'正式成员'}</strong></article><article><ClipboardCheck/><span>待办任务</span><strong>{tasks.data?.items.filter(t=>!t.confirmed_at).length??0}</strong></article><article><Sparkles/><span>提交作品</span><strong>{works.data?.total??0}</strong></article><article><Award/><span>公会贡献</span><strong>{contribution.data?.points??0}</strong></article></section><section className="shell detail-columns"><article className="parchment-panel"><h2>快捷行动</h2><div className="quick-actions"><Link to="/portal/activities"><CalendarCheck/>活动报名与签到</Link><Link to="/portal/works"><Upload/>上传新作品</Link><Link to="/portal/tasks"><ClipboardCheck/>处理部门任务</Link><Link to="/portal/files"><FileArchive/>查看内部资料</Link></div></article><article className="dark-panel"><h2>近期贡献记录</h2>{contribution.data?.events.length?contribution.data.events.slice(0,4).map(event=><div className="quest-row" key={`${event.action}-${event.entityId}`}><Award/><span>{contributionLabel[event.action]??event.action}</span><strong>+{event.points}</strong></div>):<p>完成签到、作品发布或任务确认后将在这里留下记录。</p>}<p>贡献值是社团协作统计，不是游戏货币。</p></article></section></main>;
}

export function ProfilePage(){
  const {user}=useAuth(); const [displayName,setDisplayName]=useState(user?.displayName??''); const [bio,setBio]=useState(user?.bio??''); const [saved,setSaved]=useState(false);
  const mutation=useMutation({mutationFn:()=>api('/api/member/profile',json('PATCH',{displayName,bio})),onSuccess:()=>setSaved(true)});
  return <main><PageHero eyebrow="ADVENTURER PROFILE" title="个人档案" description="维护你在社团中的公开称呼与自我介绍。"/><section className="shell narrow"><form className="parchment-form" onSubmit={e=>{e.preventDefault();setSaved(false);mutation.mutate();}}><div className="avatar-rune">{displayName.slice(0,1)||'佑'}</div><label>登录名<input value={user?.username??''} disabled/></label><label>称呼<input value={displayName} minLength={2} required onChange={e=>setDisplayName(e.target.value)}/></label><label>个人简介<textarea rows={5} value={bio} onChange={e=>setBio(e.target.value)}/></label><label>角色<input value={user?.role??''} disabled/></label>{mutation.error&&<p className="form-error">{mutation.error.message}</p>}{saved&&<p className="form-success">档案已保存</p>}<button className="guild-button primary" disabled={mutation.isPending}>保存档案</button></form></section></main>;
}

export function MemberActivitiesPage(){
  const [checkCodes,setCheckCodes]=useState<Record<string,string>>({}); const [success,setSuccess]=useState(''); const refresh=useRefresh(['portal','activities']);
  const query=useQuery({queryKey:['portal','activities'],queryFn:()=>api<PageData<Activity>>('/api/public/activities?page=1&pageSize=50')});
  const action=useMutation({mutationFn:({path,method,body}:{path:string;method:string;body?:unknown})=>api(path,json(method,body)),onMutate:()=>setSuccess(''),onSuccess:(_data,variables)=>{setSuccess(variables.path.endsWith('/check-in')?'现场签到成功':variables.method==='DELETE'?'已取消活动报名':'活动报名成功');refresh();}});
  return <main><PageHero eyebrow="QUEST DESK" title="活动报名与签到" description="报名开放活动，并在现场使用负责人提供的签到码。"/><section className="shell">{success&&<p className="form-success action-feedback">{success}</p>}{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<div className="manage-list">{query.data?.items.map(a=><article key={a.id}><div><StatusBadge status={a.status}/><h2>{a.title}</h2><p>{formatDate(a.starts_at)} · 上限 {a.capacity} 人</p></div><div className="row-actions">{a.status==='REGISTRATION'&&<><button onClick={()=>action.mutate({path:`/api/member/activities/${a.id}/register`,method:'POST'})}>报名活动</button><button className="subtle" onClick={()=>action.mutate({path:`/api/member/activities/${a.id}/register`,method:'DELETE'})}>取消报名</button></>}{a.status==='IN_PROGRESS'&&<form onSubmit={e=>{e.preventDefault();action.mutate({path:`/api/member/activities/${a.id}/check-in`,method:'POST',body:{code:checkCodes[a.id]??''}})}}><input aria-label={`${a.title}签到码`} placeholder="输入签到码" value={checkCodes[a.id]??''} onChange={e=>setCheckCodes({...checkCodes,[a.id]:e.target.value})}/><button>现场签到</button></form>}<Link to={`/activities/${a.id}`}>详情</Link></div></article>)}</div>}{action.error&&<p className="form-error action-error">{action.error.message}</p>}</section></main>;
}

export function MemberWorksPage(){
  const refresh=useRefresh(['member','works']); const [form,setForm]=useState({title:'',description:''}); const [file,setFile]=useState<File|null>(null); const [open,setOpen]=useState(false);
  const query=useQuery({queryKey:['member','works'],queryFn:()=>api<PageData<Work>>('/api/member/works?page=1&pageSize=30')});
  const create=useMutation({mutationFn:()=>{if(!file)throw new Error('请选择作品文件');const body=new FormData();body.append('title',form.title);body.append('description',form.description);body.append('file',file);return api('/api/member/works/upload',{method:'POST',body});},onSuccess:()=>{setOpen(false);setFile(null);setForm({title:'',description:''});refresh();}});
  return <main><PageHero eyebrow="CREATOR ARCHIVE" title="我的作品" description="作品文件提交后进入负责人审核队列，发布后计入贡献。"><button className="guild-button primary" onClick={()=>setOpen(!open)}>{open?'收起表单':'上传新作品'}</button></PageHero><section className="shell">{open&&<form className="inline-create" onSubmit={e=>{e.preventDefault();create.mutate();}}><label>作品名称<input required minLength={2} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>作品说明<textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>作品文件<input type="file" accept="image/*,video/*,.pdf,.zip,.txt,.doc,.docx" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><button className="guild-button primary" disabled={!file||create.isPending}>提交审核</button>{create.error&&<p className="form-error">{create.error.message}</p>}</form>}{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel label="还没有提交作品"/>:<div className="manage-list">{query.data.items.map(w=><article key={w.id}><div><StatusBadge status={w.status}/><h2>{w.title}</h2><p>{w.description}</p></div><span>{formatDate(w.created_at)}</span></article>)}</div>}</section></main>;
}

export function MemberTasksPage(){
  const refresh=useRefresh(['member','tasks']); const query=useQuery({queryKey:['member','tasks'],queryFn:()=>api<PageData<Task>>('/api/member/tasks?page=1&pageSize=30')}); const complete=useMutation({mutationFn:(id:string)=>api(`/api/member/tasks/${id}/complete`,json('POST')),onSuccess:refresh});
  return <main><PageHero eyebrow="DEPARTMENT QUESTS" title="部门任务" description="真实任务需要成员完成、负责人确认后才计入贡献。"/><section className="shell">{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel/>:<div className="task-board">{query.data.items.map(task=><article key={task.id} className={task.confirmed_at?'complete':''}><ClipboardCheck/><div><small>{task.confirmed_at?'贡献已确认':task.completed_at?'等待负责人确认':'待完成'}</small><h2>{task.title}</h2><p>{task.description}</p><span>截止：{formatDate(task.due_at)}</span></div>{!task.completed_at&&<button onClick={()=>complete.mutate(task.id)}><CheckCircle2/>标记完成</button>}</article>)}</div>}</section></main>;
}

export function MemberFilesPage(){
  const query=useQuery({queryKey:['member','files'],queryFn:()=>api<PageData<GuildFile>>('/api/member/files?page=1&pageSize=50')});
  return <main><PageHero eyebrow="INNER LIBRARY" title="内部文件" description="只有登录成员可查看真人照片与内部协作资料。"/><section className="shell">{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel/>:<div className="file-grid">{query.data.items.map(file=><article key={file.id}>{file.mime_type.startsWith('image/')?<img className="protected-preview" src={`/api/files/${file.id}/content`} alt={file.name}/>:<FileArchive/>}<div><StatusBadge status={file.visibility}/><h2>{file.name}</h2><p>{file.mime_type} · {(file.size/1024).toFixed(1)} KB</p></div><a className="icon-button" href={`/api/files/${file.id}/content`} download><Download/><span>下载</span></a></article>)}</div>}</section></main>;
}
