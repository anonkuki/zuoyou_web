import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, ImagePlus, Link2, Plus, Save, Trash2 } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { isExecutiveRole } from '@guild/contracts';
import { api, json } from './api';
import { useAuth } from './auth';
import { departmentPhotosBySlug, originalPortfolioPhotos } from './components/departments/department-photos';
import { departmentMediaBySlug } from './components/departments/department-media';
import { showcaseBySlug } from './components/departments/showcase-data';
import { DepartmentGuestbook, TechGuestbook } from './components/departments/TechGuestbook';
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

const sectionSubtitles: Record<string, string> = {
  'publicity-show': 'NOW SHOWING', 'publicity-films': 'FILM CATALOGUE', 'department-photo-gallery': 'PHOTO MEMORIES',
  'publicity-media-wall': 'MEDIA WALL', 'publicity-reviews': 'REVIEW COLUMN', 'publicity-screenings': 'SCREENING LOG', 'publicity-press': 'BACKSTAGE',
  'tech-sheet': 'CONTACT SHEET', 'department-media-shelf': 'OUR WORKS', 'tech-tutorials': 'TUTORIAL LIBRARY', 'tech-exif': 'FAQ / JOIN US',
  'dance-floor': 'MEMBERS', 'dance-setlist': 'SETLIST', 'dance-backstage': 'PERFORMANCE LIBRARY', 'dance-join': 'JOIN US',
  'original-gallery': 'FEATURED WORKS', 'original-characters': 'ORIGINAL CHARACTER ARCHIVE', 'original-toolbox': 'TOOLBOX', 'original-join': 'JOIN US',
  'cos-henshin': 'TRANSFORMATION', 'cos-conventions': 'CONVENTION BOOTH', 'cos-wardrobe': 'WARDROBE', 'cos-join': 'JOIN US',
  'music-members': 'MEMBERS', 'music-tracklist': 'ORIGINAL TRACKS', 'music-rehearsal': 'REHEARSAL ARCHIVE', 'music-recruitment': 'RECRUITMENT',
  'department-post-board': 'FORUM',
};

const sectionDescriptions: Record<string, string> = {
  'publicity-show': '这一格胶片，正在播放我们最近共同看过的故事。',
  'publicity-films': '那些曾打开过我们的动画，也同样在未来与新成员相遇。',
  'publicity-media-wall': '用图像写文字，也是与人隔着屏幕打招呼。',
  'publicity-reviews': '在文字里重逢动画，也思考作品照亮的世界。',
  'publicity-screenings': '在熟悉的放映厅里，我们共享同一段时间。',
  'publicity-press': '让热爱变成值得留下来的文字与图像。',
  'tech-sheet': '定格那些值得被记住的瞬间——每一张照片都是我们共同制作过的时光。',
  'tech-tutorials': '从入门到进阶，整理我们在实践中积累的经验与资料，欢迎一起学习与分享。',
  'tech-exif': '设备和经验都不是门槛，欢迎先来活动现场体验。',
  'dance-floor': '不同的角色、服装与舞步，因为同一份热爱站上同一个舞台。',
  'dance-setlist': '今夜的舞台，也有你的一份光芒。',
  'dance-backstage': '收录我们跳过、排练过和仍在准备中的每一首歌。',
  'dance-join': '一起排练、制作服装，也一起登上舞台。',
  'original-gallery': '小小的创作，也能照亮某个人的未来。',
  'original-characters': '每一个角色，都是一个未完的故事。',
  'original-toolbox': '一些创作路上的小工具，希望能够帮到你。',
  'original-join': '加入原创部，和我们一起创造更多可能。',
  'cos-henshin': '妆造、服装与角色演绎，记录每一次成为角色的瞬间。',
  'cos-conventions': '每一次出展，都是和更多同好见面的机会。',
  'cos-wardrobe': '服装、妆造、道具与返图，是角色诞生背后的功课。',
  'cos-join': '不论是 Coser、摄影、妆造、后勤，都欢迎一起让喜欢的角色走进现实。',
  'music-members': '不同的声音，组成同一个乐队。',
  'music-tracklist': '我们的声音，也在不断生长。',
  'music-rehearsal': '从排练室到舞台，每一次练习都是成长。',
  'music-recruitment': '不限定经验，只要热爱音乐，就欢迎加入。',
  'department-photo-gallery': '记录部门成员一起活动、创作与成长的瞬间。',
  'department-media-shelf': '从筹备到完成，这里收录部门真正做过的作品。',
  'department-post-board': '分享作品、交流经验，也记录部门的最新动态。',
};

