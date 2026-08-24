import { ChevronDown, LayoutDashboard, LogOut, Menu, Palette, Search, UserRound, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { api, json } from '../../api';
import { useAuth } from '../../auth';
import { PixelAvatar } from '../avatar/PixelAvatar';
import { roleLabels } from '@guild/contracts';

const navigation = [
  ['/', '首页'],
  ['/chronicle', '公会历史'],
  ['/departments', '职业大厅'],
  ['/activities', '冒险档案'],
  ['/works', '作品图鉴'],
  ['/join', '加入我们'],
] as const;

/** 右上角用户芯片：迷你像素小人 + 昵称，展开账号菜单 */
function UserMenu() {
  const { user } = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const logout = useMutation({
    mutationFn: () => api('/api/auth/logout', json('POST')),
    onSuccess: async () => { client.clear(); navigate('/'); },
  });

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

  if (!user) {
    return <Link className="pixel-login-link" to="/login"><UserRound />登录</Link>;
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
      <PixelAvatar config={user.avatarConfig} seed={user.id} size={26} label="" />
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
          <PixelAvatar config={user.avatarConfig} seed={user.id} size={40} label={`${user.displayName} 的像素小人`} />
          <div><strong>{user.displayName}</strong><small>{roleLabels[user.role]}</small></div>
        </div>
        <Link role="menuitem" to={`/portal/members/${user.id}`} onClick={close}><UserRound />个人主页</Link>
        <Link role="menuitem" to="/portal/avatar" onClick={close}><Palette />形象工房 · 捏脸</Link>
        <Link role="menuitem" to={home} onClick={close}><LayoutDashboard />{user.role === 'MEMBER' ? '成员中心' : '管理台'}</Link>
        {user.role !== 'MEMBER' && <Link role="menuitem" to="/portal" onClick={close}><Users />成员中心</Link>}
        <button role="menuitem" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut />退出登录</button>
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
        <span><strong>佐佑动漫社</strong><small>Zouyou Anime Guild</small></span>
      </Link>
      <nav className={menuOpen ? 'open' : ''} aria-label="主导航">
        {navigation.map(([to, label]) => <NavLink end={to === '/'} key={to} to={to} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
      </nav>
      <div className="pixel-nav-tools">
        <button aria-label="搜索" onClick={() => setSearchOpen(true)}><Search/></button>
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
