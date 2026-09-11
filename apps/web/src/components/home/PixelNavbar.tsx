import { ChevronDown, ClipboardCheck, LayoutDashboard, LogIn, LogOut, Menu, MessageCircle, Palette, Search, Send, UserPlus, UserRound, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, useLogout } from '../../auth';
import { api, json } from '../../api';
import { PixelAvatar } from '../avatar/PixelAvatar';
import { isExecutiveRole, roleLabels } from '@guild/contracts';
import './quick-chat.css';

const navigation = [
  ['/', '首页'],
  ['/departments', '职业大厅'],
  ['/activities', '冒险档案'],
  ['/works', '作品图鉴'],
  ['/tavern', '冒险者酒馆'],
  ['/join', '加入我们'],
] as const;

interface QuickConversation {
  id: string;
  type: 'DIRECT' | 'DEPARTMENT';
  title: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface QuickMessage {
  id: string;
  sender: { displayName: string };
  content: string;
  deletedAt: string | null;
}

interface ReviewSummary {
  pendingApplications: number;
  pendingRegistrations: number;
}

function RegistrationReviewAlert() {
  const { user } = useAuth();
  const canReview = Boolean(user && isExecutiveRole(user.role));
  const dashboard = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api<ReviewSummary>('/api/admin/dashboard'),
    enabled: canReview,
    refetchInterval: 15_000,
  });

  if (!canReview) return null;
  const pending = (dashboard.data?.pendingRegistrations ?? 0) + (dashboard.data?.pendingApplications ?? 0);
  const label = pending > 0 ? `注册审核，${pending} 项待处理` : '注册审核，暂无待处理';

  return <Link className="registration-review-alert" aria-label={label} title={label} to="/admin/recruitment">
    <ClipboardCheck aria-hidden="true" />
    {pending > 0 && <b aria-hidden="true">{pending > 99 ? '99+' : pending}</b>}
  </Link>;
}

