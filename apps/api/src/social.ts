import type Database from 'better-sqlite3';
import { isExecutiveRole, isManagementRole, resolveAvatarConfig, type MemberProfileUpdate, type PostCreate, type Role } from '@guild/contracts';

export interface SocialPrincipal {
  id: string;
  role: Role;
  departmentId: string | null;
  departmentIds: string[];
}

export class SocialError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
  }
}

const safeTags = (raw: string | null | undefined): string[] => {
  try {
    const value = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
};

const presence = (lastSeenAt: string | null, timestamp: string) => {
  if (!lastSeenAt) return 'OFFLINE';
  return Date.parse(timestamp) - Date.parse(lastSeenAt) <= 5 * 60_000 ? 'ONLINE' : 'AWAY';
};

interface ProfileRow {
  id: string; display_name: string; role: Role; department_id: string | null; department_name: string | null; department_title: string | null;
  bio: string; guild_title: string; college: string; grade: string; skills: string; interests: string; attributes: string; avatar_color: string; avatar_config: string | null; profile_visibility: 'MEMBERS' | 'PRIVATE';
  last_seen_at: string | null; created_at: string;
}

const PROFILE_COLUMNS = 'u.id,u.display_name,u.role,u.department_id,d.name department_name,d.title department_title,u.bio,u.guild_title,u.college,u.grade,u.skills,u.interests,u.attributes,u.avatar_color,u.avatar_config,u.profile_visibility,u.last_seen_at,u.created_at';

export class GuildSocialRepository {
  constructor(private sqlite: Database.Database, private makeId: (prefix: string) => string, private timestamp: () => string) {}

  private serializeProfile(row: ProfileRow) {
    return {
      id: row.id, displayName: row.display_name, role: row.role, departmentId: row.department_id, departmentName: row.department_name,
      departmentTitle: row.department_title, bio: row.bio, guildTitle: row.guild_title, college: row.college, grade: row.grade,
      skills: safeTags(row.skills), interests: safeTags(row.interests), attributes: safeTags(row.attributes), avatarColor: row.avatar_color, avatarConfig: resolveAvatarConfig(row.id, row.avatar_config), profileVisibility: row.profile_visibility,
      presence: presence(row.last_seen_at, this.timestamp()), lastSeenAt: row.last_seen_at, joinedAt: row.created_at,
    };
  }

  touch(userId: string): void {
    const current = this.timestamp();
    const threshold = new Date(Date.parse(current) - 60_000).toISOString();
    this.sqlite.prepare('UPDATE users SET last_seen_at=? WHERE id=? AND (last_seen_at IS NULL OR last_seen_at<?)').run(current, userId, threshold);
  }

  updateProfile(userId: string, input: MemberProfileUpdate) {
    const row = this.sqlite.prepare('SELECT * FROM users WHERE id=? AND is_active=1').get(userId) as Record<string, unknown> | undefined;
    if (!row) throw new SocialError(404, 'NOT_FOUND', '成员不存在');
    const next = {
      displayName: input.displayName ?? row.display_name,
      bio: input.bio ?? row.bio,
      guildTitle: input.guildTitle ?? row.guild_title,
      college: input.college ?? row.college,
      grade: input.grade ?? row.grade,
      skills: input.skills ? JSON.stringify([...new Set(input.skills)]) : row.skills,
      interests: input.interests ? JSON.stringify([...new Set(input.interests)]) : row.interests,
      attributes: input.attributes ? JSON.stringify([...new Set(input.attributes)]) : row.attributes,
      avatarConfig: input.avatarConfig ? JSON.stringify(input.avatarConfig) : row.avatar_config,
      avatarColor: input.avatarColor ?? row.avatar_color,
      visibility: input.profileVisibility ?? row.profile_visibility,
    };
    this.sqlite.prepare(`UPDATE users SET display_name=?,bio=?,guild_title=?,college=?,grade=?,skills=?,interests=?,attributes=?,avatar_config=?,avatar_color=?,profile_visibility=?,last_seen_at=?,updated_at=? WHERE id=?`)
      .run(next.displayName, next.bio, next.guildTitle, next.college, next.grade, next.skills, next.interests, next.attributes, next.avatarConfig, next.avatarColor, next.visibility, this.timestamp(), this.timestamp(), userId);
    return this.serializeProfile(this.getProfileRow(userId));
  }

  private getProfileRow(userId: string): ProfileRow {
    const row = this.sqlite.prepare(`SELECT ${PROFILE_COLUMNS}
      FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.id=? AND u.is_active=1`).get(userId) as ProfileRow | undefined;
    if (!row) throw new SocialError(404, 'NOT_FOUND', '成员不存在');
    return row;
  }

  listDirectory(principal: SocialPrincipal, query: string, page: number, pageSize: number) {
    const search = `%${query.trim()}%`;
    const privacy = isExecutiveRole(principal.role) ? '1=1' : "(u.profile_visibility='MEMBERS' OR u.id=?)";
    const parameters: unknown[] = isExecutiveRole(principal.role) ? [] : [principal.id];
    const where = `u.is_active=1 AND ${privacy} AND (?='' OR u.display_name LIKE ? OR u.guild_title LIKE ? OR d.name LIKE ?)`;
    parameters.push(query.trim(), search, search, search);
    const total = (this.sqlite.prepare(`SELECT COUNT(*) count FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE ${where}`).get(...parameters) as { count: number }).count;
    const rows = this.sqlite.prepare(`SELECT ${PROFILE_COLUMNS}
      FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE ${where}
      ORDER BY CASE WHEN u.id=? THEN 0 ELSE 1 END,u.last_seen_at DESC,u.display_name LIMIT ? OFFSET ?`)
      .all(...parameters, principal.id, pageSize, (page - 1) * pageSize) as ProfileRow[];
    return { items: rows.map((row) => this.serializeProfile(row)), page, pageSize, total };
  }

  getMemberHomepage(principal: SocialPrincipal, userId: string) {
    const row = this.getProfileRow(userId);
    if (row.profile_visibility === 'PRIVATE' && principal.id !== userId && !isExecutiveRole(principal.role)) throw new SocialError(404, 'NOT_FOUND', '成员主页不可见');
    const publishedWorks = (this.sqlite.prepare("SELECT COUNT(*) count FROM works WHERE user_id=? AND status='PUBLISHED'").get(userId) as { count: number }).count;
    const attendedActivities = (this.sqlite.prepare('SELECT COUNT(*) count FROM activity_registrations WHERE user_id=? AND checked_in_at IS NOT NULL').get(userId) as { count: number }).count;
    const contributionPoints = (this.sqlite.prepare(`SELECT COALESCE(SUM(CASE action WHEN 'TASK_CONFIRMED' THEN 5 WHEN 'ACTIVITY_CHECK_IN' THEN 3 WHEN 'WORK_PUBLISHED' THEN 10 ELSE 0 END),0) points
      FROM audit_logs WHERE target_user_id=?`).get(userId) as { points: number }).points;
    const works = this.sqlite.prepare("SELECT id,title,description,created_at createdAt FROM works WHERE user_id=? AND status='PUBLISHED' ORDER BY created_at DESC LIMIT 6").all(userId);
    const activities = this.sqlite.prepare(`SELECT a.id,a.title,a.starts_at startsAt,ar.checked_in_at checkedInAt FROM activity_registrations ar JOIN activities a ON a.id=ar.activity_id
      WHERE ar.user_id=? ORDER BY a.starts_at DESC LIMIT 6`).all(userId);
    return { profile: this.serializeProfile(row), stats: { publishedWorks, attendedActivities, contributionPoints }, works, activities };
  }

  private ensureDepartmentParticipation(principal: SocialPrincipal): void {
    const joinedAt = this.timestamp();
    const rows = isExecutiveRole(principal.role)
      ? this.sqlite.prepare("SELECT id FROM conversations WHERE type='DEPARTMENT'").all()
      : this.sqlite.prepare(`SELECT c.id FROM conversations c JOIN user_departments ud ON ud.department_id=c.department_id
          WHERE c.type='DEPARTMENT' AND ud.user_id=?`).all(principal.id);
    const insert = this.sqlite.prepare('INSERT OR IGNORE INTO conversation_participants(conversation_id,user_id,last_read_at,muted,joined_at) VALUES (?,?,NULL,0,?)');
    for (const row of rows as Array<{ id: string }>) insert.run(row.id, principal.id, joinedAt);
  }

  private conversationAccess(principal: SocialPrincipal, conversationId: string) {
    this.ensureDepartmentParticipation(principal);
    const conversation = this.sqlite.prepare(`SELECT c.* FROM conversations c JOIN conversation_participants cp ON cp.conversation_id=c.id
      WHERE c.id=? AND cp.user_id=?`).get(conversationId, principal.id) as { id: string; type: 'DIRECT' | 'DEPARTMENT'; department_id: string | null; title: string } | undefined;
    if (!conversation) throw new SocialError(403, 'FORBIDDEN', '你不在该会话中');
    return conversation;
  }

  listConversations(principal: SocialPrincipal) {
    this.ensureDepartmentParticipation(principal);
    const rows = this.sqlite.prepare(`SELECT c.id,c.type,c.department_id,c.title,c.updated_at,
      (SELECT content FROM messages lm WHERE lm.conversation_id=c.id ORDER BY lm.created_at DESC,lm.id DESC LIMIT 1) last_message,
      (SELECT created_at FROM messages lm WHERE lm.conversation_id=c.id ORDER BY lm.created_at DESC,lm.id DESC LIMIT 1) last_message_at,
      (SELECT COUNT(*) FROM messages um WHERE um.conversation_id=c.id AND um.sender_id<>? AND um.deleted_at IS NULL AND um.created_at>COALESCE(cp.last_read_at,'')) unread_count
      FROM conversations c JOIN conversation_participants cp ON cp.conversation_id=c.id AND cp.user_id=?
      ORDER BY COALESCE(last_message_at,c.updated_at) DESC`).all(principal.id, principal.id) as Array<Record<string, unknown>>;
    return rows.map((row) => {
      let counterpart = null;
      if (row.type === 'DIRECT') {
        const other = this.sqlite.prepare(`SELECT u.id,u.display_name,u.avatar_color,u.last_seen_at FROM conversation_participants cp JOIN users u ON u.id=cp.user_id
          WHERE cp.conversation_id=? AND cp.user_id<>? LIMIT 1`).get(row.id, principal.id) as { id: string; display_name: string; avatar_color: string; last_seen_at: string | null } | undefined;
        if (other) counterpart = { id: other.id, displayName: other.display_name, avatarColor: other.avatar_color, presence: presence(other.last_seen_at, this.timestamp()) };
      }
      const deleted = typeof row.last_message === 'string' && row.last_message.length > 0 ? row.last_message : '';
      return { id: row.id, type: row.type, departmentId: row.department_id, title: row.type === 'DIRECT' ? counterpart?.displayName ?? '私聊' : row.title,
        counterpart, lastMessage: deleted, lastMessageAt: row.last_message_at, unreadCount: Number(row.unread_count ?? 0) };
    });
  }

  createDirect(principal: SocialPrincipal, targetUserId: string) {
    if (targetUserId === principal.id) throw new SocialError(400, 'INVALID_TARGET', '不能与自己创建私聊');
    const target = this.sqlite.prepare('SELECT id FROM users WHERE id=? AND is_active=1').get(targetUserId) as { id: string } | undefined;
    if (!target) throw new SocialError(404, 'NOT_FOUND', '目标成员不存在');
    const directKey = [principal.id, targetUserId].sort().join(':');
    let conversation = this.sqlite.prepare("SELECT id FROM conversations WHERE type='DIRECT' AND direct_key=?").get(directKey) as { id: string } | undefined;
    if (!conversation) {
      const id = this.makeId('conversation');
      const createdAt = this.timestamp();
      this.sqlite.transaction(() => {
        this.sqlite.prepare("INSERT INTO conversations(id,type,direct_key,department_id,title,created_at,updated_at) VALUES (?,'DIRECT',?,NULL,'',?,?)").run(id, directKey, createdAt, createdAt);
        const insert = this.sqlite.prepare('INSERT INTO conversation_participants(conversation_id,user_id,last_read_at,muted,joined_at) VALUES (?,?,?,0,?)');
        insert.run(id, principal.id, createdAt, createdAt);
        insert.run(id, targetUserId, null, createdAt);
      })();
      conversation = { id };
    }
    return this.listConversations(principal).find((item) => item.id === conversation?.id)!;
  }

  listMessages(principal: SocialPrincipal, conversationId: string, before: string | undefined, pageSize: number) {
    this.conversationAccess(principal, conversationId);
    const beforeClause = before ? 'AND m.created_at<?' : '';
    const params: unknown[] = [conversationId];
    if (before) params.push(before);
    params.push(pageSize + 1);
    const rows = this.sqlite.prepare(`SELECT m.id,m.conversation_id,m.sender_id,m.content,m.reply_to_id,m.edited_at,m.deleted_at,m.created_at,
      u.display_name sender_name,u.avatar_color sender_color,rm.content reply_content,ru.display_name reply_sender
      FROM messages m JOIN users u ON u.id=m.sender_id LEFT JOIN messages rm ON rm.id=m.reply_to_id LEFT JOIN users ru ON ru.id=rm.sender_id
      WHERE m.conversation_id=? ${beforeClause} ORDER BY m.created_at DESC,m.id DESC LIMIT ?`).all(...params) as Array<Record<string, unknown>>;
    const hasMore = rows.length > pageSize;
    const visible = rows.slice(0, pageSize);
    const nextBefore = hasMore ? String(visible[visible.length - 1]?.created_at ?? '') : null;
    const items = [...visible].reverse().map((row) => this.serializeMessage(row));
    return { items, hasMore, nextBefore };
  }

  private serializeMessage(row: Record<string, unknown>) {
    const deleted = Boolean(row.deleted_at);
    return {
      id: row.id, conversationId: row.conversation_id, senderId: row.sender_id,
      sender: { displayName: row.sender_name, avatarColor: row.sender_color }, content: deleted ? '消息已撤回' : row.content,
      replyTo: row.reply_to_id ? { id: row.reply_to_id, content: row.reply_content ?? '消息已撤回', senderName: row.reply_sender ?? '成员' } : null,
      editedAt: row.edited_at, deletedAt: row.deleted_at, createdAt: row.created_at,
    };
  }

  sendMessage(principal: SocialPrincipal, conversationId: string, content: string, replyToId?: string | null) {
    this.conversationAccess(principal, conversationId);
    if (replyToId) {
      const reply = this.sqlite.prepare('SELECT conversation_id FROM messages WHERE id=?').get(replyToId) as { conversation_id: string } | undefined;
      if (!reply || reply.conversation_id !== conversationId) throw new SocialError(400, 'INVALID_REPLY', '回复消息不属于当前会话');
    }
    const id = this.makeId('message');
    const createdAt = this.timestamp();
    this.sqlite.transaction(() => {
      this.sqlite.prepare('INSERT INTO messages(id,conversation_id,sender_id,content,reply_to_id,created_at) VALUES (?,?,?,?,?,?)').run(id, conversationId, principal.id, content, replyToId ?? null, createdAt);
      this.sqlite.prepare('UPDATE conversations SET updated_at=? WHERE id=?').run(createdAt, conversationId);
      this.sqlite.prepare('UPDATE conversation_participants SET last_read_at=? WHERE conversation_id=? AND user_id=?').run(createdAt, conversationId, principal.id);
    })();
    const row = this.sqlite.prepare(`SELECT m.id,m.conversation_id,m.sender_id,m.content,m.reply_to_id,m.edited_at,m.deleted_at,m.created_at,u.display_name sender_name,u.avatar_color sender_color,rm.content reply_content,ru.display_name reply_sender
      FROM messages m JOIN users u ON u.id=m.sender_id LEFT JOIN messages rm ON rm.id=m.reply_to_id LEFT JOIN users ru ON ru.id=rm.sender_id WHERE m.id=?`).get(id) as Record<string, unknown>;
    return this.serializeMessage(row);
  }

  markRead(principal: SocialPrincipal, conversationId: string) {
    this.conversationAccess(principal, conversationId);
    this.sqlite.prepare('UPDATE conversation_participants SET last_read_at=? WHERE conversation_id=? AND user_id=?').run(this.timestamp(), conversationId, principal.id);
  }

  editMessage(principal: SocialPrincipal, messageId: string, content: string) {
    const message = this.sqlite.prepare('SELECT sender_id,deleted_at FROM messages WHERE id=?').get(messageId) as { sender_id: string; deleted_at: string | null } | undefined;
    if (!message) throw new SocialError(404, 'NOT_FOUND', '消息不存在');
    if (message.sender_id !== principal.id) throw new SocialError(403, 'FORBIDDEN', '只能编辑自己的消息');
    if (message.deleted_at) throw new SocialError(409, 'MESSAGE_DELETED', '已撤回消息不可编辑');
    const editedAt = this.timestamp();
    this.sqlite.prepare('UPDATE messages SET content=?,edited_at=? WHERE id=?').run(content, editedAt, messageId);
    const row = this.sqlite.prepare(`SELECT m.id,m.conversation_id,m.sender_id,m.content,m.reply_to_id,m.edited_at,m.deleted_at,m.created_at,u.display_name sender_name,u.avatar_color sender_color,rm.content reply_content,ru.display_name reply_sender
      FROM messages m JOIN users u ON u.id=m.sender_id LEFT JOIN messages rm ON rm.id=m.reply_to_id LEFT JOIN users ru ON ru.id=rm.sender_id WHERE m.id=?`).get(messageId) as Record<string, unknown>;
    return this.serializeMessage(row);
  }

  deleteMessage(principal: SocialPrincipal, messageId: string): void {
    const message = this.sqlite.prepare('SELECT sender_id,deleted_at FROM messages WHERE id=?').get(messageId) as { sender_id: string; deleted_at: string | null } | undefined;
    if (!message) throw new SocialError(404, 'NOT_FOUND', '消息不存在');
    if (message.sender_id !== principal.id) throw new SocialError(403, 'FORBIDDEN', '只能撤回自己的消息');
    if (message.deleted_at) throw new SocialError(409, 'MESSAGE_DELETED', '消息已经撤回');
    this.sqlite.prepare('UPDATE messages SET content=?,deleted_at=? WHERE id=?').run('', this.timestamp(), messageId);
  }

  private serializePost(row: Record<string, unknown>) {
    let body: unknown[] = [];
    try { body = JSON.parse(String(row.body_json ?? '[]')) as unknown[]; } catch { body = []; }
    if (!Array.isArray(body) || !body.length) body = [{ type: 'PARAGRAPH', text: String(row.content ?? '') }];
    return {
      id: row.id, title: row.title, subtitle: row.subtitle ?? '', content: row.content, body, departmentId: row.department_id ?? null, departmentName: row.department_name ?? null,
      pinned: Boolean(row.placement_pinned) || Boolean(row.pinned), featured: Boolean(row.placement_featured), visibleOnGuild: Boolean(row.visible_on_guild), visibleOnDepartment: Boolean(row.visible_on_department),
      upvoteCount: Number(row.upvote_count ?? 0), downvoteCount: Number(row.downvote_count ?? 0), score: Number(row.rating_score ?? 0), myRating: Number(row.my_rating ?? 0), voteCount: Number(row.upvote_count ?? row.vote_count ?? 0), commentCount: Number(row.comment_count ?? 0),
      author: { id: row.user_id, displayName: row.author_name, avatarColor: row.author_color },
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  private serializeComment(row: Record<string, unknown>) {
    return {
      id: row.id, postId: row.post_id, content: row.content,
      author: { id: row.user_id, displayName: row.author_name, avatarColor: row.author_color },
      createdAt: row.created_at,
    };
  }

  listPosts(page: number, pageSize: number) {
    const total = (this.sqlite.prepare('SELECT COUNT(*) count FROM posts WHERE deleted_at IS NULL').get() as { count: number }).count;
    const rows = this.sqlite.prepare(`SELECT p.*,u.display_name author_name,u.avatar_color author_color,d.name department_name,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL) comment_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=1) upvote_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=-1) downvote_count,
      (SELECT COALESCE(SUM(v.value),0) FROM post_votes v WHERE v.post_id=p.id) rating_score,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.pinned=1) placement_pinned,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.featured=1) placement_featured,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.scope_type='GUILD') visible_on_guild,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.scope_type='DEPARTMENT') visible_on_department
      FROM posts p JOIN users u ON u.id=p.user_id LEFT JOIN departments d ON d.id=p.department_id WHERE p.deleted_at IS NULL
      ORDER BY placement_pinned DESC,p.pinned DESC,p.created_at DESC,p.id LIMIT ? OFFSET ?`).all(pageSize, (page - 1) * pageSize) as Array<Record<string, unknown>>;
    return { items: rows.map((row) => this.serializePost(row)), page, pageSize, total };
  }

  createPost(principal: SocialPrincipal, input: PostCreate) {
    const id = this.makeId('post');
    const createdAt = this.timestamp();
    if (input.departmentId && !this.sqlite.prepare('SELECT 1 FROM departments WHERE id=?').get(input.departmentId)) throw new SocialError(400, 'INVALID_DEPARTMENT', '所属部门不存在');
    const body = input.body?.length ? input.body : [{ type: 'PARAGRAPH' as const, text: input.content }];
    this.sqlite.prepare('INSERT INTO posts(id,user_id,title,subtitle,content,body_json,department_id,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?,0,?,?)')
      .run(id, principal.id, input.title, input.subtitle || null, input.content, JSON.stringify(body), input.departmentId, createdAt, createdAt);
    return this.getPost(id).post;
  }

  private canModerateDepartment(principal: SocialPrincipal, departmentId: string | null): boolean {
    if (isExecutiveRole(principal.role)) return true;
    return isManagementRole(principal.role) && Boolean(departmentId) && departmentId === principal.departmentId;
  }

  editPost(principal: SocialPrincipal, postId: string, input: PostCreate) {
    const post = this.sqlite.prepare('SELECT id,department_id FROM posts WHERE id=? AND deleted_at IS NULL').get(postId) as { id: string; department_id: string | null } | undefined;
    if (!post) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    if (!this.canModerateDepartment(principal, post.department_id) || (!isExecutiveRole(principal.role) && input.departmentId !== post.department_id)) {
      throw new SocialError(403, 'FORBIDDEN', '只能编辑本部门帖子，且不可改变所属部门');
    }
    if (input.departmentId && !this.sqlite.prepare('SELECT 1 FROM departments WHERE id=?').get(input.departmentId)) throw new SocialError(400, 'INVALID_DEPARTMENT', '所属部门不存在');
    const body = input.body?.length ? input.body : [{ type: 'PARAGRAPH' as const, text: input.content }];
    this.sqlite.prepare('UPDATE posts SET title=?,subtitle=?,content=?,body_json=?,department_id=?,updated_at=? WHERE id=?')
      .run(input.title, input.subtitle || null, input.content, JSON.stringify(body), input.departmentId, this.timestamp(), postId);
    return this.getPost(postId).post;
  }

  getPost(postId: string, viewerId?: string) {
    const row = this.sqlite.prepare(`SELECT p.*,u.display_name author_name,u.avatar_color author_color,d.name department_name,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL) comment_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=1) upvote_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=-1) downvote_count,
      (SELECT COALESCE(SUM(v.value),0) FROM post_votes v WHERE v.post_id=p.id) rating_score,
      (SELECT v.value FROM post_votes v WHERE v.post_id=p.id AND v.user_id=?) my_rating,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.pinned=1) placement_pinned,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.featured=1) placement_featured,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.scope_type='GUILD') visible_on_guild,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.scope_type='DEPARTMENT') visible_on_department
      FROM posts p JOIN users u ON u.id=p.user_id LEFT JOIN departments d ON d.id=p.department_id WHERE p.id=? AND p.deleted_at IS NULL`).get(viewerId ?? '', postId) as Record<string, unknown> | undefined;
    if (!row) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    const comments = this.sqlite.prepare(`SELECT c.*,u.display_name author_name,u.avatar_color author_color
      FROM post_comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? AND c.deleted_at IS NULL ORDER BY c.created_at,c.id`).all(postId) as Array<Record<string, unknown>>;
    const supporters = this.sqlite.prepare(`SELECT u.id,u.display_name displayName,u.avatar_color avatarColor
      FROM post_votes v JOIN users u ON u.id=v.user_id WHERE v.post_id=? AND v.value=1 ORDER BY v.created_at,u.id`).all(postId);
    return { post: this.serializePost(row), comments: comments.map((comment) => this.serializeComment(comment)), supporters };
  }

  addComment(principal: SocialPrincipal, postId: string, content: string) {
    const post = this.sqlite.prepare('SELECT id FROM posts WHERE id=? AND deleted_at IS NULL').get(postId);
    if (!post) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    const id = this.makeId('comment');
    const createdAt = this.timestamp();
    this.sqlite.prepare('INSERT INTO post_comments(id,post_id,user_id,content,created_at) VALUES (?,?,?,?,?)').run(id, postId, principal.id, content, createdAt);
    const row = this.sqlite.prepare(`SELECT c.*,u.display_name author_name,u.avatar_color author_color
      FROM post_comments c JOIN users u ON u.id=c.user_id WHERE c.id=?`).get(id) as Record<string, unknown>;
    return this.serializeComment(row);
  }

  deletePost(principal: SocialPrincipal, postId: string): { ownerId: string; moderated: boolean } {
    const post = this.sqlite.prepare('SELECT user_id,department_id,deleted_at FROM posts WHERE id=?').get(postId) as { user_id: string; department_id: string | null; deleted_at: string | null } | undefined;
    if (!post || post.deleted_at) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    if (post.user_id !== principal.id && !this.canModerateDepartment(principal, post.department_id)) throw new SocialError(403, 'FORBIDDEN', '只能删除自己的帖子或管理范围内的帖子');
    this.sqlite.prepare('UPDATE posts SET deleted_at=?,updated_at=? WHERE id=?').run(this.timestamp(), this.timestamp(), postId);
    return { ownerId: post.user_id, moderated: post.user_id !== principal.id };
  }

  deleteComment(principal: SocialPrincipal, commentId: string): { ownerId: string; moderated: boolean } {
    const comment = this.sqlite.prepare(`SELECT c.user_id,c.deleted_at,p.department_id
      FROM post_comments c JOIN posts p ON p.id=c.post_id WHERE c.id=?`).get(commentId) as { user_id: string; department_id: string | null; deleted_at: string | null } | undefined;
    if (!comment || comment.deleted_at) throw new SocialError(404, 'NOT_FOUND', '评论不存在或已被删除');
    if (comment.user_id !== principal.id && !this.canModerateDepartment(principal, comment.department_id)) throw new SocialError(403, 'FORBIDDEN', '只能删除自己的评论或管理范围内的评论');
    this.sqlite.prepare('UPDATE post_comments SET deleted_at=? WHERE id=?').run(this.timestamp(), commentId);
    return { ownerId: comment.user_id, moderated: comment.user_id !== principal.id };
  }

  pinPost(principal: SocialPrincipal, postId: string, pinned: boolean) {
    const post = this.sqlite.prepare('SELECT id,department_id,deleted_at FROM posts WHERE id=?').get(postId) as { id: string; department_id: string | null; deleted_at: string | null } | undefined;
    if (!post || post.deleted_at) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    if (!this.canModerateDepartment(principal, post.department_id)) throw new SocialError(403, 'FORBIDDEN', '只能置顶管理范围内的帖子');
    this.sqlite.prepare('UPDATE posts SET pinned=?,updated_at=? WHERE id=?').run(pinned ? 1 : 0, this.timestamp(), postId);
    return this.getPost(postId).post;
  }

  ratePost(principal: SocialPrincipal, postId: string, value: -1 | 0 | 1) {
    if (!this.sqlite.prepare('SELECT 1 FROM posts WHERE id=? AND deleted_at IS NULL').get(postId)) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    if (value === 0) this.sqlite.prepare('DELETE FROM post_votes WHERE post_id=? AND user_id=?').run(postId, principal.id);
    else this.sqlite.prepare(`INSERT INTO post_votes(post_id,user_id,value,created_at) VALUES (?,?,?,?)
      ON CONFLICT(post_id,user_id) DO UPDATE SET value=excluded.value,created_at=excluded.created_at`).run(postId, principal.id, value, this.timestamp());
    const counts = this.sqlite.prepare(`SELECT COUNT(CASE WHEN value=1 THEN 1 END) upvoteCount,COUNT(CASE WHEN value=-1 THEN 1 END) downvoteCount,COALESCE(SUM(value),0) score FROM post_votes WHERE post_id=?`).get(postId) as { upvoteCount: number; downvoteCount: number; score: number };
    return { myRating: value, ...counts };
  }

  private assertPlacement(principal: SocialPrincipal, postId: string, scope: 'GUILD' | 'DEPARTMENT', departmentId: string | null) {
    const post = this.sqlite.prepare('SELECT department_id FROM posts WHERE id=? AND deleted_at IS NULL').get(postId) as { department_id: string | null } | undefined;
    if (!post) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    if (isExecutiveRole(principal.role)) return;
    if (principal.role === 'DEPARTMENT_HEAD' && scope === 'GUILD' && post.department_id && post.department_id === principal.departmentId) return;
    if ((principal.role === 'DEPARTMENT_HEAD' || principal.role === 'DEPARTMENT_ADMIN') && scope === 'DEPARTMENT' && departmentId === principal.departmentId && post.department_id === principal.departmentId) return;
    throw new SocialError(403, 'FORBIDDEN', '只能将本部门帖子展示在权限允许的页面');
  }

  placePost(principal: SocialPrincipal, postId: string, input: { scope: 'GUILD' | 'DEPARTMENT'; departmentId: string | null; visible: boolean; pinned?: boolean; featured?: boolean }) {
    const departmentId = input.scope === 'GUILD' ? null : input.departmentId;
    if (input.scope === 'DEPARTMENT' && !departmentId) throw new SocialError(400, 'DEPARTMENT_REQUIRED', '部门页面展示必须选择部门');
    this.assertPlacement(principal, postId, input.scope, departmentId);
    const existing = this.sqlite.prepare("SELECT id,pinned,featured FROM post_placements WHERE post_id=? AND scope_type=? AND COALESCE(department_id,'')=COALESCE(?,'')").get(postId, input.scope, departmentId) as { id: string; pinned: number; featured: number } | undefined;
    if (!input.visible) {
      if (existing) this.sqlite.prepare('DELETE FROM post_placements WHERE id=?').run(existing.id);
      return { visible: false };
    }
    const timestamp = this.timestamp();
    if (existing) this.sqlite.prepare('UPDATE post_placements SET pinned=?,featured=?,updated_at=? WHERE id=?').run((input.pinned ?? Boolean(existing.pinned)) ? 1 : 0, (input.featured ?? Boolean(existing.featured)) ? 1 : 0, timestamp, existing.id);
    else this.sqlite.prepare('INSERT INTO post_placements(id,post_id,scope_type,department_id,pinned,featured,placed_by,placed_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(this.makeId('placement'), postId, input.scope, departmentId, input.pinned ? 1 : 0, input.featured ? 1 : 0, principal.id, timestamp, timestamp);
    return { visible: true };
  }

  publicBoard(departmentSlug?: string) {
    let departmentId: string | null = null;
    if (departmentSlug) {
      const department = this.sqlite.prepare('SELECT id FROM departments WHERE slug=?').get(departmentSlug) as { id: string } | undefined;
      if (!department) throw new SocialError(404, 'NOT_FOUND', '部门不存在');
      departmentId = department.id;
    }
    const rows = this.sqlite.prepare(`SELECT p.*,u.display_name author_name,u.avatar_color author_color,d.name department_name,x.pinned placement_pinned,x.featured placement_featured,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL) comment_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=1) upvote_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=-1) downvote_count,
      (SELECT COALESCE(SUM(v.value),0) FROM post_votes v WHERE v.post_id=p.id) rating_score
      FROM post_placements x JOIN posts p ON p.id=x.post_id JOIN users u ON u.id=p.user_id LEFT JOIN departments d ON d.id=p.department_id
      WHERE p.deleted_at IS NULL AND x.scope_type=? AND COALESCE(x.department_id,'')=COALESCE(?,'')
      ORDER BY x.pinned DESC,x.featured DESC,p.created_at DESC,p.id`).all(departmentId ? 'DEPARTMENT' : 'GUILD', departmentId) as Array<Record<string, unknown>>;
    const items = rows.map((row) => this.serializePost(row));
    return { pinned: items.filter((item) => item.pinned).slice(0, 6), featured: items.filter((item) => item.featured || item.score > 0).sort((a, b) => Number(b.featured) - Number(a.featured) || b.score - a.score || b.upvoteCount - a.upvoteCount).slice(0, 6), latest: items.slice(0, 12) };
  }

  publicPost(postId: string) {
    const row = this.sqlite.prepare(`SELECT p.*,u.display_name author_name,u.avatar_color author_color,d.name department_name,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL) comment_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=1) upvote_count,
      (SELECT COUNT(*) FROM post_votes v WHERE v.post_id=p.id AND v.value=-1) downvote_count,
      (SELECT COALESCE(SUM(v.value),0) FROM post_votes v WHERE v.post_id=p.id) rating_score,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.pinned=1) placement_pinned,
      EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id AND x.featured=1) placement_featured
      FROM posts p JOIN users u ON u.id=p.user_id LEFT JOIN departments d ON d.id=p.department_id
      WHERE p.id=? AND p.deleted_at IS NULL AND EXISTS(SELECT 1 FROM post_placements x WHERE x.post_id=p.id)`).get(postId) as Record<string, unknown> | undefined;
    if (!row) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或尚未公开展示');
    return this.serializePost(row);
  }

  syncAssets(principal: SocialPrincipal, postId: string, assetIds: string[]) {
    const uniqueIds = [...new Set(assetIds)];
    const attached = this.sqlite.prepare('SELECT id FROM post_assets WHERE post_id=?').all(postId) as Array<{ id: string }>;
    for (const asset of attached) if (!uniqueIds.includes(asset.id)) this.sqlite.prepare('UPDATE post_assets SET post_id=NULL WHERE id=?').run(asset.id);
    for (const assetId of uniqueIds) {
      const asset = this.sqlite.prepare('SELECT owner_id,post_id FROM post_assets WHERE id=?').get(assetId) as { owner_id: string; post_id: string | null } | undefined;
      if (!asset || (asset.post_id !== postId && asset.owner_id !== principal.id) || (asset.post_id && asset.post_id !== postId)) throw new SocialError(400, 'INVALID_POST_ASSET', '帖子图片无效或不属于当前账户');
      this.sqlite.prepare('UPDATE post_assets SET post_id=? WHERE id=?').run(postId, assetId);
    }
  }

  matchMembers(principal: SocialPrincipal, limit = 12) {
    const selfRow = this.getProfileRow(principal.id);
    const myAttributes = safeTags(selfRow.attributes);
    const myTags = [...new Set([...safeTags(selfRow.skills), ...safeTags(selfRow.interests)])];
    const mine = new Map<string, number>();
    myAttributes.forEach((attribute) => mine.set(`attr:${attribute}`, 2));
    myTags.forEach((tag) => mine.set(`tag:${tag}`, 1));
    const privacy = isExecutiveRole(principal.role) ? '1=1' : "u.profile_visibility='MEMBERS'";
    const rows = this.sqlite.prepare(`SELECT ${PROFILE_COLUMNS}
      FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.is_active=1 AND u.id<>? AND ${privacy}`).all(principal.id) as ProfileRow[];
    const items = rows.map((row) => {
      const theirs = new Map<string, number>();
      safeTags(row.attributes).forEach((attribute) => theirs.set(`attr:${attribute}`, 2));
      [...new Set([...safeTags(row.skills), ...safeTags(row.interests)])].forEach((tag) => theirs.set(`tag:${tag}`, 1));
      let intersection = 0;
      const unionKeys = new Set([...mine.keys(), ...theirs.keys()]);
      for (const key of unionKeys) intersection += Math.min(mine.get(key) ?? 0, theirs.get(key) ?? 0);
      let union = 0;
      for (const key of unionKeys) union += Math.max(mine.get(key) ?? 0, theirs.get(key) ?? 0);
      const score = union ? Math.round((intersection / union) * 100) : 0;
      const myAttributeSet = new Set(myAttributes);
      const myTagSet = new Set(myTags);
      return {
        profile: this.serializeProfile(row),
        score,
        sharedAttributes: safeTags(row.attributes).filter((attribute) => myAttributeSet.has(attribute)),
        sharedTags: [...new Set([...safeTags(row.skills), ...safeTags(row.interests)])].filter((tag) => myTagSet.has(tag)),
      };
    }).filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.profile.displayName).localeCompare(String(b.profile.displayName), 'zh-CN'))
      .slice(0, limit);
    return { myAttributes, items };
  }
}

export { safeTags };
