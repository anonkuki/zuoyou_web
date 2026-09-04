import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity as ActivityIcon, ArchiveRestore, Ban, Check, CircleGauge, ClipboardCheck, FileArchive, History, ListChecks, Megaphone, Pencil, Pin, RotateCcw, Search, Settings, ShieldCheck, Trash2, UserCog, Users, X } from 'lucide-react';
import { isExecutiveRole, roleLabels, type Role } from '@guild/contracts';
import { api, json, type PageData } from './api';
import { useAuth } from './auth';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero, StatusBadge } from './components';
import type { Activity, Department } from './pages-public';

interface Dashboard { members:number; pendingApplications:number; activeActivities:number; publishedWorks:number }
interface Analytics { departmentActivity:Array<{departmentId:string;departmentName:string;score:number}>; memberGrowth:Array<{month:string;count:number}> }
interface Member { id:string; uid:string; display_name:string; email:string; role:Role; department_id:string|null; is_active:number; created_at:string }
interface HierarchyAssignment { id:string; uid:string; userId:string; role:Role; departmentId:string|null; displayName:string; departmentName:string|null; grantedByName:string|null; grantedAt:string }
interface Application { id:string; display_name:string; email:string; college:string; department_id:string; departmentIds:string[]; departmentNames:string[]; reason:string; status:string; rejection_reason?:string; created_at:string }
interface RegistrationRequest { id:string; username:string; contact:string; note:string; status:string; created_at:string; reviewed_at?:string|null }
interface Work { id:string; title:string; description:string; status:string; department_id:string; display_name?:string; created_at:string }
interface GuildFile { id:string; name:string; mime_type:string; size:number; visibility:string; category:string; department_id:string|null; deleted_at:string|null }
interface Task { id:string; title:string; description:string; department_id:string; assignee_id:string; completed_at?:string; confirmed_at?:string; due_at?:string }
interface Audit { id:string; action:string; entity_type:string; entity_id:string; actor_id?:string; created_at:string }
interface Chronicle { id:string; title:string; content:string; occurred_at:string }
interface AdminAnnouncement { id:string; title:string; summary:string; content:string; category:'RECRUITMENT'|'ACTIVITY'|'NOTICE'; href:string; pinned:number; published:number; published_at:string }

function useInvalidate(...keys:string[]){const client=useQueryClient();return ()=>keys.forEach(key=>client.invalidateQueries({queryKey:[key]}));}

export function AdminDashboardPage(){
  const dashboard=useQuery({queryKey:['admin-dashboard'],queryFn:()=>api<Dashboard>('/api/admin/dashboard')});
  const analytics=useQuery({queryKey:['admin-analytics'],queryFn:()=>api<Analytics>('/api/admin/analytics')});
  const stats=[['正式成员',dashboard.data?.members??0,Users],['待审申请',dashboard.data?.pendingApplications??0,ListChecks],['活跃活动',dashboard.data?.activeActivities??0,ActivityIcon],['已发作品',dashboard.data?.publishedWorks??0,ShieldCheck]] as const;
  return <main><PageHero eyebrow="COMMAND TABLE" title="公会数据总览" description="所有数值由成员、活动、作品与任务记录实时聚合。"/><section className="shell dashboard-cards">{stats.map(([label,value,Icon])=><article key={label}><Icon/><span>{label}</span><strong>{value}</strong></article>)}</section><section className="shell chart-grid"><article className="chart-panel"><h2>部门贡献排行</h2>{analytics.isLoading?<LoadingPanel/>:<ResponsiveContainer width="100%" height={300}><BarChart data={analytics.data?.departmentActivity??[]}><CartesianGrid strokeDasharray="3 3" stroke="#6c523b44"/><XAxis dataKey="departmentName"/><YAxis/><Tooltip/><Bar dataKey="score" fill="#c89b3c" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>}</article><article className="parchment-panel"><h2>管理提醒</h2><div className="quest-row"><ListChecks/><span>待审核招新</span><strong>{dashboard.data?.pendingApplications??0}</strong></div><div className="quest-row"><ActivityIcon/><span>正在运行活动</span><strong>{dashboard.data?.activeActivities??0}</strong></div><p className="panel-note">处理操作会写入审计日志，成员与文件删除均可恢复。</p></article></section></main>;
}

