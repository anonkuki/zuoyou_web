import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { HomeSocialOutposts } from '../components/home/HomeSocialOutposts';
import { officialSocialLinks } from '../components/departments/department-media';

afterEach(cleanup);

describe('HomeSocialOutposts', () => {
  it('introduces both publicity channels with previewable videos and direct article links', () => {
    render(<MemoryRouter><HomeSocialOutposts /></MemoryRouter>);

    const outposts = screen.getByRole('region', { name: '社团宣传阵地' });
    expect(within(outposts).getByRole('heading', { name: 'B站 · 动态影像阵地' })).toBeInTheDocument();
    expect(within(outposts).getByRole('heading', { name: '微信公众号 · 深度阅读阵地' })).toBeInTheDocument();
    expect(within(outposts).getByRole('link', { name: '访问佐佑动漫社哔哩哔哩主页' })).toHaveAttribute(
      'href',
      officialSocialLinks.bilibili,
    );
    expect(within(outposts).getAllByRole('button', { name: /预览视频/ })).toHaveLength(2);
    expect(within(outposts).getAllByRole('link', { name: /在哔哩哔哩打开/ })).toHaveLength(2);
    expect(within(outposts).getAllByRole('link', { name: /在微信公众号阅读/ })).toHaveLength(3);
  });

  it('previews a selected video through the official Bilibili player and closes the dialog', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><HomeSocialOutposts /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: /预览视频：.*横跨千年/ }));
    const dialog = screen.getByRole('dialog', { name: /正在预览：.*横跨千年/ });
    expect(within(dialog).getByTitle(/正在预览：.*横跨千年/)).toHaveAttribute(
      'src',
      'https://player.bilibili.com/player.html?bvid=BV1NA8G6REDQ&autoplay=0',
    );
    expect(within(dialog).getByRole('link', { name: /前往 B站观看完整视频/ })).toHaveAttribute(
      'href',
      'https://www.bilibili.com/video/BV1NA8G6REDQ',
    );

    await user.click(within(dialog).getByRole('button', { name: '关闭视频预览' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
