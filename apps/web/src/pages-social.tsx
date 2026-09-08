import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, CalendarCheck, Check, ChevronUp, Edit3, Eye, EyeOff, Hash, ImagePlus, MessageCircle, MoreHorizontal, Palette, Reply, Search, Send, ShieldCheck, Sparkles, Trash2, UserRound, Users, X } from 'lucide-react';
import { api, json, type PageData, type User } from './api';
import { memberAttributePool, roleLabels, type AvatarConfig } from '@guild/contracts';
import { useAuth } from './auth';
import { EmptyPanel, ErrorPanel, formatDate, LoadingPanel, PageHero } from './components';
import { PixelAvatar } from './components/avatar/PixelAvatar';

export interface SocialProfile {
  id:string; uid:string; displayName:string; role:User['role']; departmentId:string|null; departmentName?:string|null; departmentTitle?:string|null;
  bio:string; signature?:string; guildTitle:string; college:string; grade:string; skills:string[]; interests:string[]; attributes:string[]; avatarColor:string;
  avatarConfig?:AvatarConfig|null; avatarUrl?:string|null; coverUrl?:string|null;
  profileVisibility:'MEMBERS'|'PRIVATE'; presence?:'ONLINE'|'AWAY'|'OFFLINE'; lastSeenAt?:string|null; joinedAt?:string;
}
interface MemberHomepage { profile:SocialProfile; stats:{publishedWorks:number;attendedActivities:number;contributionPoints:number}; works:Array<{id:string;title:string;description:string;createdAt:string}>; activities:Array<{id:string;title:string;startsAt:string;checkedInAt?:string|null}>; photoWall:Array<{id:string;url:string;createdAt:string}> }
interface Conversation { id:string;type:'DIRECT'|'DEPARTMENT';departmentId:string|null;title:string;counterpart?:{id:string;displayName:string;avatarColor:string;presence:string}|null;lastMessage:string;lastMessageAt:string|null;unreadCount:number }
interface ChatMessage { id:string;conversationId:string;senderId:string;sender:{displayName:string;avatarColor:string};content:string;replyTo:{id:string;content:string;senderName:string}|null;editedAt:string|null;deletedAt:string|null;createdAt:string }
interface MessagePage { items:ChatMessage[];hasMore:boolean;nextBefore:string|null }

const roleLabel:Record<User['role'],string>=roleLabels;
const presenceLabel:Record<string,string>={ONLINE:'在线',AWAY:'最近活跃',OFFLINE:'离线'};
const splitTags=(value:string)=>[...new Set(value.split(/[,，]/).map(item=>item.trim()).filter(Boolean))].slice(0,8);
const attributeLabel=(id:string)=>memberAttributePool.find(attribute=>attribute.id===id)?.label??id;
const clock=(value:string|null)=>value?new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'';

function Avatar({ profile, size='normal' }:{profile:Pick<SocialProfile,'displayName'|'avatarColor'|'avatarUrl'|'presence'>;size?:'normal'|'large'|'small'}){
  return <span className={`social-avatar ${size}`} style={{'--avatar-color':profile.avatarColor} as React.CSSProperties} aria-hidden="true">{profile.avatarUrl?<img src={profile.avatarUrl} alt=""/>:<b>{profile.displayName.slice(0,1)}</b>}{profile.presence&&<i className={`presence ${profile.presence.toLowerCase()}`}/>}</span>;
}

