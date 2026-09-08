import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { api, json, type User } from './api';
import { AUTH_QUERY_KEY, clearAuthenticatedCache } from './auth';

export function LoginPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [mode, setMode] = useState<'login' | 'register'>(search.get('mode') === 'register' ? 'register' : 'login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registrationForm, setRegistrationForm] = useState({ username: '', password: '', contact: '', note: '' });
  const login = useMutation({
    mutationFn: () => api<{ user: User }>('/api/auth/login', json('POST', loginForm)),
    onSuccess: data => {
      clearAuthenticatedCache(client);
      client.setQueryData(AUTH_QUERY_KEY, data.user);
      const requested = search.get('from');
      navigate(requested ?? (data.user.role === 'MEMBER' ? '/portal' : '/admin'), { replace: true });
    },
  });
  const registration = useMutation({ mutationFn: () => api<{ id: string; status: 'PENDING' }>('/api/public/registration-requests', json('POST', registrationForm)) });
  const switchMode = (next: 'login' | 'register') => { setMode(next); login.reset(); registration.reset(); };

  return <main className="auth-page"><section className="auth-card auth-choice-card">
    <div className="auth-sigil">{mode === 'login' ? <ShieldCheck /> : <UserPlus />}</div>
    <span className="eyebrow">GUILD ACCESS</span>
    <div className="auth-tabs" role="tablist" aria-label="账号入口">
      <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>登录</button>
      <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')}>注册</button>
    </div>
    <h1>{mode === 'login' ? '成员身份验证' : '申请用户账号'}</h1>
    <p>{mode === 'login' ? '登录后可进入成员中心或公会管理台。' : '提交后由社长或副社长核验；审核通过即可使用所填账号登录。'}</p>
    {mode === 'login' ? <form onSubmit={(event: FormEvent) => { event.preventDefault(); login.mutate(); }}>
      <label>用户名<input autoComplete="username" required value={loginForm.username} onChange={event => setLoginForm({ ...loginForm, username: event.target.value })} /></label>
      <label>密码<input autoComplete="current-password" type="password" required minLength={8} value={loginForm.password} onChange={event => setLoginForm({ ...loginForm, password: event.target.value })} /></label>
      {login.error && <p className="form-error">{login.error.message}</p>}
      <button className="guild-button primary" disabled={login.isPending}><LogIn />{login.isPending ? '验证中…' : '登录公会'}</button>
    </form> : registration.isSuccess ? <div className="registration-success" role="status">
      <CheckCircle2 /><h2>注册请求已提交</h2><p>请等待社长层审核。通过后可直接使用刚才填写的用户名和密码登录。</p>
      <button className="guild-button primary" onClick={() => switchMode('login')}>返回登录</button>
    </div> : <form onSubmit={(event: FormEvent) => { event.preventDefault(); registration.mutate(); }}>
      <label>注册用户名（支持中文）<input autoComplete="username" required minLength={2} maxLength={40} title="2-40 位中文、字母、数字、点、下划线或连字符" value={registrationForm.username} onChange={event => setRegistrationForm({ ...registrationForm, username: event.target.value })} /></label>
      <label>密码<input autoComplete="new-password" type="password" required minLength={10} maxLength={200} value={registrationForm.password} onChange={event => setRegistrationForm({ ...registrationForm, password: event.target.value })} /></label>
      <label>联系方式<input autoComplete="email" required minLength={3} maxLength={160} placeholder="邮箱、手机号或其他可核验方式" value={registrationForm.contact} onChange={event => setRegistrationForm({ ...registrationForm, contact: event.target.value })} /></label>
      <label>备注<textarea rows={4} maxLength={1000} placeholder="可填写身份说明或希望管理员了解的信息" value={registrationForm.note} onChange={event => setRegistrationForm({ ...registrationForm, note: event.target.value })} /></label>
      <p className="auth-privacy-note">用户名支持中文；密码仅保存安全哈希，审核人员无法查看。</p>
      {registration.error && <p className="form-error">{registration.error.message}</p>}
      <button className="guild-button primary" disabled={registration.isPending}><UserPlus />{registration.isPending ? '提交中…' : '提交注册请求'}</button>
    </form>}
    <Link to="/">返回游客首页</Link>
  </section></main>;
}

export function ActivatePage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ token: search.get('token') ?? '', username: '', password: '' });
  const mutation = useMutation({ mutationFn: () => api('/api/auth/activate', json('POST', form)), onSuccess: () => navigate('/login') });
  return <main className="auth-page"><section className="auth-card"><div className="auth-sigil"><KeyRound /></div><span className="eyebrow">ACTIVATE MEMBERSHIP</span><h1>激活成员身份</h1><p>一次性激活码有效期为七天，使用后立即失效。</p><form onSubmit={event => { event.preventDefault(); mutation.mutate(); }}><label>激活码<input required minLength={20} value={form.token} onChange={event => setForm({ ...form, token: event.target.value })} /></label><label>新用户名<input required minLength={2} maxLength={40} value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label><label>新密码<input type="password" required minLength={10} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>{mutation.error && <p className="form-error">{mutation.error.message}</p>}<button className="guild-button primary" disabled={mutation.isPending}>建立成员档案</button></form></section></main>;
}
