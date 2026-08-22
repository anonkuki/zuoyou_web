import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GuildScrollStory } from '../components/home/GuildScrollStory';

describe('GuildScrollStory', () => {
  it('lays out three navigable chapters as one continuous downward story', () => {
    render(<MemoryRouter><GuildScrollStory /></MemoryRouter>);

    const story = screen.getByLabelText('佐佑动漫社滚动介绍');
    expect(story).toHaveAttribute('data-scroll-layout', 'continuous');
    expect(story.querySelector('.scroll-story-sticky')).not.toBeInTheDocument();
    expect(within(story).getAllByRole('article').map((chapter) => chapter.getAttribute('data-scroll-section'))).toEqual([
      'origin',
      'departments',
      'freedom',
    ]);
    expect(within(story).getByRole('heading', { name: '从 Virus 漫画社，到佐佑动漫社' })).toBeInTheDocument();
    expect(within(story).getByText(/1999年3月/)).toBeInTheDocument();
    expect(within(story).getByText(/2013年/)).toBeInTheDocument();
    expect(within(story).getByText('自由度高')).toBeInTheDocument();
    expect(within(story).getByText('综合性强')).toBeInTheDocument();

    const freedomChapter = story.querySelector('[data-scroll-section="freedom"]');
    expect(freedomChapter).not.toBeNull();
    const freedomGallery = within(freedomChapter as HTMLElement).getByLabelText('创作作品拼贴');
    expect(freedomGallery.querySelectorAll('figure img')).toHaveLength(3);
    expect(within(freedomChapter as HTMLElement).getByLabelText('创作原则')).toHaveTextContent('自由度高');
    expect(within(freedomChapter as HTMLElement).getByLabelText('创作原则')).toHaveTextContent('综合性强');

    const departmentList = within(story).getByLabelText('六个创作部门');
    ['COS', '原创', '舞装', '轻音', '技术', '外宣&幻想研'].forEach((name) => {
      expect(within(departmentList).getByText(name)).toBeInTheDocument();
    });

    expect(within(story).getByRole('link', { name: '翻阅社团历史' })).toHaveAttribute('href', '/history');
    expect(within(story).getByRole('link', { name: '进入六个部门' })).toHaveAttribute('href', '/departments');
  });
});