export function MemberDirectoryPage(){
  const [search,setSearch]=useState('');
  const query=useQuery({queryKey:['social','directory',search],queryFn:()=>api<PageData<SocialProfile>>(`/api/member/directory?q=${encodeURIComponent(search)}&page=1&pageSize=24`)});
  return <main className="social-page"><PageHero eyebrow="ADVENTURER ROSTER" title="成员名录" description="发现真实协作伙伴，查看他们的作品、活动经历与公会专长。"/>
    <section className="shell social-directory"><div className="directory-toolbar"><div><span>MEMBER DIRECTORY</span><h2>寻找同行冒险者</h2></div><label className="social-search"><Search/><span className="sr-only">搜索成员</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="搜索 UID、称呼、头衔或部门"/></label></div>
    {query.isLoading?<LoadingPanel label="正在展开成员名册"/>:query.error?<ErrorPanel error={query.error}/>:!query.data?.items.length?<EmptyPanel label="没有找到符合条件的成员"/>:<div className="member-card-grid">{query.data.items.map(profile=><article className="member-card" key={profile.id}><div className="member-card-top"><Avatar profile={profile}/><span className={`presence-label ${profile.presence?.toLowerCase()}`}>{presenceLabel[profile.presence??'OFFLINE']}</span></div><div className="member-card-copy"><small>UID {profile.uid} · {profile.departmentName??'公会中枢'} · {roleLabel[profile.role]}</small><h3>{profile.displayName}</h3><strong>{profile.guildTitle||profile.departmentTitle||'公会成员'}</strong><p>{profile.bio||'这位成员正在整理自己的冒险档案。'}</p></div><div className="social-tags">{profile.skills.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div><Link aria-label={`查看 ${profile.displayName} 的主页`} to={`/portal/members/${profile.id}`}>查看个人主页 <span>→</span></Link></article>)}</div>}</section></main>;
}

export function MemberHomepagePage(){
  const {id=''}=useParams(); const {user}=useAuth(); const navigate=useNavigate(); const query=useQuery({queryKey:['social','profile',id],queryFn:()=>api<MemberHomepage>(`/api/member/profiles/${id}`),enabled:Boolean(id)});
  const chat=useMutation({mutationFn:()=>api<{conversation:Conversation}>('/api/member/conversations/direct',json('POST',{userId:id})),onSuccess:data=>navigate(`/portal/chat?conversation=${data.conversation.id}`)});
  if(query.isLoading)return <main><LoadingPanel label="正在读取成员档案"/></main>; if(query.error)return <main className="social-profile-error"><ErrorPanel error={query.error}/><Link to="/portal/members">返回成员名录</Link></main>;
  const data=query.data!; const profile=data.profile;
  const photos=data.photoWall??[];
  return <main className="social-page member-homepage qq-profile">
    <section className={`profile-cover ${profile.coverUrl?'has-cover':''}`} style={{'--profile-accent':profile.avatarColor} as React.CSSProperties}>
      {profile.coverUrl&&<img className="profile-cover-image" src={profile.coverUrl} alt={`${profile.displayName} 的主页封面`}/>}<div className="profile-cover-shade"/><div className="profile-cover-grid" aria-hidden="true"/>
      <Link className="profile-back" to="/portal/members"><ArrowLeft/>成员名录</Link>
      <div className="profile-identity"><span className="profile-identity-avatar">{profile.avatarUrl?<img className="uploaded-avatar" src={profile.avatarUrl} alt={`${profile.displayName} 的头像`}/>:<PixelAvatar config={profile.avatarConfig} seed={profile.id} size={92} label={`${profile.displayName} 的像素小人`}/>}</span><div className="profile-identity-copy"><span>UID {profile.uid} · {profile.departmentName??'公会中枢'} · {roleLabel[profile.role]}</span><h1>{profile.displayName}</h1><strong>{profile.guildTitle||'公会成员'}</strong><p>{profile.bio||'这位成员还没有填写个人介绍。'}</p></div></div>
    </section>
    <section className="shell profile-command"><blockquote><Sparkles/><span>{profile.signature||'今天也在认真参与社团活动。'}</span></blockquote><div className="profile-actions">{user?.id===profile.id?<Link className="guild-button primary" to="/portal/profile"><Edit3/>编辑资料</Link>:<button className="guild-button primary" aria-label={`给 ${profile.displayName} 发消息`} onClick={()=>chat.mutate()} disabled={chat.isPending}><MessageCircle/>{chat.isPending?'正在打开…':'发消息'}</button>}<span className="profile-presence"><i className={`presence ${profile.presence?.toLowerCase()}`}/>{presenceLabel[profile.presence??'OFFLINE']}</span></div></section>
    <section className="shell profile-body"><div className="profile-main"><div className="profile-stat-grid"><article><Award/><span>贡献记录</span><strong>{data.stats.contributionPoints}</strong></article><article><Sparkles/><span>发布作品</span><strong>{data.stats.publishedWorks}</strong></article><article><CalendarCheck/><span>参与活动</span><strong>{data.stats.attendedActivities}</strong></article></div>
      <article className="profile-section profile-photo-section"><div className="section-heading"><ImagePlus/><div><small>PHOTO WALL</small><h2>照片墙</h2></div></div>{photos.length?<div className={`profile-photo-wall count-${Math.min(photos.length,6)}`}>{photos.map((photo,index)=><figure key={photo.id}><img src={photo.url} alt={`${profile.displayName} 的照片 ${index+1}`}/><figcaption>{formatDate(photo.createdAt)}</figcaption></figure>)}</div>:<p className="profile-empty">这里还没有照片，等待下一次值得记录的相聚。</p>}</article>
      <article className="profile-section"><div className="section-heading"><Sparkles/><div><small>PORTFOLIO</small><h2>代表作品</h2></div></div>{data.works.length?<div className="profile-work-grid">{data.works.map(work=><div key={work.id}><span>CREATION</span><h3>{work.title}</h3><p>{work.description}</p><time>{formatDate(work.createdAt)}</time></div>)}</div>:<p className="profile-empty">还没有已发布作品。</p>}</article><article className="profile-section"><div className="section-heading"><CalendarCheck/><div><small>ACTIVITY LOG</small><h2>活动足迹</h2></div></div>{data.activities.length?<div className="activity-timeline">{data.activities.map(activity=><div key={activity.id}><i/><span>{formatDate(activity.startsAt)}</span><strong>{activity.title}</strong></div>)}</div>:<p className="profile-empty">活动足迹将在报名或签到后显示。</p>}</article></div>
      <aside className="profile-aside"><article><h2>个人信息</h2><dl><div><dt>学院</dt><dd>{profile.college||'未填写'}</dd></div><div><dt>年级</dt><dd>{profile.grade||'未填写'}</dd></div><div><dt>所属部门</dt><dd>{profile.departmentName??'公会中枢'}</dd></div><div><dt>加入时间</dt><dd>{formatDate(profile.joinedAt)}</dd></div></dl></article><article><h2>个性名片</h2><div className="social-tags attribute">{profile.attributes?.length?profile.attributes.map(id=><span key={id}>{attributeLabel(id)}</span>):<em>等待补充</em>}</div></article><article><h2>擅长领域</h2><div className="social-tags feature">{profile.skills.length?profile.skills.map(tag=><span key={tag}>{tag}</span>):<em>等待补充</em>}</div></article><article><h2>兴趣坐标</h2><div className="social-tags interest">{profile.interests.length?profile.interests.map(tag=><span key={tag}>{tag}</span>):<em>等待补充</em>}</div></article></aside></section>
  </main>;
}

export function ProfileEditorPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const query = useQuery({ queryKey: ['social', 'self-profile'], queryFn: () => api<MemberHomepage>('/api/member/profile') });
  const [form, setForm] = useState({ uid: '', displayName: '', bio: '', signature: '', guildTitle: '', college: '', grade: '', skills: '', interests: '', attributes: [] as string[], avatarColor: '#5279a8', profileVisibility: 'MEMBERS' as 'MEMBERS' | 'PRIVATE' });
  const [account, setAccount] = useState({ username: '', usernamePassword: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!query.data?.profile) return;
    const profile = query.data.profile;
    const legacyUsername = (profile as SocialProfile & { username?: string }).username;
    setForm({ uid: profile.uid ?? legacyUsername ?? '', displayName: profile.displayName ?? '', bio: profile.bio ?? '', signature: profile.signature ?? '', guildTitle: profile.guildTitle ?? '', college: profile.college ?? '', grade: profile.grade ?? '', skills: (profile.skills ?? []).join(', '), interests: (profile.interests ?? []).join(', '), attributes: profile.attributes ?? [], avatarColor: profile.avatarColor ?? '#5279a8', profileVisibility: profile.profileVisibility ?? 'MEMBERS' });
    setAvatarUrl(profile.avatarUrl ?? null);
    setCoverUrl(profile.coverUrl ?? null);
  }, [query.data]);
  useEffect(() => {
    if (user?.username) setAccount((current) => ({ ...current, username: user.username ?? '' }));
  }, [user?.username]);
  const mutation = useMutation({ mutationFn: () => api('/api/member/profile', json('PATCH', { ...form, skills: splitTags(form.skills), interests: splitTags(form.interests), attributes: form.attributes })), onSuccess: async () => { setSaved(true); await Promise.all([client.invalidateQueries({ queryKey: ['auth', 'me'] }), client.invalidateQueries({ queryKey: ['social'] })]); } });
  const usernameMutation = useMutation({
    mutationFn: () => api<{ updated: boolean; user: User }>('/api/member/account/username', json('PATCH', { username: account.username, currentPassword: account.usernamePassword })),
    onSuccess: async (data) => {
      setAccount((current) => ({ ...current, username: data.user.username ?? current.username, usernamePassword: '' }));
      setAccountMessage('用户名已更新');
      await client.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
  const passwordMutation = useMutation({
    mutationFn: () => {
      if (account.newPassword !== account.confirmPassword) throw new Error('两次输入的新密码不一致');
      return api<{ updated: boolean; revokedSessions: number }>('/api/member/account/password', json('PATCH', { currentPassword: account.currentPassword, newPassword: account.newPassword }));
    },
    onSuccess: () => {
      setAccount((current) => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setAccountMessage('密码已更新，其他设备已退出登录');
    },
  });
  const avatarUpload = useMutation({
    mutationFn: (file: File) => { const body = new FormData(); body.append('file', file); return api<{ avatarUrl: string }>('/api/member/profile/avatar', { method: 'POST', body }); },
    onSuccess: async (data) => { setAvatarUrl(data.avatarUrl); await Promise.all([client.invalidateQueries({ queryKey: ['auth', 'me'] }), client.invalidateQueries({ queryKey: ['social'] })]); },
  });
  const coverUpload = useMutation({
    mutationFn: (file: File) => { const body = new FormData(); body.append('file', file); return api<{ coverUrl: string }>('/api/member/profile/cover', { method: 'POST', body }); },
    onSuccess: async (data) => { setCoverUrl(data.coverUrl); await client.invalidateQueries({ queryKey: ['social'] }); },
  });
  const photoUpload = useMutation({
    mutationFn: (file: File) => { const body = new FormData(); body.append('file', file); return api<{ photo: { id: string; url: string; createdAt: string } }>('/api/member/profile/photos', { method: 'POST', body }); },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['social', 'self-profile'] }); },
  });
  const photoDelete = useMutation({
    mutationFn: (id: string) => api(`/api/member/profile/photos/${id}`, { method: 'DELETE' }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['social', 'self-profile'] }); },
  });
  if (query.isLoading) return <main><LoadingPanel label="正在读取个人主页" /></main>;
  return <main className="social-page">
    <PageHero eyebrow="PROFILE STUDIO" title="编辑资料" description="让社团伙伴认识真实的你：协作方向、兴趣与作品，而不是游戏属性。" />
    <section className="shell profile-editor-layout">
      <aside className="profile-preview profile-avatar-card" style={{ '--profile-accent': form.avatarColor } as React.CSSProperties}>
        {coverUrl&&<img className="profile-editor-cover" src={coverUrl} alt="我的主页封面"/>}
        <span>LIVE PREVIEW</span>
        <div className="profile-avatar-stage">{avatarUrl ? <img className="uploaded-avatar" src={avatarUrl} alt="我的头像" /> : <PixelAvatar config={query.data?.profile?.avatarConfig} seed={query.data?.profile?.id ?? 'guest'} size={132} label="我的像素形象" />}</div>
        <h2>{form.displayName || '你的称呼'}</h2><strong>{form.guildTitle || '公会头衔'}</strong><blockquote>{form.signature || '写一句此刻最想说的话。'}</blockquote><p>{form.bio || '写一段简洁的社团自我介绍。'}</p>
        <div className="social-tags">{splitTags(form.skills).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <Link className="guild-button primary profile-avatar-cta" to="/portal/avatar"><Palette />前往形象工房捏脸</Link>
      </aside>
      <form className="profile-editor" onSubmit={(event: FormEvent) => { event.preventDefault(); setSaved(false); mutation.mutate(); }}>
        <div className="editor-section"><span>01 · IDENTITY</span><h2>基础身份</h2><div className="editor-grid">
          <label>账号 ID<input required minLength={3} maxLength={24} value={form.uid} onChange={(event) => setForm({ ...form, uid: event.target.value })} /><small>唯一 ID，可使用中文、字母、数字、下划线、短横线或点</small></label>
          <label>公开称呼<input required minLength={2} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label>
          <label>公会头衔<input value={form.guildTitle} maxLength={40} onChange={(event) => setForm({ ...form, guildTitle: event.target.value })} /></label>
          <label>学院<input value={form.college} maxLength={80} onChange={(event) => setForm({ ...form, college: event.target.value })} /></label>
          <label>年级<input value={form.grade} maxLength={30} onChange={(event) => setForm({ ...form, grade: event.target.value })} /></label>
        </div><label>个性签名<input aria-label="个性签名" maxLength={120} value={form.signature} onChange={(event) => setForm({ ...form, signature: event.target.value })} placeholder="一句话介绍此刻的你"/><small>{form.signature.length}/120</small></label><label>个人简介<textarea rows={5} maxLength={500} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /><small>{form.bio.length}/500</small></label></div>
        <div className="editor-section"><span>02 · SPECIALTY</span><h2>协作坐标</h2><label>技能标签<input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="以逗号分隔，最多 8 项" /></label><label>兴趣标签<input value={form.interests} onChange={(event) => setForm({ ...form, interests: event.target.value })} placeholder="动画, 摄影, 音乐…" /></label></div>
        <div className="editor-section"><span>03 · ATTRIBUTES</span><h2>我的属性</h2><p className="attribute-hint">从属性池中选择最像你的标签（最多 8 项），共鸣图鉴会据此为你推荐默契伙伴。</p><div className="attribute-pool">{memberAttributePool.map((attribute) => <button type="button" key={attribute.id} aria-pressed={form.attributes.includes(attribute.id)} className={form.attributes.includes(attribute.id) ? 'active' : ''} onClick={() => setForm({ ...form, attributes: form.attributes.includes(attribute.id) ? form.attributes.filter((id) => id !== attribute.id) : form.attributes.length >= 8 ? form.attributes : [...form.attributes, attribute.id] })}>{attribute.label}</button>)}</div><small>已选择 {form.attributes.length}/8</small></div>
        <div className="editor-section"><span>04 · APPEARANCE & PRIVACY</span><h2>头像、封面与可见性</h2>
          <label className="profile-photo-upload"><span><ImagePlus />上传头像</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) avatarUpload.mutate(file); }} /><small>支持 JPG、PNG、WebP 或 GIF，最大 8MB</small></label>
          {avatarUpload.isPending && <p>正在上传头像……</p>}{avatarUpload.error && <p className="form-error">{avatarUpload.error.message}</p>}
          <label className="profile-photo-upload"><span><ImagePlus />上传主页封面</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) coverUpload.mutate(file); }} /><small>建议使用横向照片，最大 10MB</small></label>
          {coverUpload.isPending && <p>正在上传主页封面……</p>}{coverUpload.error && <p className="form-error">{coverUpload.error.message}</p>}
          <div className="editor-grid"><label>主页主题色<span className="color-control"><input type="color" value={form.avatarColor} onChange={(event) => setForm({ ...form, avatarColor: event.target.value })} /><b>{form.avatarColor}</b></span></label><label>主页可见范围<select value={form.profileVisibility} onChange={(event) => setForm({ ...form, profileVisibility: event.target.value as 'MEMBERS' | 'PRIVATE' })}><option value="MEMBERS">全体登录成员</option><option value="PRIVATE">仅自己与管理员</option></select></label></div>
          <p className="privacy-note">{form.profileVisibility === 'MEMBERS' ? <><Eye />成员可通过名录查看你的主页。</> : <><EyeOff />普通成员无法发现或查看你的主页。</>}</p>
        </div>
        <div className="editor-section profile-gallery-editor"><span>05 · PHOTO WALL</span><h2>照片墙</h2><p className="attribute-hint">记录社团活动、创作和日常，最多展示 12 张照片。</p>
          <label className="profile-photo-upload"><span><ImagePlus />添加照片墙照片</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) photoUpload.mutate(file); }} /><small>{query.data?.photoWall?.length??0}/12 · 单张最大 10MB</small></label>
          {photoUpload.isPending&&<p>正在添加照片……</p>}{photoUpload.error&&<p className="form-error">{photoUpload.error.message}</p>}
          <div className="profile-gallery-edit-grid">{(query.data?.photoWall??[]).map((photo,index)=><figure key={photo.id}><img src={photo.url} alt={`照片墙照片 ${index+1}`}/><button type="button" aria-label={`删除照片 ${index+1}`} onClick={()=>photoDelete.mutate(photo.id)} disabled={photoDelete.isPending}><Trash2/></button></figure>)}</div>
          {photoDelete.error&&<p className="form-error">{photoDelete.error.message}</p>}
        </div>
        {mutation.error && <p className="form-error">{mutation.error.message}</p>}{saved && <p className="form-success"><Check />个人主页已保存</p>}<button className="guild-button primary" disabled={mutation.isPending}>保存个人主页</button>
      </form>
    </section>
    <section className="shell profile-editor-layout account-security-layout">
      <article className="parchment-panel">
        <span className="eyebrow">ACCOUNT IDENTITY</span>
        <h2>登录用户名</h2>
        <p>用户名与个人称呼、部门职位相互独立，可使用中文、字母、数字、点、下划线或连字符。</p>
        <form className="profile-editor" onSubmit={(event) => { event.preventDefault(); setAccountMessage(''); usernameMutation.mutate(); }}>
          <div className="editor-section">
            <label>用户名（支持中文）<input required minLength={2} maxLength={40} autoComplete="username" value={account.username} onChange={(event) => setAccount({ ...account, username: event.target.value })} /></label>
            <label>当前密码（修改用户名）<input required type="password" autoComplete="current-password" value={account.usernamePassword} onChange={(event) => setAccount({ ...account, usernamePassword: event.target.value })} /></label>
            {usernameMutation.error && <p className="form-error">{usernameMutation.error.message}</p>}
          </div>
          <button className="guild-button primary" disabled={usernameMutation.isPending}>修改用户名</button>
        </form>
      </article>
      <article className="parchment-panel">
        <span className="eyebrow">ACCOUNT SECURITY</span>
        <h2>修改密码</h2>
        <p>修改成功后保留当前登录，其他设备上的会话会自动退出。</p>
        <form className="profile-editor" onSubmit={(event) => { event.preventDefault(); setAccountMessage(''); passwordMutation.mutate(); }}>
          <div className="editor-section">
            <label>当前密码（修改密码）<input required type="password" autoComplete="current-password" value={account.currentPassword} onChange={(event) => setAccount({ ...account, currentPassword: event.target.value })} /></label>
            <label>新密码<input required type="password" minLength={6} autoComplete="new-password" value={account.newPassword} onChange={(event) => setAccount({ ...account, newPassword: event.target.value })} /></label>
            <label>确认新密码<input required type="password" minLength={6} autoComplete="new-password" value={account.confirmPassword} onChange={(event) => setAccount({ ...account, confirmPassword: event.target.value })} /></label>
            {passwordMutation.error && <p className="form-error">{passwordMutation.error.message}</p>}
          </div>
          <button className="guild-button primary" disabled={passwordMutation.isPending}>修改密码</button>
        </form>
      </article>
      {accountMessage && <p className="form-success account-security-message"><Check />{accountMessage}</p>}
    </section>
  </main>;
}

