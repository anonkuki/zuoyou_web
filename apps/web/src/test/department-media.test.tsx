import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ClosingPanel } from '../components/departments/DeptShowcasePage';
import { DepartmentMediaShelf } from '../components/departments/DepartmentMediaShelf';
import { departmentMediaBySlug, officialSocialLinks } from '../components/departments/department-media';
import { PixelFooter } from '../components/home/PixelFooter';
import { showcaseBySlug } from '../components/departments/showcase-data';
import { DepartmentPhotoGallery } from '../components/departments/DepartmentPhotoGallery';
import { departmentPhotosBySlug } from '../components/departments/department-photos';

const expectedBvids = {
  cos: ['BV1Vr7YzLE1R', 'BV14MjozwE8G', 'BV1XkFoe6Esm', 'BV1yE4m1R7kw', 'BV11H4y1F7Q9'],
  tech: ['BV1t9ZaBUELx', 'BV1AC98YeE86'],
  music: ['BV1XhVn6UED5', 'BV1ZgGJ6nEri', 'BV1K3ZTBGEmc', 'BV11zFZeaE6n', 'BV1EZA5e3Emv'],
  original: ['BV1ADfuBjEEt', 'BV1KVG3z4EXM', 'BV18YcFe5Eec', 'BV1JU411S73i', 'BV1py421i7GC'],
  dance: ['BV1NA8G6REDQ', 'BV1Xmui6EEjE', 'BV1YxuA6sEKU', 'BV1UHZSBeEsX', 'BV1nyuvzkEMa', 'BV1dvFoeLEhH'],
} as const;

const publicityArticleLinks = [
  'https://mp.weixin.qq.com/s/Of4MI-SvXnBQoLY4EW2oyg',
  'https://mp.weixin.qq.com/s/S0-FgJ9kIJvsB97VFLFHKg',
  'https://mp.weixin.qq.com/s/D2YyNO8wd1Y-igN2eAV--g',
  'https://mp.weixin.qq.com/s/40Of7EsTTt7jVfbTaco7pw',
  'https://mp.weixin.qq.com/s/slEZZgjRLXICgG5mKQ3MXA',
] as const;

