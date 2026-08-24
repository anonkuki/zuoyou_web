import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ChevronDown, Edit3, ImagePlus, Link2, MessageCircle, Pin, Plus, Send, Sparkles, Star, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
import { isExecutiveRole, isManagementRole, memberAttributePool } from '@guild/contracts';
import { api, json, type PageData } from './api';
import { useAuth } from './auth';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero } from './components';
import { PixelFrame, PixelSprite } from './components/departments/pixel';
import './tavern-editor.css';

interface PostAuthor { id: string; displayName: string; avatarColor: string }
interface PostBlock { type: 'PARAGRAPH' | 'IMAGE' | 'LINK'; text?: string; assetId?: string; alt?: string; url?: string; label?: string }
export interface TavernPost { id: string; title: string; subtitle: string; content: string; body: PostBlock[]; departmentId: string | null; departmentName: string | null; pinned: boolean; featured: boolean; visibleOnGuild: boolean; visibleOnDepartment: boolean; upvoteCount: number; downvoteCount: number; score: number; myRating: -1 | 0 | 1; commentCount: number; author: PostAuthor; createdAt: string; updatedAt: string }
interface TavernComment { id: string; postId: string; content: string; author: PostAuthor; createdAt: string }
interface DepartmentOption { id: string; name: string }
interface MatchProfile { id: string; displayName: string; avatarColor: string; guildTitle: string; departmentName?: string | null; bio: string; presence?: 'ONLINE' | 'AWAY' | 'OFFLINE' }
interface MatchItem { score: number; sharedAttributes: string[]; sharedTags: string[]; profile: MatchProfile }

type EditorBlock =
  | { key: string; type: 'PARAGRAPH'; text: string }
  | { key: string; type: 'IMAGE'; assetId: string; previewUrl: string; alt: string };

let editorBlockSequence = 0;
const nextEditorKey = () => `post-block-${++editorBlockSequence}`;
const emptyEditor = (): EditorBlock[] => [{ key: nextEditorKey(), type: 'PARAGRAPH', text: '' }];
const urlPattern = /https?:\/\/[^\s<>"']+/gi;
const trailingPunctuation = /[),.;!?\]}，。；！？）》】]+$/;

function urlsIn(text = '') {
  return [...text.matchAll(urlPattern)].map((match) => match[0].replace(trailingPunctuation, '')).filter((url, index, urls) => urls.indexOf(url) === index);
}

function linkify(text = ''): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(urlPattern)) {
    const raw = match[0];
    const url = raw.replace(trailingPunctuation, '');
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(<a key={`${start}-${url}`} href={url} target="_blank" rel="noreferrer">{url}</a>);
    if (raw.length > url.length) nodes.push(raw.slice(url.length));
    cursor = start + raw.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function describeExternalLink(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'bilibili.com' || host.endsWith('.bilibili.com')) {
      if (parsed.pathname.startsWith('/video/')) return { host, title: '哔哩哔哩视频', summary: `视频页面 · ${parsed.pathname.split('/').filter(Boolean).slice(0, 2).join(' / ')}` };
      if (parsed.pathname.startsWith('/space/')) return { host, title: '哔哩哔哩个人空间', summary: '创作者主页与投稿内容' };
      return { host, title: '哔哩哔哩页面', summary: parsed.pathname === '/' ? '哔哩哔哩首页' : `页面路径 · ${parsed.pathname}` };
    }
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return { host, title: 'YouTube 视频', summary: '外部视频页面' };
    if (host === 'mp.weixin.qq.com') return { host, title: '微信公众号文章', summary: '微信公众平台文章页面' };
    return { host, title: host, summary: parsed.pathname === '/' ? '外部网站首页' : `外部页面 · ${decodeURIComponent(parsed.pathname).slice(0, 90)}` };
  } catch {
    return { host: '外部链接', title: '外部页面', summary: url };
  }
}

function ExternalLinkPreview({ url, label }: { url: string; label?: string }) {
  const description = describeExternalLink(url);
  return <a className="tavern-link-preview" href={url} target="_blank" rel="noreferrer">
    <span><Link2 /></span><span><small>{description.host}</small><strong>{label || description.title}</strong><em>{description.summary}</em></span>
  </a>;
}