export function MembersAdminPage(){
  const {user}=useAuth(); const [q,setQ]=useState(''); const [editing,setEditing]=useState<Member|null>(null); const refresh=useInvalidate('admin-members','admin-dashboard','role-hierarchy','departments'); const query=useQuery({queryKey:['admin-members',q],queryFn:()=>api<PageData<Member>>(`/api/admin/members?page=1&pageSize=100&q=${encodeURIComponent(q)}`)});
  const hierarchy=useQuery({queryKey:['role-hierarchy'],queryFn:()=>api<{items:HierarchyAssignment[]}>('/api/admin/role-hierarchy')});
  const action=useMutation({mutationFn:({id,verb}:{id:string;verb:string})=>api(`/api/admin/members/${id}/${verb}`,json('POST')),onSuccess:refresh});
  const update=useMutation({mutationFn:(member:Member)=>api(`/api/admin/members/${member.id}`,json('PATCH',{displayName:member.display_name})),onSuccess:()=>{setEditing(null);refresh();}});
  const grant=useMutation({mutationFn:({member,role}:{member:Member;role:'VICE_PRESIDENT'|'DEPARTMENT_ADMIN'})=>api(`/api/admin/roles/${member.id}/assign`,json('POST',{role,departmentId:role==='DEPARTMENT_ADMIN'?member.department_id:null})),onSuccess:refresh});
  const revoke=useMutation({mutationFn:(member:Member)=>api(`/api/admin/roles/${member.id}/revoke`,json('POST')),onSuccess:refresh});
  const items=query.data?.items??[];
  const canRevoke=(member:Member)=>user?.role==='PRESIDENT'&&member.role==='VICE_PRESIDENT'
    || Boolean(user&&isExecutiveRole(user.role)&&member.role==='DEPARTMENT_HEAD')
    || user?.role==='DEPARTMENT_HEAD'&&member.role==='DEPARTMENT_ADMIN'&&member.department_id===user.departmentId;
  return <AdminListPage title="成员与权限" eyebrow="MEMBER ROSTER" description="按社长 → 副社长 → 部长 → 副部长逐级授权；部长可任命多名本部门副部长。" search={q} onSearch={setQ}>
    {hierarchy.data&&<article className="parchment-panel"><h2>当前权限树</h2><div className="quest-list">{hierarchy.data.items.map(item=><div className="quest-row" key={item.id}><ShieldCheck/><span>{item.displayName}（UID {item.uid}）· {roleLabels[item.role]}{item.departmentName?` · ${item.departmentName}`:''}</span><small>{item.grantedByName?`由 ${item.grantedByName} 任命`:'系统初始身份'}</small></div>)}</div></article>}
    {query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<><div className="data-table"><div className="table-head"><span>成员</span><span>身份</span><span>部门</span><span>状态</span><span>操作</span></div>{items.map(m=><div className="table-row" key={m.id}><span><strong>{m.display_name}</strong><small>UID {m.uid} · {m.email}</small></span><span>{roleLabels[m.role]}</span><span>{m.department_id??'跨部门'}</span><span>{m.is_active?<StatusBadge status="APPROVED"/>:<StatusBadge status="REJECTED"/>}</span><span className="row-actions"><button onClick={()=>setEditing({...m})}><UserCog/>编辑</button>{user?.role==='PRESIDENT'&&m.role==='MEMBER'&&m.is_active?<button onClick={()=>grant.mutate({member:m,role:'VICE_PRESIDENT'})}><ShieldCheck/>任命副社长</button>:null}{user?.role==='DEPARTMENT_HEAD'&&m.role==='MEMBER'&&m.department_id===user.departmentId&&m.is_active?<button onClick={()=>grant.mutate({member:m,role:'DEPARTMENT_ADMIN'})}><ShieldCheck/>任命副部长</button>:null}{canRevoke(m)&&<button className="danger" onClick={()=>revoke.mutate(m)}><X/>撤销权限</button>}{m.id!==user?.id&&m.role==='MEMBER'&&(m.is_active?<button onClick={()=>action.mutate({id:m.id,verb:'deactivate'})}><Ban/>停用</button>:<button onClick={()=>action.mutate({id:m.id,verb:'restore'})}><RotateCcw/>恢复</button>)}</span></div>)}</div>{(grant.error||revoke.error||action.error)&&<p className="form-error">{(grant.error||revoke.error||action.error)?.message}</p>}{editing&&<form className="inline-create" onSubmit={e=>{e.preventDefault();update.mutate(editing);}}><h2>编辑成员档案</h2><label>成员称呼<input minLength={2} required value={editing.display_name} onChange={e=>setEditing({...editing,display_name:e.target.value})}/></label><p className="panel-note">身份与部门不能在普通档案编辑中绕过权限树修改。</p>{update.error&&<p className="form-error">{update.error.message}</p>}<div className="form-actions"><button type="button" onClick={()=>setEditing(null)}>取消</button><button className="guild-button primary">保存档案</button></div></form>}</>}
  </AdminListPage>;
}

