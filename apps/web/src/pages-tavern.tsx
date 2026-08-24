import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Edit3, ImagePlus, Link2, MessageCircle, Pin, Send, Sparkles, Star, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { isExecutiveRole, isManagementRole, memberAttributePool } from '@guild/contracts';
import { api, json, type PageData } from './api';
import { useAuth } from './auth';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero } from './components';
import { PixelFrame, PixelSprite } from './components/departments/pixel';

interface PostAuthor { id: string; displayName: string; avatarColor: string }
interface PostBlock { type: 'PARAGRAPH' | 'IMAGE' | 'LINK'; text?: string; assetId?: string; alt?: string; url?: string; label?: string }
export interface TavernPost { id: string; title: string; subtitle: string; content: string; body: PostBlock[]; departmentId: string | null; departmentName: string | null; pinned: boolean; featured: boolean; visibleOnGuild: boolean; visibleOnDepartment: boolean; upvoteCount: number; downvoteCount: number; score: number; myRating: -1 | 0 | 1; commentCount: number; author: PostAuthor; createdAt: string; updatedAt: string }
interface TavernComment { id: string; postId: string; content: string; author: PostAuthor; createdAt: string }
interface DepartmentOption { id: string; name: string }
interface MatchProfile { id: string; displayName: string; avatarColor: string; guildTitle: string; departmentName?: string | null; bio: string; presence?: 'ONLINE' | 'AWAY' | 'OFFLINE' }
interface MatchItem { score: number; sharedAttributes: string[]; sharedTags: string[]; profile: MatchProfile }

const attributeLabel = (id: string) => memberAttributePool.find((attribute) => attribute.id === id)?.label ?? id;

function PostBody({ post }: { post: TavernPost }) {
  return <div className="tavern-post-content">{post.body?.length ? post.body.map((block, index) => block.type === 'IMAGE' && block.assetId
    ? <figure key={index}><img src={`/api/public/post-assets/${block.assetId}`} alt={block.alt || post.title}/>{block.alt && <figcaption>{block.alt}</figcaption>}</figure>
    : block.type === 'LINK' && block.url ? <p key={index} className="tavern-external-link"><Link2/><a href={block.url} target="_blank" rel="noreferrer">{block.label || block.url}</a></p>
    : <p key={index}>{block.text}</p>) : <p>{post.content}</p>}</div>;
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
  const [form, setForm] = useState({ title: '', subtitle: '', content: '', departmentId: '', linkUrl: '', linkLabel: '' });
  const [assets, setAssets] = useState<Array<{ id: string; url: string }>>([]);
  const departments = useQuery({ queryKey: ['public', 'departments'], queryFn: () => api<{ items: DepartmentOption[] }>('/api/public/departments') });
  const query = useQuery({ queryKey: ['tavern', 'posts'], queryFn: () => api<PageData<TavernPost>>('/api/member/posts?page=1&pageSize=50') });
  const refresh = () => client.invalidateQueries({ queryKey: ['tavern'] });
  const create = useMutation({
    mutationFn: () => api<{ post: TavernPost }>('/api/member/posts', json('POST', {
      title: form.title, subtitle: form.subtitle, content: form.content, departmentId: form.departmentId || null,
      body: [...form.content.split(/\n{2,}/).filter(Boolean).map((text) => ({ type: 'PARAGRAPH', text })), ...assets.map((asset) => ({ type: 'IMAGE', assetId: asset.id })), ...(form.linkUrl ? [{ type: 'LINK', url: form.linkUrl, label: form.linkLabel || undefined }] : [])],
    })),
    onSuccess: () => { setOpen(false); setForm({ title: '', subtitle: '', content: '', departmentId: '', linkUrl: '', linkLabel: '' }); setAssets([]); refresh(); },
  });
  const upload = useMutation({ mutationFn: (file: File) => { const data = new FormData(); data.append('file', file); return api<{ asset: { id: string; url: string } }>('/api/member/post-assets', { method: 'POST', body: data }); }, onSuccess: ({ asset }) => setAssets((items) => [...items, asset]) });
  const place = useMutation({ mutationFn: ({ post, scope, visible = true, pinned, featured }: { post: TavernPost; scope: 'GUILD' | 'DEPARTMENT'; visible?: boolean; pinned?: boolean; featured?: boolean }) => api(`/api/member/posts/${post.id}/placement`, json('PUT', { scope, departmentId: scope === 'DEPARTMENT' ? post.departmentId : null, visible, pinned, featured })), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => api(`/api/member/posts/${id}`, json('DELETE')), onSuccess: refresh });
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
        <label>帖子内容<textarea required minLength={5} maxLength={2000} rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="支持空行分段，5-2000 字" /></label>
        <label>外部链接（选填）<input type="url" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://www.bilibili.com/video/..." /></label>
        <label>链接说明（选填）<input maxLength={160} value={form.linkLabel} onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} placeholder="例如：活动记录视频" /></label>
        <label className="tavern-image-picker"><ImagePlus/>插入图片<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload.mutate(file); }} /></label>
        {assets.length > 0 && <div className="tavern-image-preview">{assets.map((asset) => <img key={asset.id} src={asset.url} alt="待发布图片" />)}</div>}
        {upload.error && <p className="form-error">{upload.error.message}</p>}
        {create.error && <p className="form-error">{create.error.message}</p>}
        <button className="guild-button primary" disabled={create.isPending}>发布到酒馆</button>
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
            {(manager || user?.id === post.author.id) && <button className="danger" aria-label={`删除 ${post.title}`} onClick={() => remove.mutate(post.id)}><Trash2 />删除</button>}
          </div>
        </PixelFrame>)}
      </div>}
    </section>
  </main>;
}

