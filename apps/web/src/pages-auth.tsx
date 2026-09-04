import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { api, json, type User } from './api';

const demoAccounts = [
  { role: '社长', username: 'admin', password: 'DemoAdmin!2026' },
  { role: '副社长', username: 'vice.president', password: 'DemoVice!2026' },
  { role: '部长', username: 'cos.lead', password: 'DemoLead!2026' },
  { role: '副部长', username: 'cos.deputy', password: 'DemoDeputy!2026' },
  { role: '成员', username: 'cos.member', password: 'DemoMember!2026' },
] as const;

export function LoginPage(){
  const [search]=useSearchParams(); const navigate=useNavigate(); const client=useQueryClient();
  const [mode,setMode]=useState<'login'|'register'>(search.get('mode')==='register'?'register':'login');
  const [loginForm,setLoginForm]=useState({username:'',password:''});
  const [registrationForm,setRegistrationForm]=useState({username:'',password:'',contact:'',note:''});
  const login=useMutation({mutationFn:()=>api<{user:User}>('/api/auth/login',json('POST',loginForm)),onSuccess:async data=>{await client.invalidateQueries({queryKey:['auth','me']});const requested=search.get('from');navigate(requested??(data.user.role==='MEMBER'?'/portal':'/admin'));}});
  const registration=useMutation({mutationFn:()=>api<{id:string;status:'PENDING'}>('/api/public/registration-requests',json('POST',registrationForm))});
  const fill=(account:(typeof demoAccounts)[number])=>setLoginForm({username:account.username,password:account.password});
  const switchMode=(next:'login'|'register')=>{setMode(next);login.reset();registration.reset();};
  return <main className="auth-page"><section className="auth-card auth-choice-card"><div className="auth-sigil">{mode==='login'?<ShieldCheck/>:<UserPlus/>}</div><span className="eyebrow">GUILD ACCESS</span><div className="auth-tabs" role="tablist" aria-label="账号入口"><button type="button" role="tab" aria-selected={mode==='login'} onClick={()=>switchMode('login')}>登录</button><button type="button" role="tab" aria-selected={mode==='register'} onClick={()=>switchMode('register')}>注册</button></div><h1>{mode==='login'?'成员身份验证':'申请用户账号'}</h1><p>{mode==='login'?'登录后可进入成员中心或公会管理台。':'提交后由社长或副社长核验；审核通过即可使用所填账号登录。'}</p>{mode==='login'?<><form onSubmit={(e:FormEvent)=>{e.preventDefault();login.mutate();}}><label>用户名<input autoComplete="username" required value={loginForm.username} onChange={e=>setLoginForm({...loginForm,username:e.target.value})}/></label><label>密码<input autoComplete="current-password" type="password" required minLength={8} value={loginForm.password} onChange={e=>setLoginForm({...loginForm,password:e.target.value})}/></label>{login.error&&<p className="form-error">{login.error.message}</p>}<button className="guild-button primary" disabled={login.isPending}><LogIn/>{login.isPending?'验证中…':'登录公会'}</button></form><div className="demo-accounts"><span>开发演示账号</span>{demoAccounts.map(account=><button type="button" key={account.role} onClick={()=>fill(account)}>{account.role}</button>)}</div></>:registration.isSuccess?<div className="registration-success" role="status"><CheckCircle2/><h2>注册请求已提交</h2><p>请等待社长层审核。通过后可直接使用刚才填写的用户名和密码登录。</p><button className="guild-button primary" onClick={()=>switchMode('login')}>返回登录</button></div>:<form onSubmit={(e:FormEvent)=>{e.preventDefault();registration.mutate();}}><label>注册用户名<input autoComplete="username" required pattern="[a-zA-Z0-9._-]{3,40}" title="3-40 位字母、数字、点、下划线或连字符" value={registrationForm.username} onChange={e=>setRegistrationForm({...registrationForm,username:e.target.value})}/></label><label>密码<input autoComplete="new-password" type="password" required minLength={10} maxLength={200} value={registrationForm.password} onChange={e=>setRegistrationForm({...registrationForm,password:e.target.value})}/></label><label>联系方式<input autoComplete="email" required minLength={3} maxLength={160} placeholder="邮箱、手机号或其他可核验方式" value={registrationForm.contact} onChange={e=>setRegistrationForm({...registrationForm,contact:e.target.value})}/></label><label>备注<textarea rows={4} maxLength={1000} placeholder="可填写身份说明或希望管理员了解的信息" value={registrationForm.note} onChange={e=>setRegistrationForm({...registrationForm,note:e.target.value})}/></label><p className="auth-privacy-note">密码仅保存安全哈希，审核人员无法查看。</p>{registration.error&&<p className="form-error">{registration.error.message}</p>}<button className="guild-button primary" disabled={registration.isPending}><UserPlus/>{registration.isPending?'提交中…':'提交注册请求'}</button></form>}<Link to="/">返回游客首页</Link></section></main>;
}

export function ActivatePage(){
  const [search]=useSearchParams(); const navigate=useNavigate(); const [form,setForm]=useState({token:search.get('token')??'',username:'',password:''});
  const mutation=useMutation({mutationFn:()=>api('/api/auth/activate',json('POST',form)),onSuccess:()=>navigate('/login')});
  return <main className="auth-page"><section className="auth-card"><div className="auth-sigil"><KeyRound/></div><span className="eyebrow">ACTIVATE MEMBERSHIP</span><h1>激活成员身份</h1><p>一次性激活码有效期为七天，使用后立即失效。</p><form onSubmit={e=>{e.preventDefault();mutation.mutate();}}><label>激活码<input required minLength={20} value={form.token} onChange={e=>setForm({...form,token:e.target.value})}/></label><label>新用户名<input required pattern="[a-zA-Z0-9._-]{3,40}" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>新密码<input type="password" required minLength={10} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{mutation.error&&<p className="form-error">{mutation.error.message}</p>}<button className="guild-button primary" disabled={mutation.isPending}>建立成员档案</button></form></section></main>;
}