export function DepartmentsAdminPage(){
  const query=useQuery({queryKey:['departments'],queryFn:()=>api<{items:Department[]}>('/api/public/departments')}); const members=useQuery({queryKey:['admin-members','leaders'],queryFn:()=>api<PageData<Member>>('/api/admin/members?page=1&pageSize=100')}); const refresh=useInvalidate('departments','admin-members'); const [editing,setEditing]=useState<Department|null>(null); const update=useMutation({mutationFn:(d:Department)=>api(`/api/admin/departments/${d.id}`,json('PATCH',{title:d.title,description:d.description})),onSuccess:()=>{setEditing(null);refresh();}}); const assign=useMutation({mutationFn:({departmentId,userId}:{departmentId:string;userId:string})=>api(`/api/admin/departments/${departmentId}/leader`,json('POST',{userId})),onSuccess:refresh});
  return <main><PageHero eyebrow="CLASS ADMINISTRATION" title="部门管理" description="社长层为六个部门任命部长；新部长会替换该部门原部长。"/><section className="shell">{query.isLoading?<LoadingPanel/>:<div className="manage-list">{query.data?.items.map(d=><article key={d.id}><div><small>{d.title}</small><h2>{d.name}</h2><p>{d.description}</p><label>部长<select aria-label={`${d.name}部长`} value={d.leader_id??''} onChange={e=>assign.mutate({departmentId:d.id,userId:e.target.value})}><option value="" disabled>选择部长</option>{members.data?.items.filter(member=>member.department_id===d.id&&member.is_active&&(member.role==='MEMBER'||member.id===d.leader_id)).map(member=><option value={member.id} key={member.id}>{member.display_name}（UID {member.uid}）</option>)}</select></label></div><button onClick={()=>setEditing(d)}><UserCog/>编辑部门</button></article>)}</div>}{assign.error&&<p className="form-error">{assign.error.message}</p>}{editing&&<form className="inline-create" onSubmit={e=>{e.preventDefault();update.mutate(editing);}}><h2>编辑 {editing.name}</h2><label>职业称号<input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><label>部门说明<textarea value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/></label>{update.error&&<p className="form-error">{update.error.message}</p>}<div className="form-actions"><button type="button" onClick={()=>setEditing(null)}>取消</button><button className="guild-button primary">保存修改</button></div></form>}</section></main>;
}

export function ActivitiesAdminPage(){
  const refresh=useInvalidate('admin-activities','admin-dashboard','activities'); const [open,setOpen]=useState(false); const [generatedCodes,setGeneratedCodes]=useState<Record<string,string>>({}); const [resultFiles,setResultFiles]=useState<Record<string,File|null>>({}); const [resultSummaries,setResultSummaries]=useState<Record<string,string>>({}); const [uploadedResults,setUploadedResults]=useState<Record<string,string>>({}); const [form,setForm]=useState({departmentId:'dept-cos',title:'',description:'',location:'星门大厅',capacity:30,startsAt:'2026-08-20T10:00:00.000Z'});
  const query=useQuery({queryKey:['admin-activities'],queryFn:()=>api<PageData<Activity>>('/api/admin/activities?page=1&pageSize=100')});
  const create=useMutation({mutationFn:()=>api('/api/admin/activities',json('POST',form)),onSuccess:()=>{setOpen(false);refresh();}});
  const transition=useMutation({mutationFn:async({id,status,resultSummary}:{id:string;status:string;resultSummary?:string})=>{
    if(resultSummary) await api(`/api/admin/activities/${id}`,json('PUT',{resultSummary}));
    return api<{status:string;checkInCode?:string}>(`/api/admin/activities/${id}/state`,json('POST',{status}));
  },onSuccess:(data,variables)=>{if(data.checkInCode)setGeneratedCodes(current=>({...current,[variables.id]:data.checkInCode!}));refresh();}});
  const uploadResult=useMutation({mutationFn:async({id,file,summary}:{id:string;file:File;summary:string})=>{const body=new FormData();body.append('summary',summary||file.name);body.append('file',file);return api(`/api/admin/activities/${id}/results/upload`,{method:'POST',body});},onSuccess:(_data,variables)=>{setUploadedResults(current=>({...current,[variables.id]:variables.file.name}));refresh();}});
  const next:Record<string,string>={PREPARING:'REGISTRATION',REGISTRATION:'IN_PROGRESS',IN_PROGRESS:'ENDED',ENDED:'ARCHIVED'};
  return <main><PageHero eyebrow="QUEST OPERATIONS" title="活动管理" description="按筹备、报名、进行、结束、成果、归档推进完整生命周期。"><button className="guild-button primary" onClick={()=>setOpen(!open)}>{open?'取消创建':'创建活动'}</button></PageHero><section className="shell">{open&&<form className="inline-create" onSubmit={e=>{e.preventDefault();create.mutate();}}><label>活动名称<input required minLength={2} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>活动说明<textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>活动地点<input required minLength={2} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label><label>开始时间<input type="datetime-local" required value={form.startsAt.slice(0,16)} onChange={e=>setForm({...form,startsAt:new Date(e.target.value).toISOString()})}/></label><label>人数上限<input type="number" min={1} value={form.capacity} onChange={e=>setForm({...form,capacity:Number(e.target.value)})}/></label>{create.error&&<p className="form-error">{create.error.message}</p>}<button className="guild-button primary">保存筹备活动</button></form>}{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<div className="manage-list">{query.data?.items.map(a=><article key={a.id}><div><StatusBadge status={a.status}/><h2>{a.title}</h2><p>{a.description} · {a.location} · {formatDate(a.starts_at)}</p>{a.result_summary&&<small>成果：{a.result_summary}</small>}{generatedCodes[a.id]&&<strong className="check-in-code">签到码：{generatedCodes[a.id]}</strong>}{uploadedResults[a.id]&&<strong className="form-success">成果文件已上传：{uploadedResults[a.id]}</strong>}</div><div className="row-actions">{a.status==='ENDED'&&<div className="result-upload"><input aria-label={`${a.title}成果说明`} placeholder="成果说明" value={resultSummaries[a.id]??''} onChange={e=>setResultSummaries({...resultSummaries,[a.id]:e.target.value})}/><input aria-label={`${a.title}成果文件`} type="file" onChange={e=>setResultFiles({...resultFiles,[a.id]:e.target.files?.[0]??null})}/><button disabled={!resultFiles[a.id]||uploadResult.isPending} onClick={()=>{const file=resultFiles[a.id];if(file)uploadResult.mutate({id:a.id,file,summary:resultSummaries[a.id]??''});}}>上传成果文件</button></div>}{next[a.status]&&<button onClick={()=>{const resultSummary=a.status==='ENDED'?(resultSummaries[a.id]?.trim()||prompt('归档前填写成果摘要')||undefined):undefined;transition.mutate({id:a.id,status:next[a.status],resultSummary});}}>{next[a.status]==='REGISTRATION'?'开放报名':next[a.status]==='IN_PROGRESS'?'开始并生成签到码':next[a.status]==='ENDED'?'结束活动':'填写成果并归档'}</button>}</div></article>)}</div>}</section></main>;
}

