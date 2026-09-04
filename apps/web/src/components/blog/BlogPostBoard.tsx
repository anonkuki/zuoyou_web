import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, Pin, Search } from 'lucide-react';
import { api } from '../../api';
import './BlogPostBoard.css';

export interface BlogPostBlock { type: 'PARAGRAPH' | 'IMAGE' | 'LINK'; text?: string; assetId?: string; alt?: string; url?: string; label?: string }
export interface BlogPostCard {
  id: string; title: string; subtitle: string; content: string; body: BlogPostBlock[]; departmentName: string | null;
  subboardId: string | null; subboardName: string | null;
  pinned: boolean; featured: boolean; upvoteCount: number; downvoteCount: number; score: number; commentCount: number; createdAt: string;
  lastActivityAt?: string; latestAuthorName?: string;
  author: { id: string; displayName: string; avatarColor: string };
}

interface BoardData { pinned: BlogPostCard[]; featured: BlogPostCard[]; latest: BlogPostCard[] }
interface LatestPost { id: string; title: string; authorName: string; latestAuthorName: string; createdAt: string }
interface ForumSubboard { id: string; departmentId: string; name: string; description: string; topicCount: number; replyCount: number; latestPost: LatestPost | null }
interface ForumGroup { id: string; slug: string; name: string; title: string; description: string; topicCount: number; replyCount: number; latestPost: LatestPost | null; subboards: ForumSubboard[] }
interface ForumDirectoryData { groups: ForumGroup[] }
interface TopicData { department: { id: string; name: string; slug: string }; subboard: { id: string; name: string; description: string } | null; items: BlogPostCard[]; page: number; pageSize: number; total: number }

const shortDate = (value: string) => new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

function LatestCell({ latest }: { latest: LatestPost | null }) {
  if (!latest) return <span className="forum-none">暂无主题</span>;
  return <span className="forum-latest"><Link to={`/posts/${latest.id}`}>{latest.title}</Link><small>由 {latest.latestAuthorName} · {shortDate(latest.createdAt)}</small></span>;
}

function CategoryRow({ name, description, topicCount, replyCount, latestPost, to, nested = false }: { name: string; description: string; topicCount: number; replyCount: number; latestPost: LatestPost | null; to: string; nested?: boolean }) {
  return <div className={`forum-category-row${nested ? ' nested' : ''}`}>
    <div className="forum-category-name"><Link to={to}>{name}</Link><small>{description}</small></div>
    <span>{topicCount}</span><span>{replyCount}</span><LatestCell latest={latestPost}/>
  </div>;
}

function CategoryGroup({ group, query = '' }: { group: ForumGroup; query?: string }) {
  const normalized = query.trim().toLocaleLowerCase();
  const subboards = group.subboards.filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase().includes(normalized));
  if (normalized && !`${group.name} ${group.description}`.toLocaleLowerCase().includes(normalized) && !subboards.length) return null;
  return <section className="forum-category-group">
    <header><strong>{group.name}</strong><span>{group.description}</span></header>
    <div className="forum-table-head"><span>板块名称</span><span>主题</span><span>回复</span><span>最新动态</span></div>
    <CategoryRow name={`${group.name}综合讨论`} description={`浏览${group.name}全部公开帖子，包括各子板块内容。`} topicCount={group.topicCount} replyCount={group.replyCount} latestPost={group.latestPost} to={`/tavern/${group.slug}`}/>
    {subboards.map((item) => <CategoryRow key={item.id} nested name={item.name} description={item.description} topicCount={item.topicCount} replyCount={item.replyCount} latestPost={item.latestPost} to={`/tavern/${group.slug}/${item.id}`}/>) }
  </section>;
}

export function ForumDirectory() {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['public-forum-categories'], queryFn: () => api<ForumDirectoryData>('/api/public/forum/categories') });
  return <section className="forum-directory shell" aria-label="酒馆板块目录">
    <div className="forum-directory-tools"><label><Search aria-hidden="true"/><span className="sr-only">检索子板块</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="检索部门或子板块"/></label><Link to="/portal/tavern">发布新帖 <ChevronRight/></Link></div>
    {query.isLoading ? <p className="retro-blog-status">正在读取酒馆目录……</p> : query.error ? <p className="retro-blog-status error">酒馆目录暂时没有响应</p> : <div className="forum-groups">{query.data?.groups.map((group) => <CategoryGroup key={group.id} group={group} query={search}/>)}</div>}
  </section>;
}

