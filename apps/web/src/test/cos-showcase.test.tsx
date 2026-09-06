import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CosShowcase } from '../components/departments/showcase/CosShowcase';
import { showcaseBySlug } from '../components/departments/showcase-data';

const department = {
  id: 'dept-cos', slug: 'cos', name: 'COS部', title: '幻装使', description: '服装、妆造、道具与角色演绎', memberCount: 16,
};

describe('cos department showcase', () => {
  it('keeps the original hero and presents the complete compact COS archive', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><CosShowcase dept={department} show={showcaseBySlug.cos} /></MemoryRouter></QueryClientProvider>);
    expect(screen.getByRole('heading', { name: 'COS部', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '变身记录' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '镜头里的角色与伙伴' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '看看我们真的做过什么' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '漫展出展' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '衣装间' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /查看第 .* 张角色与伙伴照片/ })).toHaveLength(7);
    expect(screen.getByRole('button', { name: '查看下一组变身记录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看下一组COS部视频作品' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /COS部/ })).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: '跳转到COS部讨论区' })).toHaveTextContent('06');
  });
});
