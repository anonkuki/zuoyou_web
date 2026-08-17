import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Send, Trash2, Users } from 'lucide-react';
import { worldAreas, type WorldDirection } from '@guild/contracts';
import { api, json } from './api';
import { useAuth } from './auth';
import { EmptyPanel, ErrorPanel, LoadingPanel, PageHero } from './components';
import { PixelFrame, PixelSprite } from './components/departments/pixel';
import { applyMovement, normalizeKey, worldBounds, worldObstacles, type WorldPoint } from './world-movement';

interface WorldAreaInfo { id: string; name: string; color: string; departmentSlug: string | null; online: number }
interface WorldMember { userId: string; displayName: string; avatarColor: string; sprite: string; x: number; y: number; dir: WorldDirection; self: boolean }
interface AreaMessage { id: string; areaId: string; content: string; createdAt: string; sender: { id: string; displayName: string; avatarColor: string } }
interface WorldState { area: { id: string; name: string; color: string }; members: WorldMember[]; messages: AreaMessage[]; serverTime: string }

interface OtherSprite { cur: WorldPoint; target: WorldPoint; dir: WorldDirection; displayName: string; avatarColor: string; sprite: string }

const spriteSrc = (sprite: string) => `/assets/character/adventurers/${sprite}.png`;
const toPercent = (point: WorldPoint) => ({ left: `${(point.x / worldBounds.w) * 100}%`, top: `${(point.y / worldBounds.h) * 100}%` });

export function WorldLobbyPage() {
  const query = useQuery({ queryKey: ['world', 'areas'], queryFn: () => api<{ items: WorldAreaInfo[] }>('/api/member/world/areas'), refetchInterval: 5000 });
  return <main className="social-page world-lobby">
    <PageHero eyebrow="PIXEL PLAZA" title="像素广场" description="选择一块区域，操纵你的像素小人四处走动，和在场的伙伴实时打招呼。" />
    <section className="shell">
      {query.isLoading ? <LoadingPanel label="正在铺开像素地图" /> : query.error ? <ErrorPanel error={query.error} /> : <div className="world-area-grid">
        {query.data?.items.map((area) => <Link key={area.id} className="world-area-link" to={`/portal/world/${area.id}`} aria-label={`进入${area.name}`}>
          <PixelFrame className="world-area-card" color={area.color}>
            <div className="world-area-scene" style={{ '--area-color': area.color } as React.CSSProperties}>
              <img src="/assets/background/golden-valley/forest-mid-a.png" alt="" aria-hidden="true" loading="lazy" />
              <PixelSprite slug={area.departmentSlug ?? 'cos'} />
            </div>
            <div className="world-area-meta">
              <h2>{area.name}</h2>
              <span className={area.online ? 'online' : ''}><Users />{area.online ? `${area.online} 人在线` : '暂时无人'}</span>
            </div>
          </PixelFrame>
        </Link>)}
      </div>}
    </section>
  </main>;
}

