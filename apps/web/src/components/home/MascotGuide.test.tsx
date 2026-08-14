import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MascotGuide } from './MascotGuide';

describe('MascotGuide', () => {
  it('offers a complete keyboard-friendly welcome conversation', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><MascotGuide /></MemoryRouter>);

    expect(screen.getByRole('dialog', { name: '佑子的公会向导' })).toBeInTheDocument();
    expect(screen.getByText('我是看板娘佑子。第一次来佐佑的话，就从大厅慢慢逛起吧。')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '佐佑动漫社看板娘佑子' })).toHaveAttribute('src', '/assets/brand/youzi-mascot.png');

    await user.click(screen.getByRole('button', { name: '下一句' }));
    expect(await screen.findByText('六个部门都在楼下摆好了介绍牌，看看哪一处最合你的兴趣。')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '看看六个部门' })).toHaveAttribute('href', '/departments');

    await user.click(screen.getByRole('button', { name: '关闭佑子向导' }));
    expect(await screen.findByRole('button', { name: '和佑子说话' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '佑子的公会向导' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '和佑子说话' }));
    expect(screen.getByRole('dialog', { name: '佑子的公会向导' })).toBeInTheDocument();
  });

  it('shows a selected scene character without inventing a game system', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<MemoryRouter><MascotGuide speaker={{ name: '阿澄', role: 'COS部 · 服装与角色', line: '下午要整理衣装间，想来搭把手吗？' }} onClearSpeaker={onClear} /></MemoryRouter>);

    expect(screen.getByText('阿澄')).toBeInTheDocument();
    expect(screen.getByText('COS部 · 服装与角色')).toBeInTheDocument();
    expect(screen.getByText('下午要整理衣装间，想来搭把手吗？')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '回到佑子向导' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
