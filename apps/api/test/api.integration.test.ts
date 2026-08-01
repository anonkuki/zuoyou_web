import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { openDatabase, seedDatabase } from '../src/database.js';

const tempRoot = 'D:/Temp/guild-api-';

function cookieFrom(headers: Record<string, unknown>): string {
  const value = headers['set-cookie'];
  const raw = Array.isArray(value) ? value[0] : String(value ?? '');
  return raw.split(';')[0];
}

async function login(app: FastifyInstance, username: string, password: string): Promise<string> {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password } });
  expect(response.statusCode).toBe(200);
  return cookieFrom(response.headers);
}

async function withDevelopmentSeed(assertion: (sqlite: Awaited<ReturnType<typeof openDatabase>>['sqlite']) => Promise<void>): Promise<void> {
  const root = await mkdtemp('D:/Temp/guild-production-guard-');
  const { sqlite } = await openDatabase(`${root}/guild.sqlite`);
  try {
    await seedDatabase(sqlite);
    await assertion(sqlite);
  } finally {
    sqlite.close();
    await rm(root, { recursive: true, force: true });
  }
}

describe('production seed safety', () => {
  it('validates the production admin password before an existing-database early return', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      await expect(seedDatabase(sqlite, { production: true })).rejects.toThrow(/ADMIN_PASSWORD/);
    });
  });

  it('rejects obvious production admin password placeholders', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      await expect(seedDatabase(sqlite, { production: true, adminPassword: 'required-in-production' })).rejects.toThrow(/non-placeholder/i);
    });
  });

  it('refuses to reuse a development-seeded database in production', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      await expect(seedDatabase(sqlite, { production: true, adminPassword: 'ProductionAdmin!2026' })).rejects.toThrow(/development demo/i);
    });
  });
});