function RichParagraph({ text }: { text?: string }) {
  const urls = urlsIn(text);
  return <><p>{linkify(text)}</p>{urls.map((url) => <ExternalLinkPreview key={url} url={url} />)}</>;
}

function editorBody(blocks: EditorBlock[]): PostBlock[] {
  const body: PostBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'PARAGRAPH') {
      if (block.text.trim()) body.push({ type: 'PARAGRAPH', text: block.text.trim() });
    } else body.push({ type: 'IMAGE', assetId: block.assetId, alt: block.alt.trim() || undefined });
  }
  return body;
}

function editorContent(blocks: EditorBlock[]) {
  return blocks.filter((block): block is Extract<EditorBlock, { type: 'PARAGRAPH' }> => block.type === 'PARAGRAPH').map((block) => block.text.trim()).filter(Boolean).join('\n\n');
}

function blocksFromPost(post: TavernPost): EditorBlock[] {
  const blocks = (post.body?.length ? post.body : [{ type: 'PARAGRAPH' as const, text: post.content }]).flatMap((block): EditorBlock[] => {
    if (block.type === 'IMAGE' && block.assetId) return [{ key: nextEditorKey(), type: 'IMAGE', assetId: block.assetId, previewUrl: `/api/public/post-assets/${block.assetId}`, alt: block.alt ?? '' }];
    if (block.type === 'LINK' && block.url) return [{ key: nextEditorKey(), type: 'PARAGRAPH', text: `${block.label ? `${block.label}\n` : ''}${block.url}` }];
    if (block.type === 'PARAGRAPH' && block.text) return [{ key: nextEditorKey(), type: 'PARAGRAPH', text: block.text }];
    return [];
  });
  return blocks.length ? blocks : emptyEditor();
}

function PostContentEditor({ blocks, onChange, onUpload, uploading, uploadError }: { blocks: EditorBlock[]; onChange: (blocks: EditorBlock[]) => void; onUpload: (file: File, afterIndex: number) => void; uploading: boolean; uploadError?: Error | null }) {
  const replace = (index: number, block: EditorBlock) => onChange(blocks.map((item, itemIndex) => itemIndex === index ? block : item));
  const insertText = (index: number) => onChange([...blocks.slice(0, index + 1), { key: nextEditorKey(), type: 'PARAGRAPH', text: '' }, ...blocks.slice(index + 1)]);
  const remove = (index: number) => {
    const target = blocks[index];
    if (target.type === 'IMAGE' && target.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl);
    const next = blocks.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : emptyEditor());
  };
  return <fieldset className="tavern-content-editor">
    <legend>帖子内容</legend>
    <p className="tavern-editor-help">按顺序插入文字与图片；外部链接可直接粘贴进文字，发布后会自动变成可点击的预览卡片。</p>
    {blocks.map((block, index) => <div className={`tavern-editor-block ${block.type.toLowerCase()}`} key={block.key}>
      {block.type === 'PARAGRAPH' ? <>
        <label><span>{index === 0 ? '帖子内容' : `文字段落 ${index + 1}`}</span><textarea aria-label={index === 0 ? '帖子内容' : `文字段落 ${index + 1}`} maxLength={2000} rows={5} value={block.text} onChange={(event) => replace(index, { ...block, text: event.target.value })} placeholder="输入正文，链接可直接粘贴在这里……" /></label>
        {urlsIn(block.text).map((url) => <ExternalLinkPreview key={url} url={url} />)}
      </> : <figure><img src={block.previewUrl} alt={block.alt || '待发布图片'} /><label>图片说明（选填）<input maxLength={160} value={block.alt} onChange={(event) => replace(index, { ...block, alt: event.target.value })} /></label></figure>}
      <div className="tavern-block-actions">
        <button type="button" onClick={() => insertText(index)}><Plus />在此后添加文字</button>
        <label className="tavern-inline-upload"><ImagePlus />{uploading ? '正在上传…' : '在此后插入图片'}<input type="file" disabled={uploading} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file, index); event.currentTarget.value = ''; }} /></label>
        {(blocks.length > 1 || block.type === 'IMAGE') && <button type="button" className="danger" onClick={() => remove(index)}><X />移除此段</button>}
      </div>
    </div>)}
    {uploadError && <p className="form-error">{uploadError.message}</p>}
  </fieldset>;
}