const preset = (sectionId: string, index: number, title: string, body = '', imageUrl: string | null = null, linkUrl: string | null = null, instrument?: PageContentItem['instrument']): PageContentItem => ({
  id: `preset-${sectionId}-${index}`, sectionId, title, body, imageUrl, linkUrl, ...(instrument ? { instrument } : {}),
});

const staticPresetRows: Record<string, Array<[string, string]>> = {
  'tech-tutorials': [['摄影入门', '相机设置与构图基础'], ['机位与运镜', '镜头语言与稳定技巧'], ['灯光基础', '布光思路与实战案例'], ['剪辑工作流', '从素材到成片'], ['收音与降噪', '让声音更干净'], ['活动统筹清单', '前期准备与现场执行'], ['素材整理规范', '命名、分类与备份'], ['调色入门', '从基础到风格化']],
  'original-toolbox': [['创作流程', '从灵感到完成的基本步骤'], ['投稿规范', '社团平台投稿要求'], ['社刊排版', '模板与排版参考'], ['合作招募', '寻找一起创作的伙伴']],
  'cos-conventions': [['社团招新 · 角色返图交流', '筹备中'], ['校园漫展 · 社团摊位', '计划中'], ['主题摄影 · 外景协作', '计划中']],
  'cos-wardrobe': [['服装分类', '各类服装整理与借用'], ['妆造技巧', '化妆、假发与造型经验'], ['道具整理', '道具制作与收纳分享'], ['返图制作', '修图思路与后期教程']],
  'publicity-press': [['选题参考', '从灵感到可执行的内容方向'], ['推文规范', '标题、配图与排版建议'], ['影评投稿', '幻想研文章投稿说明'], ['海报模板', '活动视觉素材与尺寸规范']],
  'publicity-reviews': [['为什么我们依然需要“随文字起便”？', '在不断定时的时代，重温成长的勇气。'], ['动画里那些没有说出口的告别', '从镜头、配乐与留白中寻找情绪。'], ['角色弧光：一次缓慢但真实的改变', '聊聊那些让人愿意反复观看的角色。']],
  'publicity-screenings': [['秋季追番交流会', '2026.11.16 · 图书馆放映厅 · 32 人'], ['新海诚作品回顾', '2026.10.19 · 团日活动室 · 46 人'], ['经典作品鉴赏', '2026.09.21 · 社团活动室 · 28 人'], ['奇幻短片专题', '2026.06.15 · 图书馆放映厅 · 35 人']],
};

