import { Menu, Search, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../auth';

const navigation = [
  ['/', '首页'],
  ['/chronicle', '公会历史'],
  ['/departments', '职业大厅'],
  ['/activities', '冒险档案'],
  ['/works', '作品图鉴'],
  ['/join', '加入我们'],
] as const;

export function PixelNavbar() {
  const { user } = useAuth();
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
        <Link aria-label={user ? '进入成员中心' : '用户入口'} to={user ? (user.role === 'MEMBER' ? '/portal' : '/admin') : '/login'}><UserRound/></Link>
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
