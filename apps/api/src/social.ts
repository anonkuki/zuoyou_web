import type Database from 'better-sqlite3';
import type { MemberProfileUpdate, Role } from '@guild/contracts';

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
  bio: string; guild_title: string; college: string; grade: string; skills: string; interests: string; attributes: string; avatar_color: string; profile_visibility: 'MEMBERS' | 'PRIVATE';
  last_seen_at: string | null; created_at: string;
}

const PROFILE_COLUMNS = 'u.id,u.display_name,u.role,u.department_id,d.name department_name,d.title department_title,u.bio,u.guild_title,u.college,u.grade,u.skills,u.interests,u.attributes,u.avatar_color,u.profile_visibility,u.last_seen_at,u.created_at';

export class GuildSocialRepository {
  constructor(private sqlite: Database.Database, private makeId: (prefix: string) => string, private timestamp: () => string) {}

  private serializeProfile(row: ProfileRow) {
    return {
      id: row.id, displayName: row.display_name, role: row.role, departmentId: row.department_id, departmentName: row.department_name,
      departmentTitle: row.department_title, bio: row.bio, guildTitle: row.guild_title, college: row.college, grade: row.grade,
      skills: safeTags(row.skills), interests: safeTags(row.interests), attributes: safeTags(row.attributes), avatarColor: row.avatar_color, profileVisibility: row.profile_visibility,
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
      avatarColor: input.avatarColor ?? row.avatar_color,
      visibility: input.profileVisibility ?? row.profile_visibility,
    };
    this.sqlite.prepare(`UPDATE users SET display_name=?,bio=?,guild_title=?,college=?,grade=?,skills=?,interests=?,attributes=?,avatar_color=?,profile_visibility=?,last_seen_at=?,updated_at=? WHERE id=?`)
      .run(next.displayName, next.bio, next.guildTitle, next.college, next.grade, next.skills, next.interests, next.attributes, next.avatarColor, next.visibility, this.timestamp(), this.timestamp(), userId);
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
    const privacy = principal.role === 'ADMIN' ? '1=1' : "(u.profile_visibility='MEMBERS' OR u.id=?)";
    const parameters: unknown[] = principal.role === 'ADMIN' ? [] : [principal.id];
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
    if (row.profile_visibility === 'PRIVATE' && principal.id !== userId && principal.role !== 'ADMIN') throw new SocialError(404, 'NOT_FOUND', '成员主页不可见');
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
    const rows = principal.role === 'ADMIN'
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
    return {
      id: row.id, title: row.title, content: row.content, pinned: Boolean(row.pinned), commentCount: Number(row.comment_count ?? 0),
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
    const rows = this.sqlite.prepare(`SELECT p.*,u.display_name author_name,u.avatar_color author_color,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL) comment_count
      FROM posts p JOIN users u ON u.id=p.user_id WHERE p.deleted_at IS NULL
      ORDER BY p.pinned DESC,p.created_at DESC,p.id LIMIT ? OFFSET ?`).all(pageSize, (page - 1) * pageSize) as Array<Record<string, unknown>>;
    return { items: rows.map((row) => this.serializePost(row)), page, pageSize, total };
  }

  createPost(principal: SocialPrincipal, title: string, content: string) {
    const id = this.makeId('post');
    const createdAt = this.timestamp();
    this.sqlite.prepare('INSERT INTO posts(id,user_id,title,content,pinned,created_at,updated_at) VALUES (?,?,?,?,0,?,?)').run(id, principal.id, title, content, createdAt, createdAt);
    return this.getPost(id).post;
  }

  getPost(postId: string) {
    const row = this.sqlite.prepare(`SELECT p.*,u.display_name author_name,u.avatar_color author_color,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL) comment_count
      FROM posts p JOIN users u ON u.id=p.user_id WHERE p.id=? AND p.deleted_at IS NULL`).get(postId) as Record<string, unknown> | undefined;
    if (!row) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    const comments = this.sqlite.prepare(`SELECT c.*,u.display_name author_name,u.avatar_color author_color
      FROM post_comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? AND c.deleted_at IS NULL ORDER BY c.created_at,c.id`).all(postId) as Array<Record<string, unknown>>;
    return { post: this.serializePost(row), comments: comments.map((comment) => this.serializeComment(comment)) };
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
    const post = this.sqlite.prepare('SELECT user_id,deleted_at FROM posts WHERE id=?').get(postId) as { user_id: string; deleted_at: string | null } | undefined;
    if (!post || post.deleted_at) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    const manager = principal.role === 'ADMIN' || principal.role === 'DEPARTMENT_LEAD';
    if (post.user_id !== principal.id && !manager) throw new SocialError(403, 'FORBIDDEN', '只能删除自己的帖子');
    this.sqlite.prepare('UPDATE posts SET deleted_at=?,updated_at=? WHERE id=?').run(this.timestamp(), this.timestamp(), postId);
    return { ownerId: post.user_id, moderated: post.user_id !== principal.id };
  }

  deleteComment(principal: SocialPrincipal, commentId: string): { ownerId: string; moderated: boolean } {
    const comment = this.sqlite.prepare('SELECT user_id,deleted_at FROM post_comments WHERE id=?').get(commentId) as { user_id: string; deleted_at: string | null } | undefined;
    if (!comment || comment.deleted_at) throw new SocialError(404, 'NOT_FOUND', '评论不存在或已被删除');
    const manager = principal.role === 'ADMIN' || principal.role === 'DEPARTMENT_LEAD';
    if (comment.user_id !== principal.id && !manager) throw new SocialError(403, 'FORBIDDEN', '只能删除自己的评论');
    this.sqlite.prepare('UPDATE post_comments SET deleted_at=? WHERE id=?').run(this.timestamp(), commentId);
    return { ownerId: comment.user_id, moderated: comment.user_id !== principal.id };
  }

  pinPost(postId: string, pinned: boolean) {
    const post = this.sqlite.prepare('SELECT id,deleted_at FROM posts WHERE id=?').get(postId) as { id: string; deleted_at: string | null } | undefined;
    if (!post || post.deleted_at) throw new SocialError(404, 'NOT_FOUND', '帖子不存在或已被删除');
    this.sqlite.prepare('UPDATE posts SET pinned=?,updated_at=? WHERE id=?').run(pinned ? 1 : 0, this.timestamp(), postId);
    return this.getPost(postId).post;
  }

  matchMembers(principal: SocialPrincipal, limit = 12) {
    const selfRow = this.getProfileRow(principal.id);
    const myAttributes = safeTags(selfRow.attributes);
    const myTags = [...new Set([...safeTags(selfRow.skills), ...safeTags(selfRow.interests)])];
    const mine = new Map<string, number>();
    myAttributes.forEach((attribute) => mine.set(`attr:${attribute}`, 2));
    myTags.forEach((tag) => mine.set(`tag:${tag}`, 1));
    const privacy = principal.role === 'ADMIN' ? '1=1' : "u.profile_visibility='MEMBERS'";
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
