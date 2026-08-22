import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ClosingPanel } from '../components/departments/DeptShowcasePage';
import { DepartmentMediaShelf } from '../components/departments/DepartmentMediaShelf';
import { departmentMediaBySlug, officialSocialLinks } from '../components/departments/department-media';
import { PixelFooter } from '../components/home/PixelFooter';
import { showcaseBySlug } from '../components/departments/showcase-data';

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
