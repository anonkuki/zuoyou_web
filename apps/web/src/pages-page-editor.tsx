import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, ImagePlus, Link2, Plus, Save, Trash2 } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { isExecutiveRole } from '@guild/contracts';
import { api, json } from './api';
import { useAuth } from './auth';
import { departmentPhotosBySlug, originalPortfolioPhotos } from './components/departments/department-photos';
import { showcaseBySlug } from './components/departments/showcase-data';
import { TechGuestbook } from './components/departments/TechGuestbook';
import {
  emptyPageContentConfig, pageContentQueryKey, type PageContentConfig, type PageContentItem,
  type PageContentResponse, type PageSectionDefinition,
} from './components/page-content/PageContentSurface';

const departmentSectionIds: Record<string, string[]> = {
  publicity: ['publicity-show', 'publicity-films', 'publicity-press'],
  tech: ['tech-focus', 'tech-sheet', 'tech-exif'],
  music: ['music-playing', 'music-tracklist', 'music-rehearsal'],
  original: ['original-atelier', 'original-gallery', 'original-toolbox'],
  dance: ['dance-floor', 'dance-setlist', 'dance-backstage'],
  cos: ['cos-mirror', 'cos-henshin', 'cos-wardrobe'],
};

const bilibiliVideoSectionIds = new Set(['music-tracklist', 'music-rehearsal', 'department-media-shelf']);

interface BilibiliPreview {
  bvid: string;
  title: string;
  cover: string;
  href: string;
  duration: string;
  publishedAt: string;
}

export const homePageSections: PageSectionDefinition[] = [
  { id: 'home-hero', name: '首页主视觉', description: '首页顶部的公会介绍与角色入口' },
  { id: 'home-story', name: '社团故事', description: '滚动浏览的社团介绍内容' },
  { id: 'home-social', name: '社团动态', description: '社团外部平台与近期动态' },
  { id: 'home-tavern', name: '冒险者酒馆', description: '置顶贴和最新发帖' },
  { id: 'home-entry', name: '大厅入口', description: '快捷入口与大厅告示板' },
];

