import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock3, Pin, Sparkles, ThumbsUp } from 'lucide-react';
import { api } from '../../api';
import { formatDate } from '../../components';

export interface BlogPostBlock { type: 'PARAGRAPH' | 'IMAGE' | 'LINK'; text?: string; assetId?: string; alt?: string; url?: string; label?: string }
export interface BlogPostCard {
  id: string; title: string; subtitle: string; content: string; body: BlogPostBlock[]; departmentName: string | null;
  pinned: boolean; featured: boolean; upvoteCount: number; downvoteCount: number; score: number; commentCount: number; createdAt: string;
  author: { id: string; displayName: string; avatarColor: string };
}
interface BoardData { pinned: BlogPostCard[]; featured: BlogPostCard[]; latest: BlogPostCard[] }

function BoardColumn({ title, icon, posts, empty }: { title: string; icon: React.ReactNode; posts: BlogPostCard[]; empty: string }) {
  return <section className="retro-blog-column">
    <h3>{icon}<span>{title}</span><small>{posts.length.toString().padStart(2, '0')}</small></h3>
    {posts.length ? posts.map((post) => <article key={post.id}>
      <div className="retro-blog-meta"><span>{post.departmentName ?? '整个社团'}</span><time>{formatDate(post.createdAt)}</time></div>
      <Link to={`/posts/${post.id}`}><strong>{post.title}</strong>{post.subtitle && <em>{post.subtitle}</em>}</Link>
      <p>{post.content.split('\n')[0]}</p>
      <footer><span>BY {post.author.displayName}</span><span><ThumbsUp /> 评分 {post.score > 0 ? `+${post.score}` : post.score}</span></footer>
    </article>) : <p className="retro-blog-empty">{empty}</p>}
  </section>;
}

export function BlogPostBoard({ departmentSlug }: { departmentSlug?: string }) {
  const suffix = departmentSlug ? `?departmentSlug=${encodeURIComponent(departmentSlug)}` : '';
  const query = useQuery({ queryKey: ['public-post-board', departmentSlug ?? 'guild'], queryFn: () => api<BoardData>(`/api/public/posts/board${suffix}`) });
  return <section className="retro-blog-board" aria-label={departmentSlug ? '部门帖子' : '社团帖子'}>
    <header><div><small>★ SAYUU WEBLOG / SINCE 2018 ★</small><h2>{departmentSlug ? '部门日志交换站' : '社团日志交换站'}</h2><p>公告、成员创作与新鲜见闻，都收录在这块复古网络留言板。</p></div><span className="retro-counter">VISIT<br/><b>000327</b></span></header>
    {query.isLoading ? <p className="retro-blog-status">正在连接日志服务器……</p> : query.error ? <p className="retro-blog-status error">日志服务器暂时没有响应</p> : <div className="retro-blog-grid">
      <BoardColumn title="置顶帖" icon={<Pin />} posts={query.data?.pinned ?? []} empty="尚无置顶公告" />
      <BoardColumn title="精选帖" icon={<Sparkles />} posts={query.data?.featured ?? []} empty="赞成与反对将共同决定精选" />
      <BoardColumn title="最新发帖" icon={<Clock3 />} posts={query.data?.latest ?? []} empty="这里还没有公开帖子" />
    </div>}
  </section>;
}
