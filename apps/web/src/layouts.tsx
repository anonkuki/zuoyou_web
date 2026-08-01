import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, BriefcaseBusiness, Castle, ChevronLeft, ClipboardCheck, FileArchive, History, LayoutDashboard, LogOut, Menu, Palette, ScrollText, Settings, Shield, Sparkles, UserRound, Users, X } from 'lucide-react';
import { api, json } from './api';
import { useAuth } from './auth';

export function PublicLayout(){
  const [open,setOpen]=useState(false); const {user}=useAuth();
  const links=[['/chronicle','公会编年史'],['/departments','职业大厅'],['/activities','活动档案'],['/works','作品图鉴'],['/join','加入公会']] as const;
  return <div className="app-shell"><header className="public-nav"><Link className="brand" to="/"><span>佐佑</span><strong>ADVENTURER GUILD</strong></Link><nav className={open?'open':''} aria-label="主导航">{links.map(([to,label])=><NavLink onClick={()=>setOpen(false)} key={to} to={to}>{label}</NavLink>)}<NavLink className="nav-access" to={user?(user.role==='MEMBER'?'/portal':'/admin'):'/login'}>{user?'进入公会':'成员登录'}</NavLink></nav><button className="mobile-menu" aria-label={open?'关闭菜单':'打开菜单'} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></header><Outlet/><footer><div><span className="footer-mark">Z · G</span><strong>佐佑动漫社 Adventurer Guild</strong><p>以动漫文化连接兴趣，以真实协作留下作品。</p></div><div><Link to="/chronicle">编年史</Link><Link to="/departments">部门</Link><Link to="/activities">活动</Link><Link to="/join">招新</Link></div><small>© 2026 ZOUYOU ANIME GUILD · RPG 视觉包装 / 社团管理系统</small></footer></div>;
}

const portalLinks=[
  ['/portal',LayoutDashboard,'个人总览'],['/portal/profile',UserRound,'个人档案'],['/portal/activities',Activity,'活动报名'],['/portal/works',Palette,'我的作品'],['/portal/tasks',ClipboardCheck,'部门任务'],['/portal/files',FileArchive,'内部文件'],
] as const;
const adminLinks=[
  ['/admin',LayoutDashboard,'数据总览'],['/admin/members',Users,'成员管理'],['/admin/departments',Shield,'部门管理'],['/admin/activities',Activity,'活动管理'],['/admin/recruitment',ScrollText,'招新管理'],['/admin/works',Sparkles,'作品审核'],['/admin/files',FileArchive,'文件管理'],['/admin/tasks',ClipboardCheck,'任务管理'],['/admin/history',History,'历史管理'],['/admin/analytics',BarChart3,'数据统计'],['/admin/settings',Settings,'系统设置'],['/admin/audit',BookOpen,'审计日志'],
] as const;

export function ConsoleLayout({admin=false}:{admin?:boolean}){
  const [collapsed,setCollapsed]=useState(false); const {user}=useAuth(); const client=useQueryClient(); const navigate=useNavigate(); const logout=useMutation({mutationFn:()=>api('/api/auth/logout',json('POST')),onSuccess:async()=>{client.clear();navigate('/');}}); const links=admin?(user?.role==='ADMIN'?adminLinks:adminLinks.filter(([to])=>['/admin/members','/admin/activities','/admin/works','/admin/files','/admin/tasks'].includes(to))):portalLinks;
  return <div className={`console ${collapsed?'collapsed':''}`}><aside><div className="console-brand"><Castle/><div><span>佐佑动漫社</span><strong>{admin?'公会管理台':'成员驻地'}</strong></div></div><button className="collapse-button" onClick={()=>setCollapsed(!collapsed)} aria-label="折叠侧栏"><ChevronLeft/></button><nav aria-label={admin?'后台管理':'成员中心'}>{links.map(([to,Icon,label])=><NavLink end={to==='/admin'||to==='/portal'} key={to} to={to}><Icon/><span>{label}</span></NavLink>)}</nav><div className="console-user"><div>{user?.displayName.slice(0,1)}</div><span><strong>{user?.displayName}</strong><small>{user?.role}</small></span><button onClick={()=>logout.mutate()} title="退出登录"><LogOut/></button></div></aside><section className="console-main"><header><div><span className="signal-dot"/>系统在线</div><Link to="/"><Castle/>游客首页</Link>{admin&&<Link to="/portal"><BriefcaseBusiness/>成员中心</Link>}</header><Outlet/></section></div>;
}

export function RootProviders({children}:{children:ReactNode}){return children}