function QuickChat() {
  const { user } = useAuth();
  const client = useQueryClient();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [content, setContent] = useState('');
  const conversations = useQuery({
    queryKey: ['navbar-conversations'],
    queryFn: () => api<{ items: QuickConversation[] }>('/api/member/conversations'),
    enabled: Boolean(user),
    refetchInterval: 5000,
  });
  const recent = (conversations.data?.items ?? []).slice(0, 3);
  const activeId = selected || recent[0]?.id || '';
  const active = recent.find((item) => item.id === activeId) ?? recent[0];
  const unread = (conversations.data?.items ?? []).reduce((total, item) => total + item.unreadCount, 0);
  const messages = useQuery({
    queryKey: ['navbar-messages', activeId],
    queryFn: () => api<{ items: QuickMessage[] }>(`/api/member/conversations/${activeId}/messages`),
    enabled: Boolean(user && open && activeId),
    refetchInterval: open ? 5000 : false,
  });
  const read = useMutation({
    mutationFn: (conversationId: string) => api(`/api/member/conversations/${conversationId}/read`, json('POST')),
    onSuccess: () => client.invalidateQueries({ queryKey: ['navbar-conversations'] }),
  });
  const send = useMutation({
    mutationFn: () => api(`/api/member/conversations/${activeId}/messages`, json('POST', { content })),
    onSuccess: async () => {
      setContent('');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['navbar-messages', activeId] }),
        client.invalidateQueries({ queryKey: ['navbar-conversations'] }),
      ]);
    },
  });

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  useEffect(() => {
    if (open && active?.unreadCount) read.mutate(active.id);
  }, [open, active?.id, active?.unreadCount]);

  if (!user) return null;
  const label = unread ? `公会通讯，${unread} 条未读` : '公会通讯';
  const visibleMessages = (messages.data?.items ?? []).filter((message) => !message.deletedAt).slice(-3);

  return <>
    <button className="quick-chat-toggle" aria-label={label} aria-expanded={open} onClick={() => setOpen(true)}>
      <MessageCircle />{unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}
    </button>
    <Link className="quick-chat-mobile-link" aria-label={label} to={`/portal/chat${activeId ? `?conversation=${activeId}` : ''}`}><MessageCircle />{unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}</Link>
    <AnimatePresence>{open && <div className="quick-chat-layer">
      <button className="quick-chat-backdrop" aria-label="关闭公会通讯" onClick={() => setOpen(false)} />
      <motion.aside className="quick-chat-drawer" role="dialog" aria-modal="true" aria-label="公会通讯"
        initial={reduce ? false : { x: '100%' }} animate={{ x: 0 }} exit={reduce ? undefined : { x: '100%' }} transition={{ duration: .24, ease: [0.22, 1, 0.36, 1] }}>
        <header><div><small>GUILD MESSENGER</small><h2>公会通讯</h2></div><button aria-label="关闭" onClick={() => setOpen(false)}><X /></button></header>
        {!recent.length ? <div className="quick-chat-empty"><MessageCircle /><p>还没有会话，从成员名录发起第一次交流吧。</p><Link to="/portal/members" onClick={() => setOpen(false)}>浏览成员名录</Link></div> : <>
          <nav aria-label="最近会话">{recent.map((item) => <button className={item.id === activeId ? 'active' : ''} key={item.id} onClick={() => setSelected(item.id)}><span><strong>{item.title}</strong><small>{item.type === 'DEPARTMENT' ? '部门频道' : '私聊'}</small></span>{item.unreadCount > 0 && <b>{item.unreadCount}</b>}</button>)}</nav>
          <section className="quick-chat-messages" aria-label="最近消息">{messages.isLoading ? <p>正在读取消息……</p> : visibleMessages.length ? visibleMessages.map((message) => <article key={message.id}><strong>{message.sender.displayName}</strong><p>{message.content}</p></article>) : <p>这里还没有消息。</p>}</section>
          <form onSubmit={(event) => { event.preventDefault(); if (content.trim()) send.mutate(); }}><label><span className="sr-only">快速回复</span><textarea aria-label="快速回复" rows={2} maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="快速回复……" /></label><button aria-label="快速发送" disabled={!content.trim() || send.isPending}><Send /></button></form>
          {send.error && <p className="form-error quick-chat-error">{send.error.message}</p>}
          <Link className="quick-chat-full" aria-label="查看完整通讯" to={`/portal/chat?conversation=${activeId}`} onClick={() => setOpen(false)}>查看完整通讯 <span aria-hidden="true">→</span></Link>
        </>}
      </motion.aside>
    </div>}</AnimatePresence>
  </>;
}