function departmentPresetItems(slug: string, sectionId: string): PageContentItem[] {
  const show = showcaseBySlug[slug];
  if (!show) return [];
  if (sectionId === 'department-photo-gallery') return (departmentPhotosBySlug[slug] ?? []).map((photo, index) => preset(sectionId, index, photo.caption, photo.source, photo.src));
  if (sectionId === 'department-media-shelf' || (slug === 'music' && sectionId === 'music-tracklist')) return (departmentMediaBySlug[slug]?.videos ?? []).map((video, index) => preset(sectionId, index, video.title, video.note, video.cover, video.href));
  if (slug === 'music' && sectionId === 'music-members') {
    const members: Array<[string, PageContentItem['instrument'], string]> = [['成员 01', '主唱', '用歌声传递心情'], ['成员 02', '吉他', '旋律与节奏的火花'], ['成员 03', '贝斯', '低频，支撑起一切'], ['成员 04', '鼓手', '用节奏推动心跳'], ['成员 05', '键盘', '让音乐拥有更多色彩']];
    return members.map(([name, instrument, note], index) => preset(sectionId, index, name, note, show.films[index].cover, null, instrument));
  }
  if (slug === 'original' && sectionId === 'original-gallery') return originalPortfolioPhotos.map((photo, index) => preset(sectionId, index, photo.caption, photo.source, photo.src));
  if (slug === 'original' && sectionId === 'original-characters') {
    const notes = [['流光', '把想象画成可以触摸的世界'], ['夜临', '故事还没结束'], ['桃枝', '花早见的日子'], ['黎序', '无论世界如何，我都会继续创作'], ['青空', '天空之外仍有新的故事'], ['白墨', '把每一格都变成相遇']];
    return show.films.map((film, index) => preset(sectionId, index, notes[index][0], notes[index][1], film.cover));
  }
  if (slug === 'publicity' && ['publicity-show', 'publicity-films'].includes(sectionId)) return show.films.map((film, index) => preset(sectionId, index, film.title, `${film.romaji} · ${film.year}`, film.cover));
  if (slug === 'publicity' && sectionId === 'publicity-media-wall') return (departmentMediaBySlug.publicity?.wechatArticles ?? []).map((article, index) => preset(sectionId, index, article.title, article.publishedAt, article.cover, article.href));
  if (slug === 'dance' && sectionId === 'dance-floor') {
    const members = [['成员 01', '在聚光灯下传递热爱'], ['成员 02', '让每一个造型拥有故事'], ['成员 03', '把节拍变成整齐的舞步'], ['成员 04', '守护演出前后的每个细节'], ['成员 05', '让角色在舞台上闪闪发光'], ['成员 06', '把精彩瞬间留在影像里']];
    return show.films.map((film, index) => preset(sectionId, index, members[index][0], members[index][1], film.cover));
  }
  if (slug === 'dance' && ['dance-setlist', 'dance-backstage'].includes(sectionId)) return show.films.map((film, index) => preset(sectionId, index, film.title, film.romaji, film.cover));
  if (slug === 'cos' && sectionId === 'cos-henshin') return show.films.map((film, index) => preset(sectionId, index, film.title, film.romaji, film.cover));
  if (slug === 'tech' && sectionId === 'tech-sheet') return show.films.map((film, index) => preset(sectionId, index, film.romaji, `${film.year} / 技术部档案`, film.cover));
  return (staticPresetRows[sectionId] ?? []).map(([title, body], index) => preset(sectionId, index, title, body));
}

