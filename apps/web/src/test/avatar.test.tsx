import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avatarEyes, avatarKlasses, avatarStyles, defaultAvatarConfig, type AvatarConfig } from '@guild/contracts';
import { App } from '../app';
import { PixelAvatar } from '../components/avatar/PixelAvatar';
import { buildAvatarRuns } from '../components/avatar/avatar-parts';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { user: null } }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderAt(path = '/') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
    </QueryClientProvider>,
  );
}

const rectFills = (container: HTMLElement) => [...container.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill'));

describe('PixelAvatar builder', () => {
  it('renders different runs for different configs', () => {
    const a = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairColor: 'red' }} />);
    const fillsA = rectFills(a.container);
    a.unmount();
    const b = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairColor: 'blue' }} />);
    const fillsB = rectFills(b.container);
    expect(fillsA.length).toBeGreaterThan(10);
    expect(fillsA).not.toEqual(fillsB);
  });

  it('draws different geometry for bald and afro hairstyles', () => {
    const bald = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairStyle: 'bald' }} />);
    const baldCount = bald.container.querySelectorAll('rect').length;
    bald.unmount();
    const afro = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairStyle: 'afro' }} />);
    expect(afro.container.querySelectorAll('rect').length).toBeGreaterThan(baldCount);
  });

  it('derives a stable avatar from a seed when no config is given', () => {
    const a = render(<PixelAvatar seed="user-abc" />);
    const fillsA = rectFills(a.container);
    a.unmount();
    const b = render(<PixelAvatar seed="user-abc" />);
    expect(rectFills(b.container)).toEqual(fillsA);
  });

  it('exposes dir and moving state for CSS flipping and walk cycles', () => {
    const { container } = render(<PixelAvatar config={defaultAvatarConfig} dir="left" moving />);
    const svg = container.querySelector('svg.pixel-avatar');
    expect(svg).toHaveAttribute('data-dir', 'left');
    expect(svg).toHaveAttribute('data-moving', 'true');
  });

  it('renders three art styles with distinct geometry', () => {
    const fillsFor = (style: AvatarConfig['style']) => {
      const view = render(<PixelAvatar config={{ ...defaultAvatarConfig, style }} />);
      const fills = rectFills(view.container);
      view.unmount();
      return fills;
    };
    const chibi = fillsFor('chibi');
    const mame = fillsFor('mame');
    const sharp = fillsFor('sharp');
    expect(chibi).not.toEqual(mame);
    expect(chibi).not.toEqual(sharp);
    expect(mame).not.toEqual(sharp);
  });

  it('gives every open eye type a white highlight pixel in all styles', () => {
    for (const style of avatarStyles) {
      for (const eyes of avatarEyes) {
        if (eyes === 'closed') continue;
        const view = render(<PixelAvatar config={{ ...defaultAvatarConfig, style, eyes }} />);
        expect(rectFills(view.container), `${style}/${eyes}`).toContain('#ffffff');
        view.unmount();
      }
    }
  });

  it('keeps the walking frame animation inside the 24x28 grid', () => {
    for (const style of avatarStyles) {
      const view = render(<PixelAvatar config={{ ...defaultAvatarConfig, style, hairStyle: 'long' }} moving />);
      const rects = [...view.container.querySelectorAll('rect')];
      for (const rect of rects) {
        const x = Number(rect.getAttribute('x'));
        const y = Number(rect.getAttribute('y'));
        expect(x, `${style} rect x`).toBeGreaterThanOrEqual(0);
        expect(y, `${style} rect y`).toBeGreaterThanOrEqual(0);
        expect(x + Number(rect.getAttribute('width')), `${style} rect right`).toBeLessThanOrEqual(24);
        expect(y + Number(rect.getAttribute('height')), `${style} rect bottom`).toBeLessThanOrEqual(28);
      }
      view.unmount();
    }
  });

  it('gives every class a distinct silhouette across all styles', () => {
    const fillsFor = (klass: AvatarConfig['klass'], style: AvatarConfig['style']) => {
      const view = render(<PixelAvatar config={{ ...defaultAvatarConfig, klass, style }} />);
      const fills = rectFills(view.container);
      view.unmount();
      return fills;
    };
    for (const style of avatarStyles) {
      const seen = new Set<string>();
      for (const klass of avatarKlasses) {
        const key = JSON.stringify(fillsFor(klass, style));
        expect(seen.has(key), `${style}/${klass} silhouette collides with another class`).toBe(false);
        seen.add(key);
      }
    }
  });

  it('keeps every class inside the 24x28 grid in both walk frames', () => {
    for (const style of avatarStyles) {
      for (const klass of avatarKlasses) {
        for (const frame of [0, 1] as const) {
          const runs = buildAvatarRuns({ ...defaultAvatarConfig, style, klass, hairStyle: 'long' }, frame);
          for (const part of runs) {
            expect(part.x, `${style}/${klass} f${frame} x`).toBeGreaterThanOrEqual(0);
            expect(part.y, `${style}/${klass} f${frame} y`).toBeGreaterThanOrEqual(0);
            expect(part.x + part.w, `${style}/${klass} f${frame} right`).toBeLessThanOrEqual(24);
            expect(part.y + part.h, `${style}/${klass} f${frame} bottom`).toBeLessThanOrEqual(28);
          }
        }
      }
    }
  });
});

