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
  '/api/public/departments': { items: [{ id: 'dept-cos', slug: 'cos', name: 'COS部', title: '幻术师', description: '角色造型与舞台呈现', memberCount: 15 }] },
  '/api/public/chronicles?page=1&pageSize=20': { items: [{ id: 'c1', title: '公会启程', content: '新的篇章', occurred_at: '2023-05-01T00:00:00.000Z' }], page: 1, pageSize: 20, total: 1 },
  '/api/public/activities?page=1&pageSize=20': { items: [{ id: 'a1', title: '校园祭协作任务', description: '六部联合活动', status: 'REGISTRATION', capacity: 80, starts_at: '2026-08-10T10:00:00.000Z' }], page: 1, pageSize: 20, total: 1 },
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
    expect(screen.getByText('我们是来自不同世界的冒险者，')).toBeInTheDocument();
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
    expect(within(party).getAllByRole('img', { name: /冒险者|公会执事|精灵|法师|游侠/ })).toHaveLength(4);
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

  it('uses one coherent guild crest system and a single primary focal point', async () => {
    renderAt('/');
    await screen.findByTestId('layered-guild-scene');
    const crests = screen.getAllByTestId('guild-crest');
    expect(crests).toHaveLength(2);
    crests.forEach((crest) => {
      expect(crest.tagName.toLowerCase()).toBe('svg');
      expect(crest.querySelectorAll('[data-crest-layer]').length).toBeGreaterThanOrEqual(5);
    });
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

  it('shows application form controls instead of placeholder buttons', async () => {
    const user = userEvent.setup();
    renderAt('/join');
    expect(screen.getByRole('heading', { name: '加入公会' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '继续填写资料' }));
    expect(screen.getByLabelText('称呼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交加入申请' })).toBeEnabled();
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
});