function DeleteConfirmDialog({ kind, pending, error, onCancel, onConfirm }: { kind: '帖子' | '评论'; pending: boolean; error?: Error | null; onCancel: () => void; onConfirm: () => void }) {
  return <div className="delete-confirm-backdrop" role="presentation">
    <section className="delete-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title">
      <AlertTriangle /><h2 id="delete-confirm-title">确认删除该{kind}吗？</h2>
      <p>删除后无法恢复，请确认这正是你想执行的操作。</p>
      {error && <p className="form-error">{error.message}</p>}
      <div><button type="button" onClick={onCancel} disabled={pending}>取消</button><button type="button" className="danger" onClick={onConfirm} disabled={pending}>{pending ? '正在删除…' : `确认删除${kind}`}</button></div>
    </section>
  </div>;
}

const attributeLabel = (id: string) => memberAttributePool.find((attribute) => attribute.id === id)?.label ?? id;

function PostBody({ post }: { post: TavernPost }) {
  return <div className="tavern-post-content">{post.body?.length ? post.body.map((block, index) => block.type === 'IMAGE' && block.assetId
    ? <figure key={index}><img src={`/api/public/post-assets/${block.assetId}`} alt={block.alt || post.title}/>{block.alt && <figcaption>{block.alt}</figcaption>}</figure>
    : block.type === 'LINK' && block.url ? <ExternalLinkPreview key={index} url={block.url} label={block.label} />
    : <RichParagraph key={index} text={block.text} />) : <RichParagraph text={post.content} />}</div>;
}

export function PublicPostPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: ['public-post', id], queryFn: () => api<{ post: TavernPost }>(`/api/public/posts/${id}`), enabled: Boolean(id) });
  if (query.isLoading) return <main><LoadingPanel label="正在读取公开日志" /></main>;
  if (query.error || !query.data) return <main className="social-profile-error"><ErrorPanel error={query.error} /><Link to="/">返回主页</Link></main>;
  const post = query.data.post;
  return <main className="public-blog-detail"><article>
    <Link className="tavern-back" to="/"><ArrowLeft/>返回社团主页</Link>
    <small>{post.departmentName ?? '整个社团'} · {formatDate(post.createdAt)}</small>
    <h1>{post.title}</h1>{post.subtitle && <h2>{post.subtitle}</h2>}
    <p className="public-blog-byline">BY {post.author.displayName} · 综合评分 {post.score > 0 ? `+${post.score}` : post.score}</p>
    <PostBody post={post}/>
  </article></main>;
}