const emptyAnnouncementForm=()=>({title:'',summary:'',content:'',category:'NOTICE' as AdminAnnouncement['category'],href:'/activities',pinned:false,published:true,publishedAt:new Date().toISOString().slice(0,16)});

export function AnnouncementsAdminPage(){
  const refresh=useInvalidate('admin-announcements','public-home');
  const [open,setOpen]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [form,setForm]=useState(emptyAnnouncementForm);
  const query=useQuery({queryKey:['admin-announcements'],queryFn:()=>api<PageData<AdminAnnouncement>>('/api/admin/announcements?page=1&pageSize=100')});
  const closeEditor=()=>{setOpen(false);setEditingId(null);setForm(emptyAnnouncementForm());};
  const save=useMutation({
    mutationFn:()=>api(editingId?`/api/admin/announcements/${editingId}`:'/api/admin/announcements',json(editingId?'PATCH':'POST',{...form,publishedAt:new Date(form.publishedAt).toISOString()})),
    onSuccess:()=>{closeEditor();refresh();},
  });
  const toggle=useMutation({mutationFn:(item:AdminAnnouncement)=>api(`/api/admin/announcements/${item.id}`,json('PATCH',{published:!item.published})),onSuccess:refresh});
  const edit=(item:AdminAnnouncement)=>{setEditingId(item.id);setForm({title:item.title,summary:item.summary,content:item.content??'',category:item.category,href:item.href,pinned:Boolean(item.pinned),published:Boolean(item.published),publishedAt:item.published_at.slice(0,16)});setOpen(true);};
  return <main><PageHero eyebrow="QUEST BOARD EDITOR" title="公会公告" description="维护首页任务公告板；发布、置顶、编辑与下架都会真实写入数据库。"><button className="guild-button primary" onClick={()=>{if(open)closeEditor();else setOpen(true);}}>{open?'取消编辑':'新建公告'}</button></PageHero><section className="shell">
    {open&&<form className="inline-create announcement-editor" onSubmit={e=>{e.preventDefault();save.mutate();}}>
      <h2>{editingId?'编辑公告':'发布新公告'}</h2>
      <label>公告标题<input required minLength={2} maxLength={80} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>公告分类<select value={form.category} onChange={e=>setForm({...form,category:e.target.value as AdminAnnouncement['category']})}><option value="RECRUITMENT">招新信息</option><option value="ACTIVITY">活动公告</option><option value="NOTICE">社团通知</option></select></label>
      <label className="announcement-summary">公告摘要<textarea required minLength={2} maxLength={240} value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/></label>
      <label className="announcement-summary">公告正文<textarea rows={6} maxLength={5000} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="支持空行分段，将在公告详情页完整展示"/></label>
      <label>站内链接<input required pattern="/.*" value={form.href} onChange={e=>setForm({...form,href:e.target.value})}/></label>
      <label>发布时间<input type="datetime-local" required value={form.publishedAt} onChange={e=>setForm({...form,publishedAt:e.target.value})}/></label>
      <label className="check-label"><input type="checkbox" checked={form.pinned} onChange={e=>setForm({...form,pinned:e.target.checked})}/>置顶显示 NEW 标记</label>
      <label className="check-label"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/>立即发布到游客首页</label>
      {save.error&&<p className="form-error">{save.error.message}</p>}
      <button className="guild-button primary" disabled={save.isPending}>保存公告</button>
    </form>}
    {query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel label="尚未创建公告"/>:<div className="manage-list announcement-list">{query.data.items.map(item=><article key={item.id}><div><div className="announcement-meta"><StatusBadge status={item.published?'PUBLISHED':'DRAFT'}/>{Boolean(item.pinned)&&<span className="pin-label"><Pin/>置顶</span>}<small>{formatDate(item.published_at)}</small></div><h2>{item.title}</h2><p>{item.summary}</p><small>{item.category} · {item.href}</small></div><div className="row-actions"><button onClick={()=>edit(item)}><Pencil/>编辑</button><button aria-label={`${item.published?'下架':'发布'} ${item.title}`} onClick={()=>toggle.mutate(item)}>{item.published?<><X/>下架</>:<><Megaphone/>发布</>}</button></div></article>)}</div>}
  </section></main>;
}

