import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TechShowcase } from '../components/departments/showcase/TechShowcase';
import { showcaseBySlug } from '../components/departments/showcase-data';

const department = {
  id: 'dept-tech', slug: 'tech', name: '技术部', title: '影像术士', description: '摄影、剪辑与活动技术支持', memberCount: 12,
};

describe('tech department showcase', () => {
  it('presents the complete compact archive with carousels', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><TechShowcase dept={department} show={showcaseBySlug.tech} /></MemoryRouter></QueryClientProvider>);
    expect(screen.getByRole('heading', { name: '技术部', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '底片夹' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '取景器后的现场记录' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '看看我们真的做过什么' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '教程资源库' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /查看第 .* 张现场记录/ })).toHaveLength(84);
    expect(screen.getByRole('button', { name: '查看下一组底片夹' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看上一组教程资源' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看下一组教程资源' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看下一组技术部项目' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '跳转到底片夹' })).toHaveTextContent('01');
    expect(screen.getByRole('button', { name: '跳转到教程资源库' })).toHaveTextContent('04');
    expect(screen.getByRole('button', { name: '跳转到技术部讨论区' })).toHaveTextContent('07');
    expect(screen.getByRole('link', { name: /我们在大量的抽象中发现了少量的技术/ })).toHaveAttribute('href', expect.stringContaining('bilibili.com/video/'));
  });
});
