import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlogPostBoard } from '../components/blog/BlogPostBoard';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('BlogPostBoard', () => {
  it('renders pinned, member-selected and newest posts for a department', async () => {
    const posts = Array.from({ length: 6 }, (_, index) => ({ id: `post-${index + 1}`, title: `幻装工坊日志 ${index + 1}`, subtitle: '不应显示的小标题', content: '不应显示的正文。', body: [], departmentName: 'COS部', pinned: true, featured: true, upvoteCount: 5, downvoteCount: 2, score: 3, commentCount: 0, createdAt: '2026-08-20T08:00:00.000Z', author: { id: `member-${index + 1}`, displayName: `作者 ${index + 1}`, avatarColor: '#fff' } }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, data: { pinned: posts, featured: posts, latest: posts } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><BlogPostBoard departmentSlug="cos" /></MemoryRouter></QueryClientProvider>);

    const board = await screen.findByRole('region', { name: '部门帖子' });
    expect(await within(board).findByRole('heading', { name: /置顶帖.*05 \/ 05/ })).toBeInTheDocument();
    expect(within(board).getByRole('heading', { name: /精选帖.*05 \/ 05/ })).toBeInTheDocument();
    expect(within(board).getByRole('heading', { name: /最新发帖.*05 \/ 05/ })).toBeInTheDocument();
    expect(within(board).getAllByRole('link')).toHaveLength(15);
    expect(within(board).getAllByText('BY 作者 1')).toHaveLength(3);
    expect(within(board).queryByText('幻装工坊日志 6')).not.toBeInTheDocument();
    expect(within(board).queryByText('不应显示的小标题')).not.toBeInTheDocument();
    expect(within(board).queryByText('不应显示的正文。')).not.toBeInTheDocument();
    expect(within(board).queryByText('评分 +3')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/public/posts/board?departmentSlug=cos', expect.any(Object));
  });
});
