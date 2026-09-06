import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PublicityShowcase } from '../components/departments/showcase/PublicityShowcase';
import { showcaseBySlug } from '../components/departments/showcase-data';

const department = {
  id: 'dept-publicity', slug: 'publicity', name: '外宣&幻想研', title: '放映术士', description: '宣传、放映与动漫鉴赏', memberCount: 20,
};

describe('publicity department showcase', () => {
  it('keeps the cinema hero and presents the complete compact publicity archive', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><PublicityShowcase dept={department} show={showcaseBySlug.publicity} /></MemoryRouter></QueryClientProvider>);
    expect(screen.getByRole('heading', { name: '外宣&幻想研', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '正在上映' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '年度片单' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '放映、记录与社团现场' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '推文／海报墙' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '幻想研影评专栏' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '番看会放映记录' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '读一读我们留下的记录' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '场刊' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /查看第 .* 张社团现场照片/ })).toHaveLength(14);
    expect(screen.getByRole('button', { name: '查看下一组正在上映' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看下一组年度片单' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看下一组推文与海报' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '查看下一组外宣文字记录' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '跳转到外宣讨论区' })).toHaveTextContent('08');
  });
});
