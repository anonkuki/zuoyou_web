import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DanceShowcase } from '../components/departments/showcase/DanceShowcase';
import { showcaseBySlug } from '../components/departments/showcase-data';

const department = {
  id: 'dept-dance', slug: 'dance', name: '舞装部', title: '星轨舞者', description: '舞蹈、服装与舞台演出', memberCount: 18,
};

describe('dance department showcase', () => {
  it('keeps the original hero and presents the compact dance archive without dropping content', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><DanceShowcase dept={department} show={showcaseBySlug.dance} /></MemoryRouter></QueryClientProvider>);
    expect(screen.getByRole('heading', { name: '舞装部', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '成员介绍' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '演出中' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '节目单' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '舞台亮起的瞬间' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '看看我们真的做过什么' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '演出曲目库' })).toBeInTheDocument();
    expect(screen.getAllByAltText(/舞装部排练与演出照片/)).toHaveLength(9);
    expect(screen.getAllByRole('link', { name: /立即加入我们/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: '查看下一组舞装部成员' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '跳转到舞装部讨论区' })).toHaveTextContent('07');
  });
});
