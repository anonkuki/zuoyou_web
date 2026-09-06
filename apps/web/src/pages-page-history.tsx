import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, History, RotateCcw, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { isExecutiveRole } from '@guild/contracts';
import { api, json, type PageData } from './api';
import { useAuth } from './auth';
import { LoadingPanel } from './components';
import { showcaseBySlug } from './components/departments/showcase-data';
import { pageContentQueryKey, type PageContentResponse } from './components/page-content/PageContentSurface';
import { departmentPageSections, homePageSections } from './pages-page-editor';

type ChangeKind = 'INITIAL' | 'VISIBILITY' | 'CONTENT' | 'ITEMS' | 'IMAGES';
interface PageRevision {
  id: string;
  revisionNo: number;
  changeType: 'BASELINE' | 'UPDATE' | 'RESTORE';
  restoredFromId: string | null;
  restoredFromRevisionNo: number | null;
  changedSections: Array<{ sectionId: string; changeKinds: ChangeKind[] }>;
  createdAt: string;
  actor: { id: string; uid: string | null; displayName: string | null } | null;
}

const kindLabels: Record<ChangeKind, string> = {
  INITIAL: '历史基线', VISIBILITY: '显示状态', CONTENT: '标题与说明', ITEMS: '展示内容', IMAGES: '图片与链接',
};

const dateTime = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium', timeStyle: 'short', hour12: false,
}).format(new Date(value));

export function PageHistoryPage({ scope }: { scope: 'home' | 'department' }) {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  if (scope === 'department' && !showcaseBySlug[slug]) return <Navigate to="/departments" replace />;

  const pageKey = scope === 'home' ? 'home' : `department:${slug}`;
  const returnTo = scope === 'home' ? '/' : `/departments/${slug}`;
  const pageName = scope === 'home' ? '社团主页' : `${showcaseBySlug[slug].theme}页面`;
  const sections = useMemo(() => scope === 'home' ? homePageSections : departmentPageSections(slug), [scope, slug]);
  const sectionNames = useMemo(() => new Map([
    ...sections.map((section) => [section.id, section.name] as const),
    ['page-images', '页面图片与跳转设置'] as const,
    ['page', '启用历史功能时的完整页面'] as const,
  ]), [sections]);
  const historyQuery = useQuery({
    queryKey: ['page-content-history', pageKey, page],
    queryFn: () => api<PageData<PageRevision>>(`/api/public/page-content/${encodeURIComponent(pageKey)}/history?page=${page}&pageSize=20`),
  });
  const restore = useMutation({
    mutationFn: (revision: PageRevision) => api<PageContentResponse>(
      `/api/admin/page-content/${encodeURIComponent(pageKey)}/history/${encodeURIComponent(revision.id)}/restore`, json('POST'),
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['page-content-history', pageKey] }),
        queryClient.invalidateQueries({ queryKey: pageContentQueryKey(pageKey) }),
      ]);
      setPage(1);
    },
  });
  const canRestore = Boolean(user && isExecutiveRole(user.role));
  const totalPages = Math.max(1, Math.ceil((historyQuery.data?.total ?? 0) / 20));
  const newestRevision = page === 1 ? historyQuery.data?.items[0]?.id : null;

  const requestRestore = (revision: PageRevision) => {
    if (!window.confirm(`确定将${pageName}还原到版本 ${revision.revisionNo} 吗？\n当前版本不会被抹去，本次还原会作为新的修改记录保存。`)) return;
    restore.mutate(revision);
  };

  return <main className="page-history shell" data-page-key={pageKey}>
    <header className="page-history-heading">
      <div>
        <Link to={returnTo}><ArrowLeft aria-hidden="true" /> 返回{pageName}</Link>
        <span>PAGE CHANGE ARCHIVE</span>
        <h1><History aria-hidden="true" /> 历史页面</h1>
        <p>这里按时间保留每次保存后的页面版本，并标出本次受到影响的模块。历史记录不会因还原而消失。</p>
      </div>
      <strong>{pageName}</strong>
    </header>

    {canRestore && <aside className="page-history-permission"><ShieldCheck aria-hidden="true" /><div><strong>你拥有页面还原权限</strong><p>选择旧版本后，系统会生成一条新的“还原记录”。</p></div></aside>}
    {restore.isSuccess && <p className="page-history-success">页面已还原，并已生成新的修改记录。</p>}
    {restore.isError && <p className="page-history-error">{restore.error instanceof Error ? restore.error.message : '还原失败，请稍后重试。'}</p>}

    {historyQuery.isLoading && <LoadingPanel label="正在翻阅页面档案" />}
    {historyQuery.isError && <p className="page-history-error">历史记录暂时无法读取，请稍后重试。</p>}
    {historyQuery.data?.items.length === 0 && <section className="page-history-empty"><History aria-hidden="true" /><h2>还没有修改记录</h2><p>下一次通过编辑模式保存页面后，第一条记录会出现在这里。</p></section>}

    <ol className="page-history-list">
      {historyQuery.data?.items.map((revision) => <li key={revision.id} className={`page-history-record is-${revision.changeType.toLowerCase()}`}>
        <div className="page-history-version"><span>VERSION</span><strong>{String(revision.revisionNo).padStart(3, '0')}</strong></div>
        <article>
          <header>
            <div>
              <span className="page-history-type">{revision.changeType === 'RESTORE' ? '还原记录' : revision.changeType === 'BASELINE' ? '历史基线' : '页面修改'}</span>
              <h2>{revision.changeType === 'RESTORE' ? `还原至版本 ${revision.restoredFromRevisionNo ?? '?'}` : `版本 ${revision.revisionNo}`}</h2>
            </div>
            <time dateTime={revision.createdAt}>{dateTime(revision.createdAt)}</time>
          </header>
          <p className="page-history-actor">操作人：{revision.actor?.displayName ?? '已停用账号'}{revision.actor?.uid ? ` · UID ${revision.actor.uid}` : ''}</p>
          <div className="page-history-changes" aria-label="本次更改的模块">
            {revision.changedSections.length ? revision.changedSections.map((change) => <div className="page-history-change" key={change.sectionId}>
              <strong>{sectionNames.get(change.sectionId) ?? change.sectionId}</strong>
              <span>{change.changeKinds.map((kind) => kindLabels[kind]).join(' · ')}</span>
            </div>) : <div className="page-history-change is-none"><strong>未检测到内容差异</strong><span>本次仍作为一次保存记录保留</span></div>}
          </div>
          <div className="page-history-actions">
            <Link className="page-history-view" to={`${returnTo}?historyVersion=${encodeURIComponent(revision.id)}`}><Eye aria-hidden="true" /> 查看此版本</Link>
            {canRestore && revision.id !== newestRevision && <button type="button" className="page-history-restore" disabled={restore.isPending} onClick={() => requestRestore(revision)}><RotateCcw aria-hidden="true" /> 还原到此版本</button>}
          </div>
        </article>
      </li>)}
    </ol>

    {totalPages > 1 && <nav className="page-history-pagination" aria-label="历史记录分页">
      <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft aria-hidden="true" /> 上一页</button>
      <span>{page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页 <ChevronRight aria-hidden="true" /></button>
    </nav>}
  </main>;
}