export function PostsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', departmentId: '' });
  const [blocks, setBlocks] = useState<EditorBlock[]>(emptyEditor);
  const [deletePost, setDeletePost] = useState<TavernPost | null>(null);
  const departments = useQuery({ queryKey: ['public', 'departments'], queryFn: () => api<{ items: DepartmentOption[] }>('/api/public/departments') });
  const query = useQuery({ queryKey: ['tavern', 'posts'], queryFn: () => api<PageData<TavernPost>>('/api/member/posts?page=1&pageSize=50') });
  const refresh = () => client.invalidateQueries({ queryKey: ['tavern'] });
  const create = useMutation({
    mutationFn: () => api<{ post: TavernPost }>('/api/member/posts', json('POST', {
      title: form.title, subtitle: form.subtitle, content: editorContent(blocks), departmentId: form.departmentId || null, body: editorBody(blocks),
    })),
    onSuccess: () => { blocks.forEach((block) => { if (block.type === 'IMAGE' && block.previewUrl.startsWith('blob:')) URL.revokeObjectURL(block.previewUrl); }); setOpen(false); setForm({ title: '', subtitle: '', departmentId: '' }); setBlocks(emptyEditor()); refresh(); },
  });
  const upload = useMutation({
    mutationFn: ({ file }: { file: File; afterIndex: number; previewUrl: string }) => { const data = new FormData(); data.append('file', file); return api<{ asset: { id: string; url: string } }>('/api/member/post-assets', { method: 'POST', body: data }); },
    onSuccess: ({ asset }, variables) => setBlocks((items) => [...items.slice(0, variables.afterIndex + 1), { key: nextEditorKey(), type: 'IMAGE', assetId: asset.id, previewUrl: variables.previewUrl, alt: '' }, ...items.slice(variables.afterIndex + 1)]),
    onError: (_error, variables) => URL.revokeObjectURL(variables.previewUrl),
  });
  const place = useMutation({ mutationFn: ({ post, scope, visible = true, pinned, featured }: { post: TavernPost; scope: 'GUILD' | 'DEPARTMENT'; visible?: boolean; pinned?: boolean; featured?: boolean }) => api(`/api/member/posts/${post.id}/placement`, json('PUT', { scope, departmentId: scope === 'DEPARTMENT' ? post.departmentId : null, visible, pinned, featured })), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => api(`/api/member/posts/${id}`, json('DELETE')), onSuccess: () => { setDeletePost(null); refresh(); } });
  const manager = Boolean(user && isManagementRole(user.role));
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate(); };
  return <main className="social-page tavern-page">
    <PageHero eyebrow="ADVENTURER TAVERN" title="冒险者酒馆" description="成员公开的交流区：分享进度、招募搭档、约团约展，真实写入公会档案。">
      <button className="guild-button primary" onClick={() => setOpen(!open)}>{open ? '收起表单' : '发布新帖'}</button>
    </PageHero>
    <section className="shell">
      {open && <form className="inline-create tavern-create" onSubmit={submit}>
        <label>帖子标题<input required minLength={2} maxLength={60} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例如：周末道具修补互助" /></label>
        <label>小标题（选填）<input maxLength={160} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="给正文加一句引子" /></label>
        <label>所属范围<select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}><option value="">整个社团</option>{departments.data?.items?.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <PostContentEditor blocks={blocks} onChange={setBlocks} uploading={upload.isPending} uploadError={upload.error} onUpload={(file, afterIndex) => upload.mutate({ file, afterIndex, previewUrl: URL.createObjectURL(file) })} />
        {editorContent(blocks).length > 0 && editorContent(blocks).length < 5 && <p className="form-error">正文文字至少需要 5 个字符。</p>}
        {create.error && <p className="form-error">{create.error.message}</p>}
        <button className="guild-button primary" disabled={create.isPending || upload.isPending || editorContent(blocks).length < 5}>发布到酒馆</button>
      </form>}
      {query.isLoading ? <LoadingPanel label="正在翻开酒馆留言板" /> : query.error ? <ErrorPanel error={query.error} /> : !query.data?.items.length ? <EmptyPanel label="酒馆还没有帖子，来发第一帖" /> : <div className="tavern-post-list">
        {query.data.items.map((post) => <PixelFrame key={post.id} className="tavern-post-card">
          <div className="tavern-post-head">
            <span className="social-avatar small" style={{ '--avatar-color': post.author.avatarColor } as React.CSSProperties}><b>{post.author.displayName.slice(0, 1)}</b></span>
            <div><strong>{post.author.displayName}</strong><time>{formatDate(post.createdAt)}</time></div>
            {post.pinned && <span className="tavern-pin"><Pin />置顶</span>}
          </div>
          <Link className="tavern-post-title" to={`/portal/tavern/${post.id}`}><h2>{post.title}</h2></Link>
          {post.subtitle && <p className="tavern-post-subtitle">{post.subtitle}</p>}
          <span className="tavern-scope">{post.departmentName ?? '整个社团'}</span>
          <p className="tavern-post-excerpt">{post.content.split('\n')[0]}</p>
          <div className="tavern-post-foot">
            <Link to={`/portal/tavern/${post.id}`}><MessageCircle />{post.commentCount} 条评论</Link>
            {manager && (isExecutiveRole(user!.role) || (user?.role === 'DEPARTMENT_HEAD' && post.departmentId === user.departmentId)) && <button onClick={() => place.mutate({ post, scope: 'GUILD', visible: !post.visibleOnGuild })}><Sparkles/>{post.visibleOnGuild ? '撤下主页' : '展示在主页'}</button>}
            {manager && post.departmentId && (isExecutiveRole(user!.role) || post.departmentId === user?.departmentId) && <button onClick={() => place.mutate({ post, scope: 'DEPARTMENT', visible: !post.visibleOnDepartment })}><Star/>{post.visibleOnDepartment ? '撤下部门页' : '展示在部门页'}</button>}
            {manager && (isExecutiveRole(user!.role) || post.departmentId === user?.departmentId) && <button onClick={() => place.mutate({ post, scope: post.departmentId ? 'DEPARTMENT' : 'GUILD', pinned: !post.pinned })}><Pin/>{post.pinned ? '取消置顶' : '置顶'}</button>}
            {manager && (isExecutiveRole(user!.role) || post.departmentId === user?.departmentId) && <button onClick={() => place.mutate({ post, scope: post.departmentId ? 'DEPARTMENT' : 'GUILD', featured: !post.featured })}><Sparkles/>{post.featured ? '取消精选' : '精选'}</button>}
            {(manager || user?.id === post.author.id) && <button className="danger" aria-label={`删除 ${post.title}`} onClick={() => { remove.reset(); setDeletePost(post); }}><Trash2 />删除</button>}
          </div>
        </PixelFrame>)}
      </div>}
    </section>
    {deletePost && <DeleteConfirmDialog kind="帖子" pending={remove.isPending} error={remove.error} onCancel={() => setDeletePost(null)} onConfirm={() => remove.mutate(deletePost.id)} />}
  </main>;
}