export function WorldAreaPage() {
  const { areaId = '' } = useParams();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const area = worldAreas.find((entry) => entry.id === areaId);

  const [members, setMembers] = useState<WorldMember[]>([]);
  const [messages, setMessages] = useState<AreaMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const myPos = useRef<WorldPoint & { dir: WorldDirection }>({ x: 480, y: 430, dir: 'down' });
  const keys = useRef(new Set<string>());
  const others = useRef(new Map<string, OtherSprite>());
  const lastMessageId = useRef<string | null>(null);
  const lastReportAt = useRef(0);
  const wasMoving = useRef(false);
  const mySprite = useRef(['guild-steward', 'silver-ranger', 'green-mage', 'rose-adventurer'][Math.abs([...(user?.id ?? 'guest')].reduce((hash, char) => hash * 31 + char.charCodeAt(0) | 0, 0)) % 4]);

  // 上报当前位置（leaving 时清除）
  const report = (leaving = false, keepalive = false) => {
    const { x, y, dir } = myPos.current;
    const body = JSON.stringify({ areaId, x: Math.round(x), y: Math.round(y), dir, leaving });
    if (keepalive && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/member/world/move', new Blob([body], { type: 'application/json' }));
      return;
    }
    api('/api/member/world/move', json('POST', { areaId, x: Math.round(x), y: Math.round(y), dir, leaving })).catch(() => undefined);
  };

  // 键盘与虚拟方向键共用的按键集合
  useEffect(() => {
    if (!area) return;
    const isTyping = () => {
      const active = document.activeElement;
      return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    };
    const down = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key);
      if (!key || isTyping()) return;
      event.preventDefault();
      keys.current.add(key);
    };
    const up = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key);
      if (key) keys.current.delete(key);
    };
    const hide = () => report(true, true);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('pagehide', hide);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('pagehide', hide);
      report(true, true);
    };
  }, [areaId]);

  // 主循环：移动自己 + 平滑过渡他人
  useEffect(() => {
    if (!area) return;
    let frame = 0;
    let previous = performance.now();
    const step = (time: number) => {
      const dt = Math.min(0.05, (time - previous) / 1000);
      previous = time;
      const next = applyMovement(myPos.current, keys.current, dt);
      let dirty = false;
      if (next.moving) {
        if (next.x !== myPos.current.x || next.y !== myPos.current.y) dirty = true;
        myPos.current = { x: next.x, y: next.y, dir: next.dir };
        if (time - lastReportAt.current > 350) {
          lastReportAt.current = time;
          report();
        }
        wasMoving.current = true;
      } else if (wasMoving.current) {
        wasMoving.current = false;
        report();
      }
      for (const sprite of others.current.values()) {
        const gap = Math.hypot(sprite.target.x - sprite.cur.x, sprite.target.y - sprite.cur.y);
        if (gap < 0.5) continue;
        if (reduce) {
          sprite.cur = { ...sprite.target };
        } else {
          const ease = Math.min(1, dt * 9);
          sprite.cur = { x: sprite.cur.x + (sprite.target.x - sprite.cur.x) * ease, y: sprite.cur.y + (sprite.target.y - sprite.cur.y) * ease };
        }
        dirty = true;
      }
      if (dirty) setTick((value) => value + 1);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [areaId, reduce]);

  // 两秒轮询区域状态 + 增量聊天
  useEffect(() => {
    if (!area) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const query = lastMessageId.current ? `?after=${encodeURIComponent(lastMessageId.current)}` : '';
        const data = await api<WorldState>(`/api/member/world/areas/${areaId}/state${query}`);
        if (cancelled) return;
        const seen = new Set(others.current.keys());
        for (const member of data.members) {
          if (member.self) { seen.delete(member.userId); continue; }
          seen.delete(member.userId);
          const existing = others.current.get(member.userId);
          if (existing) {
            existing.target = { x: member.x, y: member.y };
            existing.dir = member.dir;
          } else {
            others.current.set(member.userId, { cur: { x: member.x, y: member.y }, target: { x: member.x, y: member.y }, dir: member.dir, displayName: member.displayName, avatarColor: member.avatarColor, sprite: member.sprite });
          }
        }
        for (const stale of seen) others.current.delete(stale);
        setMembers(data.members);
        if (data.messages.length) {
          setMessages((current) => {
            const known = new Set(current.map((message) => message.id));
            const merged = [...current, ...data.messages.filter((message) => !known.has(message.id))];
            return merged.slice(-80);
          });
          lastMessageId.current = data.messages[data.messages.length - 1].id;
        }
        setError(null);
        setTick((value) => value + 1);
      } catch (pullError) {
        if (!cancelled) setError(pullError as Error);
      }
    };
    pull();
    const timer = window.setInterval(pull, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [areaId]);

  if (!area) return <main className="social-page"><section className="shell"><EmptyPanel label="区域不存在" /><Link to="/portal/world">返回像素广场</Link></section></main>;

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;
    try {
      const data = await api<{ message: AreaMessage }>(`/api/member/world/areas/${areaId}/messages`, json('POST', { content }));
      setInput('');
      setMessages((current) => [...current.filter((message) => message.id !== data.message.id), data.message].slice(-80));
      lastMessageId.current = data.message.id;
    } catch (sendError) {
      setError(sendError as Error);
    }
  };
  const removeMessage = (id: string) => {
    api(`/api/member/world/messages/${id}`, json('DELETE')).then(() => setMessages((current) => current.filter((message) => message.id !== id))).catch(() => undefined);
  };

  const now = Date.now();
  const bubbleFor = (userId: string) => {
    const latest = [...messages].reverse().find((message) => message.sender.id === userId);
    return latest && now - Date.parse(latest.createdAt) < 5000 ? latest.content : null;
  };
  const myBubble = user ? bubbleFor(user.id) : null;
  const pressKey = (key: string, pressed: boolean) => {
    if (pressed) keys.current.add(key);
    else keys.current.delete(key);
  };

  return <main className="social-page world-area-page" style={{ '--area-color': area.color } as React.CSSProperties} data-tick={tick}>
    <header className="world-area-titlebar">
      <Link to="/portal/world" aria-label="返回像素广场"><ArrowLeft />广场</Link>
      <div><span>PIXEL AREA</span><h1>{area.name}</h1></div>
      <span className="world-online"><Users />{members.length} 人在场</span>
    </header>
    <section className="world-stage-shell">
      <div className="world-stage" role="application" aria-label={`${area.name}像素场景，使用 WASD 或方向键移动`}>
        <div className="world-backdrop" aria-hidden="true">
          <img className="layer mountains" src="/assets/background/golden-valley/sunlit-mountains.png" alt="" />
          <img className="layer forest-far" src="/assets/background/golden-valley/forest-far.png" alt="" />
          <img className="layer forest-mid" src="/assets/background/golden-valley/forest-mid-a.png" alt="" />
          <img className="layer lodge" src="/assets/architecture/guild/guild-lodge-cutout.png" alt="" />
          <i className="world-tint" />
        </div>
        {worldObstacles.slice(1).map((tree, index) => <img key={index} className="world-tree" aria-hidden="true" src="/assets/background/golden-valley/tree-left.png" alt="" style={{ left: `${(tree.x / worldBounds.w) * 100}%`, top: `${(tree.y / worldBounds.h) * 100}%`, width: `${(tree.w / worldBounds.w) * 100}%` }} />)}
        {[...others.current.entries()].map(([userId, sprite]) => {
          const bubble = bubbleFor(userId);
          return <div key={userId} className="world-sprite" style={{ ...toPercent(sprite.cur), '--avatar-color': sprite.avatarColor } as React.CSSProperties} data-dir={sprite.dir}>
            {bubble && <span className="world-bubble">{bubble}</span>}
            <img src={spriteSrc(sprite.sprite)} alt="" draggable={false} />
            <b>{sprite.displayName}</b>
          </div>;
        })}
        <div className="world-sprite self" style={{ ...toPercent(myPos.current), '--avatar-color': user?.avatarColor ?? '#5279a8' } as React.CSSProperties} data-dir={myPos.current.dir}>
          {myBubble && <span className="world-bubble">{myBubble}</span>}
          <img src={spriteSrc(mySprite.current)} alt="" draggable={false} />
          <b>{user?.displayName ?? '我'}</b>
        </div>
      </div>
      <nav className="world-dpad" aria-label="虚拟方向键">
        <button aria-label="向上移动" onPointerDown={() => pressKey('up', true)} onPointerUp={() => pressKey('up', false)} onPointerLeave={() => pressKey('up', false)}>▲</button>
        <div>
          <button aria-label="向左移动" onPointerDown={() => pressKey('left', true)} onPointerUp={() => pressKey('left', false)} onPointerLeave={() => pressKey('left', false)}>◀</button>
          <button aria-label="向下移动" onPointerDown={() => pressKey('down', true)} onPointerUp={() => pressKey('down', false)} onPointerLeave={() => pressKey('down', false)}>▼</button>
          <button aria-label="向右移动" onPointerDown={() => pressKey('right', true)} onPointerUp={() => pressKey('right', false)} onPointerLeave={() => pressKey('right', false)}>▶</button>
        </div>
      </nav>
    </section>
    <section className="world-chat">
      <h2><MessageCircle />{area.name} · 公共频道</h2>
      <div className="world-chat-log">
        {messages.length ? messages.slice(-30).map((message) => <p key={message.id}>
          <b style={{ color: message.sender.avatarColor }}>{message.sender.displayName}</b>
          <span>{message.content}</span>
          {(user?.role === 'ADMIN' || user?.id === message.sender.id) && <button aria-label={`删除 ${message.sender.displayName} 的区域消息`} onClick={() => removeMessage(message.id)}><Trash2 /></button>}
        </p>) : <p className="world-chat-empty">还没有人说话，打声招呼吧。</p>}
      </div>
      <form onSubmit={send}>
        <label><span className="sr-only">发送到区域频道</span><input maxLength={200} value={input} onChange={(event) => setInput(event.target.value)} placeholder="向本区域的伙伴喊话（200 字以内）…" /></label>
        <button className="guild-button primary" disabled={!input.trim()}><Send />发送</button>
      </form>
      {error && <p className="form-error">{error.message}</p>}
    </section>
  </main>;
}