export function departmentPageSections(slug: string): PageSectionDefinition[] {
  const show = showcaseBySlug[slug];
  const ids = departmentSectionIds[slug] ?? [];
  if (slug === 'tech') return [
    { id: 'tech-focus', name: '技术部主视觉', description: 'TECH DEPARTMENT' },
    { id: 'tech-sheet', name: '底片夹', description: '技术部精选底片横向轮播' },
    { id: 'department-photo-gallery', name: '取景器后的现场记录', description: '技术部全部活动照片轮播' },
    { id: 'department-media-shelf', name: '项目作品', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    { id: 'tech-tutorials', name: '教程资源库', description: '教程、经验与外部资源' },
    { id: 'tech-exif', name: '常见问题与加入我们', description: '部门介绍与加入入口' },
    { id: 'department-post-board', name: '部门讨论区', description: '置顶帖与普通帖子' },
  ];
  if (slug === 'dance') return [
    { id: 'dance-stage', name: '舞装部主视觉', description: '保留原有星轨舞台版头' },
    { id: 'dance-floor', name: '成员介绍', description: '成员照片、姓名和个人介绍' },
    { id: 'dance-setlist', name: '节目单', description: '舞台节目的名称与介绍' },
    { id: 'department-photo-gallery', name: '舞台记忆', description: '排练、演出和谢幕照片轮播' },
    { id: 'department-media-shelf', name: '作品记录', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    { id: 'dance-backstage', name: '演出曲目库', description: '演出曲目、出处与筹备记录' },
    { id: 'dance-join', name: '加入舞装部', description: '部门介绍、加入入口与常见问题' },
    { id: 'department-post-board', name: '舞装部讨论区', description: '置顶帖与普通帖子' },
  ];
  if (slug === 'original') return [
    { id: 'original-atelier', name: '原创部主视觉', description: '保留原有梦色画室版头' },
    { id: 'original-gallery', name: '作品集锦', description: '原创作品图片轮播' },
    { id: 'original-characters', name: 'OC / 设定集', description: '角色图片、名称与设定介绍' },
    { id: 'department-photo-gallery', name: '一起创作的日常', description: '原创部周常活动照片轮播' },
    { id: 'department-media-shelf', name: '作品记录', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    { id: 'original-toolbox', name: '画具箱', description: '创作教程、投稿规范和外部资源' },
    { id: 'original-join', name: '加入原创部', description: '部门介绍与加入入口' },
    { id: 'department-post-board', name: '原创讨论区', description: '置顶帖与普通帖子' },
  ];
  const themed = slug === 'music'
    ? [
      { id: 'music-playing', name: '轻音部主视觉', description: 'LIGHT MUSIC DEPARTMENT' },
      { id: 'music-members', name: '成员配置卡', description: 'MEMBERS' },
      { id: 'music-tracklist', name: '原创曲目', description: '粘贴 B 站链接，自动获取视频封面和标题' },
      { id: 'music-rehearsal', name: '排练视频', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    ]
    : show?.sections.map((section, index) => ({ id: ids[index] ?? `${slug}-section-${index + 1}`, name: section.zh, description: section.en })) ?? [];
  return [
    ...themed,
    { id: 'department-photo-gallery', name: '部门照片展示', description: '部门活动与作品照片' },
    ...(slug === 'music'
      ? [{ id: 'music-recruitment', name: '成员招募', description: '轻音部简介、成员数量与加入入口' }]
      : [{ id: 'department-media-shelf', name: '社团实录', description: '视频与图文内容' }]),
    { id: 'department-post-board', name: '部门讨论区', description: '置顶帖与普通帖子' },
  ];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="page-editor-field"><span>{label}</span>{children}</label>;
}

export function PageEditorPage({ scope }: { scope: 'home' | 'department' }) {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pageKey = scope === 'home' ? 'home' : `department:${slug}`;
  const returnTo = scope === 'home' ? '/' : `/departments/${slug}`;
  const sections = useMemo(() => scope === 'home' ? homePageSections : departmentPageSections(slug), [scope, slug]);
  const allowed = Boolean(user && (isExecutiveRole(user.role) || (scope === 'department' && user.role !== 'MEMBER' && user.departmentId === `dept-${slug}`)));
  const query = useQuery({ queryKey: pageContentQueryKey(pageKey), queryFn: () => api<PageContentResponse>(`/api/public/page-content/${encodeURIComponent(pageKey)}`), enabled: allowed });
  const [draft, setDraft] = useState<PageContentConfig>(emptyPageContentConfig);
  const [saved, setSaved] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [videoLoadingId, setVideoLoadingId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<Record<string, string>>({});
  const [tutorialFileLoadingId, setTutorialFileLoadingId] = useState<string | null>(null);
  const [tutorialFileError, setTutorialFileError] = useState<Record<string, string>>({});

  useEffect(() => { if (query.data) setDraft(query.data.config); }, [query.data]);

  const knownImages = useMemo(() => {
    if (scope === 'home') return [];
    const show = showcaseBySlug[slug];
    return [...new Set([
      ...(departmentPhotosBySlug[slug] ?? []).map(photo => photo.src),
      ...(slug === 'original' ? originalPortfolioPhotos.map(photo => photo.src) : []),
      ...(show?.films.flatMap(film => [film.cover, film.banner]) ?? []),
    ].filter(Boolean))];
  }, [scope, slug]);

  const save = useMutation({
    mutationFn: () => api<PageContentResponse>(`/api/admin/page-content/${encodeURIComponent(pageKey)}`, json('PUT', draft)),
    onSuccess: data => {
      setDraft(data.config);
      queryClient.setQueryData(pageContentQueryKey(pageKey), data);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  if (!allowed) return <Navigate to={returnTo} replace />;
  if (query.isLoading) return <main className="page-editor shell"><p>正在读取页面内容……</p></main>;

  const toggleSection = (sectionId: string) => setDraft(current => ({
    ...current,
    hiddenSectionIds: current.hiddenSectionIds.includes(sectionId)
      ? current.hiddenSectionIds.filter(id => id !== sectionId)
      : [...current.hiddenSectionIds, sectionId],
  }));
  const addItem = (sectionId: string) => setDraft(current => ({
    ...current,
    items: [...current.items, {
      id: `page-item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sectionId,
      title: sectionId === 'music-members' ? '' : '新增内容',
      body: '', imageUrl: null, linkUrl: null,
      ...(sectionId === 'music-members' ? { instrument: '主唱' as const } : {}),
    }],
  }));
  const updateItem = (id: string, update: Partial<PageContentItem>) => setDraft(current => ({ ...current, items: current.items.map(item => item.id === id ? { ...item, ...update } : item) }));
  const deleteItem = (id: string) => setDraft(current => ({ ...current, items: current.items.filter(item => item.id !== id) }));
  const fetchBilibiliPreview = async (itemId: string, value: string) => {
    const url = value.trim();
    if (!url) return;
    setVideoLoadingId(itemId);
    setVideoError(current => ({ ...current, [itemId]: '' }));
    try {
      const preview = await api<BilibiliPreview>(`/api/admin/bilibili-preview?url=${encodeURIComponent(url)}`);
      updateItem(itemId, { title: preview.title, imageUrl: preview.cover, linkUrl: preview.href });
    } catch (error) {
      setVideoError(current => ({ ...current, [itemId]: error instanceof Error ? error.message : '读取视频信息失败' }));
    } finally {
      setVideoLoadingId(current => current === itemId ? null : current);
    }
  };
  const uploadTutorialFile = async (itemId: string, file: File) => {
    setTutorialFileLoadingId(itemId);
    setTutorialFileError(current => ({ ...current, [itemId]: '' }));
    const body = new FormData();
    body.append('visibility', 'PUBLIC');
    body.append('category', 'OTHER');
    body.append('departmentId', 'dept-tech');
    body.append('file', file);
    try {
      const uploaded = await api<{ id: string; name: string }>('/api/admin/files/upload', { method: 'POST', body });
      updateItem(itemId, { title: uploaded.name, linkUrl: `/api/files/${uploaded.id}/content` });
    } catch (error) {
      setTutorialFileError(current => ({ ...current, [itemId]: error instanceof Error ? error.message : '文件上传失败' }));
    } finally {
      setTutorialFileLoadingId(current => current === itemId ? null : current);
    }
  };
  const addImageLink = () => {
    const imageUrl = newImageUrl.trim();
    const linkUrl = newLinkUrl.trim();
    if (!imageUrl || !linkUrl) return;
    setDraft(current => ({ ...current, imageLinks: [...current.imageLinks.filter(item => item.imageUrl !== imageUrl), { imageUrl, linkUrl }] }));
    setNewImageUrl(''); setNewLinkUrl('');
  };
  const toggleImageVisibility = (imageUrl: string) => setDraft(current => ({
    ...current,
    hiddenImageUrls: current.hiddenImageUrls.includes(imageUrl)
      ? current.hiddenImageUrls.filter(url => url !== imageUrl)
      : [...current.hiddenImageUrls, imageUrl],
  }));

  return <main className="page-editor shell">
    <header className="page-editor-heading">
      <div><Link to={returnTo}><ArrowLeft aria-hidden="true" /> 返回页面</Link><span>PAGE WORKSHOP</span><h1>{scope === 'home' ? '编辑社团主页' : `编辑${showcaseBySlug[slug]?.theme ?? '部门'}页面`}</h1><p>隐藏原有板块，或在指定板块末尾添加文字和图片。保存后所有访客都能看到更新。</p></div>
      <button className="guild-button" type="button" onClick={() => save.mutate()} disabled={save.isPending}><Save aria-hidden="true" /> {save.isPending ? '保存中…' : '保存页面'}</button>
    </header>
    {saved && <p className="page-editor-success" role="status">页面内容已保存。</p>}
    {save.error && <p className="page-editor-error" role="alert">{save.error.message}</p>}

    <section className="page-editor-panel">
      <div className="page-editor-panel-title"><div><small>01 / SECTIONS</small><h2>板块内容</h2></div><p>“隐藏”会暂时移除原有板块；已经新增的内容可以逐条修改或删除。</p></div>
      <div className="page-editor-sections">
        {sections.map(section => {
          const hidden = draft.hiddenSectionIds.includes(section.id);
          const items = draft.items.filter(item => item.sectionId === section.id);
          return <article className={`page-editor-section ${hidden ? 'is-hidden' : ''}`} key={section.id}>
            <header><div><h3>{section.name}</h3>{section.description && <p>{section.description}</p>}</div><button type="button" onClick={() => toggleSection(section.id)}>{hidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}{hidden ? '恢复板块' : '隐藏板块'}</button></header>
            <div className="page-editor-items">
              {items.map(item => {
                const isMusicMember = scope === 'department' && slug === 'music' && section.id === 'music-members';
                const isTechTutorial = scope === 'department' && slug === 'tech' && section.id === 'tech-tutorials';
                return <div className="page-editor-item" key={item.id}>
                <Field label={isMusicMember ? '姓名' : '标题'}><input value={item.title} maxLength={120} onChange={event => updateItem(item.id, { title: event.target.value })} /></Field>
                {isMusicMember && <Field label="乐器"><select value={item.instrument ?? '主唱'} onChange={event => updateItem(item.id, { instrument: event.target.value as PageContentItem['instrument'] })}>
                  {['主唱', '吉他', '贝斯', '鼓手', '键盘'].map(instrument => <option value={instrument} key={instrument}>{instrument}</option>)}
                </select></Field>}
                <Field label={isMusicMember ? '介绍你自己' : '正文'}><textarea value={item.body} maxLength={4000} rows={4} onChange={event => updateItem(item.id, { body: event.target.value })} /></Field>
                {scope === 'department' && ((slug === 'music' && bilibiliVideoSectionIds.has(section.id)) || (slug === 'tech' && section.id === 'department-media-shelf')) ? <div className="page-editor-video-source">
                  <Field label="B站视频链接"><input value={item.linkUrl ?? ''} placeholder="https://www.bilibili.com/video/BV..." onChange={event => updateItem(item.id, { linkUrl: event.target.value || null })} onBlur={event => void fetchBilibiliPreview(item.id, event.target.value)} /></Field>
                  <button type="button" onClick={() => void fetchBilibiliPreview(item.id, item.linkUrl ?? '')} disabled={!item.linkUrl || videoLoadingId === item.id}>{videoLoadingId === item.id ? '正在读取…' : '自动获取封面与标题'}</button>
                  {item.imageUrl && <div className="page-editor-video-preview"><img src={item.imageUrl} alt="" referrerPolicy="no-referrer" /><strong>{item.title || '已读取视频'}</strong></div>}
                  {videoError[item.id] && <p className="page-editor-error" role="alert">{videoError[item.id]}</p>}
                </div> : isTechTutorial ? <div className="page-editor-tutorial-source">
                  <Field label="外部链接（与文件任选其一）"><input value={item.linkUrl?.startsWith('/api/files/') ? '' : item.linkUrl ?? ''} placeholder="https://..." onChange={event => updateItem(item.id, { linkUrl: event.target.value || null })} /></Field>
                  <Field label="上传教程文件"><input type="file" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadTutorialFile(item.id, file); }} /></Field>
                  {tutorialFileLoadingId === item.id && <p>正在上传文件……</p>}
                  {item.linkUrl?.startsWith('/api/files/') && <p className="form-success">已绑定文件：{item.title}</p>}
                  {tutorialFileError[item.id] && <p className="page-editor-error" role="alert">{tutorialFileError[item.id]}</p>}
                </div> : <div className="page-editor-item-row"><Field label="图片地址（选填）"><input value={item.imageUrl ?? ''} placeholder="/assets/... 或 https://..." onChange={event => updateItem(item.id, { imageUrl: event.target.value || null })} /></Field><Field label="点击图片跳转（选填）"><input value={item.linkUrl ?? ''} placeholder="https://..." onChange={event => updateItem(item.id, { linkUrl: event.target.value || null })} /></Field></div>}
                <button className="page-editor-delete" type="button" onClick={() => deleteItem(item.id)}><Trash2 aria-hidden="true" /> 删除这条内容</button>
              </div>;})}
              <button className="page-editor-add" type="button" onClick={() => addItem(section.id)}><Plus aria-hidden="true" /> 在“{section.name}”中新增内容</button>
            </div>
          </article>;
        })}
      </div>
    </section>

    <section className="page-editor-panel">
      <div className="page-editor-panel-title"><div><small>02 / IMAGE LINKS</small><h2>图片跳转设置</h2></div><p>指定链接后，访客悬停时会看到目标信息，点击图片可前往外部页面；普通展示图片点击后会就地悬浮放大。</p></div>
      <div className="page-editor-link-form">
        <Field label="选择或填写页面中的图片">
          <input list="page-known-images" value={newImageUrl} placeholder="选择现有图片，或粘贴图片地址" onChange={event => setNewImageUrl(event.target.value)} />
          <datalist id="page-known-images">{knownImages.map(src => <option value={src} key={src} />)}</datalist>
        </Field>
        <Field label="外部链接"><input value={newLinkUrl} placeholder="https://..." onChange={event => setNewLinkUrl(event.target.value)} /></Field>
        <button type="button" onClick={addImageLink}><Link2 aria-hidden="true" /> 添加跳转</button>
      </div>
      {knownImages.length > 0 && <details className="page-editor-image-picker"><summary><ImagePlus aria-hidden="true" /> 浏览、删除或恢复本页现有图片（{knownImages.length}）</summary><div>{knownImages.map(src => <article key={src} className={draft.hiddenImageUrls.includes(src) ? 'is-hidden' : ''}><button type="button" className={newImageUrl === src ? 'is-selected' : ''} onClick={() => setNewImageUrl(src)}><img src={src} alt="" loading="lazy" /><span>{src.split('/').pop()}</span></button><button type="button" className="page-editor-image-visibility" onClick={() => toggleImageVisibility(src)}>{draft.hiddenImageUrls.includes(src) ? <><Eye aria-hidden="true" />恢复</> : <><Trash2 aria-hidden="true" />从页面删除</>}</button></article>)}</div></details>}
      <div className="page-editor-links">{draft.imageLinks.length === 0 ? <p>当前没有设置图片跳转。</p> : draft.imageLinks.map(item => <article key={item.imageUrl}><img src={item.imageUrl} alt="" /><div><strong>{item.imageUrl}</strong><a href={item.linkUrl} target="_blank" rel="noreferrer">{item.linkUrl}</a></div><button type="button" aria-label="删除图片跳转" onClick={() => setDraft(current => ({ ...current, imageLinks: current.imageLinks.filter(link => link.imageUrl !== item.imageUrl) }))}><Trash2 aria-hidden="true" /></button></article>)}</div>
    </section>
    {scope === 'department' && slug === 'tech' && <TechGuestbook management />}
  </main>;
}