function TopicTable({ posts, empty = '这个板块还没有公开主题。' }: { posts: BlogPostCard[]; empty?: string }) {
  return <div className="forum-topic-table">
    <div className="forum-topic-head"><span>主题</span><span>发起人</span><span>回复</span><span>最新动态</span></div>
    {posts.length ? posts.map((post) => <article className={post.pinned ? 'pinned' : ''} key={post.id}>
      <div className="forum-topic-title">{post.pinned && <b><Pin/>置顶</b>}<Link to={`/posts/${post.id}`}>{post.title}</Link>{post.subtitle && <small>{post.subtitle}</small>}</div>
      <span>{post.author.displayName}</span><span>{post.commentCount}</span>
      <span className="forum-topic-latest">{post.latestAuthorName ?? post.author.displayName}<small>{shortDate(post.lastActivityAt ?? post.createdAt)}</small></span>
    </article>) : <p className="forum-topic-empty">{empty}</p>}
  </div>;
}

export function BlogPostBoard({ departmentSlug, initialSubboardId, compact = false, title }: { departmentSlug?: string; initialSubboardId?: string; compact?: boolean; sections?: Array<'pinned' | 'featured' | 'latest'>; title?: string }) {
  const [selectedSubboard, setSelectedSubboard] = useState<string | null>(initialSubboardId ?? null);
  const [subboardQuery, setSubboardQuery] = useState('');
  const board = useQuery({ queryKey: ['public-post-board', 'guild'], queryFn: () => api<BoardData>('/api/public/posts/board'), enabled: !departmentSlug });
  const directory = useQuery({ queryKey: ['public-forum-categories'], queryFn: () => api<ForumDirectoryData>('/api/public/forum/categories'), enabled: Boolean(departmentSlug) });
  const topics = useQuery({
    queryKey: ['public-forum-topics', departmentSlug, selectedSubboard],
    queryFn: () => api<TopicData>(`/api/public/forum/topics?departmentSlug=${encodeURIComponent(departmentSlug!)}${selectedSubboard ? `&subboardId=${encodeURIComponent(selectedSubboard)}` : ''}&page=1&pageSize=20`),
    enabled: Boolean(departmentSlug),
  });
  const homepagePosts = useMemo(() => {
    const unique = new Map<string, BlogPostCard>();
    for (const post of [...(board.data?.pinned ?? []), ...(board.data?.latest ?? [])]) unique.set(post.id, post);
    return [...unique.values()].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  }, [board.data]);
  const group = directory.data?.groups.find((item) => item.slug === departmentSlug);
  const visibleSubboards = group?.subboards.filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase().includes(subboardQuery.trim().toLocaleLowerCase())) ?? [];
  const selectedName = group?.subboards.find((item) => item.id === selectedSubboard)?.name;

  return <section className={`retro-blog-board forum-board${compact ? ' compact' : ''}`} aria-label={departmentSlug ? '部门帖子' : '社团帖子'}>
    <header><div><small>★ SAYUU FORUM / SINCE 2018 ★</small><h2>{title ?? (departmentSlug ? `${group?.name ?? '部门'}讨论区` : '冒险者酒馆')}</h2><p>{selectedName ? `当前子板块：${selectedName}` : departmentSlug ? '置顶主题与普通主题按最新动态统一排列。' : '置顶公告与最新主题汇集在同一张酒馆主题表。'}</p></div><span className="retro-counter">TOPIC<br/><b>{String(departmentSlug ? topics.data?.total ?? 0 : homepagePosts.length).padStart(6, '0')}</b></span></header>
    {departmentSlug && group && <div className="forum-board-picker">
      <label><Search aria-hidden="true"/><span className="sr-only">检索子板块</span><input value={subboardQuery} onChange={(event) => setSubboardQuery(event.target.value)} placeholder="检索本部门子板块"/></label>
      <button className={!selectedSubboard ? 'active' : ''} onClick={() => setSelectedSubboard(null)}><strong>{group.name}综合讨论</strong><small>全部 {group.topicCount} 个主题</small></button>
      {visibleSubboards.map((item) => <button className={selectedSubboard === item.id ? 'active' : ''} key={item.id} onClick={() => setSelectedSubboard(item.id)}><strong>{item.name}</strong><small>{item.description} · {item.topicCount} 个主题</small></button>)}
    </div>}
    {(departmentSlug ? topics.isLoading || directory.isLoading : board.isLoading) ? <p className="retro-blog-status">正在连接酒馆服务器……</p> : (departmentSlug ? topics.error || directory.error : board.error) ? <p className="retro-blog-status error">酒馆服务器暂时没有响应</p> : <TopicTable posts={departmentSlug ? topics.data?.items ?? [] : homepagePosts}/>}
    <footer className="forum-board-footer">{departmentSlug && <Link to="/tavern">返回全部板块</Link>}<Link to="/portal/tavern">登录后发布主题 <ChevronRight/></Link></footer>
  </section>;
}
