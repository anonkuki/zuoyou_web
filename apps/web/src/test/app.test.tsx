import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app';
import { api } from '../api';

const payloads: Record<string, unknown> = {
  '/api/public/home': {
    stats: { guildLevel: 12, levelProgress: { current: 2390, target: 3000 }, memberCount: 82, completedActivityCount: 328, honorCount: 56, foundedYear: 2018 },
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

  it('renders the high-fidelity guild hall with live summary', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: /佐佑动漫社/ })).toBeInTheDocument();
    expect(screen.getByTestId('layered-guild-scene')).toBeInTheDocument();
    expect(await screen.findByText('82')).toBeInTheDocument();
    expect(screen.getByText('有人负责舞台，有人守着画板，')).toBeInTheDocument();
    expect(screen.getByText('2026 秋季招新现已开启')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: '主导航' })).getByRole('link', { name: '首页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
  });

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
    expect(within(party).getAllByRole('img', { name: /COS部|外宣部|原创部|轻音部/ })).toHaveLength(4);
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
      '外宣部相机',
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
    const avatars = document.querySelectorAll('.footer-avatar[data-facing="visitor"]');
    expect(avatars).toHaveLength(4);
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

  it('navigates to every public module with real links', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(screen.getByRole('navigation', { name: '主导航' })).getByRole('link', { name: '公会历史' }));
    expect(await screen.findByRole('heading', { name: '公会编年史' })).toBeInTheDocument();
    expect(screen.getByText('公会启程')).toBeInTheDocument();
  });

  it('opens the pixel search and returns real route links', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(screen.getByRole('dialog', { name: '站内搜索' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('搜索关键词'), '职业');
    expect(within(screen.getByRole('navigation', { name: '搜索结果' })).getByRole('link', { name: /职业大厅/ })).toHaveAttribute('href', '/departments');
  });

  it('starts with a grounded member application and supports multiple department interests', async () => {
    const user = userEvent.setup();
    renderAt('/join');
    expect(screen.getByRole('heading', { name: '加入佐佑动漫社' })).toBeInTheDocument();
    expect(screen.queryByText('选择意向职业')).not.toBeInTheDocument();
    expect(screen.queryByText('冒险者资料')).not.toBeInTheDocument();
    expect(screen.getByLabelText('称呼')).toBeInTheDocument();
    await user.type(screen.getByLabelText('称呼'), '星砂同学');
    await user.type(screen.getByLabelText('学院与年级'), '计算机学院 2026级');
    await user.type(screen.getByLabelText('联系邮箱'), 'starsand@example.test');
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
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: { id: 'admin', username: 'admin', displayName: '管理员', email: 'admin@example.com', role: 'ADMIN', departmentId: null, bio: '' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: { id: 'admin', username: 'admin', displayName: '管理员', email: 'admin@example.com', role: 'ADMIN', departmentId: null, bio: '' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
      if (path.startsWith('/api/member/directory')) return new Response(JSON.stringify({ ok: true, data: { items: [user, { ...user, id: 'user-lead', displayName: '绯月幻装师', guildTitle: '首席幻装师', role: 'DEPARTMENT_LEAD', avatarColor: '#c75f88' }], page: 1, pageSize: 24, total: 2 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profiles/user-lead') return new Response(JSON.stringify({ ok: true, data: { profile: { ...user, id: 'user-lead', displayName: '绯月幻装师', guildTitle: '首席幻装师', role: 'DEPARTMENT_LEAD', departmentName: 'COS部', departmentTitle: '幻术师', avatarColor: '#c75f88', joinedAt: '2023-05-01T00:00:00.000Z', presence: 'ONLINE' }, stats: { publishedWorks: 4, attendedActivities: 12, contributionPoints: 86 }, works: [{ id: 'work-1', title: '星辉幻装录', description: '舞台作品', createdAt: '2026-08-01T00:00:00.000Z' }], activities: [{ id: 'activity-1', title: '夏日幻装工坊', startsAt: '2026-08-10T00:00:00.000Z' }] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    expect(screen.getByRole('heading', { name: '星辉幻装录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '发起私聊' })).toBeEnabled();
  });

  it('edits a rich personal homepage and persists structured fields', async () => {
    const profile = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', departmentName: 'COS部', bio: '活动协作', guildTitle: '幻装见习生', college: '艺术设计学院', grade: '2025级', skills: ['角色塑造'], interests: ['动画'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
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
    expect(await screen.findByRole('heading', { name: '编辑个人主页' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('公会头衔'));
    await user.type(screen.getByLabelText('公会头衔'), '银翼记录官');
    await user.clear(screen.getByLabelText('技能标签'));
    await user.type(screen.getByLabelText('技能标签'), '摄影, 后期, 活动协作');
    await user.selectOptions(screen.getByLabelText('主页可见范围'), 'PRIVATE');
    await user.click(screen.getByRole('button', { name: '保存个人主页' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile', expect.objectContaining({ method: 'PATCH' })));
    const patchCall = fetchMock.mock.calls.find(([path, init]) => path === '/api/member/profile' && init?.method === 'PATCH');
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({ guildTitle: '银翼记录官', skills: ['摄影', '后期', '活动协作'], profileVisibility: 'PRIVATE' });
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

  it('lists tavern posts and publishes a new one', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const posts = [
      { id: 'post-welcome', title: '欢迎来到冒险者酒馆', content: '社团公开交流区。', pinned: true, commentCount: 3, author: { id: 'user-admin', displayName: '星门总管', avatarColor: '#b26b3f' }, createdAt: '2026-08-01T08:00:00.000Z', updatedAt: '2026-08-01T08:00:00.000Z' },
      { id: 'post-photo', title: '招募摄影搭档拍正片', content: '周末去江边外拍。', pinned: false, commentCount: 1, author: { id: 'user-member', displayName: '白羽见习者', avatarColor: '#5279a8' }, createdAt: '2026-08-07T10:00:00.000Z', updatedAt: '2026-08-07T10:00:00.000Z' },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.startsWith('/api/member/posts?')) return new Response(JSON.stringify({ ok: true, data: { items: posts, page: 1, pageSize: 50, total: 2 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts' && init?.method === 'POST') return new Response(JSON.stringify({ ok: true, data: { post: { ...posts[1], id: 'post-new' } } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/tavern');
    expect(await screen.findByRole('heading', { name: '冒险者酒馆' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '欢迎来到冒险者酒馆' })).toBeInTheDocument();
    expect(screen.getByText('置顶')).toBeInTheDocument();
    expect(screen.getByText('3 条评论')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '发布新帖' }));
    await user.type(screen.getByLabelText('帖子标题'), '周末道具修补互助');
    await user.type(screen.getByLabelText('帖子内容'), '周六下午在活动室修补巡游道具。');
    await user.click(screen.getByRole('button', { name: '发布到酒馆' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/posts', expect.objectContaining({ method: 'POST' })));
    const call = fetchMock.mock.calls.find(([path, init]) => path === '/api/member/posts' && (init as RequestInit)?.method === 'POST');
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({ title: '周末道具修补互助' });
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
      { id: 'publicity', name: '外宣部据点', color: '#e0342f', departmentSlug: 'publicity', online: 0 },
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