/** 右上角用户芯片：迷你像素小人 + 昵称，展开账号菜单 */
function UserMenu() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [guestPromptVisible, setGuestPromptVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onPointer); };
  }, [open]);

  useEffect(() => {
    if (user || loading || location.pathname !== '/') return;
    setGuestPromptVisible(true);
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) {
        setGuestPromptVisible(true);
        return;
      }
      const nearTopRight = event.clientX >= window.innerWidth - 380 && event.clientY <= 190;
      setGuestPromptVisible(nearTopRight);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [loading, location.pathname, user]);

  if (loading) return null;
  if (!user) {
    const showPrompt = location.pathname === '/' && guestPromptVisible;
    return <div className="guest-access" ref={rootRef} onMouseEnter={()=>location.pathname==='/'&&setGuestPromptVisible(true)}>
      <Link className="pixel-login-link" to="/login" onFocus={()=>setGuestPromptVisible(true)}><UserRound />登录</Link>
      <AnimatePresence>{showPrompt&&<motion.aside className="guest-access-prompt" aria-label="游客账号入口" initial={reduce?false:{opacity:0,y:-8,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={reduce?undefined:{opacity:0,y:-8,scale:.97}} transition={{duration:.18}}>
        <button className="guest-prompt-close" aria-label="隐藏账号入口" onClick={()=>setGuestPromptVisible(false)}><X/></button>
        <small>WELCOME, VISITOR</small><strong>登录或注册账号</strong><p>已有账号可直接登录；首次来访可提交注册请求，审核通过后即可进入成员中心。</p>
        <div><Link to="/login"><LogIn/>登录</Link><Link to="/login?mode=register"><UserPlus/>注册</Link></div>
      </motion.aside>}</AnimatePresence>
    </div>;
  }
  const home = user.role === 'MEMBER' ? '/portal' : '/admin';
  const close = () => setOpen(false);
  return <div className="pixel-user-menu" ref={rootRef}>
    <button
      className="pixel-user-chip"
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={`${user.displayName} 的账号菜单`}
      onClick={() => setOpen(!open)}
    >
      {user.avatarUrl ? <img className="uploaded-account-avatar" src={user.avatarUrl} alt="" /> : <PixelAvatar config={user.avatarConfig} seed={user.id} size={26} label="" />}
      <span>{user.displayName}</span>
      <ChevronDown />
    </button>
    <AnimatePresence>
      {open && <motion.div
        className="pixel-user-dropdown"
        role="menu"
        aria-label="账号菜单"
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -6 }}
        transition={{ duration: 0.16 }}
      >
        <div className="pixel-user-dropdown-head">
          {user.avatarUrl ? <img className="uploaded-account-avatar large" src={user.avatarUrl} alt={`${user.displayName} 的头像`} /> : <PixelAvatar config={user.avatarConfig} seed={user.id} size={40} label={`${user.displayName} 的像素小人`} />}
          <div><strong>{user.displayName}</strong><small>{roleLabels[user.role]}</small></div>
        </div>
        <Link role="menuitem" to={`/portal/members/${user.id}`} onClick={close}><UserRound />个人主页</Link>
        <Link role="menuitem" to="/portal/avatar" onClick={close}><Palette />形象工房 · 捏脸</Link>
        <Link role="menuitem" to={home} onClick={close}><LayoutDashboard />{user.role === 'MEMBER' ? '成员中心' : '管理台'}</Link>
        {user.role !== 'MEMBER' && <Link role="menuitem" to="/portal" onClick={close}><Users />成员中心</Link>}
        <button role="menuitem" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut />{logout.isPending ? '正在退出…' : '退出登录'}</button>
        {logout.error && <p className="form-error" role="alert">退出失败，请检查网络后重试。</p>}
      </motion.div>}
    </AnimatePresence>
  </div>;
}

export function PixelNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = useMemo(() => navigation.filter(([, label]) => label.includes(query.trim())), [query]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return <>
    <header className="pixel-navbar">
      <Link className="pixel-brand" to="/" aria-label="佐佑动漫社首页">
        <span className="official-brand-mark"><img src="/assets/brand/zuoyou-logo-pixel.png" alt="佐佑动漫社标志" draggable={false}/></span>
        <span><strong>佐佑动漫社</strong><small>Sayuu Anime Guild</small></span>
      </Link>
      <nav className={menuOpen ? 'open' : ''} aria-label="主导航">
        {navigation.map(([to, label]) => <NavLink end={to === '/'} key={to} to={to} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
      </nav>
      <div className="pixel-nav-tools">
        <button aria-label="搜索" onClick={() => setSearchOpen(true)}><Search/></button>
        <RegistrationReviewAlert />
        <QuickChat />
        <UserMenu />
        <button className="pixel-menu-button" aria-label={menuOpen ? '关闭菜单' : '打开菜单'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      </div>
    </header>
    {searchOpen && <div className="guild-search-layer" role="dialog" aria-modal="true" aria-label="站内搜索">
      <button className="search-backdrop" aria-label="关闭搜索" onClick={() => setSearchOpen(false)}/>
      <section className="guild-search-panel">
        <div><Search/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索公会档案……" aria-label="搜索关键词"/><button onClick={() => setSearchOpen(false)} aria-label="关闭"><X/></button></div>
        <small>QUICK SEARCH · 站内索引</small>
        <nav aria-label="搜索结果">{results.map(([to, label]) => <Link key={to} to={to} onClick={() => setSearchOpen(false)}>{label}<span>›</span></Link>)}</nav>
      </section>
    </div>}
  </>;
}