export function PostDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const client = useQueryClient();
  const [content, setContent] = useState('');
  const [editForm, setEditForm] = useState<{ title: string; subtitle: string; blocks: EditorBlock[] } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: '帖子' | '评论'; id: string } | null>(null);
  const query = useQuery({ queryKey: ['tavern', 'post', id], queryFn: () => api<{ post: TavernPost; comments: TavernComment[]; supporters: PostAuthor[] }>(`/api/member/posts/${id}`), enabled: Boolean(id) });
  const refresh = () => client.invalidateQueries({ queryKey: ['tavern'] });
  const comment = useMutation({
    mutationFn: () => api(`/api/member/posts/${id}/comments`, json('POST', { content })),
    onSuccess: () => { setContent(''); refresh(); },
  });
  const removeComment = useMutation({ mutationFn: (commentId: string) => api(`/api/member/comments/${commentId}`, json('DELETE')), onSuccess: () => { setDeleteTarget(null); refresh(); } });
  const removePost = useMutation({ mutationFn: () => api(`/api/member/posts/${id}`, json('DELETE')), onSuccess: () => { refresh(); } });
  const rate = useMutation({ mutationFn: (value: -1 | 0 | 1) => api(`/api/member/posts/${id}/rating`, json('PUT', { value })), onSuccess: refresh });
  const edit = useMutation({ mutationFn: () => api(`/api/member/posts/${id}`, json('PATCH', {
    title: editForm!.title, subtitle: editForm!.subtitle, content: editorContent(editForm!.blocks), departmentId: query.data!.post.departmentId, body: editorBody(editForm!.blocks),
  })), onSuccess: () => { editForm?.blocks.forEach((block) => { if (block.type === 'IMAGE' && block.previewUrl.startsWith('blob:')) URL.revokeObjectURL(block.previewUrl); }); setEditForm(null); refresh(); } });
  const editUpload = useMutation({
    mutationFn: ({ file }: { file: File; afterIndex: number; previewUrl: string }) => { const data = new FormData(); data.append('file', file); return api<{ asset: { id: string; url: string } }>('/api/member/post-assets', { method: 'POST', body: data }); },
    onSuccess: ({ asset }, variables) => setEditForm((current) => current ? { ...current, blocks: [...current.blocks.slice(0, variables.afterIndex + 1), { key: nextEditorKey(), type: 'IMAGE', assetId: asset.id, previewUrl: variables.previewUrl, alt: '' }, ...current.blocks.slice(variables.afterIndex + 1)] } : current),
    onError: (_error, variables) => URL.revokeObjectURL(variables.previewUrl),
  });
  const navigate = useNavigate();
  if (query.isLoading) return <main><LoadingPanel label="正在读取帖子" /></main>;
  if (query.error || !query.data) return <main className="social-profile-error"><ErrorPanel error={query.error} /><Link to="/portal/tavern">返回冒险者酒馆</Link></main>;
  const { post, comments, supporters = [] } = query.data;
  const manager = Boolean(user && isManagementRole(user.role));
  return <main className="social-page tavern-page">
    <section className="shell tavern-detail">
      <Link className="tavern-back" to="/portal/tavern"><ArrowLeft />返回酒馆</Link>
      <PixelFrame className="tavern-post-card detail">
        <div className="tavern-post-head">
          <span className="social-avatar small" style={{ '--avatar-color': post.author.avatarColor } as React.CSSProperties}><b>{post.author.displayName.slice(0, 1)}</b></span>
          <div><strong>{post.author.displayName}</strong><time>{formatDate(post.createdAt)}</time></div>
          {post.pinned && <span className="tavern-pin"><Pin />置顶</span>}
        </div>
        <h1>{post.title}</h1>
        {post.subtitle && <p className="tavern-detail-subtitle">{post.subtitle}</p>}
        <PostBody post={post} />
        {editForm && <form className="tavern-edit-form" onSubmit={(event) => { event.preventDefault(); edit.mutate(); }}>
          <label>大标题<input required value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}/></label>
          <label>小标题<input value={editForm.subtitle} onChange={(event) => setEditForm({ ...editForm, subtitle: event.target.value })}/></label>
          <PostContentEditor blocks={editForm.blocks} onChange={(blocks) => setEditForm({ ...editForm, blocks })} uploading={editUpload.isPending} uploadError={editUpload.error} onUpload={(file, afterIndex) => editUpload.mutate({ file, afterIndex, previewUrl: URL.createObjectURL(file) })} />
          <div><button className="guild-button primary" disabled={edit.isPending || editUpload.isPending || editorContent(editForm.blocks).length < 5}>保存修改</button><button type="button" onClick={() => setEditForm(null)}>取消</button></div>
          {edit.error && <p className="form-error">{edit.error.message}</p>}
        </form>}
        <div className="tavern-post-foot">
          <div className="scp-rating" aria-label={`帖子综合评分 ${post.score}`}>
            <button className={post.myRating === 1 ? 'active' : ''} aria-label={`赞成，当前 ${post.upvoteCount} 人`} onClick={() => rate.mutate(post.myRating === 1 ? 0 : 1)}><ThumbsUp/>{post.upvoteCount}</button>
            <strong>{post.score > 0 ? `+${post.score}` : post.score}</strong>
            <button className={post.myRating === -1 ? 'active down' : ''} aria-label={`反对，当前 ${post.downvoteCount} 人`} onClick={() => rate.mutate(post.myRating === -1 ? 0 : -1)}><ThumbsDown/>{post.downvoteCount}</button>
          </div>
          {manager && <button onClick={() => setEditForm({ title: post.title, subtitle: post.subtitle, blocks: blocksFromPost(post) })}><Edit3/>编辑帖子</button>}
          {(manager || user?.id === post.author.id) && <button className="danger" onClick={() => { removePost.reset(); setDeleteTarget({ kind: '帖子', id: post.id }); }}><Trash2 />删除帖子</button>}
        </div>
        <details className="post-supporters"><summary><ChevronDown/>查看赞成这篇帖子的成员（{post.upvoteCount}）</summary>{supporters.length ? <ul>{supporters.map((supporter) => <li key={supporter.id}><span className="social-avatar small" style={{ '--avatar-color': supporter.avatarColor } as React.CSSProperties}><b>{supporter.displayName.slice(0, 1)}</b></span>{supporter.displayName}</li>)}</ul> : <p>还没有成员赞成这篇帖子。</p>}</details>
      </PixelFrame>
      <section className="tavern-comments">
        <h2>评论 · {comments.length}</h2>
        {comments.map((item) => <article key={item.id}>
          <span className="social-avatar small" style={{ '--avatar-color': item.author.avatarColor } as React.CSSProperties}><b>{item.author.displayName.slice(0, 1)}</b></span>
          <div><strong>{item.author.displayName}<time>{formatDate(item.createdAt)}</time></strong><p>{item.content}</p></div>
          {(manager || user?.id === item.author.id) && <button className="danger" aria-label={`删除 ${item.author.displayName} 的评论`} onClick={() => { removeComment.reset(); setDeleteTarget({ kind: '评论', id: item.id }); }}><Trash2 /></button>}
        </article>)}
        <form onSubmit={(event: FormEvent) => { event.preventDefault(); comment.mutate(); }}>
          <label><span className="sr-only">写下评论</span><input required minLength={1} maxLength={1000} value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的回复…" /></label>
          <button className="guild-button primary" disabled={comment.isPending || !content.trim()}><Send />发布评论</button>
        </form>
        {comment.error && <p className="form-error">{comment.error.message}</p>}
      </section>
    </section>
    {deleteTarget && <DeleteConfirmDialog kind={deleteTarget.kind} pending={deleteTarget.kind === '帖子' ? removePost.isPending : removeComment.isPending} error={deleteTarget.kind === '帖子' ? removePost.error : removeComment.error} onCancel={() => setDeleteTarget(null)} onConfirm={() => {
      if (deleteTarget.kind === '帖子') removePost.mutate(undefined, { onSuccess: () => navigate('/portal/tavern') });
      else removeComment.mutate(deleteTarget.id);
    }} />}
  </main>;
}