export function RecruitmentAdminPage(){
  const refresh=useInvalidate('admin-applications','admin-registration-requests','admin-dashboard');
  const applicationQuery=useQuery({queryKey:['admin-applications'],queryFn:()=>api<PageData<Application>>('/api/admin/applications?page=1&pageSize=100')});
  const registrationQuery=useQuery({queryKey:['admin-registration-requests'],queryFn:()=>api<PageData<RegistrationRequest>>('/api/admin/registration-requests?page=1&pageSize=100')});
  const applicationAction=useMutation({mutationFn:({id,verb,body}:{id:string;verb:string;body?:unknown})=>api(`/api/admin/applications/${id}/${verb}`,json('POST',body)),onSuccess:data=>{const result=data as {activationCode?:string};if(result.activationCode)navigator.clipboard?.writeText(result.activationCode);refresh();}});
  const registrationAction=useMutation({mutationFn:({id,verb}:{id:string;verb:'approve'|'reject'})=>api(`/api/admin/registration-requests/${id}/${verb}`,json('POST')),onSuccess:refresh});
  return <main><PageHero eyebrow="MEMBERSHIP REVIEW" title="招新与注册管理" description="社长和副社长审核账号注册与社员申请；注册密码始终不可见。"/><section className="shell registration-review"><article className="parchment-panel"><h2>用户注册请求</h2><p className="panel-note">这里只显示注册用户名、联系方式和备注。批准后账号可直接登录。</p>{registrationQuery.isLoading?<LoadingPanel/>:registrationQuery.error?<ErrorPanel error={registrationQuery.error}/>:!registrationQuery.data?.items.length?<EmptyPanel label="暂无用户注册请求"/>:<div className="manage-list">{registrationQuery.data.items.map(item=><article key={item.id}><div><StatusBadge status={item.status}/><h2>{item.username}</h2><p><strong>联系方式：</strong>{item.contact}</p><p><strong>备注：</strong>{item.note||'无'}</p><small>{formatDate(item.created_at)}</small></div>{item.status==='PENDING'&&<div className="row-actions"><button onClick={()=>registrationAction.mutate({id:item.id,verb:'approve'})}><Check/>同意注册</button><button className="danger" onClick={()=>registrationAction.mutate({id:item.id,verb:'reject'})}><X/>拒绝注册</button></div>}</article>)}</div>}{registrationAction.error&&<p className="form-error">{registrationAction.error.message}</p>}</article><article className="parchment-panel"><h2>社员申请</h2><p className="panel-note">原有招新流程保留部门意向，通过后生成一次性激活码。</p>{applicationQuery.isLoading?<LoadingPanel/>:applicationQuery.error?<ErrorPanel error={applicationQuery.error}/>:<div className="manage-list">{applicationQuery.data?.items.map(a=><article key={a.id}><div><StatusBadge status={a.status}/><h2>{a.display_name}</h2><p>{a.college} · {a.email}</p><p className="application-departments"><strong>意向部门</strong>{(a.departmentNames?.length?a.departmentNames:[a.department_id]).map(name=><span key={name}>{name}</span>)}</p><p>{a.reason}</p><small>{formatDate(a.created_at)}</small></div>{a.status==='PENDING'&&<div className="row-actions"><button onClick={()=>applicationAction.mutate({id:a.id,verb:'approve'})}><Check/>通过并复制激活码</button><button className="danger" onClick={()=>{const reason=prompt('填写拒绝原因');if(reason)applicationAction.mutate({id:a.id,verb:'reject',body:{reason}})}}><X/>拒绝</button></div>}{a.status==='APPROVED'&&<button onClick={()=>applicationAction.mutate({id:a.id,verb:'regenerate-activation'})}>重新生成激活码</button>}</article>)}</div>}</article></section></main>;
}