describe('Avatar studio page', () => {
  const savedConfig: AvatarConfig = { ...defaultAvatarConfig, hairStyle: 'short', accent: 'rose' };

  it('loads the saved config, edits hair style and persists via PATCH', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const profile = { ...authUser, departmentName: 'COS部', presence: 'ONLINE', avatarConfig: savedConfig };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile' && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true, data: { updated: true, profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile') return new Response(JSON.stringify({ ok: true, data: { profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/avatar');
    expect(await screen.findByRole('heading', { name: '像素形象工房' })).toBeInTheDocument();
    // 已保存的发型应处于选中态
    expect(await screen.findByRole('button', { name: /短发/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /双马尾/ }));
    expect(screen.getByRole('button', { name: /双马尾/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /短发/ })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: /保存像素形象/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile', expect.objectContaining({ method: 'PATCH' })));
    const patchCall = fetchMock.mock.calls.find(([path, init]) => path === '/api/member/profile' && (init as RequestInit)?.method === 'PATCH');
    const body = JSON.parse(String(patchCall?.[1]?.body)) as { avatarConfig: AvatarConfig };
    expect(body.avatarConfig.hairStyle).toBe('twintails');
    expect(body.avatarConfig.accent).toBe('rose');
    expect(await screen.findByText('像素形象已保存')).toBeInTheDocument();
  });
});

describe('World area theming', () => {
  it('decorates every lobby card with its area theme class and props', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const areas = [
      { id: 'hall', name: '公会大厅广场', color: '#c99a45', departmentSlug: null, online: 3 },
      { id: 'publicity', name: '外宣&幻想研据点', color: '#e0342f', departmentSlug: 'publicity', online: 0 },
      { id: 'tech', name: '技术部工房', color: '#ff9f43', departmentSlug: 'tech', online: 1 },
      { id: 'original', name: '原创部画室', color: '#f7a8b8', departmentSlug: 'original', online: 0 },
      { id: 'dance', name: '舞装部舞台', color: '#ff4d8d', departmentSlug: 'dance', online: 0 },
      { id: 'cos', name: 'COS部幻装间', color: '#d6336c', departmentSlug: 'cos', online: 2 },
      { id: 'music', name: '轻音部琴房', color: '#f5c96b', departmentSlug: 'music', online: 0 },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/world/areas') return new Response(JSON.stringify({ ok: true, data: { items: areas } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = renderAt('/portal/world');
    expect(await screen.findByRole('heading', { name: '像素广场' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '公会大厅广场' })).toBeInTheDocument();
    for (const id of ['hall', 'publicity', 'tech', 'original', 'dance', 'cos', 'music']) {
      const scene = container.querySelector(`.world-area-scene.theme-${id}`);
      expect(scene, `theme-${id} card`).not.toBeNull();
      expect(scene?.querySelector('.world-prop'), `theme-${id} props`).not.toBeNull();
    }
  });
});

const memberUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
const memberConfig: AvatarConfig = { style: 'mame', klass: 'mage', skin: 'porcelain', hairStyle: 'twintails', hairColor: 'blue', eyes: 'sparkle', accessory: 'headphones', accent: 'blue' };

function stubSession(user: unknown, extra?: (path: string, init?: RequestInit) => Response | null) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = typeof input === 'string' ? input : input.toString();
    if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const hit = extra?.(path, init);
    if (hit) return hit;
    return new Response(JSON.stringify({ ok: true, data: { items: [], page: 1, pageSize: 20, total: 0, points: 0, events: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('Navbar user entry', () => {
  const navbar = (container: HTMLElement) => container.querySelector('.pixel-navbar') as HTMLElement;

  it('shows a clear login button for guests', async () => {
    stubSession(null);
    const { container } = renderAt('/');
    await screen.findByRole('heading', { name: '佐佑动漫社' }, { timeout: 4000 }).catch(() => undefined);
    await waitFor(() => expect(navbar(container)).not.toBeNull());
    const login = navbar(container).querySelector('.guest-access > .pixel-login-link');
    expect(login).not.toBeNull();
    expect(login).toHaveAttribute('href', '/login');
  });

  it('shows, hides and restores the homepage guest login and registration prompt', async () => {
    stubSession(null);
    renderAt('/');
    const prompt = await screen.findByRole('complementary', { name: '游客账号入口' });
    expect(prompt).toBeInTheDocument();
    const register = screen.getByRole('link', { name: '注册' });
    expect(register).toHaveAttribute('href', '/login?mode=register');
    fireEvent.pointerMove(register, { clientX: window.innerWidth - 80, clientY: 245, pointerType: 'mouse' });
    expect(screen.getByRole('complementary', { name: '游客账号入口' })).toBeInTheDocument();
    fireEvent.pointerMove(window, { clientX: 120, clientY: 360, pointerType: 'mouse' });
    await waitFor(() => expect(screen.queryByRole('complementary', { name: '游客账号入口' })).toBeNull());
    fireEvent.pointerMove(window, { clientX: window.innerWidth - 20, clientY: 40, pointerType: 'mouse' });
    expect(await screen.findByRole('complementary', { name: '游客账号入口' })).toBeInTheDocument();
  });

  it('opens an account menu with avatar studio and logout for signed-in members', async () => {
    stubSession({ ...memberUser, avatarConfig: memberConfig });
    const user = userEvent.setup();
    const { container } = renderAt('/');
    const chip = await within(navbar(container)).findByRole('button', { name: '白羽见习者 的账号菜单' });
    expect(chip).toHaveAttribute('aria-expanded', 'false');
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    const menu = within(navbar(container)).getByRole('menu', { name: '账号菜单' });
    expect(within(menu).getByRole('menuitem', { name: '个人主页' })).toHaveAttribute('href', '/portal/members/user-member');
    expect(within(menu).getByRole('menuitem', { name: '形象工房 · 捏脸' })).toHaveAttribute('href', '/portal/avatar');
    expect(within(menu).getByRole('menuitem', { name: '成员中心' })).toHaveAttribute('href', '/portal');
    expect(within(menu).getByRole('menuitem', { name: '退出登录' })).toBeEnabled();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(within(navbar(container)).queryByRole('menu')).toBeNull());
  });

  it('opens unread conversations from the homepage navbar and sends a quick reply', async () => {
    const conversations = [
      { id: 'conversation-direct', type: 'DIRECT', title: '绯月幻装师', counterpart: { id: 'user-lead', displayName: '绯月幻装师', avatarColor: '#c75f88', presence: 'ONLINE' }, lastMessage: '道具清单已经更新', lastMessageAt: '2026-09-08T08:00:00.000Z', unreadCount: 2 },
      { id: 'conversation-department', type: 'DEPARTMENT', title: 'COS部协作频道', counterpart: null, lastMessage: '今晚确认排练时间', lastMessageAt: '2026-09-08T07:00:00.000Z', unreadCount: 1 },
    ];
    const messages = [{ id: 'message-1', conversationId: 'conversation-direct', senderId: 'user-lead', sender: { displayName: '绯月幻装师', avatarColor: '#c75f88' }, content: '道具清单已经更新', replyTo: null, editedAt: null, deletedAt: null, createdAt: '2026-09-08T08:00:00.000Z' }];
    const fetchMock = stubSession(memberUser, (path, init) => {
      if (path === '/api/member/conversations') return new Response(JSON.stringify({ ok: true, data: { items: conversations } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/conversations/conversation-direct/messages' && init?.method !== 'POST') return new Response(JSON.stringify({ ok: true, data: { items: messages, hasMore: false, nextBefore: null } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/conversations/conversation-direct/messages' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { id: 'message-new' } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/conversations/conversation-direct/read' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { read: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return null;
    });
    const user = userEvent.setup();
    const { container } = renderAt('/');

    const trigger = await within(navbar(container)).findByRole('button', { name: '公会通讯，3 条未读' });
    await user.click(trigger);
    const drawer = await screen.findByRole('dialog', { name: '公会通讯' });
    expect(within(drawer).getAllByText('绯月幻装师')).toHaveLength(2);
    expect(within(drawer).getByText('COS部协作频道')).toBeInTheDocument();
    expect(within(drawer).getByText('道具清单已经更新')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: '查看完整通讯' })).toHaveAttribute('href', '/portal/chat?conversation=conversation-direct');
    await user.type(within(drawer).getByLabelText('快速回复'), '收到，我马上确认。');
    await user.click(within(drawer).getByRole('button', { name: '快速发送' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/conversations/conversation-direct/messages', expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: '收到，我马上确认。' }) })));
  });

  it('returns to guest state immediately after logout', async () => {
    const fetchMock = stubSession({ ...memberUser, avatarConfig: memberConfig }, (path, init) => {
      if (path === '/api/auth/logout' && init?.method === 'POST') {
        return new Response(JSON.stringify({ ok: true, data: { loggedOut: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return null;
    });
    const user = userEvent.setup();
    const { container } = renderAt('/');
    await user.click(await within(navbar(container)).findByRole('button', { name: '白羽见习者 的账号菜单' }));
    await user.click(within(navbar(container)).getByRole('menuitem', { name: '退出登录' }));
    await waitFor(() => expect(navbar(container).querySelector('.pixel-login-link')).not.toBeNull());
    expect(within(navbar(container)).queryByRole('button', { name: '白羽见习者 的账号菜单' })).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
  });

  it('lets admins reach the console from the account menu', async () => {
    stubSession({ ...memberUser, id: 'user-admin', displayName: '星门总管', role: 'PRESIDENT', avatarConfig: memberConfig });
    const user = userEvent.setup();
    const { container } = renderAt('/');
    await user.click(await within(navbar(container)).findByRole('button', { name: '星门总管 的账号菜单' }));
    const menu = within(navbar(container)).getByRole('menu', { name: '账号菜单' });
    expect(within(menu).getByRole('menuitem', { name: '管理台' })).toHaveAttribute('href', '/admin');
  });
});

describe('Profile and portal identity cards', () => {
  it('shows the pixel avatar card and studio entry in the profile editor', async () => {
    const profile = { ...memberUser, departmentName: 'COS部', presence: 'ONLINE', joinedAt: '2025-09-01T00:00:00.000Z', avatarConfig: memberConfig };
    stubSession(memberUser, (path) => {
      if (path === '/api/member/profile') return new Response(JSON.stringify({ ok: true, data: { profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return null;
    });
    const { container } = renderAt('/portal/profile');
    expect(await screen.findByRole('heading', { name: '编辑资料' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /前往形象工房捏脸/ })).toHaveAttribute('href', '/portal/avatar');
    await waitFor(() => expect(container.querySelector('.profile-avatar-stage .pixel-avatar')).not.toBeNull());
  });

  it('shows the identity card with quick links on portal home', async () => {
    stubSession({ ...memberUser, avatarConfig: memberConfig });
    const { container } = renderAt('/portal');
    expect(await screen.findByRole('heading', { name: /欢迎回来/ })).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('.portal-identity-card .pixel-avatar')).not.toBeNull());
    const card = container.querySelector('.portal-identity-card') as HTMLElement;
    expect(within(card).getByRole('link', { name: /捏脸/ })).toHaveAttribute('href', '/portal/avatar');
    expect(within(card).getByRole('link', { name: /编辑资料/ })).toHaveAttribute('href', '/portal/profile');
    expect(within(card).getByRole('link', { name: /像素广场/ })).toHaveAttribute('href', '/portal/world');
  });
});