describe('department social media shelf', () => {
  it('indexes real and fallback photos for all six departments', () => {
    expect(Object.keys(departmentPhotosBySlug).sort()).toEqual(['cos', 'dance', 'music', 'original', 'publicity', 'tech']);
    expect(departmentPhotosBySlug.tech.length).toBeGreaterThan(6);
    expect(departmentPhotosBySlug.tech.every(photo => photo.src.startsWith('/assets/photos/departments/tech/'))).toBe(true);
    expect(departmentPhotosBySlug.dance).toHaveLength(6);
    expect(departmentPhotosBySlug.dance.every(photo => photo.src.startsWith('/assets/photos/departments/dance/'))).toBe(true);
    expect(departmentPhotosBySlug.publicity.length).toBeGreaterThan(6);
    expect(departmentPhotosBySlug.publicity.every(photo => photo.src.startsWith('/assets/photos/departments/publicity-fantasy/'))).toBe(true);
    expect(showcaseBySlug.tech.intro).toMatch(/视频制作.*摄影.*道具制作/);
    expect(showcaseBySlug.tech.intro).toMatch(/Premiere Pro.*After Effects/);
    expect(showcaseBySlug.publicity.intro).toContain('动漫鉴赏');
  });

  it('turns a large technical photo set into an operable carousel', async () => {
    const user = userEvent.setup();
    render(<DepartmentPhotoGallery slug="tech" />);

    const gallery = screen.getByRole('region', { name: '技术部照片实录' });
    expect(within(gallery).getByText(`1 / ${departmentPhotosBySlug.tech.length}`)).toBeInTheDocument();
    expect(within(gallery).getByRole('img', { name: departmentPhotosBySlug.tech[0].alt })).toBeInTheDocument();

    await user.click(within(gallery).getByRole('button', { name: '下一张照片' }));
    expect(within(gallery).getByText(`2 / ${departmentPhotosBySlug.tech.length}`)).toBeInTheDocument();
    expect(within(gallery).getByText(departmentPhotosBySlug.tech[1].caption)).toBeInTheDocument();

    await user.click(within(gallery).getByRole('button', { name: `查看第 4 张照片：${departmentPhotosBySlug.tech[3].caption}` }));
    expect(within(gallery).getByText(`4 / ${departmentPhotosBySlug.tech.length}`)).toBeInTheDocument();

    await user.click(within(gallery).getByRole('button', { name: '上一张照片' }));
    expect(within(gallery).getByText(`3 / ${departmentPhotosBySlug.tech.length}`)).toBeInTheDocument();
  });

  it('turns six or more department photos into a carousel', () => {
    render(<DepartmentPhotoGallery slug="dance" />);
    const gallery = screen.getByRole('region', { name: '舞装部照片实录' });
    expect(within(gallery).getByRole('button', { name: '下一张照片' })).toBeInTheDocument();
  });

  it('supports horizontal touch gestures without reacting to vertical page scrolling', () => {
    render(<DepartmentPhotoGallery slug="publicity" />);
    const gallery = screen.getByRole('region', { name: '外宣&幻想研照片实录' });
    const stage = within(gallery).getByLabelText('照片轮播，使用左右方向键或滑动切换');

    fireEvent.touchStart(stage, { touches: [{ clientX: 310, clientY: 120 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 220, clientY: 126 }] });
    expect(within(gallery).getByText('2 / 14', { exact: true })).toBeInTheDocument();

    fireEvent.touchStart(stage, { touches: [{ clientX: 220, clientY: 120 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 215, clientY: 205 }] });
    expect(within(gallery).getByText('2 / 14', { exact: true })).toBeInTheDocument();
  });

  it('keeps a short fallback set as an editorial grid instead of a carousel', () => {
    render(<DepartmentPhotoGallery slug="cos" />);
    const gallery = screen.getByRole('region', { name: 'COS部照片实录' });
    expect(gallery).toBeInTheDocument();
    expect(within(gallery).queryByRole('button', { name: '下一张照片' })).not.toBeInTheDocument();
  });

  it('maps every supplied department video to its matching department', () => {
    expect(Object.keys(departmentMediaBySlug).sort()).toEqual(['cos', 'dance', 'music', 'original', 'publicity', 'tech']);
    for (const [slug, bvids] of Object.entries(expectedBvids)) {
      const entry = departmentMediaBySlug[slug];
      expect(entry.videos?.map(video => video.bvid)).toEqual(bvids);
      for (const video of entry.videos ?? []) {
        expect(video.href).toBe(`https://www.bilibili.com/video/${video.bvid}`);
        expect(video.cover).toMatch(/^https:\/\/i\d\.hdslb\.com\/bfs\/archive\//);
        expect(video.title.length).toBeGreaterThan(8);
      }
    }
    expect(departmentMediaBySlug.publicity.videos).toBeUndefined();
  });

  it('keeps publicity and Fantasy Lab articles together without pretending QQ is a public feed', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<DepartmentMediaShelf slug="publicity" />);

    expect(screen.getByRole('heading', { name: '外宣&幻想研近期推送' })).toBeInTheDocument();
    const articleLinks = screen.getAllByRole('link', { name: /在微信公众号阅读/ });
    expect(articleLinks.map(link => link.getAttribute('href'))).toEqual(publicityArticleLinks);
    expect(screen.queryByRole('link', { name: /在哔哩哔哩观看/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '打开佐佑动漫社 2025 年度总结网站' })).toHaveAttribute(
      'href',
      'https://anonkuki.github.io/Zuoyou-Anime-Club-2025-Annual-Summary/',
    );
    await user.click(screen.getByRole('button', { name: '复制 QQ 频道号 pd17345257' }));
    expect(writeText).toHaveBeenCalledWith('pd17345257');
    expect(screen.getByText('频道号已复制')).toBeInTheDocument();
  });

  it('mounts the matching media link inside a department detail closing panel', () => {
    const show = showcaseBySlug.cos;
    render(<MemoryRouter><ClosingPanel
      dept={{ slug: 'cos', name: 'COS部', title: '幻术师', description: '服装、妆造与角色演绎', memberCount: 14 }}
      show={show}
    /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /那一天的cos，接力起来/ })).toHaveAttribute('href', `https://www.bilibili.com/video/${expectedBvids.cos[0]}`);
  });

  it('turns footer social actions into real external destinations', () => {
    render(<MemoryRouter><PixelFooter /></MemoryRouter>);
    const follow = screen.getByRole('heading', { name: '关注我们' }).closest('section');
    expect(follow).not.toBeNull();
    expect(within(follow!).getByRole('link', { name: '访问佐佑动漫社哔哩哔哩主页' })).toHaveAttribute('href', officialSocialLinks.bilibili);
    expect(within(follow!).getByRole('link', { name: '阅读佐佑动漫社微信公众号' })).toHaveAttribute('href', officialSocialLinks.wechat);
    expect(within(follow!).queryByRole('button', { name: '小红书' })).not.toBeInTheDocument();
  });
});