describe.sequential('Adventurer Guild API', () => {
  let app: FastifyInstance;
  let root: string;
  let adminCookie: string;
  let leadCookie: string;
  let memberCookie: string;

  beforeAll(async () => {
    root = await mkdtemp(tempRoot);
    app = await createApp({
      databasePath: `${root}/guild.sqlite`,
      uploadRoot: `${root}/uploads`,
      seed: true,
      sessionSecret: 'integration-test-secret-that-is-long',
    });
    await mkdir(`${root}/uploads/public`, { recursive: true });
    await writeFile(`${root}/uploads/public/guild-guide.pdf`, 'guild-guide-bytes');
    adminCookie = await login(app, 'admin', 'DemoAdmin!2026');
    leadCookie = await login(app, 'cos.lead', 'DemoLead!2026');
    memberCookie = await login(app, 'cos.member', 'DemoMember!2026');
  });

  afterAll(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });

  it('reports health and exact fictional seed counts', async () => {
    const health = await app.inject({ method: 'GET', url: '/api/health' });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ ok: true, data: { status: 'ok' } });

    const summary = await app.inject({ method: 'GET', url: '/api/public/summary' });
    expect(summary.json().data).toMatchObject({ memberCount: 82, departmentCount: 6 });
    const departments = await app.inject({ method: 'GET', url: '/api/public/departments' });
    expect(departments.json().data.items).toHaveLength(6);
    expect(departments.json().data.items.map((item: { name: string; title: string }) => [item.name, item.title])).toEqual([
      ['COS部', '幻术师'], ['技术部', '魔导工程师'], ['轻音部', '吟游诗人'],
      ['原创部', '绘卷术士'], ['舞装部', '舞刃使'], ['外宣部', '传令官'],
    ]);
    const activities = await app.inject({ method: 'GET', url: '/api/public/activities' });
    expect(activities.json().data.items.every((activity: Record<string, unknown>) => !('check_in_code' in activity) && !('checkInCode' in activity))).toBe(true);
  });

  it('supports login, me, logout and rejects missing/insufficient authority', async () => {
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } });
    expect(me.json().data.user).toMatchObject({ username: 'cos.member', role: 'MEMBER' });
    expect((await app.inject({ method: 'GET', url: '/api/member/profile' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: memberCookie } })).statusCode).toBe(403);
    const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie: memberCookie } });
    expect(logout.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } })).statusCode).toBe(401);
    memberCookie = await login(app, 'cos.member', 'DemoMember!2026');
  });

  it('returns a standard 400 response for malformed JSON', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'content-type': 'application/json' }, payload: '{"username":' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, error: { code: 'BAD_REQUEST' } });
  });

  it('does not provision known lead/member passwords in production seeds', async () => {
    const productionRoot = await mkdtemp('D:/Temp/guild-api-production-');
    const productionApp = await createApp({
      databasePath: `${productionRoot}/guild.sqlite`, uploadRoot: `${productionRoot}/uploads`, seed: true,
      sessionSecret: 'production-integration-secret-long', adminPassword: 'ProductionAdmin!2026', production: true,
    });
    try {
      expect((await productionApp.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'cos.lead', password: 'DemoLead!2026' } })).statusCode).toBe(401);
      expect((await productionApp.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password: 'ProductionAdmin!2026' } })).statusCode).toBe(200);
    } finally {
      await productionApp.close();
      await rm(productionRoot, { recursive: true, force: true });
    }
  });

  it('completes recruitment approval, status lookup, one-time activation and login', async () => {
    const submitted = await app.inject({ method: 'POST', url: '/api/public/applications', payload: {
      displayName: '星砂旅人', email: 'starsand@example.test', departmentId: 'dept-tech', reason: '希望参与魔导装置维护',
    } });
    expect(submitted.statusCode).toBe(201);
    const { id, statusToken } = submitted.json().data;
    expect(statusToken.length).toBeGreaterThan(30);

    const approved = await app.inject({ method: 'POST', url: `/api/admin/applications/${id}/approve`, headers: { cookie: adminCookie } });
    expect(approved.statusCode).toBe(200);
    const status = await app.inject({ method: 'GET', url: `/api/public/applications/status/${statusToken}` });
    expect(status.json().data).toMatchObject({ status: 'APPROVED' });
    const activationCode = status.json().data.activationCode;
    expect(activationCode).toBeTypeOf('string');

    const activationAttempts = await Promise.all(['starsand', 'starsand2'].map((username) => app.inject({
      method: 'POST', url: '/api/auth/activate', payload: { token: activationCode, username, password: 'StrongPass!2026' },
    })));
    expect(activationAttempts.map((response) => response.statusCode).sort()).toEqual([200, 409]);
    const winner = activationAttempts[0].statusCode === 200 ? 'starsand' : 'starsand2';
    expect(await login(app, winner, 'StrongPass!2026')).toContain('guild_session=');
    expect((await app.inject({ method: 'POST', url: `/api/admin/applications/${id}/regenerate-activation`, headers: { cookie: adminCookie } })).statusCode).toBe(409);
  });

  it('makes registration capacity-safe and non-duplicate', async () => {
    const first = await app.inject({ method: 'POST', url: '/api/member/activities/activity-open/register', headers: { cookie: memberCookie } });
    expect(first.statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: '/api/member/activities/activity-open/register', headers: { cookie: memberCookie } })).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: '/api/member/activities/activity-open/register', headers: { cookie: leadCookie } })).statusCode).toBe(409);
  });

  it('restricts check-in to registered members while in progress', async () => {
    const activity = await app.inject({ method: 'GET', url: '/api/admin/activities/activity-live', headers: { cookie: adminCookie } });
    const code = activity.json().data.activity.checkInCode;
    expect((await app.inject({ method: 'POST', url: '/api/member/activities/activity-live/check-in', headers: { cookie: leadCookie }, payload: { code } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/member/activities/activity-live/check-in', headers: { cookie: memberCookie }, payload: { code: 'WRONG' } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/member/activities/activity-live/check-in', headers: { cookie: memberCookie }, payload: { code } })).statusCode).toBe(200);
  });

  it('rejects invalid lifecycle jumps and archive without a result', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/admin/activities/activity-preparing/state', headers: { cookie: adminCookie }, payload: { status: 'IN_PROGRESS' } })).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: '/api/admin/activities/activity-ended/state', headers: { cookie: adminCookie }, payload: { status: 'ARCHIVED' } })).statusCode).toBe(409);
    await app.inject({ method: 'PUT', url: '/api/admin/activities/activity-ended', headers: { cookie: adminCookie }, payload: { resultSummary: '圆满完成' } });
    expect((await app.inject({ method: 'POST', url: '/api/admin/activities/activity-ended/state', headers: { cookie: adminCookie }, payload: { status: 'ARCHIVED' } })).statusCode).toBe(200);
  });

  it('limits department leads to their own department', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/admin/members', headers: { cookie: leadCookie } });
    expect(list.statusCode).toBe(200);
    expect(list.json().data.items.every((member: { departmentId: string }) => member.departmentId === 'dept-cos')).toBe(true);
    expect((await app.inject({ method: 'PATCH', url: '/api/admin/members/user-tech-01', headers: { cookie: leadCookie }, payload: { displayName: '越权修改' } })).statusCode).toBe(403);
    const activities = await app.inject({ method: 'GET', url: '/api/admin/activities', headers: { cookie: leadCookie } });
    expect(activities.statusCode).toBe(200);
    expect(activities.json().data.items.every((activity: { departmentId: string }) => activity.departmentId === 'dept-cos')).toBe(true);
    expect((await app.inject({ method: 'GET', url: '/api/admin/activities/activity-preparing', headers: { cookie: leadCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PUT', url: '/api/admin/activities/activity-open', headers: { cookie: leadCookie }, payload: { departmentId: 'dept-tech' } })).statusCode).toBe(403);
  });

  it('routes department-leader changes through the invariant-preserving endpoint', async () => {
    expect((await app.inject({ method: 'PATCH', url: '/api/admin/members/user-member', headers: { cookie: adminCookie }, payload: { role: 'DEPARTMENT_LEAD' } })).statusCode).toBe(409);
    expect((await app.inject({ method: 'PATCH', url: '/api/admin/members/user-lead', headers: { cookie: adminCookie }, payload: { departmentId: 'dept-tech' } })).statusCode).toBe(409);
  });

  it('provides a paged and department-scoped work review queue', async () => {
    const adminAll = await app.inject({ method: 'GET', url: '/api/admin/works?page=1&pageSize=1', headers: { cookie: adminCookie } });
    expect(adminAll.statusCode).toBe(200);
    expect(adminAll.json().data).toMatchObject({ page: 1, pageSize: 1, total: 2 });
    expect(adminAll.json().data.items).toHaveLength(1);

    const adminPending = await app.inject({ method: 'GET', url: '/api/admin/works?status=PENDING', headers: { cookie: adminCookie } });
    expect(adminPending.json().data.items.map((work: { id: string }) => work.id)).toEqual(['work-tech-pending']);
    const leadAll = await app.inject({ method: 'GET', url: '/api/admin/works', headers: { cookie: leadCookie } });
    expect(leadAll.json().data).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    expect(leadAll.json().data.items.every((work: { departmentId: string }) => work.departmentId === 'dept-cos')).toBe(true);
    const leadPending = await app.inject({ method: 'GET', url: '/api/admin/works?status=PENDING', headers: { cookie: leadCookie } });
    expect(leadPending.json().data.total).toBe(0);
    expect((await app.inject({ method: 'GET', url: '/api/admin/works', headers: { cookie: memberCookie } })).statusCode).toBe(403);
  });

  it('paginates member and manager work, task, and file lists', async () => {
    const memberWorks = await app.inject({ method: 'GET', url: '/api/member/works?page=1&pageSize=1', headers: { cookie: memberCookie } });
    expect(memberWorks.json().data).toMatchObject({ page: 1, pageSize: 1, total: 1 });
    expect(memberWorks.json().data.items).toHaveLength(1);
    const memberTasks = await app.inject({ method: 'GET', url: '/api/member/tasks?page=1&pageSize=1', headers: { cookie: memberCookie } });
    expect(memberTasks.json().data).toMatchObject({ page: 1, pageSize: 1, total: 1 });
    expect(memberTasks.json().data.items).toHaveLength(1);
    const memberFiles = await app.inject({ method: 'GET', url: '/api/member/files?page=2&pageSize=2', headers: { cookie: memberCookie } });
    expect(memberFiles.json().data).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    expect(memberFiles.json().data.items).toHaveLength(1);

    const adminFiles = await app.inject({ method: 'GET', url: '/api/admin/files?page=2&pageSize=2', headers: { cookie: adminCookie } });
    expect(adminFiles.json().data).toMatchObject({ page: 2, pageSize: 2, total: 5 });
    expect(adminFiles.json().data.items).toHaveLength(2);
    const leadFiles = await app.inject({ method: 'GET', url: '/api/admin/files', headers: { cookie: leadCookie } });
    expect(leadFiles.json().data).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    const adminTasks = await app.inject({ method: 'GET', url: '/api/admin/tasks?page=1&pageSize=1', headers: { cookie: adminCookie } });
    expect(adminTasks.json().data).toMatchObject({ page: 1, pageSize: 1, total: 1 });
    expect(adminTasks.json().data.items).toHaveLength(1);
    const leadTasks = await app.inject({ method: 'GET', url: '/api/admin/tasks', headers: { cookie: leadCookie } });
    expect(leadTasks.json().data).toMatchObject({ page: 1, pageSize: 20, total: 1 });
  });

  it('supports scoped activity creation and safe deletion while preparing', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/admin/activities', headers: { cookie: leadCookie }, payload: {
      departmentId: 'dept-cos', title: '幻装小队筹备会', capacity: 12, startsAt: '2026-09-10T10:00:00.000Z',
    } });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id;
    expect((await app.inject({ method: 'DELETE', url: `/api/admin/activities/${id}`, headers: { cookie: leadCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'DELETE', url: '/api/admin/activities/activity-live', headers: { cookie: adminCookie } })).statusCode).toBe(409);
  });

  it('creates pending works and allows scoped lead review', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/works', headers: { cookie: memberCookie }, payload: { title: '星辉摄影集', description: '夏日祭记录' } });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.work.status).toBe('PENDING');
    const id = created.json().data.work.id;
    expect((await app.inject({ method: 'POST', url: `/api/admin/works/${id}/review`, headers: { cookie: leadCookie }, payload: { status: 'PUBLISHED' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/admin/works/work-tech-pending/review', headers: { cookie: leadCookie }, payload: { status: 'PUBLISHED' } })).statusCode).toBe(403);
  });

  it('protects file metadata and supports trash/restore', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/files/file-public' })).statusCode).toBe(200);
    const publicContent = await app.inject({ method: 'GET', url: '/api/files/file-public/content' });
    expect(publicContent.statusCode).toBe(200);
    expect(publicContent.body).toBe('guild-guide-bytes');
    expect((await app.inject({ method: 'GET', url: '/api/files/file-members' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/files/file-members/content' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/files/file-cos', headers: { cookie: memberCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/files/file-tech', headers: { cookie: memberCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/admin/files/file-public/recycle', headers: { cookie: adminCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/files/file-public' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/api/admin/files/file-public/restore', headers: { cookie: adminCookie } })).statusCode).toBe(200);
  });

  it('confirms a completed task once and derives contribution from the event', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/member/tasks/task-cos-1/complete', headers: { cookie: memberCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/admin/tasks/task-cos-1/confirm', headers: { cookie: leadCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/admin/tasks/task-cos-1/confirm', headers: { cookie: leadCookie } })).statusCode).toBe(409);
    const dashboard = await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: adminCookie } });
    const member = dashboard.json().data.contributions.find((entry: { userId: string }) => entry.userId === 'user-member');
    expect(member.points).toBeGreaterThanOrEqual(18);
  });
});
