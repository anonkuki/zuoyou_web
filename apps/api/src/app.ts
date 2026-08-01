import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { copyFile, mkdir, stat, unlink } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import type Database from 'better-sqlite3';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { z, ZodError } from 'zod';
import {
  ActivityStatusSchema, FileVisibilitySchema, RoleSchema, WorkStatusSchema, pageQuerySchema, successResponse,
  type ActivityStatus, type Role,
} from '@guild/contracts';
import { createActivationToken } from './activation.js';
import { canTransitionActivity } from './activity.js';
import { openDatabase, seedDatabase } from './database.js';
import { canAccessDepartment, canAccessFile } from './policies.js';
import { decryptSecret, encryptSecret, hashPassword, sha256, verifyPassword } from './security.js';

export interface AppOptions {
  databasePath: string;
  uploadRoot: string;
  sessionSecret: string;
  seed?: boolean;
  adminPassword?: string;
  production?: boolean;
  webRoot?: string;
}

interface UserRow {
  id: string;
  username: string | null;
  password_hash: string | null;
  display_name: string;
  email: string;
  role: Role;
  department_id: string | null;
  bio: string;
  is_active: number;
}

interface Principal {
  id: string;
  username: string | null;
  displayName: string;
  email: string;
  role: Role;
  departmentId: string | null;
  bio: string;
}

