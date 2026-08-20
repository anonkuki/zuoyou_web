import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultAvatarConfig, type AvatarConfig } from '@guild/contracts';
import { App } from '../app';
import { PixelAvatar } from '../components/avatar/PixelAvatar';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { user: null } }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderAt(path = '/') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
    </QueryClientProvider>,
  );
}

const rectFills = (container: HTMLElement) => [...container.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill'));

describe('PixelAvatar builder', () => {
  it('renders different runs for different configs', () => {
    const a = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairColor: 'red' }} />);
    const fillsA = rectFills(a.container);
    a.unmount();
    const b = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairColor: 'blue' }} />);
    const fillsB = rectFills(b.container);
    expect(fillsA.length).toBeGreaterThan(10);
    expect(fillsA).not.toEqual(fillsB);
  });

  it('draws different geometry for bald and afro hairstyles', () => {
    const bald = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairStyle: 'bald' }} />);
    const baldCount = bald.container.querySelectorAll('rect').length;
    bald.unmount();
    const afro = render(<PixelAvatar config={{ ...defaultAvatarConfig, hairStyle: 'afro' }} />);
    expect(afro.container.querySelectorAll('rect').length).toBeGreaterThan(baldCount);
  });

  it('derives a stable avatar from a seed when no config is given', () => {
    const a = render(<PixelAvatar seed="user-abc" />);
    const fillsA = rectFills(a.container);
    a.unmount();
    const b = render(<PixelAvatar seed="user-abc" />);
    expect(rectFills(b.container)).toEqual(fillsA);
  });

  it('exposes dir and moving state for CSS flipping and walk cycles', () => {
    const { container } = render(<PixelAvatar config={defaultAvatarConfig} dir="left" moving />);
    const svg = container.querySelector('svg.pixel-avatar');
    expect(svg).toHaveAttribute('data-dir', 'left');
    expect(svg).toHaveAttribute('data-moving', 'true');
  });
});

describe('Avatar studio page', () => {
  const savedConfig: AvatarConfig = { ...defaultAvatarConfig, hairStyle: 'short', accent: 'rose' };

  it('loads the saved config, edits hair style and persists via PATCH', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const profile = { ...authUser, departmentName: 'COS部', presence: 'ONLINE', avatarConfig: savedConfig };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile' && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true, data: { updated: true, profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/profile') return new Response(JSON.stringify({ ok: true, data: { profile } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/portal/avatar');
    expect(await screen.findByRole('heading', { name: '像素形象工房' })).toBeInTheDocument();
    // 已保存的发型应处于选中态
    expect(await screen.findByRole('button', { name: /短发/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /双马尾/ }));
    expect(screen.getByRole('button', { name: /双马尾/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /短发/ })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: /保存像素形象/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/member/profile', expect.objectContaining({ method: 'PATCH' })));
    const patchCall = fetchMock.mock.calls.find(([path, init]) => path === '/api/member/profile' && (init as RequestInit)?.method === 'PATCH');
    const body = JSON.parse(String(patchCall?.[1]?.body)) as { avatarConfig: AvatarConfig };
    expect(body.avatarConfig.hairStyle).toBe('twintails');
    expect(body.avatarConfig.accent).toBe('rose');
    expect(await screen.findByText('像素形象已保存')).toBeInTheDocument();
  });
});

describe('World area theming', () => {
  it('decorates every lobby card with its area theme class and props', async () => {
    const authUser = { id: 'user-member', username: 'cos.member', displayName: '白羽见习者', email: 'member@example.com', role: 'MEMBER', departmentId: 'dept-cos', bio: '', guildTitle: '', college: '', grade: '', skills: [], interests: [], attributes: ['cosplay'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' };
    const areas = [
      { id: 'hall', name: '公会大厅广场', color: '#c99a45', departmentSlug: null, online: 3 },
      { id: 'publicity', name: '外宣部据点', color: '#e0342f', departmentSlug: 'publicity', online: 0 },
      { id: 'tech', name: '技术部工房', color: '#ff9f43', departmentSlug: 'tech', online: 1 },
      { id: 'original', name: '原创部画室', color: '#f7a8b8', departmentSlug: 'original', online: 0 },
      { id: 'dance', name: '舞装部舞台', color: '#ff4d8d', departmentSlug: 'dance', online: 0 },
      { id: 'cos', name: 'COS部幻装间', color: '#d6336c', departmentSlug: 'cos', online: 2 },
      { id: 'music', name: '轻音部琴房', color: '#f5c96b', departmentSlug: 'music', online: 0 },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = typeof input === 'string' ? input : input.toString();
      if (path === '/api/auth/session') return new Response(JSON.stringify({ ok: true, data: { user: authUser } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/api/member/world/areas') return new Response(JSON.stringify({ ok: true, data: { items: areas } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = renderAt('/portal/world');
    expect(await screen.findByRole('heading', { name: '像素广场' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '公会大厅广场' })).toBeInTheDocument();
    for (const id of ['hall', 'publicity', 'tech', 'original', 'dance', 'cos', 'music']) {
      const scene = container.querySelector(`.world-area-scene.theme-${id}`);
      expect(scene, `theme-${id} card`).not.toBeNull();
      expect(scene?.querySelector('.world-prop'), `theme-${id} props`).not.toBeNull();
    }
  });
});