export function WorksAdminPage(){
  const {user}=useAuth(); const refresh=useInvalidate('admin-works','admin-dashboard','works'); const [status,setStatus]=useState('PENDING'); const query=useQuery({queryKey:['admin-works',status],queryFn:()=>api<PageData<Work>>(`/api/admin/works?page=1&pageSize=100&status=${status}`)}); const review=useMutation({mutationFn:({id,status}:{id:string;status:string})=>api(`/api/admin/works/${id}/review`,json('POST',{status})),onSuccess:refresh});
  return <main><PageHero eyebrow="CURATION DESK" title="作品审核" description={`${user&&isExecutiveRole(user.role)?'全社':'本部门'}作品进入公开图鉴前需完成审核。`}/><section className="shell"><div className="filter-bar">{['PENDING','PUBLISHED','REJECTED'].map(s=><button className={status===s?'active':''} onClick={()=>setStatus(s)} key={s}>{s}</button>)}</div>{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel label="当前队列为空"/>:<div className="manage-list">{query.data.items.map(w=><article key={w.id}><div><StatusBadge status={w.status}/><h2>{w.title}</h2><p>{w.description}</p></div>{w.status==='PENDING'&&<div className="row-actions"><button onClick={()=>review.mutate({id:w.id,status:'PUBLISHED'})}><Check/>发布</button><button className="danger" onClick={()=>review.mutate({id:w.id,status:'REJECTED'})}><X/>拒绝</button></div>}</article>)}</div>}</section></main>;
}

export function FilesAdminPage(){
  const {user}=useAuth();
  const refresh=useInvalidate('admin-files','member');
  const [open,setOpen]=useState(false);
  const [file,setFile]=useState<File|null>(null);
  const [visibility,setVisibility]=useState('MEMBERS');
  const [category,setCategory]=useState('OTHER');
  const [departmentId,setDepartmentId]=useState(user?.departmentId??'dept-cos');
  const query=useQuery({queryKey:['admin-files'],queryFn:()=>api<PageData<GuildFile>>('/api/admin/files?page=1&pageSize=100')});
  const action=useMutation({mutationFn:({id,verb}:{id:string;verb:string})=>api(`/api/admin/files/${id}/${verb}`,json('POST')),onSuccess:refresh});
  const rename=useMutation({mutationFn:({id,name}:{id:string;name:string})=>api(`/api/admin/files/${id}`,json('PATCH',{name})),onSuccess:refresh});
  const upload=useMutation({
    mutationFn:async()=>{
      if(!file)throw new Error('请选择文件');
      const body=new FormData();
      body.append('visibility',visibility);
      body.append('category',category);
      body.append('departmentId',departmentId);
      body.append('file',file);
      return api('/api/admin/files/upload',{method:'POST',body});
    },
    onSuccess:()=>{setOpen(false);setFile(null);refresh();},
  });
  return <main>
    <PageHero eyebrow="ARCHIVE VAULT" title="文件管理" description="按权限管理海报、照片、视频、策划案和历史资料。"><button className="guild-button primary" onClick={()=>setOpen(!open)}>{open?'取消上传':'上传文件'}</button></PageHero>
    <section className="shell">
      {open&&<form className="inline-create" onSubmit={e=>{e.preventDefault();upload.mutate();}}>
        <label>选择文件<input type="file" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
        <label>可见范围<select value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="MEMBERS">全体成员</option><option value="DEPARTMENT">仅所属部门</option>{user&&isExecutiveRole(user.role)&&<><option value="PUBLIC">公开</option><option value="ADMINS">仅管理层</option></>}</select></label>
        <label>业务分类<select value={category} onChange={e=>setCategory(e.target.value)}><option value="POSTER">活动海报</option><option value="PHOTO">活动照片</option><option value="VIDEO">活动视频</option><option value="PLAN">策划文档</option><option value="HISTORY">历史资料</option><option value="OTHER">其他资料</option></select></label>
        <label>所属部门<select value={departmentId} disabled={!user||!isExecutiveRole(user.role)} onChange={e=>setDepartmentId(e.target.value)}><option value="dept-cos">COS部</option><option value="dept-tech">技术部</option><option value="dept-music">轻音部</option><option value="dept-original">原创部</option><option value="dept-dance">舞装部</option><option value="dept-publicity">外宣&amp;幻想研</option></select></label>
        {upload.error&&<p className="form-error">{upload.error.message}</p>}
        <button className="guild-button primary" disabled={!file||upload.isPending}>保存文件</button>
      </form>}
      {query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<div className="file-grid">{query.data?.items.map(item=><article className={item.deleted_at?'trashed':''} key={item.id}><FileArchive/><div><StatusBadge status={item.visibility}/><h2>{item.name}</h2><p>{item.category} · {item.mime_type} · {(item.size/1024).toFixed(1)} KB</p></div><div className="row-actions">{!item.deleted_at&&<button onClick={()=>{const name=prompt('输入新的文件名',item.name);if(name&&name!==item.name)rename.mutate({id:item.id,name});}}>重命名</button>}{item.deleted_at?<button onClick={()=>action.mutate({id:item.id,verb:'restore'})}><ArchiveRestore/>恢复</button>:<button className="danger" onClick={()=>action.mutate({id:item.id,verb:'recycle'})}><Trash2/>回收</button>}</div></article>)}</div>}
    </section>
  </main>;
}

