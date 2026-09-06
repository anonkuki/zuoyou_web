import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MusicShowcase } from '../components/departments/showcase/MusicShowcase';
import { showcaseBySlug } from '../components/departments/showcase-data';
import { PageContentSurface } from '../components/page-content/PageContentSurface';
import { departmentPageSections } from '../pages-page-editor';

afterEach(() => vi.unstubAllGlobals());

const department = {
  id: 'dept-music', slug: 'music', name: '轻音部', title: '吟游诗人', description: '乐队排练、歌曲编排与现场演出', memberCount: 8,
};

describe('music department showcase', () => {
  it('keeps the lyric hero and members, removes instruments, and retains every activity photo', () => {
    render(<MemoryRouter><MusicShowcase dept={department} show={showcaseBySlug.music} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: '轻音部', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '成员配置卡' })).toBeInTheDocument();
    expect(screen.getAllByText('主唱').length).toBeGreaterThan(0);
    expect(screen.queryByText('乐器', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '原创曲目' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '排练视频' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /轻音部排练与演出照片/ })).toHaveLength(11);
    expect(screen.getByRole('button', { name: '查看下一组活动影像' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '章节导航' }).closest('main')).toBeNull();
  });

  it('integrates editor-provided Bilibili cards into both video sections', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: {
        pageKey: 'department:music', updatedAt: null,
        config: {
          hiddenSectionIds: [], hiddenImageUrls: [], imageLinks: [],
          items: [
            { id: 'member', sectionId: 'music-members', title: '小音', body: '喜欢一起排练。', imageUrl: '/assets/member.jpg', linkUrl: null, instrument: '贝斯' },
            { id: 'track', sectionId: 'music-tracklist', title: '新增原创曲', body: '原创作品说明', imageUrl: 'https://i0.hdslb.com/track.jpg', linkUrl: 'https://www.bilibili.com/video/BV1tracktest' },
            { id: 'rehearsal', sectionId: 'music-rehearsal', title: '新生合奏排练', body: '排练记录', imageUrl: 'https://i0.hdslb.com/rehearsal.jpg', linkUrl: 'https://www.bilibili.com/video/BV1rehearse' },
          ],
        },
      } }),
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><PageContentSurface
      pageKey="department:music"
      sections={departmentPageSections('music')}
      editTo="/admin/page-editor/department/music"
      canEdit={false}
    ><MusicShowcase dept={department} show={showcaseBySlug.music} /></PageContentSurface></MemoryRouter></QueryClientProvider>);

    const track = await screen.findByRole('link', { name: /新增原创曲/ });
    const rehearsal = await screen.findByRole('link', { name: /新生合奏排练/ });
    expect(track).toHaveAttribute('href', 'https://www.bilibili.com/video/BV1tracktest');
    expect(rehearsal).toHaveAttribute('href', 'https://www.bilibili.com/video/BV1rehearse');
    expect(track.querySelector('img')).toHaveAttribute('src', 'https://i0.hdslb.com/track.jpg');
    const memberCard = screen.getByRole('img', { name: '小音' }).closest('article');
    expect(memberCard).not.toBeNull();
    expect(memberCard?.querySelector('.music-member-name')).toHaveTextContent('小音');
    expect(memberCard?.querySelector('.music-member-instrument')).toHaveTextContent('贝斯 BASS');
    expect(memberCard?.querySelector('.music-member-details p')).toHaveTextContent('喜欢一起排练。');
    expect(memberCard?.querySelector('.music-member-tag')).toHaveTextContent('GROOVE');
  });
});
