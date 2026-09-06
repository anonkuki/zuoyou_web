import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { OriginalShowcase } from '../components/departments/showcase/OriginalShowcase';
import { showcaseBySlug } from '../components/departments/showcase-data';

const department = {
  id: 'dept-original', slug: 'original', name: '原创部', title: '绘卷术士', description: '绘画与原创企划', memberCount: 13,
};

describe('original department showcase', () => {
  it('keeps the original atelier hero and separates works from weekly activity photos', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><OriginalShowcase dept={department} show={showcaseBySlug.original} /></MemoryRouter></QueryClientProvider>);
    expect(screen.getByRole('heading', { name: '原创部', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '作品集锦' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OC / 设定集' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '一起创作的日常' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '看看我们真的做过什么' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '画具箱' })).toBeInTheDocument();
    expect(screen.getAllByAltText(/原创部原创作品照片/)).toHaveLength(4);
    expect(screen.getAllByAltText(/原创部周常活动照片/)).toHaveLength(1);
    expect(screen.getByRole('button', { name: '上一张创作日常' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一张创作日常' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /查看第 .* 张创作日常/ })).toHaveLength(7);
    expect(screen.getByRole('button', { name: '查看下一组原创作品' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '跳转到原创讨论区' })).toHaveTextContent('07');
  });
});