const enrichDepartmentSections = (slug: string, sections: PageSectionDefinition[]) => sections.map(section => ({
  ...section,
  subtitle: sectionSubtitles[section.id] ?? '',
  description: sectionDescriptions[section.id] ?? section.description,
  defaultItems: departmentPresetItems(slug, section.id),
}));

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
  if (slug === 'publicity') return enrichDepartmentSections(slug, [
    { id: 'publicity-show', name: '正在上映', description: '近期片单与放映内容轮播' },
    { id: 'publicity-films', name: '年度片单', description: '年度动画片单与介绍' },
    { id: 'department-photo-gallery', name: '放映、记录与社团现场', description: '外宣与幻想研全部活动照片轮播' },
    { id: 'publicity-media-wall', name: '推文／海报墙', description: '公众号推文、活动海报与外部链接' },
    { id: 'publicity-reviews', name: '幻想研影评专栏', description: '影评标题、封面、摘要与阅读全文链接' },
    { id: 'publicity-screenings', name: '番看会放映记录', description: '放映时间、主题和活动记录' },
    { id: 'publicity-press', name: '场刊', description: '选题、投稿、排版与海报资源' },
    { id: 'department-post-board', name: '外宣＆幻想研讨论区', description: '置顶帖与普通帖子' },
  ]);
  if (slug === 'tech') return enrichDepartmentSections(slug, [
    { id: 'tech-focus', name: '技术部主视觉', description: 'TECH DEPARTMENT' },
    { id: 'tech-sheet', name: '底片夹', description: '技术部精选底片横向轮播' },
    { id: 'department-photo-gallery', name: '取景器后的现场记录', description: '技术部全部活动照片轮播' },
    { id: 'department-media-shelf', name: '项目作品', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    { id: 'tech-tutorials', name: '教程资源库', description: '教程、经验与外部资源' },
    { id: 'tech-exif', name: '常见问题与加入我们', description: '部门介绍与加入入口' },
    { id: 'department-post-board', name: '部门讨论区', description: '置顶帖与普通帖子' },
  ]);
  if (slug === 'dance') return enrichDepartmentSections(slug, [
    { id: 'dance-stage', name: '舞装部主视觉', description: '保留原有星轨舞台版头' },
    { id: 'dance-floor', name: '成员介绍', description: '成员照片、姓名和个人介绍' },
    { id: 'dance-setlist', name: '节目单', description: '舞台节目的名称与介绍' },
    { id: 'department-photo-gallery', name: '舞台记忆', description: '排练、演出和谢幕照片轮播' },
    { id: 'department-media-shelf', name: '作品记录', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    { id: 'dance-backstage', name: '演出曲目库', description: '演出曲目、出处与筹备记录' },
    { id: 'dance-join', name: '加入舞装部', description: '部门介绍、加入入口与常见问题' },
    { id: 'department-post-board', name: '舞装部讨论区', description: '置顶帖与普通帖子' },
  ]);
  if (slug === 'original') return enrichDepartmentSections(slug, [
    { id: 'original-atelier', name: '原创部主视觉', description: '保留原有梦色画室版头' },
    { id: 'original-gallery', name: '作品集锦', description: '原创作品图片轮播' },
    { id: 'original-characters', name: 'OC / 设定集', description: '角色图片、名称与设定介绍' },
    { id: 'department-photo-gallery', name: '一起创作的日常', description: '原创部周常活动照片轮播' },
    { id: 'department-media-shelf', name: '作品记录', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    { id: 'original-toolbox', name: '画具箱', description: '创作教程、投稿规范和外部资源' },
    { id: 'original-join', name: '加入原创部', description: '部门介绍与加入入口' },
    { id: 'department-post-board', name: '原创讨论区', description: '置顶帖与普通帖子' },
  ]);
  if (slug === 'cos') return enrichDepartmentSections(slug, [
    { id: 'cos-mirror', name: 'COS部主视觉', description: '保留原有镜中变身版头' },
    { id: 'cos-henshin', name: '变身记录', description: '定妆照、角色名称与介绍' },
    { id: 'department-photo-gallery', name: '镜头里的角色与伙伴', description: 'COS部全部活动照片轮播' },
    { id: 'department-media-shelf', name: '作品记录', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    { id: 'cos-conventions', name: '漫展出展', description: '出展计划、活动信息与相关链接' },
    { id: 'cos-wardrobe', name: '衣装间', description: '服装、妆造、道具与返图资源' },
    { id: 'cos-join', name: '加入 COS 部', description: '部门介绍与加入入口' },
    { id: 'department-post-board', name: 'COS部讨论区', description: '置顶帖与普通帖子' },
  ]);
  const themed = slug === 'music'
    ? [
      { id: 'music-playing', name: '轻音部主视觉', description: 'LIGHT MUSIC DEPARTMENT' },
      { id: 'music-members', name: '成员配置卡', description: 'MEMBERS' },
      { id: 'music-tracklist', name: '原创曲目', description: '粘贴 B 站链接，自动获取视频封面和标题' },
      { id: 'music-rehearsal', name: '排练视频', description: '粘贴 B 站链接，自动获取视频封面和标题' },
    ]
    : show?.sections.map((section, index) => ({ id: ids[index] ?? `${slug}-section-${index + 1}`, name: section.zh, description: section.en })) ?? [];
  return enrichDepartmentSections(slug, [
    ...themed,
    { id: 'department-photo-gallery', name: '部门照片展示', description: '部门活动与作品照片' },
    ...(slug === 'music'
      ? [{ id: 'music-recruitment', name: '成员招募', description: '轻音部简介、成员数量与加入入口' }]
      : [{ id: 'department-media-shelf', name: '社团实录', description: '视频与图文内容' }]),
    { id: 'department-post-board', name: '部门讨论区', description: '置顶帖与普通帖子' },
  ]);
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

  useEffect(() => { if (query.data) setDraft({ ...emptyPageContentConfig(), ...query.data.config }); }, [query.data]);

  const presetLookup = useMemo(() => new Map(sections.flatMap(section => section.defaultItems ?? []).map(item => [item.id, item])), [sections]);

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
  const updateItem = (id: string, update: Partial<PageContentItem>) => setDraft(current => {
    const exists = current.items.some(item => item.id === id);
    const source = presetLookup.get(id);
    return { ...current, items: exists ? current.items.map(item => item.id === id ? { ...item, ...update } : item) : source ? [...current.items, { ...source, ...update }] : current.items };
  });
  const deleteItem = (id: string) => setDraft(current => ({ ...current, items: current.items.filter(item => item.id !== id) }));
  const togglePreset = (id: string) => setDraft(current => ({ ...current, hiddenPresetIds: current.hiddenPresetIds.includes(id) ? current.hiddenPresetIds.filter(item => item !== id) : [...current.hiddenPresetIds, id] }));
  const updateSectionHeading = (section: PageSectionDefinition, update: Partial<{ title: string; subtitle: string; description: string }>) => setDraft(current => {
    const existing = current.sectionOverrides.find(item => item.sectionId === section.id) ?? { sectionId: section.id, title: section.name, subtitle: section.subtitle ?? '', description: section.description ?? '' };
    return { ...current, sectionOverrides: [...current.sectionOverrides.filter(item => item.sectionId !== section.id), { ...existing, ...update }] };
  });
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
          const defaults = section.defaultItems ?? [];
          const defaultIds = new Set(defaults.map(item => item.id));
          const overrides = new Map(draft.items.filter(item => defaultIds.has(item.id)).map(item => [item.id, item]));
          const items = [...defaults.map(item => overrides.get(item.id) ?? item), ...draft.items.filter(item => item.sectionId === section.id && !defaultIds.has(item.id))];
          const heading = draft.sectionOverrides.find(item => item.sectionId === section.id) ?? { title: section.name, subtitle: section.subtitle ?? '', description: section.description ?? '' };
          return <article className={`page-editor-section ${hidden ? 'is-hidden' : ''}`} key={section.id}>
            <header><div><h3>{section.name}</h3>{section.description && <p>{section.description}</p>}</div><button type="button" onClick={() => toggleSection(section.id)}>{hidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}{hidden ? '恢复板块' : '隐藏板块'}</button></header>
            <div className="page-editor-heading-fields">
              <Field label="板块大标题"><input value={heading.title} maxLength={120} onChange={event => updateSectionHeading(section, { title: event.target.value })} /></Field>
              <Field label="英文副标题"><input value={heading.subtitle} maxLength={120} onChange={event => updateSectionHeading(section, { subtitle: event.target.value })} /></Field>
              <Field label="板块说明"><textarea value={heading.description} maxLength={500} rows={2} onChange={event => updateSectionHeading(section, { description: event.target.value })} /></Field>
            </div>
            <div className="page-editor-items">
              {items.map(item => {
                const isPreset = defaultIds.has(item.id);
                const presetHidden = isPreset && draft.hiddenPresetIds.includes(item.id);
                const isMusicMember = scope === 'department' && slug === 'music' && section.id === 'music-members';
                const isTechTutorial = scope === 'department' && slug === 'tech' && section.id === 'tech-tutorials';
                return <div className={`page-editor-item${presetHidden ? ' is-preset-hidden' : ''}`} key={item.id}>
                {isPreset && <span className="page-editor-preset-label">预设元素{presetHidden ? ' · 已从页面隐藏' : ''}</span>}
                <Field label={isMusicMember ? '姓名' : '标题'}><input value={item.title} maxLength={120} onChange={event => updateItem(item.id, { title: event.target.value })} /></Field>
                {isMusicMember && <Field label="乐器"><select value={item.instrument ?? '主唱'} onChange={event => updateItem(item.id, { instrument: event.target.value as PageContentItem['instrument'] })}>
                  {['主唱', '吉他', '贝斯', '鼓手', '键盘'].map(instrument => <option value={instrument} key={instrument}>{instrument}</option>)}
                </select></Field>}
                <Field label={isMusicMember ? '介绍你自己' : '正文'}><textarea value={item.body} maxLength={4000} rows={4} onChange={event => updateItem(item.id, { body: event.target.value })} /></Field>
                {scope === 'department' && ((slug === 'music' && bilibiliVideoSectionIds.has(section.id)) || (['tech', 'cos'].includes(slug) && section.id === 'department-media-shelf')) ? <div className="page-editor-video-source">
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
                <button className="page-editor-delete" type="button" onClick={() => isPreset ? togglePreset(item.id) : deleteItem(item.id)}>{presetHidden ? <Eye aria-hidden="true" /> : <Trash2 aria-hidden="true" />} {isPreset ? (presetHidden ? '恢复这个预设元素' : '从页面隐藏这个预设元素') : '删除这条内容'}</button>
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
    {scope === 'department' && slug === 'original' && <DepartmentGuestbook slug="original" departmentId="dept-original" departmentName="原创部" number="06" management />}
  </main>;
}
