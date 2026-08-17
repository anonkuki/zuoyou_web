import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Pin, PinOff, Send, Sparkles, Trash2 } from 'lucide-react';
import { memberAttributePool } from '@guild/contracts';
import { api, json, type PageData } from './api';
import { useAuth } from './auth';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero } from './components';
import { PixelFrame, PixelSprite } from './components/departments/pixel';

interface PostAuthor { id: string; displayName: string; avatarColor: string }
export interface TavernPost { id: string; title: string; content: string; pinned: boolean; commentCount: number; author: PostAuthor; createdAt: string; updatedAt: string }
interface TavernComment { id: string; postId: string; content: string; author: PostAuthor; createdAt: string }
interface MatchProfile { id: string; displayName: string; avatarColor: string; guildTitle: string; departmentName?: string | null; bio: string; presence?: 'ONLINE' | 'AWAY' | 'OFFLINE' }
interface MatchItem { score: number; sharedAttributes: string[]; sharedTags: string[]; profile: MatchProfile }

const attributeLabel = (id: string) => memberAttributePool.find((attribute) => attribute.id === id)?.label ?? id;

function PostBody({ content }: { content: string }) {
  return <div className="tavern-post-content">{content.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph.split('\n').map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{line}</span>)}</p>)}</div>;
}

export function PostsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const query = useQuery({ queryKey: ['tavern', 'posts'], queryFn: () => api<PageData<TavernPost>>('/api/member/posts?page=1&pageSize=50') });
  const refresh = () => client.invalidateQueries({ queryKey: ['tavern'] });
  const create = useMutation({
    mutationFn: () => api<{ post: TavernPost }>('/api/member/posts', json('POST', form)),
    onSuccess: () => { setOpen(false); setForm({ title: '', content: '' }); refresh(); },
  });
  const pin = useMutation({ mutationFn: (post: TavernPost) => api(`/api/member/posts/${post.id}/pin`, json('PATCH', { pinned: !post.pinned })), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => api(`/api/member/posts/${id}`, json('DELETE')), onSuccess: refresh });
  const manager = user?.role === 'ADMIN' || user?.role === 'DEPARTMENT_LEAD';
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate(); };
  return <main className="social-page tavern-page">
    <PageHero eyebrow="ADVENTURER TAVERN" title="冒险者酒馆" description="成员公开的交流区：分享进度、招募搭档、约团约展，真实写入公会档案。">
      <button className="guild-button primary" onClick={() => setOpen(!open)}>{open ? '收起表单' : '发布新帖'}</button>
    </PageHero>
    <section className="shell">
      {open && <form className="inline-create tavern-create" onSubmit={submit}>
        <label>帖子标题<input required minLength={2} maxLength={60} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例如：周末道具修补互助" /></label>
        <label>帖子内容<textarea required minLength={5} maxLength={2000} rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="支持空行分段，5-2000 字" /></label>
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
          <p className="tavern-post-excerpt">{post.content.split('\n')[0]}</p>
          <div className="tavern-post-foot">
            <Link to={`/portal/tavern/${post.id}`}><MessageCircle />{post.commentCount} 条评论</Link>
            {manager && <button aria-label={`${post.pinned ? '取消置顶' : '置顶'} ${post.title}`} onClick={() => pin.mutate(post)}>{post.pinned ? <><PinOff />取消置顶</> : <><Pin />置顶</>}</button>}
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
  const query = useQuery({ queryKey: ['tavern', 'post', id], queryFn: () => api<{ post: TavernPost; comments: TavernComment[] }>(`/api/member/posts/${id}`), enabled: Boolean(id) });
  const refresh = () => client.invalidateQueries({ queryKey: ['tavern'] });
  const comment = useMutation({
    mutationFn: () => api(`/api/member/posts/${id}/comments`, json('POST', { content })),
    onSuccess: () => { setContent(''); refresh(); },
  });
  const removeComment = useMutation({ mutationFn: (commentId: string) => api(`/api/member/comments/${commentId}`, json('DELETE')), onSuccess: refresh });
  const removePost = useMutation({ mutationFn: () => api(`/api/member/posts/${id}`, json('DELETE')), onSuccess: () => { refresh(); } });
  const navigate = useNavigate();
  if (query.isLoading) return <main><LoadingPanel label="正在读取帖子" /></main>;
  if (query.error || !query.data) return <main className="social-profile-error"><ErrorPanel error={query.error} /><Link to="/portal/tavern">返回冒险者酒馆</Link></main>;
  const { post, comments } = query.data;
  const manager = user?.role === 'ADMIN' || user?.role === 'DEPARTMENT_LEAD';
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
        <PostBody content={post.content} />
        {(manager || user?.id === post.author.id) && <div className="tavern-post-foot"><button className="danger" onClick={async () => { await removePost.mutateAsync(); navigate('/portal/tavern'); }}><Trash2 />删除帖子</button></div>}
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
