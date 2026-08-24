import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlogPostBoard } from '../components/blog/BlogPostBoard';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('BlogPostBoard', () => {
  it('renders pinned, member-selected and newest posts for a department', async () => {
    const post = { id: 'post-1', title: '幻装工坊日志', subtitle: '道具上色记录', content: '今天完成了上色。', body: [], departmentName: 'COS部', pinned: true, featured: true, upvoteCount: 5, downvoteCount: 2, score: 3, commentCount: 0, createdAt: '2026-08-20T08:00:00.000Z', author: { id: 'member-1', displayName: '白羽', avatarColor: '#fff' } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, data: { pinned: [post], featured: [post], latest: [post] } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><BlogPostBoard departmentSlug="cos" /></MemoryRouter></QueryClientProvider>);

    const board = await screen.findByRole('region', { name: '部门帖子' });
    expect(await within(board).findByRole('heading', { name: /置顶帖.*01/ })).toBeInTheDocument();
    expect(within(board).getByRole('heading', { name: /精选帖.*01/ })).toBeInTheDocument();
    expect(within(board).getByRole('heading', { name: /最新发帖.*01/ })).toBeInTheDocument();
    expect(within(board).getAllByRole('link', { name: /幻装工坊日志/ })).toHaveLength(3);
    expect(within(board).getAllByText('评分 +3')).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith('/api/public/posts/board?departmentSlug=cos', expect.any(Object));
  });
});