export function ChatPage(){
  const {user}=useAuth(); const client=useQueryClient(); const [params,setParams]=useSearchParams(); const initial=params.get('conversation'); const [selected,setSelected]=useState(initial??''); const [content,setContent]=useState(''); const [replying,setReplying]=useState<ChatMessage|null>(null); const [editing,setEditing]=useState<ChatMessage|null>(null); const [editContent,setEditContent]=useState(''); const [filter,setFilter]=useState(''); const endRef=useRef<HTMLDivElement|null>(null);
  const conversations=useQuery({queryKey:['social','conversations'],queryFn:()=>api<{items:Conversation[]}>('/api/member/conversations'),refetchInterval:2000});
  const messages=useInfiniteQuery({queryKey:['social','messages',selected],queryFn:({pageParam})=>api<MessagePage>(`/api/member/conversations/${selected}/messages?pageSize=40${pageParam?`&before=${encodeURIComponent(pageParam)}`:''}`),initialPageParam:undefined as string|undefined,getNextPageParam:last=>last.nextBefore??undefined,enabled:Boolean(selected),refetchInterval:2000});
  const active=conversations.data?.items.find(item=>item.id===selected); const allMessages=useMemo(()=>messages.data?.pages.slice().reverse().flatMap(page=>page.items)??[],[messages.data]);
  const refresh=async()=>Promise.all([client.invalidateQueries({queryKey:['social','conversations']}),client.invalidateQueries({queryKey:['social','messages',selected]})]);
  const read=useMutation({mutationFn:()=>api(`/api/member/conversations/${selected}/read`,json('POST')),onSuccess:()=>client.invalidateQueries({queryKey:['social','conversations']})});
  useEffect(()=>{if(selected&&messages.data?.pages.length&&(active?.unreadCount??0)>0&&!read.isPending)read.mutate();},[selected,messages.dataUpdatedAt,active?.unreadCount]);
  useEffect(()=>{
    if(allMessages.length&&typeof endRef.current?.scrollIntoView==='function')endRef.current.scrollIntoView({behavior:'smooth'});
  },[allMessages.length,selected]);
  const send=useMutation({mutationFn:()=>api(`/api/member/conversations/${selected}/messages`,json('POST',{content,replyToId:replying?.id??null})),onSuccess:async()=>{setContent('');setReplying(null);await refresh();}});
  const edit=useMutation({mutationFn:()=>api(`/api/member/messages/${editing?.id}`,json('PATCH',{content:editContent})),onSuccess:async()=>{setEditing(null);setEditContent('');await refresh();}});
  const remove=useMutation({mutationFn:(id:string)=>api(`/api/member/messages/${id}`,json('DELETE')),onSuccess:refresh});
  const choose=(id:string)=>{setSelected(id);setParams({conversation:id});setReplying(null);};
  const filtered=conversations.data?.items.filter(item=>item.title.toLowerCase().includes(filter.toLowerCase()))??[];
  return <main className="chat-page" data-chat-state={selected?'active':'empty'}><header className="chat-titlebar"><div><span>GUILD COMMUNICATION NETWORK</span><h1>公会通讯</h1></div><div className="chat-network"><i/>安全连接 · 仅成员可见</div></header><section className="chat-workspace"><aside className={`conversation-rail ${selected?'mobile-hidden':''}`}><label><Search/><span className="sr-only">搜索会话</span><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="搜索会话"/></label><div className="conversation-tabs"><button className="active">全部</button><Link to="/portal/members"><Users/>发起私聊</Link></div>{conversations.isLoading?<LoadingPanel label="连接通讯频道"/>:conversations.error?<ErrorPanel error={conversations.error}/>:<div className="conversation-list">{filtered.map(item=><button key={item.id} className={item.id===selected?'active':''} onClick={()=>choose(item.id)} aria-label={`${item.title}${item.unreadCount?`，${item.unreadCount} 条未读`:''}`}>{item.type==='DEPARTMENT'?<span className="channel-avatar"><Hash/></span>:<Avatar profile={{displayName:item.title,avatarColor:item.counterpart?.avatarColor??'#5279a8',presence:item.counterpart?.presence as SocialProfile['presence']}} size="small"/>}<span><strong>{item.title}</strong><small>{item.lastMessage||'开始一段新对话'}</small></span><time>{clock(item.lastMessageAt)}</time>{item.unreadCount>0&&<b className="unread-badge" aria-label={`${item.unreadCount} 条未读消息`}>{item.unreadCount}</b>}</button>)}</div>}</aside><section className={`message-panel ${selected?'mobile-active':''}`}>{!selected?<div className="chat-empty"><span><MessageCircle/></span><h2>选择一个通讯频道</h2><p>在部门频道中协作，或从成员名录发起一对一私聊。</p><Link to="/portal/members">浏览成员名录</Link></div>:<><header className="active-chat-header"><button className="mobile-chat-back" aria-label="返回会话列表" onClick={()=>{setSelected('');setParams({});}}><ArrowLeft/></button>{active?.type==='DIRECT'?<Avatar profile={{displayName:active.title,avatarColor:active.counterpart?.avatarColor??'#5279a8',presence:active.counterpart?.presence as SocialProfile['presence']}} size="small"/>:<span className="channel-avatar"><Hash/></span>}<div><h2>{active?.title??'通讯频道'}</h2><span>{active?.type==='DIRECT'?presenceLabel[active.counterpart?.presence??'OFFLINE']:'部门协作频道 · 成员可见'}</span></div><button title="会话信息"><MoreHorizontal/></button></header><div className="message-stream">{messages.hasNextPage&&<button className="load-older" onClick={()=>messages.fetchNextPage()} disabled={messages.isFetchingNextPage}><ChevronUp/>{messages.isFetchingNextPage?'读取中…':'查看更早消息'}</button>}{messages.isLoading?<LoadingPanel label="正在解封消息卷轴"/>:messages.error?<ErrorPanel error={messages.error}/>:allMessages.map((message,index)=>{const own=message.senderId===user?.id;const showDate=index===0||new Date(message.createdAt).toDateString()!==new Date(allMessages[index-1].createdAt).toDateString();return <div key={message.id}>{showDate&&<div className="message-date"><span>{new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'short'}).format(new Date(message.createdAt))}</span></div>}<article className={`chat-message ${own?'own':''} ${message.deletedAt?'deleted':''}`}><Avatar profile={{displayName:message.sender.displayName,avatarColor:message.sender.avatarColor}} size="small"/><div><header><strong>{message.sender.displayName}</strong><time>{clock(message.createdAt)}{message.editedAt?' · 已编辑':''}</time></header>{message.replyTo&&<blockquote><b>{message.replyTo.senderName}</b>{message.replyTo.content}</blockquote>}{editing?.id===message.id?<form className="inline-message-edit" onSubmit={e=>{e.preventDefault();edit.mutate();}}><input autoFocus value={editContent} onChange={e=>setEditContent(e.target.value)}/><button aria-label="保存编辑"><Check/></button><button type="button" aria-label="取消编辑" onClick={()=>setEditing(null)}><X/></button></form>:<p>{message.content}</p>}{!message.deletedAt&&<div className="message-actions"><button aria-label="回复该消息" title="回复" onClick={()=>setReplying(message)}><Reply/></button>{own&&<><button aria-label="编辑该消息" title="编辑" onClick={()=>{setEditing(message);setEditContent(message.content);}}><Edit3/></button><button aria-label="撤回该消息" title="撤回" onClick={()=>remove.mutate(message.id)}><Trash2/></button></>}</div>}</div></article></div>})}<div ref={endRef}/></div><form className="message-composer" onSubmit={e=>{e.preventDefault();if(content.trim())send.mutate();}}>{replying&&<div className="reply-composer"><Reply/><span>正在回复 {replying.sender.displayName}<small>{replying.content}</small></span><button type="button" aria-label="取消回复" onClick={()=>setReplying(null)}><X/></button></div>}<div><textarea aria-label="输入消息" value={content} onChange={e=>setContent(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(content.trim())send.mutate();}}} placeholder="输入消息，Enter 发送，Shift + Enter 换行" rows={2} maxLength={2000}/><button aria-label="发送消息" disabled={!content.trim()||send.isPending}><Send/></button></div><small>{content.length}/2000 · 请勿发送联系方式等敏感信息</small></form></>}</section><aside className="chat-context"><div className="context-emblem"><ShieldCheck/></div><h2>{active?.title??'公会通讯守则'}</h2>{active?.type==='DIRECT'&&active.counterpart?<><span className={`context-presence ${active.counterpart.presence.toLowerCase()}`}>{presenceLabel[active.counterpart.presence]}</span><Link to={`/portal/members/${active.counterpart.id}`}><UserRound/>查看成员主页</Link></>:<><p>消息仅用于真实社团协作，不构成公开内容。</p><ul><li>保护成员隐私</li><li>保持友善与尊重</li><li>重要资料请转存文件区</li></ul></>}</aside></section></main>;
}