export function TasksAdminPage(){
  const {user}=useAuth(); const refresh=useInvalidate('admin-tasks','admin-analytics'); const [open,setOpen]=useState(false); const [form,setForm]=useState({departmentId:user?.departmentId??'dept-cos',assigneeId:'',title:'',description:'',dueAt:'2026-08-30T12:00:00.000Z'});
  const query=useQuery({queryKey:['admin-tasks'],queryFn:()=>api<PageData<Task>>('/api/admin/tasks?page=1&pageSize=100')});
  const members=useQuery({queryKey:['admin-members','task'],queryFn:()=>api<PageData<Member>>('/api/admin/members?page=1&pageSize=100')});
  const confirm=useMutation({mutationFn:(id:string)=>api(`/api/admin/tasks/${id}/confirm`,json('POST')),onSuccess:refresh});
  const create=useMutation({mutationFn:()=>api('/api/admin/tasks',json('POST',form)),onSuccess:()=>{setOpen(false);setForm({...form,title:'',description:'',assigneeId:''});refresh();}});
  const candidates=members.data?.items.filter(member=>member.department_id===form.departmentId)??[];
  return <main><PageHero eyebrow="QUEST ASSIGNMENT" title="部门任务" description="管理层指派任务，成员完成后确认贡献且只计入一次。"><button className="guild-button primary" onClick={()=>setOpen(!open)}>{open?'取消指派':'指派新任务'}</button></PageHero><section className="shell">{open&&<form className="inline-create" onSubmit={e=>{e.preventDefault();create.mutate();}}><label>所属部门<select value={form.departmentId} disabled={!user||!isExecutiveRole(user.role)} onChange={e=>setForm({...form,departmentId:e.target.value,assigneeId:''})}><option value="dept-cos">COS部</option><option value="dept-tech">技术部</option><option value="dept-music">轻音部</option><option value="dept-original">原创部</option><option value="dept-dance">舞装部</option><option value="dept-publicity">外宣&amp;幻想研</option></select></label><label>指派成员<select required value={form.assigneeId} onChange={e=>setForm({...form,assigneeId:e.target.value})}><option value="">请选择成员</option>{candidates.map(member=><option key={member.id} value={member.id}>{member.display_name}</option>)}</select></label><label>任务名称<input required minLength={2} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>任务说明<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>{create.error&&<p className="form-error">{create.error.message}</p>}<button className="guild-button primary">发布任务</button></form>}{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<div className="task-board">{query.data?.items.map(t=><article className={t.confirmed_at?'complete':''} key={t.id}><ClipboardCheck/><div><small>{t.confirmed_at?'已确认':t.completed_at?'待确认':'执行中'}</small><h2>{t.title}</h2><p>{t.description}</p></div>{t.completed_at&&!t.confirmed_at&&<button onClick={()=>confirm.mutate(t.id)}><Check/>确认贡献</button>}</article>)}</div>}</section></main>;
}

export function ChronicleAdminPage(){
  const refresh=useInvalidate('chronicles'); const [form,setForm]=useState({title:'',content:'',occurredAt:new Date().toISOString(),published:true}); const query=useQuery({queryKey:['chronicles'],queryFn:()=>api<PageData<Chronicle>>('/api/public/chronicles?page=1&pageSize=100')}); const create=useMutation({mutationFn:()=>api('/api/admin/chronicles',json('POST',form)),onSuccess:()=>{setForm({...form,title:'',content:''});refresh();}});
  return <main><PageHero eyebrow="CHRONICLE EDITOR" title="历史管理" description="后台新增的时间线节点会立即显示在公会编年史。"/><section className="shell detail-columns"><form className="inline-create" onSubmit={e=>{e.preventDefault();create.mutate();}}><h2>新增历史节点</h2><label>标题<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>描述<textarea required value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></label><button className="guild-button primary">发布到编年史</button></form><article className="parchment-panel"><h2>现有节点</h2>{query.data?.items.map(c=><div className="quest-row" key={c.id}><History/><span>{new Date(c.occurred_at).getFullYear()}</span><strong>{c.title}</strong></div>)}</article></section></main>;
}