export function PostDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const client = useQueryClient();
  const [content, setContent] = useState('');
  const [editForm, setEditForm] = useState<{ title: string; subtitle: string; content: string; linkUrl: string; linkLabel: string } | null>(null);
  const query = useQuery({ queryKey: ['tavern', 'post', id], queryFn: () => api<{ post: TavernPost; comments: TavernComment[]; supporters: PostAuthor[] }>(`/api/member/posts/${id}`), enabled: Boolean(id) });
  const refresh = () => client.invalidateQueries({ queryKey: ['tavern'] });
  const comment = useMutation({
    mutationFn: () => api(`/api/member/posts/${id}/comments`, json('POST', { content })),
    onSuccess: () => { setContent(''); refresh(); },
  });
  const removeComment = useMutation({ mutationFn: (commentId: string) => api(`/api/member/comments/${commentId}`, json('DELETE')), onSuccess: refresh });
  const removePost = useMutation({ mutationFn: () => api(`/api/member/posts/${id}`, json('DELETE')), onSuccess: () => { refresh(); } });
  const rate = useMutation({ mutationFn: (value: -1 | 0 | 1) => api(`/api/member/posts/${id}/rating`, json('PUT', { value })), onSuccess: refresh });
  const edit = useMutation({ mutationFn: () => api(`/api/member/posts/${id}`, json('PATCH', {
    title: editForm!.title, subtitle: editForm!.subtitle, content: editForm!.content, departmentId: query.data!.post.departmentId,
    body: [...editForm!.content.split(/\n{2,}/).filter(Boolean).map((text) => ({ type: 'PARAGRAPH', text })), ...query.data!.post.body.filter((block) => block.type === 'IMAGE'), ...(editForm!.linkUrl ? [{ type: 'LINK', url: editForm!.linkUrl, label: editForm!.linkLabel || undefined }] : [])],
  })), onSuccess: () => { setEditForm(null); refresh(); } });
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
          <label>正文<textarea required rows={8} value={editForm.content} onChange={(event) => setEditForm({ ...editForm, content: event.target.value })}/></label>
          <label>外部链接<input type="url" value={editForm.linkUrl} onChange={(event) => setEditForm({ ...editForm, linkUrl: event.target.value })}/></label>
          <label>链接说明<input value={editForm.linkLabel} onChange={(event) => setEditForm({ ...editForm, linkLabel: event.target.value })}/></label>
          <div><button className="guild-button primary" disabled={edit.isPending}>保存修改</button><button type="button" onClick={() => setEditForm(null)}>取消</button></div>
          {edit.error && <p className="form-error">{edit.error.message}</p>}
        </form>}
        <div className="tavern-post-foot">
          <div className="scp-rating" aria-label={`帖子综合评分 ${post.score}`}>
            <button className={post.myRating === 1 ? 'active' : ''} aria-label={`赞成，当前 ${post.upvoteCount} 人`} onClick={() => rate.mutate(post.myRating === 1 ? 0 : 1)}><ThumbsUp/>{post.upvoteCount}</button>
            <strong>{post.score > 0 ? `+${post.score}` : post.score}</strong>
            <button className={post.myRating === -1 ? 'active down' : ''} aria-label={`反对，当前 ${post.downvoteCount} 人`} onClick={() => rate.mutate(post.myRating === -1 ? 0 : -1)}><ThumbsDown/>{post.downvoteCount}</button>
          </div>
          {manager && <button onClick={() => { const link = post.body.find((block) => block.type === 'LINK'); setEditForm({ title: post.title, subtitle: post.subtitle, content: post.content, linkUrl: link?.url ?? '', linkLabel: link?.label ?? '' }); }}><Edit3/>编辑帖子</button>}
          {(manager || user?.id === post.author.id) && <button className="danger" onClick={async () => { await removePost.mutateAsync(); navigate('/portal/tavern'); }}><Trash2 />删除帖子</button>}
        </div>
        <details className="post-supporters"><summary><ChevronDown/>查看赞成这篇帖子的成员（{post.upvoteCount}）</summary>{supporters.length ? <ul>{supporters.map((supporter) => <li key={supporter.id}><span className="social-avatar small" style={{ '--avatar-color': supporter.avatarColor } as React.CSSProperties}><b>{supporter.displayName.slice(0, 1)}</b></span>{supporter.displayName}</li>)}</ul> : <p>还没有成员赞成这篇帖子。</p>}</details>
      </PixelFrame>
      <section className="tavern-comments">
        <h2>评论 · {comments.length}</h2>
        {comments.map((item) => <article key={item.id}>
          <span className="social-avatar small" style={{ '--avatar-color': item.author.avatarColor } as React.CSSProperties}><b>{item.author.displayName.slice(0, 1)}</b></span>
          <div><strong>{item.author.displayName}<time>{formatDate(item.createdAt)}</time></strong><p>{item.content}</p></div>
          {(manager || user?.id === item.author.id) && <button className="danger" aria-label={`删除 ${item.author.displayName} 的评论`} onClick={() => removeComment.mutate(item.id)}><Trash2 /></button>}
        </article>)}
        <form onSubmit={(event: FormEvent) => { event.preventDefault(); comment.mutate(); }}>
          <label><span className="sr-only">写下评论</span><input required minLength={1} maxLength={1000} value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的回复…" /></label>
          <button className="guild-button primary" disabled={comment.isPending || !content.trim()}><Send />发布评论</button>
        </form>
        {comment.error && <p className="form-error">{comment.error.message}</p>}
      </section>
    </section>
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
