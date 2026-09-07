import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlogPostBoard, ForumDirectory } from '../components/blog/BlogPostBoard';
import { AuthProvider } from '../auth';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const post = (id: string, title: string, pinned = false) => ({ id, title, subtitle: '', content: '正文', body: [], departmentId: 'dept-publicity', departmentName: '外宣&幻想研', subboardId: null, subboardName: null, pinned, featured: false, upvoteCount: 0, downvoteCount: 0, score: 0, commentCount: 2, createdAt: `2026-08-${id === 'pinned' ? '01' : '20'}T08:00:00.000Z`, author: { id: 'member', displayName: '测试作者', avatarColor: '#fff' } });
const group = { id: 'dept-publicity', slug: 'publicity', name: '外宣&幻想研', title: '传令官', description: '宣传运营与动漫文化研究', topicCount: 3, replyCount: 4, latestPost: { id: 'latest', title: '本周番剧讨论', authorName: '测试作者', latestAuthorName: '回复者', createdAt: '2026-08-20T09:00:00.000Z' }, subboards: [
  { id: 'subboard-anime', departmentId: 'dept-publicity', name: '番剧吐槽', description: '当季动画讨论', topicCount: 2, replyCount: 3, latestPost: { id: 'latest', title: '本周番剧讨论', authorName: '测试作者', latestAuthorName: '回复者', createdAt: '2026-08-20T09:00:00.000Z' } },
  { id: 'subboard-news', departmentId: 'dept-publicity', name: '宣传速报', description: '发布动态', topicCount: 1, replyCount: 1, latestPost: null },
] };

const renderWithClient = (node: React.ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
};

const renderWithAccount = (node: React.ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><AuthProvider>{node}</AuthProvider></MemoryRouter></QueryClientProvider>);
};

describe('public forum layout', () => {
  it('shows departments and their child boards as an SCP-style category directory', async () => {
    const guild = { id: 'guild', slug: 'guild', name: '佐佑动漫社', title: '全社团讨论', description: '面向全体社员的共同话题', topicCount: 2, replyCount: 1, latestPost: null, subboards: [] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, data: { groups: [guild, group] } }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    renderWithClient(<ForumDirectory/>);
    const directory = await screen.findByRole('region', { name: '酒馆板块目录' });
    expect(await within(directory).findByRole('link', { name: '佐佑动漫社综合讨论' })).toHaveAttribute('href', '/tavern/guild');
    expect(await within(directory).findByText('外宣&幻想研')).toBeInTheDocument();
    expect(within(directory).getByRole('link', { name: '外宣&幻想研综合讨论' })).toHaveAttribute('href', '/tavern/publicity');
    expect(within(directory).getByRole('link', { name: /番剧吐槽/ })).toHaveAttribute('href', '/tavern/publicity/subboard-anime');
    expect(within(directory).getAllByText('主题')).toHaveLength(2);
    expect(within(directory).getAllByText('回复')).toHaveLength(2);
    expect(within(directory).getAllByText('最新动态')).toHaveLength(2);
  });

  it('mixes pinned and ordinary topics and filters a department by child board', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/public/forum/categories') return new Response(JSON.stringify({ ok: true, data: { groups: [group] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      const items = path.includes('subboardId=subboard-anime') ? [post('latest', '本周番剧讨论')] : [post('pinned', '版规与发帖指引', true), post('latest', '本周番剧讨论')];
      return new Response(JSON.stringify({ ok: true, data: { department: { id: group.id, name: group.name, slug: group.slug }, subboard: null, items, page: 1, pageSize: 20, total: items.length } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithClient(<BlogPostBoard departmentSlug="publicity"/>);
    const board = await screen.findByRole('region', { name: '部门帖子' });
    expect(await within(board).findByText('版规与发帖指引')).toBeInTheDocument();
    expect(within(board).getByText('本周番剧讨论')).toBeInTheDocument();
    expect(within(board).getByText('置顶')).toBeInTheDocument();
    await user.type(within(board).getByPlaceholderText('检索本部门子板块'), '番剧');
    expect(within(board).queryByRole('button', { name: /宣传速报/ })).not.toBeInTheDocument();
    await user.click(within(board).getByRole('button', { name: /番剧吐槽/ }));
    expect(await within(board).findByText('当前子板块：番剧吐槽')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('subboardId=subboard-anime'), expect.any(Object));
  });

  it('deduplicates pinned topics in the compact homepage list', async () => {
    const pinned = post('pinned', '欢迎来到冒险者酒馆', true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, data: { pinned: [pinned], featured: [], latest: [pinned, post('latest', '九月宣传内容排期')] } }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    renderWithClient(<BlogPostBoard compact title="冒险者酒馆"/>);
    const board = await screen.findByRole('region', { name: '社团帖子' });
    expect(await within(board).findAllByText('欢迎来到冒险者酒馆')).toHaveLength(1);
    expect(within(board).getByText('九月宣传内容排期')).toBeInTheDocument();
    expect(within(board).queryByRole('heading', { name: '置顶帖' })).not.toBeInTheDocument();
  });

  it('lets an authorized department manager pin and delete topics from the public board', async () => {
    const item = post('latest', '本周番剧讨论');
    const manager = { id: 'publicity-head', uid: '10003', username: 'publicity.head', displayName: '外宣部部长', email: 'head@example.test', role: 'DEPARTMENT_HEAD', departmentId: 'dept-publicity', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: [], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: manager } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/public/forum/categories') return new Response(JSON.stringify({ ok: true, data: { groups: [group] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path.startsWith('/api/public/forum/topics?')) return new Response(JSON.stringify({ ok: true, data: { department: { id: group.id, name: group.name, slug: group.slug }, subboard: null, items: [item], page: 1, pageSize: 20, total: 1 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/latest/placement' && init?.method === 'PUT') return new Response(JSON.stringify({ ok: true, data: { visible: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/posts/latest' && init?.method === 'DELETE') return new Response(JSON.stringify({ ok: true, data: { deleted: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithAccount(<BlogPostBoard departmentSlug="publicity"/>);
    const board = await screen.findByRole('region', { name: '部门帖子' });
    expect(await within(board).findByRole('link', { name: '本周番剧讨论' })).toHaveAttribute('href', '/posts/latest');
    await user.click(within(board).getByRole('button', { name: '置顶' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/member/posts/latest/placement', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ scope: 'DEPARTMENT', departmentId: 'dept-publicity', visible: true, pinned: true }) }));
    await user.click(within(board).getByRole('button', { name: '删除' }));
    expect(screen.getByRole('alertdialog', { name: '确认删除该帖子吗？' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认删除帖子' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/member/posts/latest', expect.objectContaining({ method: 'DELETE' }));
  });
});
