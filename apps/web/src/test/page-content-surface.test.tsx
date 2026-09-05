import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DepartmentPhotoGallery } from '../components/departments/DepartmentPhotoGallery';
import { departmentPhotosBySlug } from '../components/departments/department-photos';
import { PageContentSurface } from '../components/page-content/PageContentSurface';

afterEach(() => vi.unstubAllGlobals());

describe('editable page image presentation', () => {
  it('merges editor photos into the department carousel and previews external links', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: {
        pageKey: 'department:cos', updatedAt: null,
        config: {
          hiddenSectionIds: [], hiddenImageUrls: [],
          items: [{ id: 'added-photo', sectionId: 'department-photo-gallery', title: '编辑器新增照片', body: '相册说明', imageUrl: '/assets/test-added.webp', linkUrl: null }],
          imageLinks: [{ imageUrl: departmentPhotosBySlug.cos[0].src, linkUrl: 'https://example.com/activity/2026' }],
        },
      } }),
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><PageContentSurface
      pageKey="department:cos"
      sections={[{ id: 'department-photo-gallery', name: '部门照片展示' }]}
      editTo="/admin/page-editor/department/cos"
      canEdit={false}
    ><DepartmentPhotoGallery slug="cos" /></PageContentSurface></MemoryRouter></QueryClientProvider>);

    const gallery = await screen.findByRole('region', { name: 'COS部照片实录' });
    expect(await within(gallery).findByText('1 / 8', { exact: true })).toBeInTheDocument();
    expect(within(gallery).getByRole('button', { name: '查看第 8 张照片：编辑器新增照片' })).toBeInTheDocument();
    expect(screen.queryByText('相册说明')).not.toBeInTheDocument();

    fireEvent.mouseMove(within(gallery).getByText(departmentPhotosBySlug.cos[0].caption));
    const linkPreview = screen.getByRole('status');
    expect(linkPreview.parentElement).toBe(document.body);
    expect(within(linkPreview).getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('/activity/2026')).toBeInTheDocument();

    await userEvent.click(within(gallery).getByRole('button', { name: '查看第 8 张照片：编辑器新增照片' }));
    const added = within(gallery).getByRole('img', { name: '编辑器新增照片' });
    fireEvent.click(within(gallery).getByText('编辑器新增照片'));
    expect(added.closest('figure')).not.toHaveClass('is-page-image-expanded');
    const preview = screen.getByRole('dialog', { name: '图片悬浮预览' });
    expect(preview.parentElement).toBe(document.body);
    expect(within(preview).getByRole('img', { name: '编辑器新增照片' })).toBeInTheDocument();
    await userEvent.click(preview);
    expect(screen.queryByRole('dialog', { name: '图片悬浮预览' })).not.toBeInTheDocument();
  });
});