class HttpError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}_${randomUUID()}`;
const cleanUser = (user: UserRow): Principal => ({
  id: user.id, username: user.username, displayName: user.display_name, email: user.email,
  role: user.role, departmentId: user.department_id, bio: user.bio,
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

function getPaging(query: unknown): { page: number; pageSize: number; offset: number } {
  const { page, pageSize } = parse(pageQuerySchema, query);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function pageData(items: unknown[], total: number, page: number, pageSize: number) {
  return { items, page, pageSize, total };
}

function audit(sqlite: Database.Database, actorId: string | null, action: string, entityType: string, entityId: string, targetUserId: string | null = null, details?: unknown): void {
  sqlite.prepare('INSERT OR IGNORE INTO audit_logs(id,actor_id,target_user_id,action,entity_type,entity_id,details,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(newId('audit'), actorId, targetUserId, action, entityType, entityId, details ? JSON.stringify(details) : null, now());
}

export async function createApp(options: AppOptions): Promise<FastifyInstance> {
  if (options.sessionSecret.length < 24) throw new Error('sessionSecret must contain at least 24 characters');
  await mkdir(options.uploadRoot, { recursive: true });
  const { sqlite } = await openDatabase(options.databasePath);
  if (options.seed) {
    await seedDatabase(sqlite, { adminPassword: options.adminPassword, production: options.production });
    const photoRoot = resolve(options.uploadRoot, 'members/photos');
    await mkdir(photoRoot, { recursive: true });
    for (const name of ['club-anniversary.jpg', 'club-memory-01.jpg', 'club-memory-02.jpg']) {
      const source = new URL(`../seed-assets/private/${name}`, import.meta.url);
      await copyFile(source, resolve(photoRoot, name)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  await app.register(multipart, { limits: { files: 1, fields: 8, fileSize: 200 * 1024 * 1024 } });
  if (options.webRoot) await app.register(fastifyStatic, { root: resolve(options.webRoot), wildcard: false });
  app.addHook('onClose', async () => { sqlite.close(); });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ ok: false, error: { code: error.code, message: error.message, details: error.details } });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: '请求参数校验失败', details: error.issues } });
    }
    const clientError = error as { statusCode?: number; code?: string; message?: string };
    if (clientError.statusCode && clientError.statusCode >= 400 && clientError.statusCode < 500) {
      const code = clientError.statusCode === 400 ? 'BAD_REQUEST' : (clientError.code ?? 'REQUEST_ERROR');
      return reply.status(clientError.statusCode).send({ ok: false, error: { code, message: clientError.statusCode === 400 ? '请求格式错误' : (clientError.message ?? '请求处理失败') } });
    }
    if ((error as { code?: string }).code?.startsWith('SQLITE_CONSTRAINT')) {
      return reply.status(409).send({ ok: false, error: { code: 'CONFLICT', message: '资源状态冲突' } });
    }
    app.log.error(error);
    return reply.status(500).send({ ok: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } });
  });

  function principalFor(request: FastifyRequest): Principal | null {
    const token = request.cookies.guild_session;
    if (!token) return null;
    const row = sqlite.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.id=? AND s.expires_at>? AND u.is_active=1`).get(sha256(token), now()) as UserRow | undefined;
    return row ? cleanUser(row) : null;
  }

  function requireMember(request: FastifyRequest, reply: FastifyReply): Principal | null {
    const principal = principalFor(request);
    if (!principal) {
      reply.status(401).send({ ok: false, error: { code: 'UNAUTHENTICATED', message: '请先登录' } });
      return null;
    }
    return principal;
  }

  function requireManager(request: FastifyRequest, reply: FastifyReply): Principal | null {
    const principal = requireMember(request, reply);
    if (!principal) return null;
    if (principal.role !== 'ADMIN' && principal.role !== 'DEPARTMENT_LEAD') {
      reply.status(403).send({ ok: false, error: { code: 'FORBIDDEN', message: '权限不足' } });
      return null;
    }
    return principal;
  }

  function requireAdmin(request: FastifyRequest, reply: FastifyReply): Principal | null {
    const principal = requireMember(request, reply);
    if (!principal) return null;
    if (principal.role !== 'ADMIN') {
      reply.status(403).send({ ok: false, error: { code: 'FORBIDDEN', message: '仅管理员可执行此操作' } });
      return null;
    }
    return principal;
  }

  function scopeDepartment(principal: Principal, departmentId: string): void {
    if (!canAccessDepartment(principal, departmentId)) throw new HttpError(403, 'FORBIDDEN', '不可管理其他部门资源');
  }

  app.get('/api/health', async () => successResponse({ status: 'ok', timestamp: now() }));

  app.get('/api/public/summary', async () => {
    const memberCount = (sqlite.prepare('SELECT COUNT(*) count FROM users').get() as { count: number }).count;
    const departmentCount = (sqlite.prepare('SELECT COUNT(*) count FROM departments').get() as { count: number }).count;
    const activityCount = (sqlite.prepare("SELECT COUNT(*) count FROM activities WHERE status != 'ARCHIVED'").get() as { count: number }).count;
    const workCount = (sqlite.prepare("SELECT COUNT(*) count FROM works WHERE status='PUBLISHED'").get() as { count: number }).count;
    return successResponse({ memberCount, departmentCount, activityCount, workCount });
  });

  app.get('/api/public/departments', async () => successResponse({ items: sqlite.prepare(`SELECT d.*, COUNT(u.id) memberCount FROM departments d LEFT JOIN users u ON u.department_id=d.id GROUP BY d.id ORDER BY d.rowid`).all() }));
  app.get('/api/public/departments/:slug', async (request) => {
    const { slug } = request.params as { slug: string };
    const department = sqlite.prepare('SELECT * FROM departments WHERE slug=?').get(slug);
    if (!department) throw new HttpError(404, 'NOT_FOUND', '部门不存在');
    return successResponse({ department });
  });
  app.get('/api/public/chronicles', async (request) => {
    const paging = getPaging(request.query);
    const items = sqlite.prepare('SELECT * FROM chronicles WHERE published=1 ORDER BY occurred_at DESC LIMIT ? OFFSET ?').all(paging.pageSize, paging.offset);
    const total = (sqlite.prepare('SELECT COUNT(*) count FROM chronicles WHERE published=1').get() as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  app.get('/api/public/activities', async (request) => {
    const paging = getPaging(request.query);
    const items = sqlite.prepare('SELECT id,department_id,title,description,location,status,capacity,result_summary,starts_at,created_at,updated_at FROM activities ORDER BY starts_at DESC LIMIT ? OFFSET ?').all(paging.pageSize, paging.offset);
    const total = (sqlite.prepare('SELECT COUNT(*) count FROM activities').get() as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  app.get('/api/public/activities/:id', async (request) => {
    const activity = sqlite.prepare('SELECT id,department_id,title,description,location,status,capacity,result_summary,starts_at FROM activities WHERE id=?').get((request.params as { id: string }).id);
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在');
    return successResponse({ activity });
  });
  app.get('/api/public/works', async (request) => {
    const paging = getPaging(request.query);
    const items = sqlite.prepare("SELECT * FROM works WHERE status='PUBLISHED' ORDER BY created_at DESC LIMIT ? OFFSET ?").all(paging.pageSize, paging.offset);
    const total = (sqlite.prepare("SELECT COUNT(*) count FROM works WHERE status='PUBLISHED'").get() as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });

  const applicationSchema = z.object({ displayName: z.string().trim().min(2).max(60), email: z.email(), college: z.string().trim().min(2).max(100).default('未填写'), departmentId: z.string().min(1), reason: z.string().trim().min(5).max(1000) });
  app.post('/api/public/applications', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (request, reply) => {
    const body = parse(applicationSchema, request.body);
    if (!sqlite.prepare('SELECT 1 FROM departments WHERE id=?').get(body.departmentId)) throw new HttpError(400, 'VALIDATION_ERROR', '目标部门不存在');
    if (sqlite.prepare("SELECT 1 FROM applications WHERE email=? AND status='PENDING'").get(body.email)) throw new HttpError(409, 'CONFLICT', '该邮箱已有待审申请');
    const id = newId('application');
    const statusToken = randomBytes(32).toString('base64url');
    sqlite.prepare('INSERT INTO applications(id,status_token_hash,display_name,email,college,department_id,reason,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, sha256(statusToken), body.displayName, body.email, body.college, body.departmentId, body.reason, 'PENDING', now(), now());
    audit(sqlite, null, 'APPLICATION_SUBMITTED', 'application', id);
    return reply.status(201).send(successResponse({ id, statusToken, status: 'PENDING' }));
  });
  app.get('/api/public/applications/status/:token', async (request) => {
    const row = sqlite.prepare('SELECT id,status,rejection_reason,activation_code_encrypted FROM applications WHERE status_token_hash=?').get(sha256((request.params as { token: string }).token)) as { id: string; status: string; rejection_reason: string | null; activation_code_encrypted: string | null } | undefined;
    if (!row) throw new HttpError(404, 'NOT_FOUND', '申请状态凭证无效');
    return successResponse({ id: row.id, status: row.status, rejectionReason: row.rejection_reason, activationCode: row.activation_code_encrypted ? decryptSecret(row.activation_code_encrypted, options.sessionSecret) : undefined });
  });

  const loginSchema = z.object({ username: z.string().trim().min(1), password: z.string().min(8).max(200) });
  app.post('/api/auth/login', { config: { rateLimit: { max: options.production ? 10 : 100, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const body = parse(loginSchema, request.body);
    const user = sqlite.prepare('SELECT * FROM users WHERE username=?').get(body.username) as UserRow | undefined;
    if (!user?.password_hash || !user.is_active || !await verifyPassword(body.password, user.password_hash)) throw new HttpError(401, 'INVALID_CREDENTIALS', '用户名或密码错误');
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    sqlite.prepare('INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES (?,?,?,?)').run(sha256(token), user.id, expiresAt, now());
    reply.setCookie('guild_session', token, { httpOnly: true, sameSite: 'strict', secure: options.production ?? false, path: '/', expires: new Date(expiresAt) });
    audit(sqlite, user.id, 'LOGIN', 'session', sha256(token));
    return successResponse({ user: cleanUser(user) });
  });
  app.post('/api/auth/logout', async (request, reply) => {
    const token = request.cookies.guild_session;
    if (token) sqlite.prepare('DELETE FROM sessions WHERE id=?').run(sha256(token));
    reply.clearCookie('guild_session', { path: '/' });
    return successResponse({ loggedOut: true });
  });
  app.get('/api/auth/me', async (request, reply) => {
    const principal = requireMember(request, reply);
    if (!principal) return;
    return successResponse({ user: principal });
  });
  app.get('/api/auth/session', async (request) => successResponse({ user: principalFor(request) }));
  const activateSchema = z.object({ token: z.string().min(20), username: z.string().regex(/^[a-zA-Z0-9._-]{3,40}$/), password: z.string().min(10).max(200) });
  app.post('/api/auth/activate', { config: { rateLimit: { max: 8, timeWindow: '1 hour' } } }, async (request) => {
    const body = parse(activateSchema, request.body);
    const tokenHash = sha256(body.token);
    const token = sqlite.prepare('SELECT * FROM activation_tokens WHERE token_hash=?').get(tokenHash) as { id: string; user_id: string; expires_at: string; used_at: string | null } | undefined;
    if (!token) throw new HttpError(400, 'INVALID_ACTIVATION', '激活码无效');
    if (token.used_at) throw new HttpError(409, 'ACTIVATION_USED', '激活码已使用');
    if (new Date(token.expires_at).getTime() < Date.now()) throw new HttpError(400, 'ACTIVATION_EXPIRED', '激活码已过期');
    const passwordHash = await hashPassword(body.password);
    sqlite.transaction(() => {
      const consumedAt = now();
      const consumed = sqlite.prepare('UPDATE activation_tokens SET used_at=? WHERE id=? AND used_at IS NULL AND expires_at>=?').run(consumedAt, token.id, consumedAt);
      if (consumed.changes !== 1) throw new HttpError(409, 'ACTIVATION_USED', '激活码已使用或已过期');
      if (sqlite.prepare('SELECT 1 FROM users WHERE username=?').get(body.username)) throw new HttpError(409, 'CONFLICT', '用户名已存在');
      sqlite.prepare('UPDATE users SET username=?,password_hash=?,is_active=1,updated_at=? WHERE id=?').run(body.username, passwordHash, now(), token.user_id);
      sqlite.prepare('UPDATE applications SET activation_code_encrypted=NULL,updated_at=? WHERE user_id=?').run(now(), token.user_id);
      audit(sqlite, token.user_id, 'ACCOUNT_ACTIVATED', 'user', token.user_id, token.user_id);
    })();
    return successResponse({ activated: true });
  });

  app.get('/api/member/profile', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    return successResponse({ profile: principal });
  });
  app.patch('/api/member/profile', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const body = parse(z.object({ displayName: z.string().trim().min(2).max(60).optional(), bio: z.string().max(500).optional() }).refine((value) => Object.keys(value).length > 0), request.body);
    sqlite.prepare('UPDATE users SET display_name=COALESCE(?,display_name),bio=COALESCE(?,bio),updated_at=? WHERE id=?').run(body.displayName ?? null, body.bio ?? null, now(), principal.id);
    return successResponse({ updated: true });
  });

  app.post('/api/member/activities/:id/register', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const activityId = (request.params as { id: string }).id;
    sqlite.transaction(() => {
      const activity = sqlite.prepare('SELECT status,capacity FROM activities WHERE id=?').get(activityId) as { status: string; capacity: number } | undefined;
      if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在');
      if (activity.status !== 'REGISTRATION') throw new HttpError(409, 'INVALID_STATE', '活动不在报名阶段');
      if (sqlite.prepare('SELECT 1 FROM activity_registrations WHERE activity_id=? AND user_id=?').get(activityId, principal.id)) throw new HttpError(409, 'DUPLICATE_REGISTRATION', '不可重复报名');
      const count = (sqlite.prepare('SELECT COUNT(*) count FROM activity_registrations WHERE activity_id=?').get(activityId) as { count: number }).count;
      if (count >= activity.capacity) throw new HttpError(409, 'CAPACITY_FULL', '活动名额已满');
      sqlite.prepare('INSERT INTO activity_registrations(id,activity_id,user_id,registered_at) VALUES (?,?,?,?)').run(newId('registration'), activityId, principal.id, now());
    }).immediate();
    return reply.status(201).send(successResponse({ registered: true }));
  });
  app.delete('/api/member/activities/:id/register', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id;
    const activity = sqlite.prepare('SELECT status FROM activities WHERE id=?').get(id) as { status: string } | undefined;
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在');
    if (activity.status !== 'REGISTRATION') throw new HttpError(409, 'INVALID_STATE', '当前不可取消报名');
    const result = sqlite.prepare('DELETE FROM activity_registrations WHERE activity_id=? AND user_id=?').run(id, principal.id);
    if (!result.changes) throw new HttpError(404, 'NOT_FOUND', '未找到报名记录');
    return successResponse({ registered: false });
  });
  app.post('/api/member/activities/:id/check-in', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id;
    const { code } = parse(z.object({ code: z.string().min(1) }), request.body);
    const activity = sqlite.prepare('SELECT status,check_in_code FROM activities WHERE id=?').get(id) as { status: string; check_in_code: string | null } | undefined;
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在');
    if (activity.status !== 'IN_PROGRESS') throw new HttpError(409, 'INVALID_STATE', '仅活动进行中可签到');
    const registration = sqlite.prepare('SELECT id,checked_in_at FROM activity_registrations WHERE activity_id=? AND user_id=?').get(id, principal.id) as { id: string; checked_in_at: string | null } | undefined;
    if (!registration) throw new HttpError(403, 'NOT_REGISTERED', '仅已报名成员可签到');
    if (registration.checked_in_at) throw new HttpError(409, 'ALREADY_CHECKED_IN', '已完成签到');
    if (activity.check_in_code !== code) throw new HttpError(400, 'INVALID_CHECK_IN_CODE', '签到码错误');
    sqlite.prepare('UPDATE activity_registrations SET checked_in_at=? WHERE id=?').run(now(), registration.id);
    audit(sqlite, principal.id, 'ACTIVITY_CHECK_IN', 'activity', id, principal.id);
    return successResponse({ checkedIn: true });
  });
  app.get('/api/member/works', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const items = sqlite.prepare('SELECT * FROM works WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(principal.id, paging.pageSize, paging.offset);
    const total = (sqlite.prepare('SELECT COUNT(*) count FROM works WHERE user_id=?').get(principal.id) as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  app.post('/api/member/works', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    if (!principal.departmentId) throw new HttpError(409, 'NO_DEPARTMENT', '成员尚未归属部门');
    const body = parse(z.object({ title: z.string().trim().min(2).max(100), description: z.string().max(2000).default('') }), request.body);
    const work = { id: newId('work'), userId: principal.id, departmentId: principal.departmentId, title: body.title, description: body.description, status: 'PENDING' };
    sqlite.prepare('INSERT INTO works(id,user_id,department_id,title,description,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(work.id, work.userId, work.departmentId, work.title, work.description, work.status, now(), now());
    return reply.status(201).send(successResponse({ work }));
  });
  app.post('/api/member/works/upload', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    if (!principal.departmentId) throw new HttpError(409, 'NO_DEPARTMENT', '成员尚未归属部门');
    const fields: Record<string, string> = {};
    let uploaded: { name: string; mimeType: string; storageKey: string; path: string; size: number } | null = null;
    for await (const part of request.parts()) {
      if (part.type === 'field') { fields[part.fieldname] = String(part.value ?? ''); continue; }
      if (uploaded) throw new HttpError(400, 'TOO_MANY_FILES', '每个作品只能提交一个文件');
      const extension = extname(part.filename).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
      const storageKey = `works/${randomUUID()}${extension}`;
      const path = resolve(options.uploadRoot, storageKey);
      await mkdir(resolve(options.uploadRoot, 'works'), { recursive: true });
      await pipeline(part.file, createWriteStream(path, { flags: 'wx' }));
      const info = await stat(path);
      uploaded = { name: part.filename, mimeType: part.mimetype, storageKey, path, size: info.size };
    }
    if (!uploaded) throw new HttpError(400, 'FILE_REQUIRED', '作品文件不能为空');
    const file = uploaded as { name: string; mimeType: string; storageKey: string; path: string; size: number };
    const sizeLimit = file.mimeType.startsWith('image/') ? 10 * 1024 * 1024
      : file.mimeType.startsWith('video/') ? 200 * 1024 * 1024 : 30 * 1024 * 1024;
    if (file.size > sizeLimit) {
      await unlink(file.path).catch(() => undefined);
      throw new HttpError(413, 'FILE_TOO_LARGE', `该类型作品最大允许 ${sizeLimit / 1024 / 1024}MB`);
    }
    let body: { title: string; description: string };
    try {
      body = parse(z.object({ title: z.string().trim().min(2).max(100), description: z.string().max(2000).default('') }), fields);
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
    const fileId = newId('file'); const workId = newId('work'); const createdAt = now();
    sqlite.transaction(() => {
      sqlite.prepare('INSERT INTO files(id,owner_id,department_id,name,storage_key,mime_type,size,visibility,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(fileId, principal.id, principal.departmentId, file.name, file.storageKey, file.mimeType, file.size, 'MEMBERS', createdAt, createdAt);
      sqlite.prepare('INSERT INTO works(id,user_id,department_id,file_id,title,description,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(workId, principal.id, principal.departmentId, fileId, body.title, body.description, 'PENDING', createdAt, createdAt);
      audit(sqlite, principal.id, 'WORK_SUBMITTED', 'work', workId, principal.id, { fileId });
    })();
    return reply.status(201).send(successResponse({ work: { id: workId, title: body.title, description: body.description, status: 'PENDING', fileId } }));
  });
  app.get('/api/member/tasks', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const items = sqlite.prepare('SELECT * FROM department_tasks WHERE assignee_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(principal.id, paging.pageSize, paging.offset);
    const total = (sqlite.prepare('SELECT COUNT(*) count FROM department_tasks WHERE assignee_id=?').get(principal.id) as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  app.get('/api/member/contributions', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const pointExpression = "CASE action WHEN 'TASK_CONFIRMED' THEN 5 WHEN 'ACTIVITY_CHECK_IN' THEN 3 WHEN 'WORK_PUBLISHED' THEN 10 ELSE 0 END";
    const events = sqlite.prepare(`SELECT action,entity_type entityType,entity_id entityId,created_at createdAt,${pointExpression} points
      FROM audit_logs WHERE target_user_id=? AND action IN ('TASK_CONFIRMED','ACTIVITY_CHECK_IN','WORK_PUBLISHED') ORDER BY created_at DESC`).all(principal.id) as Array<{ points: number }>;
    return successResponse({ points: events.reduce((sum, event) => sum + event.points, 0), events });
  });
  app.post('/api/member/tasks/:id/complete', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id;
    const task = sqlite.prepare('SELECT assignee_id,completed_at FROM department_tasks WHERE id=?').get(id) as { assignee_id: string; completed_at: string | null } | undefined;
    if (!task) throw new HttpError(404, 'NOT_FOUND', '任务不存在');
    if (task.assignee_id !== principal.id) throw new HttpError(403, 'FORBIDDEN', '不能完成他人的任务');
    if (task.completed_at) throw new HttpError(409, 'ALREADY_COMPLETED', '任务已标记完成');
    sqlite.prepare('UPDATE department_tasks SET completed_at=?,updated_at=? WHERE id=?').run(now(), now(), id);
    return successResponse({ completed: true });
  });
  app.get('/api/member/files', async (request, reply) => {
    const principal = requireMember(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const rows = sqlite.prepare('SELECT * FROM files WHERE deleted_at IS NULL').all() as Array<{ visibility: 'PUBLIC' | 'MEMBERS' | 'DEPARTMENT' | 'ADMINS'; department_id: string | null; deleted_at: string | null }>;
    const authorized = rows.filter((file) => canAccessFile(principal, { visibility: file.visibility, departmentId: file.department_id, deletedAt: file.deleted_at }));
    const items = authorized.slice(paging.offset, paging.offset + paging.pageSize);
    return successResponse(pageData(items, authorized.length, paging.page, paging.pageSize));
  });

  type StoredFile = {
    name: string;
    storage_key: string;
    mime_type: string;
    visibility: 'PUBLIC' | 'MEMBERS' | 'DEPARTMENT' | 'ADMINS';
    department_id: string | null;
    deleted_at: string | null;
  } & Record<string, unknown>;
  function authorizedFile(request: FastifyRequest): StoredFile {
    const id = (request.params as { id: string }).id;
    const file = sqlite.prepare('SELECT * FROM files WHERE id=?').get(id) as StoredFile | undefined;
    if (!file || file.deleted_at) throw new HttpError(404, 'NOT_FOUND', '文件不存在');
    const principal = principalFor(request);
    if (!canAccessFile(principal, { visibility: file.visibility, departmentId: file.department_id, deletedAt: file.deleted_at })) {
      if (!principal) throw new HttpError(401, 'UNAUTHENTICATED', '请先登录');
      throw new HttpError(403, 'FORBIDDEN', '无权访问该文件');
    }
    return file;
  }
  app.get('/api/files/:id', async (request) => successResponse({ file: authorizedFile(request) }));
  app.get('/api/files/:id/content', async (request, reply) => {
    const file = authorizedFile(request);
    const uploadRoot = resolve(options.uploadRoot);
    const filePath = resolve(uploadRoot, file.storage_key);
    if (!filePath.startsWith(`${uploadRoot}${sep}`)) throw new HttpError(400, 'INVALID_STORAGE_KEY', '文件存储路径无效');
    try {
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error('not a file');
    } catch {
      throw new HttpError(404, 'CONTENT_NOT_FOUND', '文件内容不存在');
    }
    reply.type(file.mime_type).header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    return reply.send(createReadStream(filePath));
  });

  app.get('/api/admin/dashboard', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const contributions = sqlite.prepare(`SELECT target_user_id userId,
      SUM(CASE action WHEN 'TASK_CONFIRMED' THEN 5 WHEN 'ACTIVITY_CHECK_IN' THEN 3 WHEN 'WORK_PUBLISHED' THEN 10 ELSE 0 END) points,
      COUNT(*) eventCount FROM audit_logs WHERE action IN ('TASK_CONFIRMED','ACTIVITY_CHECK_IN','WORK_PUBLISHED') GROUP BY target_user_id`).all();
    const counts = {
      members: (sqlite.prepare('SELECT COUNT(*) count FROM users').get() as { count: number }).count,
      pendingApplications: (sqlite.prepare("SELECT COUNT(*) count FROM applications WHERE status='PENDING'").get() as { count: number }).count,
      activeActivities: (sqlite.prepare("SELECT COUNT(*) count FROM activities WHERE status IN ('REGISTRATION','IN_PROGRESS')").get() as { count: number }).count,
      publishedWorks: (sqlite.prepare("SELECT COUNT(*) count FROM works WHERE status='PUBLISHED'").get() as { count: number }).count,
    };
    return successResponse({ ...counts, contributions });
  });
  app.get('/api/admin/analytics', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const departmentActivity = sqlite.prepare(`SELECT d.id,d.name departmentName,
      COUNT(DISTINCT u.id) members,COUNT(DISTINCT a.id) activities,COUNT(DISTINCT w.id) publishedWorks,
      COUNT(DISTINCT u.id) + COUNT(DISTINCT a.id) * 5 + COUNT(DISTINCT w.id) * 10 score
      FROM departments d
      LEFT JOIN users u ON u.department_id=d.id AND u.is_active=1
      LEFT JOIN activities a ON a.department_id=d.id
      LEFT JOIN works w ON w.department_id=d.id AND w.status='PUBLISHED'
      GROUP BY d.id ORDER BY score DESC,d.name`).all();
    const memberGrowth = sqlite.prepare(`SELECT substr(created_at,1,7) month,COUNT(*) count FROM users GROUP BY substr(created_at,1,7) ORDER BY month`).all();
    return successResponse({ departmentActivity, memberGrowth });
  });

  app.get('/api/admin/members', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const where = principal.role === 'ADMIN' ? '' : 'WHERE department_id=?';
    const params = principal.role === 'ADMIN' ? [paging.pageSize, paging.offset] : [principal.departmentId, paging.pageSize, paging.offset];
    const rows = sqlite.prepare(`SELECT id,username,display_name,email,role,department_id,is_active,created_at FROM users ${where} ORDER BY created_at LIMIT ? OFFSET ?`).all(...params) as Array<Record<string, unknown>>;
    const items = rows.map((row) => ({ ...row, departmentId: row.department_id }));
    const totalParams = principal.role === 'ADMIN' ? [] : [principal.departmentId];
    const total = (sqlite.prepare(`SELECT COUNT(*) count FROM users ${where}`).get(...totalParams) as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  app.patch('/api/admin/members/:id', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id;
    const target = sqlite.prepare('SELECT department_id,role FROM users WHERE id=?').get(id) as { department_id: string | null; role: Role } | undefined;
    if (!target) throw new HttpError(404, 'NOT_FOUND', '成员不存在');
    if (principal.role !== 'ADMIN') scopeDepartment(principal, target.department_id ?? '');
    const body = parse(z.object({ displayName: z.string().min(2).max(60).optional(), role: RoleSchema.optional(), departmentId: z.string().nullable().optional() }).refine((value) => Object.keys(value).length > 0), request.body);
    if (principal.role !== 'ADMIN' && (body.role || body.departmentId !== undefined)) throw new HttpError(403, 'FORBIDDEN', '部门负责人不可修改角色或部门');
    if (body.role === 'DEPARTMENT_LEAD' || (target.role === 'DEPARTMENT_LEAD' && (body.role !== undefined || (body.departmentId !== undefined && body.departmentId !== target.department_id)))) throw new HttpError(409, 'LEADER_ASSIGNMENT_REQUIRED', '部门负责人变更必须使用负责人指派接口');
    sqlite.prepare('UPDATE users SET display_name=COALESCE(?,display_name),role=COALESCE(?,role),department_id=CASE WHEN ? THEN ? ELSE department_id END,updated_at=? WHERE id=?')
      .run(body.displayName ?? null, body.role ?? null, body.departmentId !== undefined ? 1 : 0, body.departmentId ?? null, now(), id);
    audit(sqlite, principal.id, 'MEMBER_UPDATED', 'user', id, id, body);
    return successResponse({ updated: true });
  });
  for (const [path, active, action] of [['deactivate', 0, 'MEMBER_DEACTIVATED'], ['restore', 1, 'MEMBER_RESTORED']] as const) {
    app.post(`/api/admin/members/:id/${path}`, async (request, reply) => {
      const principal = requireManager(request, reply); if (!principal) return;
      const id = (request.params as { id: string }).id;
      if (!active && id === principal.id) throw new HttpError(409, 'CANNOT_DEACTIVATE_SELF', '不能停用当前登录账号');
      const target = sqlite.prepare('SELECT department_id FROM users WHERE id=?').get(id) as { department_id: string | null } | undefined;
      if (!target) throw new HttpError(404, 'NOT_FOUND', '成员不存在');
      if (principal.role !== 'ADMIN') scopeDepartment(principal, target.department_id ?? '');
      sqlite.prepare('UPDATE users SET is_active=?,updated_at=? WHERE id=?').run(active, now(), id);
      if (!active) sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
      audit(sqlite, principal.id, action, 'user', id, id);
      return successResponse({ active: Boolean(active) });
    });
  }

  app.post('/api/admin/departments', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const body = parse(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(2), title: z.string().min(2), description: z.string().default('') }), request.body);
    const id = newId('dept'); sqlite.prepare('INSERT INTO departments(id,slug,name,title,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(id, body.slug, body.name, body.title, body.description, now(), now());
    return reply.status(201).send(successResponse({ id }));
  });
  app.patch('/api/admin/departments/:id', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const body = parse(z.object({ name: z.string().min(2).optional(), title: z.string().min(2).optional(), description: z.string().optional() }), request.body);
    sqlite.prepare('UPDATE departments SET name=COALESCE(?,name),title=COALESCE(?,title),description=COALESCE(?,description),updated_at=? WHERE id=?').run(body.name ?? null, body.title ?? null, body.description ?? null, now(), (request.params as { id: string }).id);
    return successResponse({ updated: true });
  });
  app.post('/api/admin/departments/:id/leader', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const departmentId = (request.params as { id: string }).id;
    const { userId } = parse(z.object({ userId: z.string() }), request.body);
    const user = sqlite.prepare('SELECT department_id FROM users WHERE id=?').get(userId) as { department_id: string | null } | undefined;
    if (!user || user.department_id !== departmentId) throw new HttpError(400, 'VALIDATION_ERROR', '负责人必须属于该部门');
    sqlite.transaction(() => {
      sqlite.prepare("UPDATE users SET role='MEMBER',updated_at=? WHERE role='DEPARTMENT_LEAD' AND department_id=?").run(now(), departmentId);
      sqlite.prepare("UPDATE users SET role='DEPARTMENT_LEAD',updated_at=? WHERE id=?").run(now(), userId);
      sqlite.prepare('UPDATE departments SET leader_id=?,updated_at=? WHERE id=?').run(userId, now(), departmentId);
    })();
    return successResponse({ leaderId: userId });
  });
  app.delete('/api/admin/departments/:id', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id;
    if ((sqlite.prepare('SELECT COUNT(*) count FROM users WHERE department_id=?').get(id) as { count: number }).count) throw new HttpError(409, 'DEPARTMENT_NOT_EMPTY', '部门仍有成员');
    const result = sqlite.prepare('DELETE FROM departments WHERE id=?').run(id); if (!result.changes) throw new HttpError(404, 'NOT_FOUND', '部门不存在');
    return successResponse({ deleted: true });
  });

  const chronicleBody = z.object({ title: z.string().min(2), content: z.string().min(2), occurredAt: z.iso.datetime(), published: z.boolean().default(true) });
  app.post('/api/admin/chronicles', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const body = parse(chronicleBody, request.body); const id = newId('chronicle');
    sqlite.prepare('INSERT INTO chronicles(id,title,content,occurred_at,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(id, body.title, body.content, body.occurredAt, body.published ? 1 : 0, now(), now());
    return reply.status(201).send(successResponse({ id }));
  });
  app.patch('/api/admin/chronicles/:id', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return;
    const body = parse(chronicleBody.partial(), request.body); const current = sqlite.prepare('SELECT * FROM chronicles WHERE id=?').get((request.params as { id: string }).id) as Record<string, unknown> | undefined;
    if (!current) throw new HttpError(404, 'NOT_FOUND', '大事记不存在');
    sqlite.prepare('UPDATE chronicles SET title=?,content=?,occurred_at=?,published=?,updated_at=? WHERE id=?').run(body.title ?? current.title, body.content ?? current.content, body.occurredAt ?? current.occurred_at, body.published === undefined ? current.published : body.published ? 1 : 0, now(), (request.params as { id: string }).id);
    return successResponse({ updated: true });
  });
  app.delete('/api/admin/chronicles/:id', async (request, reply) => { const principal = requireAdmin(request, reply); if (!principal) return; sqlite.prepare('DELETE FROM chronicles WHERE id=?').run((request.params as { id: string }).id); return successResponse({ deleted: true }); });

  const activityBody = z.object({ departmentId: z.string().nullable().default(null), title: z.string().min(2), description: z.string().default(''), location: z.string().trim().min(2).max(120).default('待定'), capacity: z.number().int().positive(), startsAt: z.iso.datetime(), resultSummary: z.string().nullable().optional() });
  const activityUpdateBody = activityBody.partial().extend({ departmentId: z.string().nullable().optional() });
  app.get('/api/admin/activities', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const where = principal.role === 'ADMIN' ? '' : 'WHERE department_id=?';
    const parameters = principal.role === 'ADMIN' ? [paging.pageSize, paging.offset] : [principal.departmentId, paging.pageSize, paging.offset];
    const rows = sqlite.prepare(`SELECT * FROM activities ${where} ORDER BY starts_at DESC LIMIT ? OFFSET ?`).all(...parameters) as Array<Record<string, unknown>>;
    const items = rows.map((row) => ({ ...row, departmentId: row.department_id }));
    const totalParameters = principal.role === 'ADMIN' ? [] : [principal.departmentId];
    const total = (sqlite.prepare(`SELECT COUNT(*) count FROM activities ${where}`).get(...totalParameters) as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  app.post('/api/admin/activities', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const body = parse(activityBody, request.body); if (principal.role !== 'ADMIN') scopeDepartment(principal, body.departmentId ?? '');
    const id = newId('activity'); sqlite.prepare('INSERT INTO activities(id,department_id,title,description,location,status,capacity,starts_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, body.departmentId, body.title, body.description, body.location, 'PREPARING', body.capacity, body.startsAt, now(), now());
    return reply.status(201).send(successResponse({ id, status: 'PREPARING' }));
  });
  app.get('/api/admin/activities/:id', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const activity = sqlite.prepare('SELECT * FROM activities WHERE id=?').get((request.params as { id: string }).id) as { department_id: string | null } | undefined;
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在'); if (principal.role !== 'ADMIN') scopeDepartment(principal, activity.department_id ?? '');
    return successResponse({ activity: { ...activity, checkInCode: (activity as { check_in_code?: string | null }).check_in_code } });
  });
  app.put('/api/admin/activities/:id', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id; const activity = sqlite.prepare('SELECT * FROM activities WHERE id=?').get(id) as { department_id: string | null } | undefined;
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在'); if (principal.role !== 'ADMIN') scopeDepartment(principal, activity.department_id ?? '');
    const body = parse(activityUpdateBody, request.body);
    if (principal.role !== 'ADMIN' && body.departmentId !== undefined && body.departmentId !== principal.departmentId) throw new HttpError(403, 'FORBIDDEN', '不可将活动迁移到其他部门');
    sqlite.prepare('UPDATE activities SET department_id=COALESCE(?,department_id),title=COALESCE(?,title),description=COALESCE(?,description),location=COALESCE(?,location),capacity=COALESCE(?,capacity),starts_at=COALESCE(?,starts_at),result_summary=COALESCE(?,result_summary),updated_at=? WHERE id=?')
      .run(body.departmentId ?? null, body.title ?? null, body.description ?? null, body.location ?? null, body.capacity ?? null, body.startsAt ?? null, body.resultSummary ?? null, now(), id);
    return successResponse({ updated: true });
  });
  app.delete('/api/admin/activities/:id', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id;
    const activity = sqlite.prepare('SELECT department_id,status FROM activities WHERE id=?').get(id) as { department_id: string | null; status: ActivityStatus } | undefined;
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在');
    if (principal.role !== 'ADMIN') scopeDepartment(principal, activity.department_id ?? '');
    if (activity.status !== 'PREPARING') throw new HttpError(409, 'INVALID_STATE', '仅筹备中的活动可删除');
    sqlite.prepare('DELETE FROM activities WHERE id=?').run(id);
    audit(sqlite, principal.id, 'ACTIVITY_DELETED', 'activity', id);
    return successResponse({ deleted: true });
  });
  app.post('/api/admin/activities/:id/results/upload', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const activityId = (request.params as { id: string }).id;
    const activity = sqlite.prepare('SELECT department_id,status FROM activities WHERE id=?').get(activityId) as { department_id: string | null; status: ActivityStatus } | undefined;
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在');
    if (principal.role !== 'ADMIN') scopeDepartment(principal, activity.department_id ?? '');
    if (activity.status !== 'ENDED') throw new HttpError(409, 'INVALID_STATE', '仅已结束活动可上传成果');
    const fields: Record<string, string> = {};
    let uploaded: { name: string; mimeType: string; storageKey: string; path: string; size: number } | null = null;
    for await (const part of request.parts()) {
      if (part.type === 'field') { fields[part.fieldname] = String(part.value ?? ''); continue; }
      if (uploaded) throw new HttpError(400, 'TOO_MANY_FILES', '每次只能上传一个成果文件');
      const extension = extname(part.filename).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
      const storageKey = `activity-results/${randomUUID()}${extension}`;
      const path = resolve(options.uploadRoot, storageKey);
      await mkdir(resolve(options.uploadRoot, 'activity-results'), { recursive: true });
      await pipeline(part.file, createWriteStream(path, { flags: 'wx' }));
      const info = await stat(path);
      uploaded = { name: part.filename, mimeType: part.mimetype, storageKey, path, size: info.size };
    }
    if (!uploaded) throw new HttpError(400, 'FILE_REQUIRED', '请选择成果文件');
    const file = uploaded as { name: string; mimeType: string; storageKey: string; path: string; size: number };
    const sizeLimit = file.mimeType.startsWith('image/') ? 10 * 1024 * 1024 : file.mimeType.startsWith('video/') ? 200 * 1024 * 1024 : 30 * 1024 * 1024;
    if (file.size > sizeLimit) {
      await unlink(file.path).catch(() => undefined);
      throw new HttpError(413, 'FILE_TOO_LARGE', `该类型成果最大允许 ${sizeLimit / 1024 / 1024}MB`);
    }
    let summary: string;
    try {
      summary = parse(z.string().trim().min(2).max(1000), fields.summary?.trim() || file.name);
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
    const fileId = newId('file'); const resultId = newId('result'); const createdAt = now();
    const category = file.mimeType.startsWith('image/') ? 'PHOTO' : file.mimeType.startsWith('video/') ? 'VIDEO' : 'OTHER';
    try {
      sqlite.transaction(() => {
        sqlite.prepare('INSERT INTO files(id,owner_id,department_id,name,storage_key,mime_type,size,visibility,category,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
          .run(fileId, principal.id, activity.department_id, file.name, file.storageKey, file.mimeType, file.size, 'MEMBERS', category, createdAt, createdAt);
        sqlite.prepare('INSERT INTO activity_results(id,activity_id,file_id,summary,created_at) VALUES (?,?,?,?,?)').run(resultId, activityId, fileId, summary, createdAt);
        audit(sqlite, principal.id, 'ACTIVITY_RESULT_UPLOADED', 'activity', activityId, null, { resultId, fileId });
      })();
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
    return reply.status(201).send(successResponse({ activityId, resultId, fileId, summary }));
  });
  app.post('/api/admin/activities/:id/state', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id; const { status } = parse(z.object({ status: ActivityStatusSchema }), request.body);
    const activity = sqlite.prepare('SELECT * FROM activities WHERE id=?').get(id) as { status: ActivityStatus; department_id: string | null; result_summary: string | null } | undefined;
    if (!activity) throw new HttpError(404, 'NOT_FOUND', '活动不存在'); if (principal.role !== 'ADMIN') scopeDepartment(principal, activity.department_id ?? '');
    if (!canTransitionActivity(activity.status, status)) throw new HttpError(409, 'INVALID_TRANSITION', `不允许从 ${activity.status} 转为 ${status}`);
    if (status === 'ARCHIVED' && !activity.result_summary && !sqlite.prepare('SELECT 1 FROM activity_results WHERE activity_id=?').get(id)) throw new HttpError(409, 'ARCHIVE_REQUIRES_RESULT', '归档前必须填写成果总结');
    const checkInCode = status === 'IN_PROGRESS' ? randomBytes(4).toString('hex').toUpperCase() : null;
    sqlite.prepare('UPDATE activities SET status=?,check_in_code=COALESCE(?,check_in_code),updated_at=? WHERE id=?').run(status, checkInCode, now(), id);
    audit(sqlite, principal.id, 'ACTIVITY_STATE_CHANGED', 'activity', id, null, { from: activity.status, to: status });
    return successResponse({ status, checkInCode: checkInCode ?? undefined });
  });

  app.get('/api/admin/applications', async (request, reply) => { const principal = requireAdmin(request, reply); if (!principal) return; const paging = getPaging(request.query); const items = sqlite.prepare('SELECT id,display_name,email,college,department_id,reason,status,rejection_reason,created_at FROM applications ORDER BY created_at DESC LIMIT ? OFFSET ?').all(paging.pageSize, paging.offset); const total = (sqlite.prepare('SELECT COUNT(*) count FROM applications').get() as { count: number }).count; return successResponse(pageData(items, total, paging.page, paging.pageSize)); });
  async function approveApplication(id: string, actor: Principal): Promise<string> {
    const application = sqlite.prepare('SELECT * FROM applications WHERE id=?').get(id) as { display_name: string; email: string; department_id: string; status: string } | undefined;
    if (!application) throw new HttpError(404, 'NOT_FOUND', '申请不存在'); if (application.status !== 'PENDING') throw new HttpError(409, 'INVALID_STATE', '申请已处理');
    const userId = newId('user'); const { rawToken, record } = createActivationToken(userId);
    sqlite.transaction(() => {
      sqlite.prepare('INSERT INTO users(id,display_name,email,role,department_id,bio,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(userId, application.display_name, application.email, 'MEMBER', application.department_id, '', 0, now(), now());
      sqlite.prepare('INSERT INTO activation_tokens(id,user_id,token_hash,expires_at,used_at,created_at) VALUES (?,?,?,?,?,?)').run(newId('activation'), userId, record.tokenHash, record.expiresAt, null, now());
      sqlite.prepare("UPDATE applications SET status='APPROVED',user_id=?,activation_code_encrypted=?,updated_at=? WHERE id=?").run(userId, encryptSecret(rawToken, options.sessionSecret), now(), id);
      audit(sqlite, actor.id, 'APPLICATION_APPROVED', 'application', id, userId);
    })();
    return rawToken;
  }
  app.post('/api/admin/applications/:id/approve', async (request, reply) => { const principal = requireAdmin(request, reply); if (!principal) return; const activationCode = await approveApplication((request.params as { id: string }).id, principal); return successResponse({ approved: true, activationCode }); });
  app.post('/api/admin/applications/:id/reject', async (request, reply) => { const principal = requireAdmin(request, reply); if (!principal) return; const { reason } = parse(z.object({ reason: z.string().min(2) }), request.body); const id = (request.params as { id: string }).id; const result = sqlite.prepare("UPDATE applications SET status='REJECTED',rejection_reason=?,updated_at=? WHERE id=? AND status='PENDING'").run(reason, now(), id); if (!result.changes) throw new HttpError(409, 'INVALID_STATE', '申请不存在或已处理'); audit(sqlite, principal.id, 'APPLICATION_REJECTED', 'application', id); return successResponse({ rejected: true }); });
  app.post('/api/admin/applications/:id/regenerate-activation', async (request, reply) => {
    const principal = requireAdmin(request, reply); if (!principal) return; const id = (request.params as { id: string }).id;
    const application = sqlite.prepare("SELECT a.user_id,u.is_active,u.password_hash FROM applications a JOIN users u ON u.id=a.user_id WHERE a.id=? AND a.status='APPROVED'").get(id) as { user_id: string | null; is_active: number; password_hash: string | null } | undefined; if (!application?.user_id) throw new HttpError(409, 'INVALID_STATE', '申请尚未批准');
    if (application.is_active || application.password_hash) throw new HttpError(409, 'ALREADY_ACTIVATED', '账户已激活，不可重新生成激活码');
    const { rawToken, record } = createActivationToken(application.user_id); sqlite.transaction(() => { sqlite.prepare('DELETE FROM activation_tokens WHERE user_id=? AND used_at IS NULL').run(application.user_id); sqlite.prepare('INSERT INTO activation_tokens(id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').run(newId('activation'), application.user_id, record.tokenHash, record.expiresAt, now()); sqlite.prepare('UPDATE applications SET activation_code_encrypted=?,updated_at=? WHERE id=?').run(encryptSecret(rawToken, options.sessionSecret), now(), id); })();
    return successResponse({ activationCode: rawToken });
  });

  app.get('/api/admin/works', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const rawStatus = (request.query as { status?: unknown }).status;
    const status = rawStatus === undefined ? undefined : parse(WorkStatusSchema, rawStatus);
    const conditions: string[] = [];
    const parameters: Array<string | number> = [];
    if (principal.role !== 'ADMIN') {
      conditions.push('department_id=?');
      parameters.push(principal.departmentId ?? '');
    }
    if (status) {
      conditions.push('status=?');
      parameters.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = sqlite.prepare(`SELECT * FROM works ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...parameters, paging.pageSize, paging.offset) as Array<Record<string, unknown>>;
    const items = rows.map((row) => ({ ...row, departmentId: row.department_id }));
    const total = (sqlite.prepare(`SELECT COUNT(*) count FROM works ${where}`).get(...parameters) as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });

  app.post('/api/admin/works/:id/review', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return; const id = (request.params as { id: string }).id;
    const body = parse(z.object({ status: WorkStatusSchema.refine((value) => value !== 'PENDING'), note: z.string().max(500).optional() }), request.body);
    const work = sqlite.prepare('SELECT * FROM works WHERE id=?').get(id) as { department_id: string; user_id: string; status: string } | undefined; if (!work) throw new HttpError(404, 'NOT_FOUND', '作品不存在'); if (principal.role !== 'ADMIN') scopeDepartment(principal, work.department_id); if (work.status !== 'PENDING') throw new HttpError(409, 'INVALID_STATE', '作品已审核');
    sqlite.prepare('UPDATE works SET status=?,review_note=?,updated_at=? WHERE id=?').run(body.status, body.note ?? null, now(), id); if (body.status === 'PUBLISHED') audit(sqlite, principal.id, 'WORK_PUBLISHED', 'work', id, work.user_id); else audit(sqlite, principal.id, 'WORK_REJECTED', 'work', id, work.user_id);
    return successResponse({ status: body.status });
  });

  app.get('/api/admin/files', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const where = principal.role === 'ADMIN' ? '' : 'WHERE department_id=?';
    const parameters = principal.role === 'ADMIN' ? [] : [principal.departmentId];
    const items = sqlite.prepare(`SELECT * FROM files ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...parameters, paging.pageSize, paging.offset);
    const total = (sqlite.prepare(`SELECT COUNT(*) count FROM files ${where}`).get(...parameters) as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  const fileCategorySchema = z.enum(['POSTER', 'PHOTO', 'VIDEO', 'PLAN', 'HISTORY', 'OTHER']);
  app.post('/api/admin/files/upload', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const fields: Record<string, string> = {};
    let uploaded: { name: string; mimeType: string; storageKey: string; path: string; size: number } | null = null;
    for await (const part of request.parts()) {
      if (part.type === 'field') {
        fields[part.fieldname] = String(part.value ?? '');
        continue;
      }
      if (uploaded) throw new HttpError(400, 'TOO_MANY_FILES', '每次只能上传一个文件');
      const extension = extname(part.filename).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
      const storageKey = `managed/${randomUUID()}${extension}`;
      const path = resolve(options.uploadRoot, storageKey);
      await mkdir(resolve(options.uploadRoot, 'managed'), { recursive: true });
      await pipeline(part.file, createWriteStream(path, { flags: 'wx' }));
      const info = await stat(path);
      uploaded = { name: part.filename, mimeType: part.mimetype, storageKey, path, size: info.size };
    }
    if (!uploaded) throw new HttpError(400, 'FILE_REQUIRED', '请选择要上传的文件');
    const file = uploaded as { name: string; mimeType: string; storageKey: string; path: string; size: number };
    let visibility: z.infer<typeof FileVisibilitySchema>;
    let category: z.infer<typeof fileCategorySchema>;
    const departmentId = fields.departmentId || null;
    try {
      visibility = parse(FileVisibilitySchema, fields.visibility ?? 'MEMBERS');
      category = parse(fileCategorySchema, fields.category ?? 'OTHER');
      if (principal.role !== 'ADMIN') scopeDepartment(principal, departmentId ?? '');
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
    const sizeLimit = file.mimeType.startsWith('image/') ? 10 * 1024 * 1024
      : file.mimeType.startsWith('video/') ? 200 * 1024 * 1024 : 30 * 1024 * 1024;
    if (file.size > sizeLimit) {
      await unlink(file.path).catch(() => undefined);
      throw new HttpError(413, 'FILE_TOO_LARGE', `该类型文件最大允许 ${sizeLimit / 1024 / 1024}MB`);
    }
    const id = newId('file');
    sqlite.prepare('INSERT INTO files(id,owner_id,department_id,name,storage_key,mime_type,size,visibility,category,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, principal.id, departmentId, file.name, file.storageKey, file.mimeType, file.size, visibility, category, now(), now());
    audit(sqlite, principal.id, 'FILE_UPLOADED', 'file', id, null, { visibility, category, departmentId });
    return reply.status(201).send(successResponse({ id, name: file.name, mimeType: file.mimeType, size: file.size, visibility, category, departmentId, storageKey: file.storageKey }));
  });
  app.post('/api/admin/files', async (request, reply) => { const principal = requireManager(request, reply); if (!principal) return; const body = parse(z.object({ name: z.string().min(1), storageKey: z.string().min(1), mimeType: z.string().min(1), size: z.number().int().nonnegative(), visibility: FileVisibilitySchema, category: fileCategorySchema.default('OTHER'), departmentId: z.string().nullable().default(null) }), request.body); if (principal.role !== 'ADMIN') scopeDepartment(principal, body.departmentId ?? ''); const id = newId('file'); sqlite.prepare('INSERT INTO files(id,owner_id,department_id,name,storage_key,mime_type,size,visibility,category,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id, principal.id, body.departmentId, body.name, body.storageKey, body.mimeType, body.size, body.visibility, body.category, now(), now()); return reply.status(201).send(successResponse({ id })); });
  app.patch('/api/admin/files/:id', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const id = (request.params as { id: string }).id;
    const file = sqlite.prepare('SELECT department_id FROM files WHERE id=?').get(id) as { department_id: string | null } | undefined;
    if (!file) throw new HttpError(404, 'NOT_FOUND', '文件不存在');
    if (principal.role !== 'ADMIN') scopeDepartment(principal, file.department_id ?? '');
    const body = parse(z.object({ name: z.string().trim().min(1).max(180).optional(), visibility: FileVisibilitySchema.optional(), category: fileCategorySchema.optional(), departmentId: z.string().nullable().optional() }).refine((value) => Object.keys(value).length > 0, '至少提供一个修改字段'), request.body);
    if (principal.role !== 'ADMIN') {
      if (body.departmentId !== undefined && body.departmentId !== principal.departmentId) throw new HttpError(403, 'FORBIDDEN', '不可移动到其他部门');
      if (body.visibility === 'PUBLIC' || body.visibility === 'ADMINS') throw new HttpError(403, 'FORBIDDEN', '负责人不可设置该可见范围');
    }
    sqlite.prepare('UPDATE files SET name=COALESCE(?,name),visibility=COALESCE(?,visibility),category=COALESCE(?,category),department_id=COALESCE(?,department_id),updated_at=? WHERE id=?')
      .run(body.name ?? null, body.visibility ?? null, body.category ?? null, body.departmentId ?? null, now(), id);
    audit(sqlite, principal.id, 'FILE_UPDATED', 'file', id, null, body);
    return successResponse({ updated: true });
  });
  app.post('/api/admin/files/:id/recycle', async (request, reply) => { const principal = requireManager(request, reply); if (!principal) return; const id = (request.params as { id: string }).id; const file = sqlite.prepare('SELECT department_id,deleted_at FROM files WHERE id=?').get(id) as { department_id: string | null; deleted_at: string | null } | undefined; if (!file) throw new HttpError(404, 'NOT_FOUND', '文件不存在'); if (principal.role !== 'ADMIN') scopeDepartment(principal, file.department_id ?? ''); if (file.deleted_at) throw new HttpError(409, 'ALREADY_DELETED', '文件已在回收站'); sqlite.prepare('UPDATE files SET deleted_at=?,updated_at=? WHERE id=?').run(now(), now(), id); return successResponse({ recycled: true }); });
  app.post('/api/admin/files/:id/restore', async (request, reply) => { const principal = requireManager(request, reply); if (!principal) return; const id = (request.params as { id: string }).id; const file = sqlite.prepare('SELECT department_id,deleted_at FROM files WHERE id=?').get(id) as { department_id: string | null; deleted_at: string | null } | undefined; if (!file) throw new HttpError(404, 'NOT_FOUND', '文件不存在'); if (principal.role !== 'ADMIN') scopeDepartment(principal, file.department_id ?? ''); if (!file.deleted_at) throw new HttpError(409, 'NOT_DELETED', '文件不在回收站'); sqlite.prepare('UPDATE files SET deleted_at=NULL,updated_at=? WHERE id=?').run(now(), id); return successResponse({ restored: true }); });

  app.get('/api/admin/tasks', async (request, reply) => {
    const principal = requireManager(request, reply); if (!principal) return;
    const paging = getPaging(request.query);
    const where = principal.role === 'ADMIN' ? '' : 'WHERE department_id=?';
    const parameters = principal.role === 'ADMIN' ? [] : [principal.departmentId];
    const items = sqlite.prepare(`SELECT * FROM department_tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...parameters, paging.pageSize, paging.offset);
    const total = (sqlite.prepare(`SELECT COUNT(*) count FROM department_tasks ${where}`).get(...parameters) as { count: number }).count;
    return successResponse(pageData(items, total, paging.page, paging.pageSize));
  });
  app.post('/api/admin/tasks', async (request, reply) => { const principal = requireManager(request, reply); if (!principal) return; const body = parse(z.object({ departmentId: z.string(), assigneeId: z.string(), title: z.string().min(2), description: z.string().default(''), dueAt: z.iso.datetime().optional() }), request.body); if (principal.role !== 'ADMIN') scopeDepartment(principal, body.departmentId); const assignee = sqlite.prepare('SELECT department_id FROM users WHERE id=?').get(body.assigneeId) as { department_id: string | null } | undefined; if (!assignee || assignee.department_id !== body.departmentId) throw new HttpError(400, 'VALIDATION_ERROR', '任务成员必须属于目标部门'); const id = newId('task'); sqlite.prepare('INSERT INTO department_tasks(id,department_id,assignee_id,title,description,due_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(id, body.departmentId, body.assigneeId, body.title, body.description, body.dueAt ?? null, now(), now()); return reply.status(201).send(successResponse({ id })); });
  app.post('/api/admin/tasks/:id/confirm', async (request, reply) => { const principal = requireManager(request, reply); if (!principal) return; const id = (request.params as { id: string }).id; const task = sqlite.prepare('SELECT department_id,assignee_id,completed_at,confirmed_at FROM department_tasks WHERE id=?').get(id) as { department_id: string; assignee_id: string; completed_at: string | null; confirmed_at: string | null } | undefined; if (!task) throw new HttpError(404, 'NOT_FOUND', '任务不存在'); if (principal.role !== 'ADMIN') scopeDepartment(principal, task.department_id); if (!task.completed_at) throw new HttpError(409, 'NOT_COMPLETED', '成员尚未完成任务'); if (task.confirmed_at) throw new HttpError(409, 'ALREADY_CONFIRMED', '任务贡献已确认'); sqlite.transaction(() => { sqlite.prepare('UPDATE department_tasks SET confirmed_at=?,updated_at=? WHERE id=? AND confirmed_at IS NULL').run(now(), now(), id); audit(sqlite, principal.id, 'TASK_CONFIRMED', 'task', id, task.assignee_id); })(); return successResponse({ confirmed: true, contributionPoints: 5 }); });

  app.get('/api/admin/site-settings', async (request, reply) => { const principal = requireAdmin(request, reply); if (!principal) return; return successResponse({ settings: Object.fromEntries((sqlite.prepare('SELECT key,value FROM site_settings').all() as Array<{ key: string; value: string }>).map((entry) => [entry.key, entry.value])) }); });
  app.put('/api/admin/site-settings', async (request, reply) => { const principal = requireAdmin(request, reply); if (!principal) return; const body = parse(z.record(z.string(), z.string().max(2000)), request.body); const statement = sqlite.prepare('INSERT INTO site_settings(key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at'); sqlite.transaction(() => { for (const [key, value] of Object.entries(body)) statement.run(key, value, now()); })(); audit(sqlite, principal.id, 'SITE_SETTINGS_UPDATED', 'settings', 'site'); return successResponse({ updated: Object.keys(body) }); });
  app.get('/api/admin/audit-log', async (request, reply) => { const principal = requireAdmin(request, reply); if (!principal) return; const paging = getPaging(request.query); const items = sqlite.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(paging.pageSize, paging.offset); const total = (sqlite.prepare('SELECT COUNT(*) count FROM audit_logs').get() as { count: number }).count; return successResponse(pageData(items, total, paging.page, paging.pageSize)); });

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
    if (options.webRoot && request.method === 'GET') return reply.type('text/html').sendFile('index.html');
    return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: '资源不存在' } });
  });

  await app.ready();
  return app;
}
