import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, MessageSquareText, Save, Send, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, json } from '../../api';
import { useAuth } from '../../auth';

interface GuestbookMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; displayName: string; avatarColor: string };
}

interface GuestbookResponse { items: GuestbookMessage[] }

const queryKey = ['department-guestbook', 'tech'] as const;

export function TechGuestbook({ management = false }: { management?: boolean }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const query = useQuery({ queryKey, queryFn: () => api<GuestbookResponse>('/api/member/departments/tech/guestbook'), enabled: Boolean(user) });
  const refresh = () => client.invalidateQueries({ queryKey });
  const create = useMutation({
    mutationFn: () => api('/api/member/departments/tech/guestbook', json('POST', { content })),
    onSuccess: () => { setContent(''); void refresh(); },
  });
  const update = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => api(`/api/admin/departments/tech/guestbook/${id}`, json('PATCH', { content: value })),
    onSuccess: () => { setEditing(null); void refresh(); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/admin/departments/tech/guestbook/${id}`, { method: 'DELETE' }),
    onSuccess: () => void refresh(),
  });
  const belongsToTech = Boolean(user && (
    user.departmentId === 'dept-tech'
    || user.departmentIds?.includes('dept-tech')
    || user.role === 'PRESIDENT'
    || user.role === 'VICE_PRESIDENT'
  ));
  const submit = (event: FormEvent) => { event.preventDefault(); if (content.trim()) create.mutate(); };

  return <section className={`tech-guestbook${management ? ' is-management' : ''}`} id={management ? 'tech-guestbook-management' : 'tech-guestbook'}>
    <header><span><MessageSquareText aria-hidden="true" /> 05</span><div><h2>{management ? '管理技术部留言' : '留言板'}</h2><small>MESSAGE BOARD</small></div><p>{management ? '部长和副部长可修改或删除不合适的留言。' : '技术部成员可以在这里留下现场提醒、建议与想说的话。'}</p></header>
    {!user ? <div className="tech-guestbook-gate"><p>登录技术部成员账号后即可查看并留言。</p><Link to="/login?from=/departments/tech">登录后参与</Link></div> : <>
      <div className="tech-guestbook-notes">
        {query.isLoading ? <p>正在读取留言……</p> : query.error ? <p className="form-error">{query.error.message}</p> : !query.data?.items.length ? <p>还没有留言，来写下第一张便笺吧。</p> : query.data.items.map(message => <article key={message.id}>
          <div className="tech-guestbook-avatar" style={{ background: message.sender.avatarColor }}>{message.sender.displayName.slice(0, 1)}</div>
          {management && editing?.id === message.id ? <form onSubmit={event => { event.preventDefault(); update.mutate({ id: message.id, value: editing.content }); }}><textarea value={editing.content} maxLength={200} onChange={event => setEditing({ id: message.id, content: event.target.value })} /><button type="submit" aria-label="保存留言修改"><Save aria-hidden="true" /></button><button type="button" aria-label="取消修改" onClick={() => setEditing(null)}><X aria-hidden="true" /></button></form> : <div><strong>{message.sender.displayName}</strong><time>{new Date(message.createdAt).toLocaleString('zh-CN')}</time><p>{message.content}</p></div>}
          {management && editing?.id !== message.id && <div className="tech-guestbook-actions"><button type="button" onClick={() => setEditing({ id: message.id, content: message.content })} aria-label={`修改${message.sender.displayName}的留言`}><Edit3 aria-hidden="true" /></button><button type="button" onClick={() => { if (window.confirm('确认删除这条留言吗？')) remove.mutate(message.id); }} aria-label={`删除${message.sender.displayName}的留言`}><Trash2 aria-hidden="true" /></button></div>}
        </article>)}
      </div>
      {!management && (belongsToTech ? <form className="tech-guestbook-form" onSubmit={submit}><label htmlFor="tech-guestbook-content">留下你的话</label><textarea id="tech-guestbook-content" required maxLength={200} value={content} onChange={event => setContent(event.target.value)} placeholder="写下不超过 200 字的留言……" /><button type="submit" disabled={create.isPending || !content.trim()}><Send aria-hidden="true" />{create.isPending ? '正在提交…' : '钉到留言板上'}</button>{create.error && <p className="form-error">{create.error.message}</p>}</form> : <p className="tech-guestbook-member-note">仅技术部成员可以新增留言。</p>)}
      {(update.error || remove.error) && <p className="form-error">{(update.error || remove.error)?.message}</p>}
    </>}
  </section>;
}