export function MatchPage() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['tavern', 'match'], queryFn: () => api<{ myAttributes: string[]; items: MatchItem[] }>('/api/member/match') });
  const chat = useMutation({
    mutationFn: (userId: string) => api<{ conversation: { id: string } }>('/api/member/conversations/direct', json('POST', { userId })),
    onSuccess: (data) => { client.invalidateQueries({ queryKey: ['social', 'conversations'] }); navigate(`/portal/chat?conversation=${data.conversation.id}`); },
  });
  return <main className="social-page match-page">
    <PageHero eyebrow="RESONANCE ATLAS" title="共鸣图鉴" description="基于你的属性、技能与兴趣标签，为你找出最有默契的社团伙伴。" />
    <section className="shell">
      {query.isLoading ? <LoadingPanel label="正在演算共鸣指数" /> : query.error ? <ErrorPanel error={query.error} /> : !query.data?.myAttributes.length ? <PixelFrame className="match-empty">
        <PixelSprite slug="cos" />
        <h2>先为自己选择冒险属性</h2>
        <p>共鸣图鉴需要你的属性、技能与兴趣标签作为参照。前往个人主页编辑「我的属性」，再回来查看默契排行。</p>
        <Link className="guild-button primary" to="/portal/profile"><Sparkles />去设置我的属性</Link>
      </PixelFrame> : !query.data.items.length ? <EmptyPanel label="暂时没有共鸣指数足够的伙伴" /> : <div className="match-grid">
        {query.data.items.map((item, index) => <PixelFrame key={item.profile.id} className="match-card" color={item.profile.avatarColor}>
          <div className="match-rank">#{index + 1}</div>
          <div className="match-top">
            <span className="social-avatar" style={{ '--avatar-color': item.profile.avatarColor } as React.CSSProperties}><b>{item.profile.displayName.slice(0, 1)}</b></span>
            <div><small>{item.profile.departmentName ?? '公会中枢'}</small><h3>{item.profile.displayName}</h3><strong>{item.profile.guildTitle || '公会成员'}</strong></div>
            <b className="match-score">{item.score}%</b>
          </div>
          <div className="match-bar" role="progressbar" aria-valuenow={item.score} aria-valuemin={0} aria-valuemax={100} aria-label={`与 ${item.profile.displayName} 的共鸣指数 ${item.score}%`}><i style={{ width: `${item.score}%` }} /></div>
          {item.sharedAttributes.length > 0 && <div className="match-shared"><small>共鸣属性</small><div className="social-tags">{item.sharedAttributes.map((attribute) => <span key={attribute}>{attributeLabel(attribute)}</span>)}</div></div>}
          {item.sharedTags.length > 0 && <div className="match-shared"><small>共同标签</small><div className="social-tags interest">{item.sharedTags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>}
          <div className="match-actions">
            <Link to={`/portal/members/${item.profile.id}`}>查看主页</Link>
            <button onClick={() => chat.mutate(item.profile.id)} disabled={chat.isPending}><MessageCircle />发起私聊</button>
          </div>
        </PixelFrame>)}
      </div>}
    </section>
  </main>;
}
