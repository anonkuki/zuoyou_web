import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app';
import { api } from '../api';

const payloads: Record<string, unknown> = {
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
    expect(screen.getByText('1524')).toBeInTheDocument();
    expect(screen.getByText('我们是来自不同世界的冒险者，')).toBeInTheDocument();
    expect(screen.getByText('2026春季招新开启！')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: '主导航' })).getByRole('link', { name: '首页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
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
});