export function AnalyticsAdminPage(){const query=useQuery({queryKey:['admin-analytics'],queryFn:()=>api<Analytics>('/api/admin/analytics')});return <main><PageHero eyebrow="GUILD INTELLIGENCE" title="数据统计" description="成员增长、活动数量、部门活跃度、贡献排行与年度报告。"/><section className="shell chart-grid">{query.isLoading?<LoadingPanel/>:<><article className="chart-panel"><h2>成员增长</h2><ResponsiveContainer width="100%" height={320}><BarChart data={query.data?.memberGrowth??[]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="count" fill="#4b9cd3"/></BarChart></ResponsiveContainer></article><article className="chart-panel"><h2>部门活跃度</h2><ResponsiveContainer width="100%" height={320}><BarChart data={query.data?.departmentActivity??[]} layout="vertical"><XAxis type="number"/><YAxis type="category" dataKey="departmentName" width={80}/><Tooltip/><Bar dataKey="score" fill="#c89b3c"/></BarChart></ResponsiveContainer></article></>}</section><section className="shell report-actions"><button className="guild-button" onClick={()=>window.print()}>打印年度报告</button><button className="guild-button ghost" onClick={()=>{const rows=query.data?.departmentActivity??[];const csv=['部门,活跃度',...rows.map(r=>`${r.departmentName},${r.score}`)].join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='佐佑动漫社年度报告.csv';a.click();URL.revokeObjectURL(url);}}>导出统计 CSV</button></section></main>}

export function SettingsAdminPage(){
  const [settings,setSettings]=useState<Record<string,string>>({});
  const refresh=useInvalidate('public-home','admin-settings');
  const query=useQuery({queryKey:['admin-settings'],queryFn:async()=>{const d=await api<{settings:Record<string,string>}>('/api/admin/site-settings');setSettings(d.settings);return d;}});
  const save=useMutation({mutationFn:()=>api('/api/admin/site-settings',json('PUT',settings)),onSuccess:refresh});
  const setValue=(key:string,value:string)=>setSettings(current=>({...current,[key]:value}));
  return <main><PageHero eyebrow="GUILD CONFIGURATION" title="系统设置" description="维护站点名称、首页公会状态和招新开关。"/><section className="shell narrow">{query.isLoading?<LoadingPanel/>:<form className="parchment-form" onSubmit={e=>{e.preventDefault();save.mutate();}}>
    <label>站点名称<input value={settings.siteName??''} onChange={e=>setValue('siteName',e.target.value)}/></label>
    <label>首页欢迎语<input value={settings.welcomeMessage??'欢迎来到冒险者公会'} onChange={e=>setValue('welcomeMessage',e.target.value)}/></label>
    <label>公会等级<input type="number" min="1" max="999" value={settings.guildLevel??'12'} onChange={e=>setValue('guildLevel',e.target.value)}/></label>
    <label>当前经验<input type="number" min="0" value={settings.guildLevelCurrent??'2390'} onChange={e=>setValue('guildLevelCurrent',e.target.value)}/></label>
    <label>升级目标<input type="number" min="1" value={settings.guildLevelTarget??'3000'} onChange={e=>setValue('guildLevelTarget',e.target.value)}/></label>
    <label>荣誉数量<input type="number" min="0" value={settings.honorCount??'56'} onChange={e=>setValue('honorCount',e.target.value)}/></label>
    <label>成立年份<input type="number" min="1900" max="2200" value={settings.foundedYear??'2018'} onChange={e=>setValue('foundedYear',e.target.value)}/></label>
    <label className="check-label"><input type="checkbox" checked={settings.recruitmentOpen!=='false'} onChange={e=>setValue('recruitmentOpen',String(e.target.checked))}/>开放招新</label>
    {save.isSuccess&&<p className="form-success">设置已保存，游客首页刷新后生效。</p>}{save.error&&<p className="form-error">{save.error.message}</p>}
    <button className="guild-button primary"><Settings/>保存设置</button>
  </form>}</section></main>;
}

export function AuditAdminPage(){const query=useQuery({queryKey:['admin-audit'],queryFn:()=>api<PageData<Audit>>('/api/admin/audit-log?page=1&pageSize=100')});return <main><PageHero eyebrow="AUDIT TRAIL" title="审计日志" description="记录登录、审核、状态迁移和贡献确认等关键管理操作。"/><section className="shell">{query.isLoading?<LoadingPanel/>:query.error?<ErrorPanel error={query.error}/>:<div className="audit-list">{query.data?.items.map(a=><article key={a.id}><CircleGauge/><div><strong>{a.action}</strong><span>{a.entity_type} · {a.entity_id}</span></div><time>{formatDate(a.created_at)}</time></article>)}</div>}</section></main>}

function AdminListPage({title,eyebrow,description,search,onSearch,children}:{title:string;eyebrow:string;description:string;search:string;onSearch:(value:string)=>void;children:React.ReactNode}){return <main><PageHero eyebrow={eyebrow} title={title} description={description}/><section className="shell"><label className="search-box"><Search/><span className="sr-only">搜索</span><input value={search} onChange={e=>onSearch(e.target.value)} placeholder="搜索 UID、成员名称、用户名或邮箱"/></label>{children}</section></main>}
