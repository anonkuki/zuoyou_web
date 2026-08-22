import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GuildScrollStory } from '../components/home/GuildScrollStory';

describe('GuildScrollStory', () => {
  it('turns the supplied club history into three navigable scroll chapters', () => {
    render(<MemoryRouter><GuildScrollStory /></MemoryRouter>);

    const story = screen.getByLabelText('佐佑动漫社滚动介绍');
    expect(story).toHaveAttribute('data-scroll-story', 'three-chapter');
    expect(within(story).getAllByRole('article')).toHaveLength(3);
    expect(within(story).getByRole('heading', { name: '从 Virus 漫画社，到佐佑动漫社' })).toBeInTheDocument();
    expect(within(story).getByText(/1999年3月/)).toBeInTheDocument();
    expect(within(story).getByText(/2013年/)).toBeInTheDocument();
    expect(within(story).getByText('自由度高')).toBeInTheDocument();
    expect(within(story).getByText('综合性强')).toBeInTheDocument();

    const departmentList = within(story).getByLabelText('六个创作部门');
    ['COS', '原创', '舞装', '轻音', '技术', '外宣&幻想研'].forEach((name) => {
      expect(within(departmentList).getByText(name)).toBeInTheDocument();
    });

    expect(within(story).getByRole('link', { name: '翻阅社团历史' })).toHaveAttribute('href', '/history');
    expect(within(story).getByRole('link', { name: '进入六个部门' })).toHaveAttribute('href', '/departments');
  });
});
