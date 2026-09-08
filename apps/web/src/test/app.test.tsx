import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app';
import { api, AUTH_SESSION_EXPIRED_EVENT } from '../api';

const payloads: Record<string, unknown> = {
  '/api/public/home': {
    stats: { guildLevel: 12, levelProgress: { current: 2390, target: 3000 }, memberCount: 82, onlineCount: 3, completedActivityCount: 328, honorCount: 56, foundedYear: 1999 },
    announcements: [
      { id: 'notice-1', title: '2026 秋季招新现已开启', summary: '六部门联合招募', category: 'RECRUITMENT', href: '/join', pinned: true, published: true, publishedAt: '2026-08-08T00:00:00.000Z' },
      { id: 'notice-2', title: '月下轻音会活动报名', summary: '轻音部专场', category: 'ACTIVITY', href: '/activities', pinned: false, published: true, publishedAt: '2026-08-06T00:00:00.000Z' },
    ],
  },
  '/api/public/summary': { memberCount: 82, departmentCount: 6, activityCount: 4, workCount: 1 },
  '/api/public/departments': { items: [
    { id: 'dept-cos', slug: 'cos', name: 'COS部', title: '幻术师', description: '角色造型与舞台呈现', memberCount: 15 },
    { id: 'dept-tech', slug: 'tech', name: '技术部', title: '魔导工程师', description: '摄影、直播与技术支持', memberCount: 14 },
    { id: 'dept-original', slug: 'original', name: '原创部', title: '绘卷术士', description: '绘画与原创企划', memberCount: 13 },
  ] },
  '/api/public/chronicles?page=1&pageSize=20': { items: [{ id: 'c1', title: '公会启程', content: '新的篇章', occurred_at: '2023-05-01T00:00:00.000Z' }], page: 1, pageSize: 20, total: 1 },
  '/api/public/activities?page=1&pageSize=20': { items: [{ id: 'a1', title: '校园祭协作任务', description: '六部联合活动', status: 'REGISTRATION', capacity: 80, starts_at: '2026-08-10T10:00:00.000Z' }], page: 1, pageSize: 20, total: 1 },
  '/api/public/announcements?page=1&pageSize=20': { items: [{ id: 'notice-1', title: '2026 秋季招新现已开启', summary: '六部门联合招募', category: 'RECRUITMENT', href: '/join', pinned: true, published: true, publishedAt: '2026-08-08T00:00:00.000Z' }], page: 1, pageSize: 20, total: 1 },
  '/api/public/announcements/notice-1': { announcement: { id: 'notice-1', title: '2026 秋季招新现已开启', summary: '六部门联合招募', category: 'RECRUITMENT', href: '/join', pinned: true, published: true, publishedAt: '2026-08-08T00:00:00.000Z' } },
  '/api/public/works?page=1&pageSize=20': { items: [{ id: 'w1', title: '星辉舞台记录', description: '社团作品', status: 'PUBLISHED', department_id: 'dept-cos' }], page: 1, pageSize: 20, total: 1 },
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const path = typeof input === 'string' ? input : input.toString();
    if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: null } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ ok: true, data: payloads[path] ?? {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
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

describe('Adventurer Guild app', () => {
  it('does not mark bodyless mutations as malformed JSON', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { approved: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await api('/api/admin/applications/example/approve', { method: 'POST' });
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/applications/example/approve', expect.objectContaining({ headers: undefined }));
  });

  it('announces an expired session when a protected request is unauthorized', async () => {
    const onExpired = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } }), { status: 401, headers: { 'Content-Type': 'application/json' } })));
    await expect(api('/api/member/profile')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(onExpired).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  });

  it('switches immediately to the authenticated account after login', async () => {
    const signedInUser = { id: 'user-member', uid: '10005', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: null } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/auth/login') return new Response(JSON.stringify({ ok: true, data: { user: signedInUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/tasks?page=1&pageSize=20') return new Response(JSON.stringify({ ok: true, data: { items: [], page: 1, pageSize: 20, total: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/contributions') return new Response(JSON.stringify({ ok: true, data: { points: 0, events: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: { items: [], page: 1, pageSize: 3, total: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/login');
    await user.type(screen.getByLabelText('用户名'), 'cos.member');
    await user.type(screen.getByLabelText('密码'), 'DemoMember!2026');
    await user.click(screen.getByRole('button', { name: '登录公会' }));
    expect(await screen.findByRole('heading', { name: '欢迎回来，白羽见习者' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
  });

  it('submits a guest account registration from the login page', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    renderAt('/login?mode=register');
    expect(await screen.findByRole('tab', { name: '注册' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('密码')).toHaveAttribute('minlength', '6');
    await user.type(screen.getByLabelText('注册用户名（支持中文）'), '星砂成员');
    await user.type(screen.getByLabelText('密码'), 'NewMember!2026');
    await user.type(screen.getByLabelText('联系方式'), 'new.member@example.test');
    await user.type(screen.getByLabelText('备注'), '希望加入社团线上社区');
    await user.click(screen.getByRole('button', { name: '提交注册请求' }));
    expect(await screen.findByRole('status')).toHaveTextContent('注册请求已提交');
    expect(fetchMock).toHaveBeenCalledWith('/api/public/registration-requests', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: '星砂成员', password: 'NewMember!2026', contact: 'new.member@example.test', note: '希望加入社团线上社区' }),
    }));
  });

  it('keeps development credentials off the public login page', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: '成员身份验证' })).toBeInTheDocument();
    expect(screen.queryByText('开发演示账号')).not.toBeInTheDocument();
    for (const role of ['社长', '副社长', '部长', '副部长', '成员'])
      expect(screen.queryByRole('button', { name: new RegExp(`^${role}$`) })).not.toBeInTheDocument();
  });

  it('renders the high-fidelity guild hall with live summary', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: '创作型社团' })).toBeInTheDocument();
    expect(screen.getByTestId('layered-guild-scene')).toBeInTheDocument();
    expect(await screen.findByText('82')).toBeInTheDocument();
    expect(screen.getByText('画面、舞台、声音、技术与记录在这里交织，')).toBeInTheDocument();
    expect(screen.getByText('2026 秋季招新现已开启')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: '主导航' })).getByRole('link', { name: '首页' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: '主导航' })).queryByRole('link', { name: '公会历史' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
  });

  it('hides the onsite raffle from guests and ordinary members', async () => {
    renderAt('/');
    await screen.findByRole('heading', { name: '创作型社团' });
    expect(screen.queryByRole('button', { name: '现场抽奖' })).not.toBeInTheDocument();
    cleanup();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: { id: 'user-member', uid: '10005', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: payloads[path] ?? {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    renderAt('/');
    await screen.findByRole('heading', { name: '创作型社团' });
    expect(screen.queryByRole('button', { name: '现场抽奖' })).not.toBeInTheDocument();
  });

  it('opens the manager pixel raffle and reveals the server-drawn prize', async () => {
    const manager = { id: 'user-lead', uid: '10002', username: 'cos.lead', displayName: '绯月幻装师', email: 'lead@example.com', role: 'DEPARTMENT_HEAD', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], avatarColor: '#c75f88', profileVisibility: 'MEMBERS' };
    const prizes = [
      { id: 'raffle-third', tier: 3, name: '三等奖', contents: '挂件', initialStock: 250, remainingStock: 250, accent: '#59a875' },
      { id: 'raffle-second', tier: 2, name: '二等奖', contents: '透卡', initialStock: 40, remainingStock: 40, accent: '#6aa7d8' },
      { id: 'raffle-first', tier: 1, name: '一等奖', contents: '挂件 + 透卡 + 卡套', initialStock: 10, remainingStock: 10, accent: '#efb74f' },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: manager } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/admin/raffle' && !init?.method) return new Response(JSON.stringify({ ok: true, data: { prizes, totalInitial: 300, totalRemaining: 300, recentDraws: [], canReset: false } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/admin/raffle/draw' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { prizes, totalInitial: 300, totalRemaining: 300, canReset: false, recentDraws: [], draw: { id: 'draw-test-1', prizeId: 'raffle-first', prizeName: '一等奖', prizeContents: '挂件 + 透卡 + 卡套', operatorId: 'user-lead', operatorDisplayName: '绯月幻装师', drawnAt: '2026-09-08T15:00:00.000Z', testMode: true } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: payloads[path] ?? {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/');
    const launcher = await screen.findByRole('button', { name: '现场抽奖' });
    expect(launcher).toHaveAttribute('data-machine', 'pixel-garapon');
    await user.click(launcher);
    expect(await screen.findByRole('dialog', { name: '福引抽奖所' })).toBeInTheDocument();
    expect(screen.getByText('剩余 300 / 300 抽')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: '测试模式' }));
    await user.click(screen.getByRole('button', { name: '摇动手柄' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/raffle/draw', expect.objectContaining({ method: 'POST', body: JSON.stringify({ testMode: true }) }));
    expect(await screen.findByRole('status', undefined, { timeout: 3_000 })).toHaveTextContent('一等奖');
    expect(screen.getByRole('status')).toHaveTextContent('测试抽奖');
    expect(screen.getByRole('status')).toHaveTextContent('挂件 + 透卡 + 卡套');
    expect(screen.getByText('剩余 300 / 300 抽')).toBeInTheDocument();
  }, 10_000);

  it('composes the hero from independently licensed parallax and architecture layers', async () => {
    renderAt('/');
    const scene = await screen.findByTestId('layered-guild-scene');
    const assetLayers = Array.from(scene.querySelectorAll('[data-open-asset-layer]'));
    expect(assetLayers.length).toBeGreaterThanOrEqual(7);
    expect(assetLayers.map((layer) => layer.getAttribute('data-open-asset-layer'))).toEqual(expect.arrayContaining([
      'clouds',
      'castle-silhouette',
      'far-forest',
      'mid-forest',
      'near-forest',
      'guild-architecture',
      'adventurer-party',
    ]));
    assetLayers.forEach((layer) => expect(layer).toHaveAttribute('data-license'));
    const party = scene.querySelector('[data-open-asset-layer="adventurer-party"]') as HTMLElement;
    expect(within(party).getAllByRole('img', { name: /COS部|外宣&幻想研|原创部|轻音部/ })).toHaveLength(4);
    expect(scene.querySelector('[data-architecture-piece="cohesive-lodge"]')).toBeInTheDocument();
    expect(scene.querySelectorAll('[data-architecture-piece]').length).toBeGreaterThanOrEqual(6);
    expect(scene.querySelector('[data-lighting="golden-hour"]')).toBeInTheDocument();
    expect(scene).toHaveAttribute('data-layout', 'cinematic-wide');
  });

  it('keeps the hero message open to the landscape instead of placing it in a large card', async () => {
    renderAt('/');
    await screen.findByTestId('layered-guild-scene');
    expect(document.querySelector('.guild-hero-copy')).toHaveAttribute('data-surface', 'open-landscape-overlay');
  });

  it('builds every primary portal from layered pixel artwork', async () => {
    renderAt('/');
    await screen.findByTestId('layered-guild-scene');
    const portals = document.querySelectorAll('[data-portal-art]');
    expect(portals).toHaveLength(3);
    portals.forEach((portal) => {
      expect(portal.querySelectorAll('[data-card-art-layer]').length).toBeGreaterThanOrEqual(3);
    });
  });

  it('keeps the hero message fully legible on the first rendered frame', () => {
    renderAt('/');
    expect(document.querySelector('.guild-hero-copy')).not.toHaveStyle({ opacity: '0' });
  });

  it('uses the official club branding and a single primary focal point', async () => {
    renderAt('/');
    await screen.findByTestId('layered-guild-scene');
    expect(screen.getByRole('img', { name: '佐佑动漫社标志' })).toHaveAttribute('src', '/assets/brand/zuoyou-logo-pixel.png');
    expect(screen.getByRole('img', { name: '公会旗帜上的佐佑标志' })).toHaveAttribute('src', '/assets/brand/zuoyou-logo-pixel.png');
    expect(screen.getByRole('img', { name: '佐佑动漫社看板娘佑子' })).toHaveAttribute('src', '/assets/brand/youzi-mascot.png');
    expect(document.querySelectorAll('[data-visual-priority="primary"]')).toHaveLength(1);
  });

  it('uses Sayuu as the English club name throughout the homepage', async () => {
    renderAt('/');
    await screen.findByTestId('layered-guild-scene');
    expect(document.querySelector('.pixel-brand small')).toHaveTextContent('Sayuu Anime Guild');
    expect(document.querySelector('.hero-season')).toHaveTextContent('SAYUU ANIMATION CLUB · SINCE 1999');
    expect(document.querySelector('.guild-hero-copy > b')).toHaveTextContent('SAYUU ANIME GUILD');
    expect(document.querySelector('.entry-zone-heading > small')).toHaveTextContent('WELCOME TO SAYUU');
    expect(document.body).not.toHaveTextContent(/zouyou/i);
  });

  it('adds a dedicated atmospheric depth pass over the independent art layers', async () => {
    renderAt('/');
    const scene = await screen.findByTestId('layered-guild-scene');
    const atmosphere = scene.querySelector('[data-atmosphere="cinematic-depth"]');
    expect(atmosphere).toBeInTheDocument();
    expect(atmosphere?.querySelectorAll('[data-atmosphere-particle]')).toHaveLength(10);
    expect(scene.querySelectorAll('img').length).toBeGreaterThanOrEqual(11);
  });

  it('keeps the cinematic atmosphere progressive and the chapter framing semantic', async () => {
    renderAt('/');
    const atmosphere = await screen.findByTestId('guild-atmosphere-canvas');
    expect(atmosphere).toHaveAttribute('data-renderer', 'static-fallback');
    expect(atmosphere.querySelector('canvas')).not.toBeInTheDocument();
    expect(document.querySelector('[data-hero-chapter="guild-arrival"]')).toBeInTheDocument();
    expect(document.querySelector('[data-scroll-cue="continue"]')).toBeInTheDocument();
  });

  it('welcomes visitors through a grounded approach and six real anime club departments', async () => {
    renderAt('/');
    const scene = await screen.findByTestId('layered-guild-scene');
    expect(scene.querySelector('[data-environment="guild-approach"]')).toBeInTheDocument();
    const cultureProps = scene.querySelector('[data-anime-culture="six-departments"]') as HTMLElement;
    const departmentProps = Array.from(cultureProps.querySelectorAll('[data-department-prop]'));
    expect(departmentProps).toHaveLength(6);
    expect(departmentProps.map((prop) => prop.getAttribute('aria-label'))).toEqual([
      'COS部服装箱',
      '技术部像素终端',
      '轻音部乐器箱',
      '原创部画板',
      '舞装部折扇',
      '外宣&幻想研相机',
    ]);
    expect(scene.querySelector('[data-open-asset-layer="adventurer-party"]')).toHaveAttribute('data-facing', 'visitor');
  });

  it('gives each primary story entrance a distinct editorial format', async () => {
    renderAt('/');
    await screen.findByTestId('layered-guild-scene');
    expect(Array.from(document.querySelectorAll('[data-story-format]')).map((entry) => entry.getAttribute('data-story-format'))).toEqual([
      'chronicle',
      'guild-roster',
      'field-report',
    ]);
    expect(document.querySelector('.notice-board')).toHaveAttribute('data-surface', 'wooden-quest-board');
    await waitFor(() => expect(document.querySelectorAll('.footer-avatar[data-facing="visitor"]')).toHaveLength(3));
  });

  it('opens every homepage story card through a full-card link', async () => {
    renderAt('/');
    const departments = await screen.findByRole('link', { name: '查看六个部门' });
    const activities = screen.getByRole('link', { name: '查看最近在忙' });
    expect(departments).toHaveAttribute('href', '/departments');
    expect(activities).toHaveAttribute('href', '/activities');
    expect(departments).toHaveAttribute('data-card-link', 'full');
    expect(activities).toHaveAttribute('data-card-link', 'full');
  });

  it('opens a homepage notice as its own public announcement detail', async () => {
    renderAt('/');
    const notice = await screen.findByRole('link', { name: /2026 秋季招新现已开启/ });
    expect(notice).toHaveAttribute('href', '/announcements/notice-1');
    cleanup();
    renderAt('/announcements/notice-1');
    expect(await screen.findByRole('heading', { name: '2026 秋季招新现已开启' })).toBeInTheDocument();
    expect(screen.getByText('六部门联合招募')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看相关页面' })).toHaveAttribute('href', '/join');
  });

  it('keeps the chronicle route available without advertising it in navigation or search', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const mainNavigation = within(screen.getByRole('navigation', { name: '主导航' }));
    expect(mainNavigation.queryByRole('link', { name: '公会历史' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await user.type(screen.getByLabelText('搜索关键词'), '公会历史');
    expect(within(screen.getByRole('navigation', { name: '搜索结果' })).queryByRole('link', { name: '公会历史' })).not.toBeInTheDocument();
    cleanup();
    renderAt('/chronicle');
    expect(await screen.findByRole('heading', { name: '公会编年史' })).toBeInTheDocument();
  });

  it('opens the pixel search and returns real route links', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(screen.getByRole('dialog', { name: '站内搜索' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('搜索关键词'), '职业');
    expect(within(screen.getByRole('navigation', { name: '搜索结果' })).getByRole('link', { name: /职业大厅/ })).toHaveAttribute('href', '/departments');
  });

  it('asks guests to log in before submitting a department application', async () => {
    renderAt('/join');
    expect(await screen.findByRole('heading', { name: '请先登录或注册账号' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '前往登录' })).toHaveAttribute('href', '/login?from=%2Fjoin');
  });

  it('lets a registered member apply to multiple departments without an activation step', async () => {
    const signedInUser = { id: 'user-member', uid: '10005', username: 'cos.member', displayName: '星砂同学', email: 'starsand@example.test', role: 'MEMBER', departmentId: null, departmentIds: [], bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: signedInUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: payloads[path] ?? {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    const user = userEvent.setup();
    renderAt('/join');
    expect(await screen.findByRole('heading', { name: '加入佐佑动漫社' })).toBeInTheDocument();
    expect(screen.queryByText('选择意向职业')).not.toBeInTheDocument();
    expect(screen.queryByText('冒险者资料')).not.toBeInTheDocument();
    expect(screen.getByLabelText('称呼')).toBeInTheDocument();
    expect(screen.getByLabelText('称呼')).toHaveValue('星砂同学');
    await user.type(screen.getByLabelText('学院与年级'), '计算机学院 2026级');
    expect(screen.getByLabelText('联系邮箱')).toHaveValue('starsand@example.test');
    await user.type(screen.getByLabelText('自我介绍与加入理由'), '希望认识同好并参与社团活动');
    await user.click(screen.getByRole('button', { name: '选择意向部门' }));
    expect(screen.getByRole('heading', { name: '选择感兴趣的部门' })).toBeInTheDocument();
    const tech = screen.getByRole('checkbox', { name: /技术部/ });
    const original = screen.getByRole('checkbox', { name: /原创部/ });
    await user.click(tech);
    await user.click(original);
    expect(tech).toBeChecked();
    expect(original).toBeChecked();
    expect(screen.getByText('已选择 2 个部门')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交社员申请' })).toBeEnabled();
  });

  it('shows each department deputy in department management', async () => {
    const admin = { id: 'admin', uid: '10001', username: 'admin', displayName: '管理员', email: 'admin@example.com', role: 'PRESIDENT', departmentId: null, bio: '' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: admin } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/admin/members?page=1&pageSize=100') return new Response(JSON.stringify({ ok: true, data: { items: [
        { id: 'leader', uid: '10003', display_name: '绯月部长', email: 'lead@example.com', role: 'DEPARTMENT_HEAD', department_id: 'dept-cos', is_active: 1 },
        { id: 'deputy', uid: '10004', display_name: '绯羽副部长', email: 'deputy@example.com', role: 'DEPARTMENT_ADMIN', department_id: 'dept-cos', is_active: 1 },
        { id: 'member', uid: '10005', display_name: '白羽成员', email: 'member@example.com', role: 'MEMBER', department_id: 'dept-cos', is_active: 1 },
      ], page: 1, pageSize: 100, total: 3 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/admin/roles/member/assign' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { assignmentId: 'role-new' } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: payloads[path] ?? {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/admin/departments');
    expect(await screen.findByText('绯羽副部长（UID 10004）')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'COS部新增副部长' }), 'member');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/roles/member/assign', expect.objectContaining({ method: 'POST', body: JSON.stringify({ role: 'DEPARTMENT_ADMIN', departmentId: 'dept-cos' }) })));
  });

  it('frames every secondary public route with the authored guild visual system', async () => {
    renderAt('/departments');
    expect(await screen.findByRole('heading', { name: '职业大厅' })).toBeInTheDocument();
    const hero = document.querySelector('.page-hero');
    expect(hero).toHaveAttribute('data-visual', 'guild-page-v2');
    expect(hero?.querySelector('[data-ornament="constellation"]')).toBeInTheDocument();
    expect(hero?.querySelector('[data-ornament="chapter-mark"]')).toBeInTheDocument();
  });

  it('protects the management area for unauthenticated visitors', async () => {
    renderAt('/admin');
    expect(await screen.findByText('需要公会身份验证')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '前往登录' })).toBeInTheDocument();
  });

  it('uploads a real file from the management archive', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: { id: 'admin', username: 'admin', displayName: '管理员', email: 'admin@example.com', role: 'PRESIDENT', departmentId: null, bio: '' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.startsWith('/api/admin/files?')) return new Response(JSON.stringify({ ok: true, data: { items: [], page: 1, pageSize: 100, total: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/admin/files/upload') {
        expect(init?.body).toBeInstanceOf(FormData);
        return new Response(JSON.stringify({ ok: true, data: { id: 'file-new' } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/admin/files');
    expect(await screen.findByRole('heading', { name: '文件管理' })).toBeInTheDocument();
    expect(document.querySelector('.console')).toHaveAttribute('data-workspace', 'admin');
    expect(document.querySelector('.console aside')).toHaveAttribute('data-surface', 'guild-navigation');
    expect(document.querySelector('.console-main > header')).toHaveAttribute('data-surface', 'console-utility');
    await user.click(screen.getByRole('button', { name: '上传文件' }));
    await user.upload(screen.getByLabelText('选择文件'), new File(['guild-data'], '内部手册.txt', { type: 'text/plain' }));
    const save = screen.getByRole('button', { name: '保存文件' });
    expect(save).toBeEnabled();
    await user.click(save);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/files/upload', expect.objectContaining({ method: 'POST' })));
  });

  it('lets an administrator publish and unpublish homepage announcements', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: { id: 'admin', username: 'admin', displayName: '管理员', email: 'admin@example.com', role: 'PRESIDENT', departmentId: null, bio: '' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.startsWith('/api/admin/announcements?')) return new Response(JSON.stringify({ ok: true, data: { items: [{ id: 'notice-1', title: '招新公告', summary: '六部门联合招募', category: 'RECRUITMENT', href: '/join', pinned: 0, published: 1, published_at: '2026-08-08T00:00:00.000Z' }], page: 1, pageSize: 100, total: 1 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/admin/announcements' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { id: 'notice-new' } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/admin/announcements/notice-1' && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true, data: { updated: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/admin/announcements');
    expect(await screen.findByRole('heading', { name: '公会公告' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '招新公告' })).toBeInTheDocument();
    const meta=document.querySelector('.announcement-meta');
    expect(Array.from(meta?.childNodes??[]).some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent==='0')).toBe(false);
    await user.click(screen.getByRole('button', { name: '新建公告' }));
    await user.type(screen.getByLabelText('公告标题'), '六部门联合成果展');
    await user.type(screen.getByLabelText('公告摘要'), '年度成果集中展示');
    await user.click(screen.getByRole('button', { name: '保存公告' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/announcements', expect.objectContaining({ method: 'POST' })));
    await user.click(screen.getByRole('button', { name: '下架 招新公告' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/announcements/notice-1', expect.objectContaining({ method: 'PATCH' })));
  });

  it('discovers members and opens a complete member homepage', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      const user = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '活动协作', guildTitle: '幻装见习生', college: '艺术设计学院', grade: '2025级', skills: ['角色塑造'], interests: ['动画'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.startsWith('/api/member/directory')) return new Response(JSON.stringify({ ok: true, data: { items: [user, { ...user, id: 'user-lead', displayName: '绯月幻装师', guildTitle: '首席幻装师', role: 'DEPARTMENT_HEAD', avatarColor: '#c75f88' }], page: 1, pageSize: 24, total: 2 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profiles/user-lead') return new Response(JSON.stringify({ ok: true, data: { profile: { ...user, id: 'user-lead', displayName: '绯月幻装师', guildTitle: '首席幻装师', signature: '把喜欢的角色认真带到舞台上。', coverUrl: '/api/member/profile-covers/user-lead?v=1', role: 'DEPARTMENT_HEAD', departmentName: 'COS部', departmentTitle: '幻术师', avatarColor: '#c75f88', joinedAt: '2023-05-01T00:00:00.000Z', presence: 'ONLINE' }, stats: { publishedWorks: 4, attendedActivities: 12, contributionPoints: 86 }, works: [{ id: 'work-1', title: '星辉幻装录', description: '舞台作品', createdAt: '2026-08-01T00:00:00.000Z' }], activities: [{ id: 'activity-1', title: '夏日幻装工坊', startsAt: '2026-08-10T00:00:00.000Z' }], photoWall: [{ id: 'photo-1', url: '/api/member/profile-photos/photo-1/content', createdAt: '2026-08-08T00:00:00.000Z' }] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/conversations/direct' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { conversation: { id: 'direct-new' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/members');
    expect(await screen.findByRole('heading', { name: '成员名录' })).toBeInTheDocument();
    expect(await screen.findByText('首席幻装师')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '查看 绯月幻装师 的主页' }));
    expect(await screen.findByRole('heading', { name: '绯月幻装师' })).toBeInTheDocument();
    expect(screen.getByText('86')).toBeInTheDocument();
    expect(screen.getByText('把喜欢的角色认真带到舞台上。')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '绯月幻装师 的主页封面' })).toHaveAttribute('src', '/api/member/profile-covers/user-lead?v=1');
    expect(screen.getByRole('img', { name: '绯月幻装师 的照片 1' })).toHaveAttribute('src', '/api/member/profile-photos/photo-1/content');
    expect(screen.getByRole('heading', { name: '星辉幻装录' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '给 绯月幻装师 发消息' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/conversations/direct', expect.objectContaining({ method: 'POST' })));
  });

  it('edits a rich personal homepage and persists structured fields', async () => {
    const profile = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', departmentName: 'COS部', bio: '活动协作', signature: '在准备新的正片。', guildTitle: '幻装见习生', college: '艺术设计学院', grade: '2025级', skills: ['角色塑造'], interests: ['动画'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile' && !init?.method) return new Response(JSON.stringify({ ok: true, data: { profile, photoWall: [{ id: 'photo-old', url: '/api/member/profile-photos/photo-old/content', createdAt: '2026-08-01T00:00:00.000Z' }] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile' && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true, data: { updated: true, profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile/avatar' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { avatarUrl: '/api/public/avatars/user-member?v=2' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile/cover' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { coverUrl: '/api/member/profile-covers/user-member?v=2' } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile/photos' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { photo: { id: 'photo-new', url: '/api/member/profile-photos/photo-new/content', createdAt: '2026-08-09T00:00:00.000Z' } } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile/photos/photo-old' && init?.method === 'DELETE') return new Response(JSON.stringify({ ok: true, data: { deleted: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/profile');
    expect(await screen.findByRole('heading', { name: '编辑资料' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('公会头衔'));
    await user.type(screen.getByLabelText('公会头衔'), '银翼记录官');
    await user.clear(screen.getByLabelText(/^账号 ID/));
    await user.type(screen.getByLabelText(/^账号 ID/), '白羽_2026');
    await user.clear(screen.getByLabelText('技能标签'));
    await user.type(screen.getByLabelText('技能标签'), '摄影, 后期, 活动协作');
    await user.clear(screen.getByLabelText('个性签名'));
    await user.type(screen.getByLabelText('个性签名'), '周末一起去拍正片吧。');
    await user.upload(screen.getByLabelText(/上传头像/), new File(['avatar'], 'avatar.png', { type: 'image/png' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile/avatar', expect.objectContaining({ method: 'POST', body: expect.any(FormData) })));
    expect(await screen.findByRole('img', { name: '我的头像' })).toHaveAttribute('src', '/api/public/avatars/user-member?v=2');
    await user.upload(screen.getByLabelText(/上传主页封面/), new File(['cover'], 'cover.png', { type: 'image/png' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile/cover', expect.objectContaining({ method: 'POST', body: expect.any(FormData) })));
    await user.upload(screen.getByLabelText(/添加照片墙照片/), new File(['memory'], 'memory.png', { type: 'image/png' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile/photos', expect.objectContaining({ method: 'POST', body: expect.any(FormData) })));
    await user.click(screen.getByRole('button', { name: '删除照片 1' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile/photos/photo-old', expect.objectContaining({ method: 'DELETE' })));
    await user.selectOptions(screen.getByLabelText('主页可见范围'), 'PRIVATE');
    await user.click(screen.getByRole('button', { name: '保存个人主页' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile', expect.objectContaining({ method: 'PATCH' })));
    const patchCall = fetchMock.mock.calls.find(([path, init]) => path === '/api/member/profile' && init?.method === 'PATCH');
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({ uid: '白羽_2026', guildTitle: '银翼记录官', signature: '周末一起去拍正片吧。', skills: ['摄影', '后期', '活动协作'], profileVisibility: 'PRIVATE' });
  });

  it('changes a Chinese login username and password from the profile editor', async () => {
    const profile = { id: 'user-member', uid: '10005', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'DEPARTMENT_ADMIN', departmentId: 'dept-cos', departmentName: 'COS部', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile') return new Response(JSON.stringify({ ok: true, data: { profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/account/username' && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true, data: { updated: true, user: { ...profile, username: '星砂成员' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/account/password' && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true, data: { updated: true, revokedSessions: 2 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/profile');

    const username = await screen.findByLabelText('用户名（支持中文）');
    await user.clear(username);
    await user.type(username, '星砂成员');
    await user.type(screen.getByLabelText('当前密码（修改用户名）'), 'DemoMember!2026');
    await user.click(screen.getByRole('button', { name: '修改用户名' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/account/username', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ username: '星砂成员', currentPassword: 'DemoMember!2026' }) })));
    expect(await screen.findByText('用户名已更新')).toBeInTheDocument();

    await user.type(screen.getByLabelText('当前密码（修改密码）'), 'DemoMember!2026');
    expect(screen.getByLabelText('新密码')).toHaveAttribute('minlength', '6');
    expect(screen.getByLabelText('确认新密码')).toHaveAttribute('minlength', '6');
    await user.type(screen.getByLabelText('新密码'), 'NewDemoMember!2026');
    await user.type(screen.getByLabelText('确认新密码'), 'NewDemoMember!2026');
    await user.click(screen.getByRole('button', { name: '修改密码' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/account/password', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ currentPassword: 'DemoMember!2026', newPassword: 'NewDemoMember!2026' }) })));
    expect(await screen.findByText('密码已更新，其他设备已退出登录')).toBeInTheDocument();
  });

  it('operates an unread-aware chat workspace with reply and send feedback', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '幻装见习生', college: '', grade: '', skills: [], interests: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const conversations = [{ id: 'conversation-demo-direct', type: 'DIRECT', title: '绯月幻装师', counterpart: { id: 'user-lead', displayName: '绯月幻装师', avatarColor: '#c75f88', presence: 'ONLINE' }, lastMessage: '辛苦啦！', lastMessageAt: '2026-08-10T09:04:00.000Z', unreadCount: 2 }];
    const messages = [{ id: 'message-1', conversationId: 'conversation-demo-direct', senderId: 'user-lead', sender: { displayName: '绯月幻装师', avatarColor: '#c75f88' }, content: '辛苦啦！注意保护个人信息。', replyTo: null, editedAt: null, deletedAt: null, createdAt: '2026-08-10T09:04:00.000Z' }];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/conversations') return new Response(JSON.stringify({ ok: true, data: { items: conversations } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.startsWith('/api/member/conversations/conversation-demo-direct/messages') && init?.method !== 'POST') return new Response(JSON.stringify({ ok: true, data: { items: messages, hasMore: false, nextBefore: null } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.endsWith('/read')) return new Response(JSON.stringify({ ok: true, data: { read: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.endsWith('/messages') && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { message: { ...messages[0], id: 'message-new', senderId: 'user-member', content: '收到，我会处理。' } } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/chat');
    expect(await screen.findByRole('heading', { name: '公会通讯' })).toBeInTheDocument();
    expect(await screen.findByLabelText('2 条未读消息')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /绯月幻装师/ }));
    expect(await screen.findByText('辛苦啦！注意保护个人信息。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '回复该消息' }));
    expect(screen.getByRole('button', { name: '取消回复' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('输入消息'), '收到，我会处理。');
    await user.click(screen.getByRole('button', { name: '发送消息' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/conversations/conversation-demo-direct/messages', expect.objectContaining({ method: 'POST' })));
  });

  it('publishes a complete post from the public tavern', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const posts = [
      { id: 'post-welcome', title: '欢迎来到冒险者酒馆', content: '社团公开交流区。', pinned: true, commentCount: 3, author: { id: 'user-admin', displayName: '星门总管', avatarColor: '#b26b3f' }, createdAt: '2026-08-01T08:00:00.000Z', updatedAt: '2026-08-01T08:00:00.000Z' },
      { id: 'post-photo', title: '招募摄影搭档拍正片', content: '周末去江边外拍。', pinned: false, commentCount: 1, author: { id: 'user-member', displayName: '白羽见习者', avatarColor: '#5279a8' }, createdAt: '2026-08-07T10:00:00.000Z', updatedAt: '2026-08-07T10:00:00.000Z' },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/public/forum/categories') return new Response(JSON.stringify({ ok: true, data: { groups: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/post-attachments' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { attachment: { id: 'attachment-1', name: '道具说明.pdf', mimeType: 'application/pdf', size: 2048 } } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { post: { ...posts[1], id: 'post-new' } } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/tavern?compose=1');
    expect(await screen.findByRole('heading', { name: '冒险者酒馆' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '收起发帖表单' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('帖子标题'), '周末道具修补互助');
    await user.type(screen.getByLabelText('帖子内容'), '周六下午在活动室修补巡游道具。 https://www.bilibili.com/video/BV1test');
    expect(screen.getByRole('link', { name: /哔哩哔哩视频/ })).toBeInTheDocument();
    await user.upload(screen.getByLabelText('选择帖子附件'), new File(['pdf'], '道具说明.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText('道具说明.pdf')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '发布到酒馆' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/posts', expect.objectContaining({ method: 'POST' })));
    const call = fetchMock.mock.calls.find(([path, init]) => path === '/api/member/posts' && (init as RequestInit)?.method === 'POST');
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({ title: '周末道具修补互助', body: [{ type: 'PARAGRAPH', text: expect.stringContaining('https://www.bilibili.com/video/BV1test') }], attachmentIds: ['attachment-1'] });
  });

  it('rates a post up or down and reveals only supporters', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const post = { id: 'post-rating', title: 'SCP式评分测试帖', subtitle: '', content: '评分正文', body: [{ type: 'PARAGRAPH', text: '评分正文' }], attachments: [{ id: 'attachment-1', name: '道具说明.pdf', mimeType: 'application/pdf', size: 2048 }], departmentId: 'dept-cos', departmentName: 'COS部', pinned: false, featured: false, visibleOnGuild: true, visibleOnDepartment: true, upvoteCount: 2, downvoteCount: 1, score: 1, myRating: 0, commentCount: 0, author: { id: 'author-1', displayName: '作者', avatarColor: '#765584' }, createdAt: '2026-08-20T08:00:00.000Z', updatedAt: '2026-08-20T08:00:00.000Z' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/post-rating') return new Response(JSON.stringify({ ok: true, data: { post, comments: [{ id: 'comment-mine', postId: post.id, content: '我的待删除评论', author: { id: authUser.id, displayName: authUser.displayName, avatarColor: authUser.avatarColor }, createdAt: post.createdAt }], supporters: [{ id: 'supporter-1', displayName: '赞成者甲', avatarColor: '#5279a8' }, { id: 'supporter-2', displayName: '赞成者乙', avatarColor: '#c75f88' }] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/post-rating/rating' && init?.method === 'PUT') return new Response(JSON.stringify({ ok: true, data: { myRating: 1, upvoteCount: 3, downvoteCount: 1, score: 2 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/comments/comment-mine' && init?.method === 'DELETE') return new Response(JSON.stringify({ ok: true, data: { deleted: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/posts/post-rating');
    expect(await screen.findByRole('heading', { name: 'SCP式评分测试帖' })).toBeInTheDocument();
    expect(screen.getByLabelText('帖子综合评分 1')).toHaveTextContent('+1');
    const appendix = screen.getByRole('heading', { name: '帖子附录' }).closest('section')!;
    const supporters = screen.getByText('查看赞成这篇帖子的成员（2）').closest('details')!;
    expect(appendix.compareDocumentPosition(supporters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('link', { name: '下载' })).toHaveAttribute('href', '/api/member/post-attachments/attachment-1/content');
    expect(screen.getByText('赞成者甲')).not.toBeVisible();
    await user.click(screen.getByText('查看赞成这篇帖子的成员（2）'));
    expect(screen.getByText('赞成者甲')).toBeVisible();
    expect(screen.getByText('赞成者乙')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '赞成，当前 2 人' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/posts/post-rating/rating', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ value: 1 }) })));
    await user.click(screen.getByRole('button', { name: '删除 白羽见习者 的评论' }));
    expect(screen.getByRole('alertdialog', { name: '确认删除该评论吗？' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([path, init]) => path === '/api/member/comments/comment-mine' && init?.method === 'DELETE')).toBe(false);
    await user.click(screen.getByRole('button', { name: '确认删除评论' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/comments/comment-mine', expect.objectContaining({ method: 'DELETE' })));
  });

  it('lets a post author edit and restore history without gaining guild moderation', async () => {
    const authUser = { id: 'author-1', username: 'author', displayName: '帖子作者', email: 'author@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const post = { id: 'post-owner', title: '全社团话题第二版', subtitle: '修订稿', content: '作者修订后的正文。', body: [{ type: 'PARAGRAPH', text: '作者修订后的正文。' }], attachments: [], departmentId: null, departmentName: null, subboardId: null, subboardName: null, pinned: false, featured: false, visibleOnGuild: true, visibleOnDepartment: false, upvoteCount: 0, downvoteCount: 0, score: 0, myRating: 0, commentCount: 0, author: { id: authUser.id, displayName: authUser.displayName, avatarColor: authUser.avatarColor }, createdAt: '2026-08-20T08:00:00.000Z', updatedAt: '2026-08-21T08:00:00.000Z' };
    const revisions = [
      { id: 'revision-2', revisionNo: 2, changeType: 'UPDATE', restoredFromId: null, createdAt: post.updatedAt, snapshot: { title: post.title, subtitle: post.subtitle, content: post.content }, actor: { id: authUser.id, displayName: authUser.displayName, uid: '12345' } },
      { id: 'revision-1', revisionNo: 1, changeType: 'CREATE', restoredFromId: null, createdAt: post.createdAt, snapshot: { title: '全社团话题第一版', subtitle: '初稿', content: '最初正文。' }, actor: { id: authUser.id, displayName: authUser.displayName, uid: '12345' } },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/post-owner') return new Response(JSON.stringify({ ok: true, data: { post, comments: [], supporters: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/post-owner/history') return new Response(JSON.stringify({ ok: true, data: { items: revisions } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/post-owner/history/revision-1/restore' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { post: { ...post, title: '全社团话题第一版' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/posts/post-owner');
    expect(await screen.findByRole('button', { name: '编辑帖子' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '置顶帖子' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除帖子' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '历史记录' }));
    expect(await screen.findByText('全社团话题第一版')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '还原此版本' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/posts/post-owner/history/revision-1/restore', expect.objectContaining({ method: 'POST' })));
  });

  it('hides cross-department moderation controls from department managers', async () => {
    const authUser = { id: 'user-tech-lead', username: 'tech.lead', displayName: '技术部部长', email: 'tech@example.com', role: 'DEPARTMENT_HEAD', departmentId: 'dept-tech', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const post = { id: 'post-cos', title: 'COS 部内部日志', subtitle: '', content: '跨部门管理员只能阅读。', body: [{ type: 'PARAGRAPH', text: '跨部门管理员只能阅读。' }], departmentId: 'dept-cos', departmentName: 'COS部', pinned: false, featured: false, visibleOnGuild: true, visibleOnDepartment: true, upvoteCount: 0, downvoteCount: 0, score: 0, myRating: 0, commentCount: 1, author: { id: 'cos-author', displayName: 'COS 部成员', avatarColor: '#765584' }, createdAt: '2026-08-20T08:00:00.000Z', updatedAt: '2026-08-20T08:00:00.000Z' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/post-cos') return new Response(JSON.stringify({ ok: true, data: { post, comments: [{ id: 'comment-cos', postId: post.id, content: 'COS 部评论', author: { id: 'cos-commenter', displayName: '评论成员', avatarColor: '#c75f88' }, createdAt: post.createdAt }], supporters: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/portal/tavern/post-cos');

    expect(await screen.findByRole('heading', { name: 'COS 部内部日志' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '编辑帖子' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除帖子' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除 评论成员 的评论' })).not.toBeInTheDocument();
  });

  it('shows a dialog when the pinned post section has reached five posts', async () => {
    const authUser = { id: 'user-tech-lead', username: 'tech.lead', displayName: '技术部部长', email: 'tech@example.com', role: 'DEPARTMENT_HEAD', departmentId: 'dept-tech', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const post = { id: 'post-tech', title: '技术部直播日志', subtitle: '', content: '准备本周直播设备。', body: [{ type: 'PARAGRAPH', text: '准备本周直播设备。' }], departmentId: 'dept-tech', departmentName: '技术部', pinned: false, featured: false, visibleOnGuild: false, visibleOnDepartment: true, upvoteCount: 0, downvoteCount: 0, score: 0, myRating: 0, commentCount: 0, author: { id: 'tech-author', displayName: '技术部成员', avatarColor: '#765584' }, createdAt: '2026-08-20T08:00:00.000Z', updatedAt: '2026-08-20T08:00:00.000Z' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/public/forum/categories') return new Response(JSON.stringify({ ok: true, data: { groups: [{ id: 'dept-tech', slug: 'tech', name: '技术部', title: '技术部', description: '技术交流', topicCount: 1, replyCount: 0, latestPost: null, subboards: [] }] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.startsWith('/api/public/forum/topics?')) return new Response(JSON.stringify({ ok: true, data: { department: { id: 'dept-tech', name: '技术部', slug: 'tech' }, subboard: null, items: [post], page: 1, pageSize: 20, total: 1 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/post-tech/placement' && init?.method === 'PUT') return new Response(JSON.stringify({ ok: false, error: { code: 'PINNED_POST_LIMIT', message: '置顶贴数量已到上限' } }), { status: 409, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: { items: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/tavern/tech');

    expect(await screen.findByRole('link', { name: '技术部直播日志' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '置顶' }));
    expect(await screen.findByRole('alertdialog', { name: '展示数量提醒' })).toHaveTextContent('置顶贴数量已到上限');
    await user.click(screen.getByRole('button', { name: '我知道了' }));
    expect(screen.queryByRole('alertdialog', { name: '展示数量提醒' })).not.toBeInTheDocument();
  });

  it('shows resonance matches with shared attributes and guides unset members', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay', 'photography'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const match = { myAttributes: ['cosplay', 'photography'], items: [
      { score: 62, sharedAttributes: ['cosplay', 'photography'], sharedTags: ['漫展'], profile: { id: 'user-lead', displayName: '绯月幻装师', avatarColor: '#c75f88', guildTitle: '首席幻装师', departmentName: 'COS部', bio: '舞台呈现', presence: 'ONLINE' } },
    ] };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/match') return new Response(JSON.stringify({ ok: true, data: match }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    renderAt('/portal/match');
    expect(await screen.findByRole('heading', { name: '共鸣图鉴' })).toBeInTheDocument();
    expect(await screen.findByText('绯月幻装师')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '与 绯月幻装师 的共鸣指数 62%' })).toBeInTheDocument();
    expect(screen.getAllByText('COS').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: '查看主页' })).toHaveAttribute('href', '/portal/members/user-lead');
    expect(screen.getByRole('button', { name: '发起私聊' })).toBeEnabled();
  });

  it('guides members without attributes to the profile editor', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/match') return new Response(JSON.stringify({ ok: true, data: { myAttributes: [], items: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    renderAt('/portal/match');
    expect(await screen.findByRole('heading', { name: '先为自己选择冒险属性' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /去设置我的属性/ })).toHaveAttribute('href', '/portal/profile');
  });

  it('toggles attributes in the profile editor and persists them', async () => {
    const profile = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', departmentName: 'COS部', bio: '活动协作', guildTitle: '幻装见习生', college: '艺术设计学院', grade: '2025级', skills: ['角色塑造'], interests: ['动画'], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile' && !init?.method) return new Response(JSON.stringify({ ok: true, data: { profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile' && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true, data: { updated: true, profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/profile');
    expect(await screen.findByRole('heading', { name: '我的属性' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'COS' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '摄影' }));
    expect(screen.getByText('已选择 2/8')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '保存个人主页' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile', expect.objectContaining({ method: 'PATCH' })));
    const patchCall = fetchMock.mock.calls.find(([path, init]) => path === '/api/member/profile' && (init as RequestInit)?.method === 'PATCH');
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({ attributes: ['cosplay', 'photography'] });
  });

  it('renders the pixel plaza lobby with seven areas and online counts', async () => {
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
    renderAt('/portal/world');
    expect(await screen.findByRole('heading', { name: '像素广场' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '公会大厅广场' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'COS部幻装间' })).toBeInTheDocument();
    expect(screen.getByText('3 人在线')).toBeInTheDocument();
    expect(screen.getAllByText('暂时无人')).toHaveLength(4);
    expect(screen.getByRole('link', { name: '进入COS部幻装间' })).toHaveAttribute('href', '/portal/world/cos');
  });
});
