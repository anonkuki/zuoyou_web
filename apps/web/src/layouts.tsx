import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, BriefcaseBusiness, Castle, ChevronLeft, ClipboardCheck, FileArchive, Gamepad2, History, LayoutDashboard, LogOut, Megaphone, MessageCircle, Palette, ScrollText, Settings, Shield, Sparkles, UserRound, Users } from 'lucide-react';
import { isExecutiveRole, roleLabels } from '@guild/contracts';
import { api, json } from './api';
import { useAuth } from './auth';
import { PixelFooter } from './components/home/PixelFooter';
import { PixelNavbar } from './components/home/PixelNavbar';
import { PixelAvatar } from './components/avatar/PixelAvatar';

export function PublicLayout(){
  return <div className="app-shell"><PixelNavbar/><Outlet/><PixelFooter/></div>;
}

const portalLinks=[
  ['/portal',LayoutDashboard,'个人总览'],['/portal/profile',UserRound,'编辑资料'],['/portal/members',Users,'成员名录'],['/portal/world',Gamepad2,'像素广场'],['/portal/tavern',ScrollText,'冒险者酒馆'],['/portal/match',Sparkles,'共鸣图鉴'],['/portal/chat',MessageCircle,'公会通讯'],['/portal/activities',Activity,'活动报名'],['/portal/works',Palette,'我的作品'],['/portal/tasks',ClipboardCheck,'部门任务'],['/portal/files',FileArchive,'内部文件'],
] as const;
const adminLinks=[
  ['/admin',LayoutDashboard,'数据总览'],['/admin/members',Users,'成员管理'],['/admin/departments',Shield,'部门管理'],['/admin/activities',Activity,'活动管理'],['/admin/announcements',Megaphone,'公会公告'],['/admin/recruitment',ScrollText,'招新管理'],['/admin/works',Sparkles,'作品审核'],['/admin/files',FileArchive,'文件管理'],['/admin/tasks',ClipboardCheck,'任务管理'],['/admin/history',History,'历史管理'],['/admin/analytics',BarChart3,'数据统计'],['/admin/settings',Settings,'系统设置'],['/admin/audit',BookOpen,'审计日志'],
] as const;

export function ConsoleLayout({admin=false}:{admin?:boolean}){
  const [collapsed,setCollapsed]=useState(false); const {user}=useAuth(); const client=useQueryClient(); const navigate=useNavigate(); const logout=useMutation({mutationFn:()=>api('/api/auth/logout',json('POST')),onSuccess:async()=>{client.clear();navigate('/');}}); const links=admin?(user&&isExecutiveRole(user.role)?adminLinks:adminLinks.filter(([to])=>['/admin/members','/admin/activities','/admin/works','/admin/files','/admin/tasks'].includes(to))):portalLinks;
  return <div className={`console ${collapsed?'collapsed':''}`} data-workspace={admin?'admin':'member'}>
    <aside data-surface="guild-navigation">
      <span className="console-rail-ornament ornament-top" aria-hidden="true"/><span className="console-rail-ornament ornament-bottom" aria-hidden="true"/>
      <div className="console-brand"><Castle/><div><span>佐佑动漫社</span><strong>{admin?'公会管理台':'成员驻地'}</strong></div></div>
      <button className="collapse-button" onClick={()=>setCollapsed(!collapsed)} aria-label="折叠侧栏"><ChevronLeft/></button>
      <small className="console-nav-caption">{admin?'GUILD OPERATIONS':'MEMBER LODGE'}</small>
      <nav aria-label={admin?'后台管理':'成员中心'}>{links.map(([to,Icon,label],index)=><NavLink end={to==='/admin'||to==='/portal'} key={to} to={to} data-index={String(index+1).padStart(2,'0')}><Icon/><span>{label}</span></NavLink>)}</nav>
      <div className="console-user">{user&&<PixelAvatar config={user.avatarConfig} seed={user.id} size={30} label=""/>}<span><strong>{user?.displayName}</strong><small>{user?roleLabels[user.role]:''}</small></span><button onClick={()=>logout.mutate()} title="退出登录"><LogOut/></button></div>
    </aside>
    <section className="console-main"><header data-surface="console-utility"><div className="console-context"><span className="signal-dot"/><span><small>{admin?'OPERATION STATUS':'LODGE STATUS'}</small>系统在线</span></div><div className="console-utility-links"><Link to="/"><Castle/>游客首页</Link>{admin&&<Link to="/portal"><BriefcaseBusiness/>成员中心</Link>}</div></header><Outlet/></section>
  </div>;
}

export function RootProviders({children}:{children:ReactNode}){return children}
