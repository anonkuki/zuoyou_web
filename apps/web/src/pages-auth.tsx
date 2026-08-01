import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { api, json, type User } from './api';

export function LoginPage(){
  const [form,setForm]=useState({username:'',password:''}); const [search]=useSearchParams(); const navigate=useNavigate(); const client=useQueryClient();
  const mutation=useMutation({mutationFn:()=>api<{user:User}>('/api/auth/login',json('POST',form)),onSuccess:async data=>{await client.invalidateQueries({queryKey:['auth','me']});const requested=search.get('from');navigate(requested??(data.user.role==='MEMBER'?'/portal':'/admin'));}});
  const fill=(role:'admin'|'lead'|'member')=>setForm(role==='admin'?{username:'admin',password:'DemoAdmin!2026'}:role==='lead'?{username:'cos.lead',password:'DemoLead!2026'}:{username:'cos.member',password:'DemoMember!2026'});
  return <main className="auth-page"><section className="auth-card"><div className="auth-sigil"><ShieldCheck/></div><span className="eyebrow">GUILD ACCESS</span><h1>成员身份验证</h1><p>登录后可进入成员中心或公会管理台。</p><form onSubmit={(e:FormEvent)=>{e.preventDefault();mutation.mutate();}}><label>用户名<input autoComplete="username" required value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>密码<input autoComplete="current-password" type="password" required minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{mutation.error&&<p className="form-error">{mutation.error.message}</p>}<button className="guild-button primary" disabled={mutation.isPending}><LogIn/>{mutation.isPending?'验证中…':'登录公会'}</button></form><div className="demo-accounts"><span>开发演示账号</span><button onClick={()=>fill('admin')}>管理员</button><button onClick={()=>fill('lead')}>负责人</button><button onClick={()=>fill('member')}>成员</button></div><Link to="/">返回游客首页</Link></section></main>;
}

export function ActivatePage(){
  const [search]=useSearchParams(); const navigate=useNavigate(); const [form,setForm]=useState({token:search.get('token')??'',username:'',password:''});
  const mutation=useMutation({mutationFn:()=>api('/api/auth/activate',json('POST',form)),onSuccess:()=>navigate('/login')});
  return <main className="auth-page"><section className="auth-card"><div className="auth-sigil"><KeyRound/></div><span className="eyebrow">ACTIVATE MEMBERSHIP</span><h1>激活成员身份</h1><p>一次性激活码有效期为七天，使用后立即失效。</p><form onSubmit={e=>{e.preventDefault();mutation.mutate();}}><label>激活码<input required minLength={20} value={form.token} onChange={e=>setForm({...form,token:e.target.value})}/></label><label>新用户名<input required pattern="[a-zA-Z0-9._-]{3,40}" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>新密码<input type="password" required minLength={10} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{mutation.error&&<p className="form-error">{mutation.error.message}</p>}<button className="guild-button primary" disabled={mutation.isPending}>建立成员档案</button></form></section></main>;
}
