import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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

  it('allows a production-seeded persistent database to restart safely', async () => {
    const root = await mkdtemp('D:/Temp/guild-production-restart-');
    const { sqlite } = await openDatabase(`${root}/guild.sqlite`);
    try {
      const options = { production: true, adminPassword: 'ProductionAdmin!2026' };
      await seedDatabase(sqlite, options);
      await expect(seedDatabase(sqlite, options)).resolves.toBeUndefined();
      expect((sqlite.prepare("SELECT email FROM users WHERE username='admin'").get() as { email: string }).email).not.toBe('admin@guild.example');
    } finally {
      sqlite.close();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('creates the six real department chat channels for a production database', async () => {
    const root = await mkdtemp('D:/Temp/guild-production-channels-');
    const { sqlite } = await openDatabase(`${root}/guild.sqlite`);
    try {
      await seedDatabase(sqlite, { production: true, adminPassword: 'ProductionAdmin!2026' });
      const channels = sqlite.prepare("SELECT department_id,title FROM conversations WHERE type='DEPARTMENT' ORDER BY department_id").all();
      expect(channels).toHaveLength(6);
      expect(channels).toEqual(expect.arrayContaining([
        { department_id: 'dept-tech', title: '技术部协作频道' },
        { department_id: 'dept-original', title: '原创部协作频道' },
      ]));
    } finally {
      sqlite.close();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('backfills homepage mock data when an existing development database is upgraded', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      sqlite.exec("DELETE FROM announcements; DELETE FROM site_settings WHERE key IN ('guildLevel','guildLevelCurrent','guildLevelTarget','honorCount','foundedYear'); DELETE FROM activities WHERE id LIKE 'activity-archive-%';");
      await seedDatabase(sqlite);
      expect((sqlite.prepare('SELECT COUNT(*) count FROM announcements').get() as { count: number }).count).toBe(4);
      expect((sqlite.prepare("SELECT COUNT(*) count FROM activities WHERE status IN ('ENDED','ARCHIVED')").get() as { count: number }).count).toBe(328);
      expect((sqlite.prepare("SELECT value FROM site_settings WHERE key='foundedYear'").get() as { value: string }).value).toBe('1999');
    });
  });

  it('migrates and seeds mature member profiles and guild conversations', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      const userColumns = sqlite.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>;
      expect(userColumns.map((column) => column.name)).toEqual(expect.arrayContaining([
        'guild_title', 'college', 'grade', 'skills', 'interests', 'avatar_color', 'profile_visibility', 'last_seen_at',
      ]));
      expect((sqlite.prepare("SELECT COUNT(*) count FROM conversations WHERE type='DEPARTMENT'").get() as { count: number }).count).toBe(6);
      expect((sqlite.prepare('SELECT COUNT(*) count FROM conversation_participants').get() as { count: number }).count).toBeGreaterThanOrEqual(3);
      expect((sqlite.prepare('SELECT COUNT(*) count FROM messages').get() as { count: number }).count).toBeGreaterThanOrEqual(6);
      expect((sqlite.prepare("SELECT COUNT(*) count FROM works WHERE user_id='user-lead' AND status='PUBLISHED'").get() as { count: number }).count).toBeGreaterThanOrEqual(2);
      expect((sqlite.prepare("SELECT COUNT(*) count FROM activity_registrations WHERE user_id='user-lead' AND checked_in_at IS NOT NULL").get() as { count: number }).count).toBeGreaterThanOrEqual(1);
      expect((sqlite.prepare("SELECT COUNT(*) count FROM audit_logs WHERE target_user_id='user-lead'").get() as { count: number }).count).toBeGreaterThanOrEqual(3);
      const profile = sqlite.prepare("SELECT guild_title,skills,profile_visibility FROM users WHERE id='user-member'").get() as { guild_title: string; skills: string; profile_visibility: string };
      expect(profile.guild_title).toBe('幻装见习生');
      expect(JSON.parse(profile.skills)).toContain('角色塑造');
      expect(profile.profile_visibility).toBe('MEMBERS');
    });
  });

  it('assigns every seed account a unique five-digit UID and permits later custom IDs', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      const counts = sqlite.prepare("SELECT COUNT(*) total,COUNT(DISTINCT uid) unique_uids,SUM(CASE WHEN length(uid)=5 AND uid NOT GLOB '*[^0-9]*' THEN 1 ELSE 0 END) valid_uids FROM users").get() as { total: number; unique_uids: number; valid_uids: number };
      expect(counts).toEqual({ total: 112, unique_uids: 112, valid_uids: 112 });
      const adminUid = (sqlite.prepare("SELECT uid FROM users WHERE id='user-admin'").get() as { uid: string }).uid;
      expect(() => sqlite.prepare("UPDATE users SET uid=? WHERE id='user-member'").run(adminUid)).toThrow();
      expect(() => sqlite.prepare("UPDATE users SET uid='ABC12' WHERE id='user-member'").run()).not.toThrow();
    });
  });

  it('migrates and backfills multi-department membership records', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      const applicationDepartments = sqlite.prepare("SELECT department_id FROM application_departments WHERE application_id='application-history'").all() as Array<{ department_id: string }>;
      const memberDepartments = sqlite.prepare("SELECT department_id,is_primary FROM user_departments WHERE user_id='user-member'").all() as Array<{ department_id: string; is_primary: number }>;
      expect(applicationDepartments).toEqual([{ department_id: 'dept-publicity' }]);
      expect(memberDepartments).toEqual([{ department_id: 'dept-cos', is_primary: 1 }]);
    });
  });

  it('migrates the publicity department to 外宣&幻想研 without changing its stable id', async () => {
    await withDevelopmentSeed(async (sqlite) => {
      const department = sqlite.prepare("SELECT id,slug,name,description FROM departments WHERE id='dept-publicity'").get() as { id: string; slug: string; name: string; description: string };
      const conversation = sqlite.prepare("SELECT title FROM conversations WHERE department_id='dept-publicity'").get() as { title: string };
      expect(department).toMatchObject({ id: 'dept-publicity', slug: 'publicity', name: '外宣&幻想研' });
      expect(department.description).toContain('动漫文化研究');
      expect(conversation.title).toBe('外宣&幻想研协作频道');
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
    await mkdir(`${root}/web`, { recursive: true });
    await writeFile(`${root}/web/index.html`, '<!doctype html><title>Adventurer Guild</title><div id="root"></div>');
    app = await createApp({
      databasePath: `${root}/guild.sqlite`,
      uploadRoot: `${root}/uploads`,
      webRoot: `${root}/web`,
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
    expect(summary.json().data).toMatchObject({ memberCount: 112, departmentCount: 6 });
    const departments = await app.inject({ method: 'GET', url: '/api/public/departments' });
    expect(departments.json().data.items).toHaveLength(6);
    expect(departments.json().data.items.map((item: { name: string; title: string }) => [item.name, item.title])).toEqual([
      ['COS部', '幻术师'], ['技术部', '魔导工程师'], ['轻音部', '吟游诗人'],
      ['原创部', '绘卷术士'], ['舞装部', '舞刃使'], ['外宣&幻想研', '传令官'],
    ]);
    expect(departments.json().data.items.map((item: { description: string }) => item.description)).toEqual([
      '角色造型、服装道具与舞台呈现', '摄影摄像、直播与活动技术支持', '乐队排练、歌曲编排与现场演出',
      '绘画、设定创作与社团原创企划', '宅舞排练、舞台编排与演出', '宣传运营、影像记录与动漫文化研究',
    ]);
    const activities = await app.inject({ method: 'GET', url: '/api/public/activities' });
    expect(activities.json().data.items.every((activity: Record<string, unknown>) => !('check_in_code' in activity) && !('checkInCode' in activity))).toBe(true);
  });

  it('serves database-derived homepage stats and only published announcements', async () => {
    const home = await app.inject({ method: 'GET', url: '/api/public/home' });
    expect(home.statusCode).toBe(200);
    expect(home.json().data.stats).toEqual({
      guildLevel: 12,
      levelProgress: { current: 2390, target: 3000 },
      memberCount: 112,
      onlineCount: 3,
      completedActivityCount: 328,
      honorCount: 56,
      foundedYear: 1999,
    });
    expect(home.json().data.announcements).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: '2026 秋季招新现已开启', category: 'RECRUITMENT', href: '/join' }),
    ]));
    expect(home.json().data.announcements.every((item: { published: boolean }) => item.published)).toBe(true);
  });

  it('migrates an existing founded year setting to the verified 1999 value', async () => {
    const migrationRoot = await mkdtemp('D:/Temp/guild-founded-year-');
    const databasePath = `${migrationRoot}/guild.sqlite`;
    const first = await openDatabase(databasePath);
    try {
      await seedDatabase(first.sqlite);
      first.sqlite.prepare("UPDATE site_settings SET value='2018' WHERE key='foundedYear'").run();
      first.sqlite.prepare("DELETE FROM __migrations WHERE name='0023_foundation_year_1999'").run();
    } finally {
      first.sqlite.close();
    }
    const reopened = await openDatabase(databasePath);
    try {
      expect((reopened.sqlite.prepare("SELECT value FROM site_settings WHERE key='foundedYear'").get() as { value: string }).value).toBe('1999');
    } finally {
      reopened.sqlite.close();
      await rm(migrationRoot, { recursive: true, force: true });
    }
  });

  it('counts active multi-department memberships in both department endpoints', async () => {
    const database = await openDatabase(`${root}/guild.sqlite`);
    try {
      database.sqlite.prepare("INSERT OR IGNORE INTO user_departments(user_id,department_id,is_primary,joined_at) VALUES ('user-member','dept-tech',0,?)").run(new Date().toISOString());
      const expected = (database.sqlite.prepare(`SELECT COUNT(DISTINCT ud.user_id) count FROM user_departments ud
        JOIN users u ON u.id=ud.user_id WHERE ud.department_id='dept-tech' AND u.is_active=1`).get() as { count: number }).count;
      const departments = await app.inject({ method: 'GET', url: '/api/public/departments' });
      const detail = await app.inject({ method: 'GET', url: '/api/public/departments/tech' });
      expect(departments.json().data.items.find((item: { id: string }) => item.id === 'dept-tech').memberCount).toBe(expected);
      expect(detail.json().data.department.memberCount).toBe(expected);
    } finally {
      database.sqlite.prepare("DELETE FROM user_departments WHERE user_id='user-member' AND department_id='dept-tech'").run();
      database.sqlite.close();
    }
  });

  it('serves a public announcement archive and individual published details', async () => {
    const archive = await app.inject({ method: 'GET', url: '/api/public/announcements?page=1&pageSize=20' });
    expect(archive.statusCode).toBe(200);
    expect(archive.json().data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'announcement-recruitment-2026', title: '2026 秋季招新现已开启', published: true }),
    ]));

    const detail = await app.inject({ method: 'GET', url: '/api/public/announcements/announcement-recruitment-2026' });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().data.announcement).toMatchObject({
      id: 'announcement-recruitment-2026',
      summary: '社员申请现已开放，可同时选择多个感兴趣的部门。',
      href: '/join',
    });

    const missing = await app.inject({ method: 'GET', url: '/api/public/announcements/not-published' });
    expect(missing.statusCode).toBe(404);
  });

  it('closes the admin announcement publish and unpublish workflow', async () => {
    const payload = {
      title: '六部门联合成果展开放预约',
      summary: '年度成果展将在星门大厅集中呈现。',
      category: 'ACTIVITY',
      href: '/activities',
      pinned: true,
      published: true,
      publishedAt: '2026-08-08T08:00:00.000Z',
    };
    expect((await app.inject({ method: 'POST', url: '/api/admin/announcements', payload })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/admin/announcements', headers: { cookie: memberCookie }, payload })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/admin/announcements', headers: { cookie: adminCookie }, payload: { ...payload, href: 'https://example.com' } })).statusCode).toBe(400);

    const created = await app.inject({ method: 'POST', url: '/api/admin/announcements', headers: { cookie: adminCookie }, payload });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id as string;

    const adminList = await app.inject({ method: 'GET', url: '/api/admin/announcements?page=1&pageSize=100', headers: { cookie: adminCookie } });
    expect(adminList.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ id, title: payload.title, published: 1 })]));
    const publicAfterCreate = await app.inject({ method: 'GET', url: '/api/public/home' });
    expect(publicAfterCreate.json().data.announcements).toEqual(expect.arrayContaining([expect.objectContaining({ id, title: payload.title })]));

    const unpublished = await app.inject({ method: 'PATCH', url: `/api/admin/announcements/${id}`, headers: { cookie: adminCookie }, payload: { published: false } });
    expect(unpublished.statusCode).toBe(200);
    const publicAfterUnpublish = await app.inject({ method: 'GET', url: '/api/public/home' });
    expect(publicAfterUnpublish.json().data.announcements.some((item: { id: string }) => item.id === id)).toBe(false);

    const audit = await app.inject({ method: 'GET', url: '/api/admin/audit-log?page=1&pageSize=100', headers: { cookie: adminCookie } });
    expect(audit.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'ANNOUNCEMENT_UPDATED', entity_id: id })]));
  });

  it('serves the production web app without masking unknown API routes', async () => {
    expect((await app.inject({ method: 'GET', url: '/' })).body).toContain('Adventurer Guild');
    expect((await app.inject({ method: 'GET', url: '/member/profile' })).body).toContain('Adventurer Guild');
    const missingApi = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(missingApi.statusCode).toBe(404);
    expect(missingApi.json()).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });

  it('returns database-derived dashboard and chart series', async () => {
    const dashboard = await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: adminCookie } });
    expect(dashboard.json().data).toMatchObject({
      members: 112,
      pendingApplications: expect.any(Number),
      activeActivities: expect.any(Number),
      publishedWorks: expect.any(Number),
    });
    const analytics = await app.inject({ method: 'GET', url: '/api/admin/analytics', headers: { cookie: adminCookie } });
    expect(analytics.json().data.departmentActivity).toHaveLength(6);
    expect(analytics.json().data.departmentActivity[0]).toEqual(expect.objectContaining({ departmentName: expect.any(String), score: expect.any(Number) }));
    expect(analytics.json().data.memberGrowth.length).toBeGreaterThan(0);
  });

  it('supports login, me, logout and rejects missing/insufficient authority', async () => {
    const anonymousSession = await app.inject({ method: 'GET', url: '/api/auth/session' });
    expect(anonymousSession.statusCode).toBe(200);
    expect(anonymousSession.json().data).toEqual({ user: null });
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } });
    expect(me.json().data.user).toMatchObject({ username: 'cos.member', role: 'MEMBER', uid: expect.stringMatching(/^\d{5}$/) });
    const expectedRoles = [
      ['admin', 'DemoAdmin!2026', 'PRESIDENT'],
      ['vice.president', 'DemoVice!2026', 'VICE_PRESIDENT'],
      ['vice.president2', 'DemoVice2!2026', 'VICE_PRESIDENT'],
      ['vice.president3', 'DemoVice3!2026', 'VICE_PRESIDENT'],
      ['vice.president4', 'DemoVice4!2026', 'VICE_PRESIDENT'],
      ['vice.president5', 'DemoVice5!2026', 'VICE_PRESIDENT'],
      ['cos.lead', 'DemoLead!2026', 'DEPARTMENT_HEAD'],
      ['cos.deputy', 'DemoDeputy!2026', 'DEPARTMENT_ADMIN'],
      ['cos.member', 'DemoMember!2026', 'MEMBER'],
    ] as const;
    for (const [username, password, role] of expectedRoles) {
      const cookie = await login(app, username, password);
      const session = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
      expect(session.json().data.user).toMatchObject({ username, role, uid: expect.stringMatching(/^\d{5}$/) });
    }
    expect((await app.inject({ method: 'GET', url: '/api/member/profile' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: memberCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/admin/members/user-admin/deactivate', headers: { cookie: adminCookie } })).statusCode).toBe(409);
    const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie: memberCookie } });
    expect(logout.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } })).statusCode).toBe(401);
    memberCookie = await login(app, 'cos.member', 'DemoMember!2026');
  });

  it('lets members change to a unique Chinese username with their current password', async () => {
    const changed = await app.inject({ method: 'PATCH', url: '/api/member/account/username', headers: { cookie: memberCookie }, payload: { username: '星砂成员', currentPassword: 'DemoMember!2026' } });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().data.user).toMatchObject({ username: '星砂成员', uid: expect.stringMatching(/^\d{5}$/) });
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } })).json().data.user.username).toBe('星砂成员');
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/username', headers: { cookie: memberCookie }, payload: { username: 'admin', currentPassword: 'DemoMember!2026' } })).statusCode).toBe(409);
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/username', headers: { cookie: memberCookie }, payload: { username: 'cos.member', currentPassword: 'wrong-password' } })).statusCode).toBe(401);

    const database = await openDatabase(`${root}/guild.sqlite`);
    expect((database.sqlite.prepare("SELECT COUNT(*) count FROM audit_logs WHERE actor_id='user-member' AND action='USERNAME_CHANGED'").get() as { count: number }).count).toBe(1);
    database.sqlite.close();
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/username', headers: { cookie: memberCookie }, payload: { username: 'cos.member', currentPassword: 'DemoMember!2026' } })).statusCode).toBe(200);
  });

  it('changes passwords and revokes other sessions while retaining the current session', async () => {
    const otherCookie = await login(app, 'cos.member', 'DemoMember!2026');
    const changed = await app.inject({ method: 'PATCH', url: '/api/member/account/password', headers: { cookie: memberCookie }, payload: { currentPassword: 'DemoMember!2026', newPassword: 'NewDemoMember!2026' } });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().data.revokedSessions).toBeGreaterThanOrEqual(1);
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: otherCookie } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'cos.member', password: 'DemoMember!2026' } })).statusCode).toBe(401);
    expect(await login(app, 'cos.member', 'NewDemoMember!2026')).toContain('guild_session=');
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/password', headers: { cookie: memberCookie }, payload: { currentPassword: 'wrong-password', newPassword: 'AnotherPass!2026' } })).statusCode).toBe(401);

    const database = await openDatabase(`${root}/guild.sqlite`);
    expect((database.sqlite.prepare("SELECT COUNT(*) count FROM audit_logs WHERE actor_id='user-member' AND action='PASSWORD_CHANGED'").get() as { count: number }).count).toBe(1);
    database.sqlite.close();
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/password', headers: { cookie: memberCookie }, payload: { currentPassword: 'NewDemoMember!2026', newPassword: 'DemoMember!2026' } })).statusCode).toBe(200);
  });

  it('keeps a deputy account and its management role after changing username and password', async () => {
    const deputyCookie = await login(app, 'cos.deputy', 'DemoDeputy!2026');
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/username', headers: { cookie: deputyCookie }, payload: { username: 'COS副部长测试账号', currentPassword: 'DemoDeputy!2026' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/password', headers: { cookie: deputyCookie }, payload: { currentPassword: 'DemoDeputy!2026', newPassword: 'ChangedDeputy!2026' } })).statusCode).toBe(200);

    const reseeded = await openDatabase(`${root}/guild.sqlite`);
    await seedDatabase(reseeded.sqlite);
    reseeded.sqlite.close();

    expect((await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'cos.deputy', password: 'DemoDeputy!2026' } })).statusCode).toBe(401);
    const changedCookie = await login(app, 'COS副部长测试账号', 'ChangedDeputy!2026');
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: changedCookie } })).json().data.user).toMatchObject({ id: 'user-deputy', role: 'DEPARTMENT_ADMIN', departmentId: 'dept-cos' });

    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/username', headers: { cookie: deputyCookie }, payload: { username: 'cos.deputy', currentPassword: 'ChangedDeputy!2026' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'PATCH', url: '/api/member/account/password', headers: { cookie: deputyCookie }, payload: { currentPassword: 'ChangedDeputy!2026', newPassword: 'DemoDeputy!2026' } })).statusCode).toBe(200);
  });

  it('provisions login accounts for every department head and deputy in development', async () => {
    const expectedDepartmentAccounts = [
      ['cos.lead', 'DemoLead!2026', 'DEPARTMENT_HEAD', 'dept-cos'],
      ['cos.deputy', 'DemoDeputy!2026', 'DEPARTMENT_ADMIN', 'dept-cos'],
      ['cos.deputy2', 'DemoDeputy2!2026', 'DEPARTMENT_ADMIN', 'dept-cos'],
      ['cos.deputy3', 'DemoDeputy3!2026', 'DEPARTMENT_ADMIN', 'dept-cos'],
      ['cos.deputy4', 'DemoDeputy4!2026', 'DEPARTMENT_ADMIN', 'dept-cos'],
      ['cos.deputy5', 'DemoDeputy5!2026', 'DEPARTMENT_ADMIN', 'dept-cos'],
      ['tech.lead', 'DemoLead!2026', 'DEPARTMENT_HEAD', 'dept-tech'],
      ['tech.deputy', 'DemoDeputy!2026', 'DEPARTMENT_ADMIN', 'dept-tech'],
      ['tech.deputy2', 'DemoDeputy2!2026', 'DEPARTMENT_ADMIN', 'dept-tech'],
      ['tech.deputy3', 'DemoDeputy3!2026', 'DEPARTMENT_ADMIN', 'dept-tech'],
      ['tech.deputy4', 'DemoDeputy4!2026', 'DEPARTMENT_ADMIN', 'dept-tech'],
      ['tech.deputy5', 'DemoDeputy5!2026', 'DEPARTMENT_ADMIN', 'dept-tech'],
      ['music.lead', 'DemoLead!2026', 'DEPARTMENT_HEAD', 'dept-music'],
      ['music.deputy', 'DemoDeputy!2026', 'DEPARTMENT_ADMIN', 'dept-music'],
      ['music.deputy2', 'DemoDeputy2!2026', 'DEPARTMENT_ADMIN', 'dept-music'],
      ['music.deputy3', 'DemoDeputy3!2026', 'DEPARTMENT_ADMIN', 'dept-music'],
      ['music.deputy4', 'DemoDeputy4!2026', 'DEPARTMENT_ADMIN', 'dept-music'],
      ['music.deputy5', 'DemoDeputy5!2026', 'DEPARTMENT_ADMIN', 'dept-music'],
      ['original.lead', 'DemoLead!2026', 'DEPARTMENT_HEAD', 'dept-original'],
      ['original.deputy', 'DemoDeputy!2026', 'DEPARTMENT_ADMIN', 'dept-original'],
      ['original.deputy2', 'DemoDeputy2!2026', 'DEPARTMENT_ADMIN', 'dept-original'],
      ['original.deputy3', 'DemoDeputy3!2026', 'DEPARTMENT_ADMIN', 'dept-original'],
      ['original.deputy4', 'DemoDeputy4!2026', 'DEPARTMENT_ADMIN', 'dept-original'],
      ['original.deputy5', 'DemoDeputy5!2026', 'DEPARTMENT_ADMIN', 'dept-original'],
      ['dance.lead', 'DemoLead!2026', 'DEPARTMENT_HEAD', 'dept-dance'],
      ['dance.deputy', 'DemoDeputy!2026', 'DEPARTMENT_ADMIN', 'dept-dance'],
      ['dance.deputy2', 'DemoDeputy2!2026', 'DEPARTMENT_ADMIN', 'dept-dance'],
      ['dance.deputy3', 'DemoDeputy3!2026', 'DEPARTMENT_ADMIN', 'dept-dance'],
      ['dance.deputy4', 'DemoDeputy4!2026', 'DEPARTMENT_ADMIN', 'dept-dance'],
      ['dance.deputy5', 'DemoDeputy5!2026', 'DEPARTMENT_ADMIN', 'dept-dance'],
      ['publicity.lead', 'DemoLead!2026', 'DEPARTMENT_HEAD', 'dept-publicity'],
      ['publicity.deputy', 'DemoDeputy!2026', 'DEPARTMENT_ADMIN', 'dept-publicity'],
      ['publicity.deputy2', 'DemoDeputy2!2026', 'DEPARTMENT_ADMIN', 'dept-publicity'],
      ['publicity.deputy3', 'DemoDeputy3!2026', 'DEPARTMENT_ADMIN', 'dept-publicity'],
      ['publicity.deputy4', 'DemoDeputy4!2026', 'DEPARTMENT_ADMIN', 'dept-publicity'],
      ['publicity.deputy5', 'DemoDeputy5!2026', 'DEPARTMENT_ADMIN', 'dept-publicity'],
    ] as const;

    const database = await openDatabase(`${root}/guild.sqlite`);
    const accounts = database.sqlite.prepare(`SELECT username,role,department_id FROM users
      WHERE username IN (${expectedDepartmentAccounts.map(() => '?').join(',')}) ORDER BY username`)
      .all(...expectedDepartmentAccounts.map(([username]) => username));
    database.sqlite.close();
    expect(accounts).toHaveLength(36);

    for (const [username, password, role, departmentId] of expectedDepartmentAccounts) {
      const cookie = await login(app, username, password);
      const session = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
      expect(session.json().data.user).toMatchObject({ username, role, departmentId });
    }
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

  it('allows an explicit insecure cookie override for an HTTP IP preview', async () => {
    const productionRoot = await mkdtemp('D:/Temp/guild-api-http-preview-');
    const productionApp = await createApp({
      databasePath: `${productionRoot}/guild.sqlite`, uploadRoot: `${productionRoot}/uploads`, seed: true,
      sessionSecret: 'production-http-preview-secret-long', adminPassword: 'ProductionAdmin!2026', production: true,
      secureCookies: false,
    });
    try {
      const response = await productionApp.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password: 'ProductionAdmin!2026' } });
      expect(response.statusCode).toBe(200);
      expect(String(response.headers['set-cookie'])).not.toContain('Secure');
    } finally {
      await productionApp.close();
      await rm(productionRoot, { recursive: true, force: true });
    }
  });

  it('adds an authenticated applicant directly to selected departments after approval', async () => {
    const unauthenticated = await app.inject({ method: 'POST', url: '/api/public/applications', payload: {
      displayName: '未登录申请人', email: 'anonymous@example.test', college: '计算机学院', departmentIds: ['dept-tech'], reason: '希望参加社团活动',
    } });
    expect(unauthenticated.statusCode).toBe(401);
    const accountRequest = await app.inject({ method: 'POST', url: '/api/public/registration-requests', payload: {
      username: 'starsand.member', password: 'StrongPass!2026', contact: 'starsand@example.test', note: '准备提交社员申请',
    } });
    expect(accountRequest.statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: `/api/admin/registration-requests/${accountRequest.json().data.id}/approve`, headers: { cookie: adminCookie } })).statusCode).toBe(200);
    const applicantCookie = await login(app, 'starsand.member', 'StrongPass!2026');
    const submitted = await app.inject({ method: 'POST', url: '/api/public/applications', payload: {
      displayName: '星砂同学', email: 'starsand@example.test', college: '计算机学院 2026级', departmentIds: ['dept-tech', 'dept-original'], reason: '希望认识同好并参与社团活动',
    }, headers: { cookie: applicantCookie } });
    expect(submitted.statusCode).toBe(201);
    const { id, statusToken } = submitted.json().data;
    expect(statusToken.length).toBeGreaterThan(30);

    const applications = await app.inject({ method: 'GET', url: '/api/admin/applications?page=1&pageSize=100', headers: { cookie: adminCookie } });
    expect(applications.json().data.items.find((item: { id: string }) => item.id === id)).toMatchObject({
      departmentIds: ['dept-tech', 'dept-original'],
      departmentNames: ['技术部', '原创部'],
    });

    const approved = await app.inject({ method: 'POST', url: `/api/admin/applications/${id}/approve`, headers: { cookie: adminCookie } });
    expect(approved.statusCode).toBe(200);
    const database = await openDatabase(`${root}/guild.sqlite`);
    const approvedDepartments = database.sqlite.prepare(`SELECT ud.department_id,ud.is_primary FROM user_departments ud
      JOIN applications a ON a.user_id=ud.user_id WHERE a.id=? ORDER BY ud.is_primary DESC,ud.rowid`).all(id);
    database.sqlite.close();
    expect(approvedDepartments).toEqual(expect.arrayContaining([
      { department_id: 'dept-tech', is_primary: 1 },
      { department_id: 'dept-original', is_primary: 0 },
    ]));
    const status = await app.inject({ method: 'GET', url: `/api/public/applications/status/${statusToken}` });
    expect(status.json().data).toMatchObject({ status: 'APPROVED' });
    expect(status.json().data).not.toHaveProperty('activationCode');
    const refreshedSession = await app.inject({ method: 'GET', url: '/api/auth/session', headers: { cookie: applicantCookie } });
    expect(refreshedSession.json().data.user.departmentIds).toEqual(expect.arrayContaining(['dept-tech', 'dept-original']));
  });

  it('lets guests request accounts and limits approval data and actions to the president layer', async () => {
    const password = 'GuestStrong!2026';
    const submitted = await app.inject({ method: 'POST', url: '/api/public/registration-requests', payload: {
      username: '星砂访客', password, contact: '13800000001', note: '校内动漫爱好者，希望加入线上交流。',
    } });
    expect(submitted.statusCode).toBe(201);
    const requestId = submitted.json().data.id as string;

    const database = await openDatabase(`${root}/guild.sqlite`);
    const stored = database.sqlite.prepare('SELECT username,password_hash,contact,note,status FROM registration_requests WHERE id=?').get(requestId) as Record<string, string>;
    database.sqlite.close();
    expect(stored).toMatchObject({ username: '星砂访客', contact: '13800000001', note: '校内动漫爱好者，希望加入线上交流。', status: 'PENDING' });
    expect(stored.password_hash).not.toBe(password);
    expect(stored.password_hash).toMatch(/^scrypt\$/);

    expect((await app.inject({ method: 'GET', url: '/api/admin/registration-requests', headers: { cookie: memberCookie } })).statusCode).toBe(403);
    const presidentList = await app.inject({ method: 'GET', url: '/api/admin/registration-requests?page=1&pageSize=100', headers: { cookie: adminCookie } });
    const visible = presidentList.json().data.items.find((item: { id: string }) => item.id === requestId);
    expect(visible).toMatchObject({ username: '星砂访客', contact: '13800000001', note: '校内动漫爱好者，希望加入线上交流。', status: 'PENDING' });
    expect(visible).not.toHaveProperty('password_hash');
    expect(visible).not.toHaveProperty('passwordHash');

    const registrationViceCookie = await login(app, 'vice.president2', 'DemoVice2!2026');
    expect((await app.inject({ method: 'GET', url: '/api/admin/registration-requests', headers: { cookie: registrationViceCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: `/api/admin/registration-requests/${requestId}/approve`, headers: { cookie: registrationViceCookie } })).statusCode).toBe(200);
    expect(await login(app, '星砂访客', password)).toContain('guild_session=');

    const rejected = await app.inject({ method: 'POST', url: '/api/public/registration-requests', payload: {
      username: 'guest.beta', password: 'OtherStrong!2026', contact: '13800000002', note: '',
    } });
    expect(rejected.statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: `/api/admin/registration-requests/${rejected.json().data.id}/reject`, headers: { cookie: registrationViceCookie } })).statusCode).toBe(200);
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

  it('lets the owning lead save an activity result summary before archive', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/admin/activities/activity-live/state', headers: { cookie: leadCookie }, payload: { status: 'ENDED' } })).statusCode).toBe(200);
    const update = await app.inject({ method: 'PUT', url: '/api/admin/activities/activity-live', headers: { cookie: leadCookie }, payload: { resultSummary: '活动成果资料与复盘已整理' } });
    expect(update.statusCode).toBe(200);
    const archived = await app.inject({ method: 'POST', url: '/api/admin/activities/activity-live/state', headers: { cookie: leadCookie }, payload: { status: 'ARCHIVED' } });
    expect(archived.statusCode).toBe(200);
    expect(archived.json().data.status).toBe('ARCHIVED');
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

  it('routes hierarchy changes through the invariant-preserving endpoints', async () => {
    expect((await app.inject({ method: 'PATCH', url: '/api/admin/members/user-member', headers: { cookie: adminCookie }, payload: { role: 'DEPARTMENT_HEAD' } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PATCH', url: '/api/admin/members/user-lead', headers: { cookie: adminCookie }, payload: { departmentId: 'dept-tech' } })).statusCode).toBe(403);
  });

  it('lets the president appoint and revoke a department deputy', async () => {
    const appointed = await app.inject({ method: 'POST', url: '/api/admin/roles/user-member/assign', headers: { cookie: adminCookie }, payload: { role: 'DEPARTMENT_ADMIN', departmentId: 'dept-cos' } });
    expect(appointed.statusCode).toBe(201);
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } })).json().data.user).toMatchObject({ role: 'DEPARTMENT_ADMIN', departmentId: 'dept-cos' });
    expect((await app.inject({ method: 'POST', url: '/api/admin/roles/user-member/revoke', headers: { cookie: adminCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: memberCookie } })).json().data.user.role).toBe('MEMBER');
  });

  it('enforces the four-level delegation tree and allows multiple department admins', async () => {
    for (const id of ['user-fiction-007', 'user-fiction-013']) {
      const granted = await app.inject({ method: 'POST', url: `/api/admin/roles/${id}/assign`, headers: { cookie: leadCookie }, payload: { role: 'DEPARTMENT_ADMIN', departmentId: 'dept-cos' } });
      expect(granted.statusCode).toBe(201);
    }
    const hierarchy = await app.inject({ method: 'GET', url: '/api/admin/role-hierarchy', headers: { cookie: leadCookie } });
    expect(hierarchy.statusCode).toBe(200);
    expect(hierarchy.json().data.items.filter((item: { role: string }) => item.role === 'DEPARTMENT_ADMIN')).toHaveLength(7);
    expect((await app.inject({ method: 'POST', url: '/api/admin/roles/user-fiction-008/assign', headers: { cookie: leadCookie }, payload: { role: 'DEPARTMENT_ADMIN', departmentId: 'dept-tech' } })).statusCode).toBe(403);
    for (const id of ['user-fiction-007', 'user-fiction-013']) {
      expect((await app.inject({ method: 'POST', url: `/api/admin/roles/${id}/revoke`, headers: { cookie: leadCookie } })).statusCode).toBe(200);
    }

    const executiveHierarchy = await app.inject({ method: 'GET', url: '/api/admin/role-hierarchy', headers: { cookie: adminCookie } });
    expect(executiveHierarchy.json().data.limits.vicePresidents).toBe(5);
    expect(executiveHierarchy.json().data.items.filter((item: { role: string }) => item.role === 'VICE_PRESIDENT')).toHaveLength(5);
    expect((await app.inject({ method: 'POST', url: '/api/admin/roles/user-fiction-014/assign', headers: { cookie: adminCookie }, payload: { role: 'VICE_PRESIDENT' } })).json().error.code).toBe('VICE_PRESIDENT_LIMIT');

    const secondViceCookie = await login(app, 'vice.president2', 'DemoVice2!2026');
    const appointed = await app.inject({ method: 'POST', url: '/api/admin/roles/user-fiction-019/assign', headers: { cookie: secondViceCookie }, payload: { role: 'DEPARTMENT_HEAD', departmentId: 'dept-cos' } });
    expect(appointed.statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: '/api/admin/roles/user-fiction-014/assign', headers: { cookie: secondViceCookie }, payload: { role: 'VICE_PRESIDENT' } })).statusCode).toBe(403);

    expect((await app.inject({ method: 'POST', url: '/api/admin/roles/user-fiction-019/revoke', headers: { cookie: adminCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/admin/departments/dept-cos/leader', headers: { cookie: adminCookie }, payload: { userId: 'user-lead' } })).statusCode).toBe(200);
  });

  it('provides a paged and department-scoped work review queue', async () => {
    const adminAll = await app.inject({ method: 'GET', url: '/api/admin/works?page=1&pageSize=1', headers: { cookie: adminCookie } });
    expect(adminAll.statusCode).toBe(200);
    expect(adminAll.json().data).toMatchObject({ page: 1, pageSize: 1, total: 4 });
    expect(adminAll.json().data.items).toHaveLength(1);

    const adminPending = await app.inject({ method: 'GET', url: '/api/admin/works?status=PENDING', headers: { cookie: adminCookie } });
    expect(adminPending.json().data.items.map((work: { id: string }) => work.id)).toEqual(['work-tech-pending']);
    const leadAll = await app.inject({ method: 'GET', url: '/api/admin/works', headers: { cookie: leadCookie } });
    expect(leadAll.json().data).toMatchObject({ page: 1, pageSize: 20, total: 3 });
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
    expect(memberFiles.json().data).toMatchObject({ page: 2, pageSize: 2, total: 6 });
    expect(memberFiles.json().data.items).toHaveLength(2);

    const adminFiles = await app.inject({ method: 'GET', url: '/api/admin/files?page=2&pageSize=2', headers: { cookie: adminCookie } });
    expect(adminFiles.json().data).toMatchObject({ page: 2, pageSize: 2, total: 8 });
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
      departmentId: 'dept-cos', title: '幻装小队筹备会', location: '星门大厅东侧', capacity: 12, startsAt: '2026-09-10T10:00:00.000Z',
    } });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id;
    const detail = await app.inject({ method: 'GET', url: `/api/admin/activities/${id}`, headers: { cookie: leadCookie } });
    expect(detail.json().data.activity.location).toBe('星门大厅东侧');
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

  it('accepts a real member work file and keeps its media member-only', async () => {
    const boundary = '----guild-work-boundary';
    const body = Buffer.from([
      `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\n星灯舞台摄影\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\n现场作品记录\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="stage.jpg"\r\nContent-Type: image/jpeg\r\n\r\nimage-bytes\r\n`,
      `--${boundary}--\r\n`,
    ].join(''));
    const created = await app.inject({ method: 'POST', url: '/api/member/works/upload', headers: { cookie: memberCookie, 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: body });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.work).toMatchObject({ title: '星灯舞台摄影', status: 'PENDING', fileId: expect.any(String) });
    const fileId = created.json().data.work.fileId;
    expect((await app.inject({ method: 'GET', url: `/api/files/${fileId}/content` })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: `/api/files/${fileId}/content`, headers: { cookie: memberCookie } })).body).toBe('image-bytes');
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
    expect((await app.inject({ method: 'GET', url: '/api/files/file-photo-anniversary/content' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/files/file-photo-anniversary/content', headers: { cookie: memberCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/admin/files/file-public/recycle', headers: { cookie: adminCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/files/file-public' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/api/admin/files/file-public/restore', headers: { cookie: adminCookie } })).statusCode).toBe(200);
  });

  it('stores multipart uploads under generated keys and serves them through authorization', async () => {
    const boundary = '----guild-integration-boundary';
    const body = Buffer.from([
      `--${boundary}\r\nContent-Disposition: form-data; name="visibility"\r\n\r\nMEMBERS\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="departmentId"\r\n\r\ndept-cos\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nPLAN\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="作战手册.txt"\r\nContent-Type: text/plain\r\n\r\n真实文件内容\r\n`,
      `--${boundary}--\r\n`,
    ].join(''));
    const uploaded = await app.inject({
      method: 'POST', url: '/api/admin/files/upload', headers: { cookie: leadCookie, 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: body,
    });
    expect(uploaded.statusCode).toBe(201);
    expect(uploaded.json().data).toMatchObject({ name: '作战手册.txt', visibility: 'MEMBERS', category: 'PLAN' });
    const fileId = uploaded.json().data.id;
    const renamed = await app.inject({ method: 'PATCH', url: `/api/admin/files/${fileId}`, headers: { cookie: leadCookie }, payload: { name: '新版作战手册.txt', category: 'HISTORY' } });
    expect(renamed.statusCode).toBe(200);
    const metadata = await app.inject({ method: 'GET', url: `/api/files/${fileId}`, headers: { cookie: memberCookie } });
    expect(metadata.json().data.file).toMatchObject({ name: '新版作战手册.txt', category: 'HISTORY' });
    const content = await app.inject({ method: 'GET', url: `/api/files/${fileId}/content`, headers: { cookie: memberCookie } });
    expect(content.statusCode).toBe(200);
    expect(content.body).toBe('真实文件内容');
    expect(uploaded.json().data.storageKey).not.toContain('作战手册');
  });

  it('links a real result file to an ended activity before archive', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/admin/activities', headers: { cookie: leadCookie }, payload: {
      departmentId: 'dept-cos', title: '成果文件验收会', location: '星门大厅', capacity: 10, startsAt: '2026-10-01T10:00:00.000Z',
    } });
    const id = created.json().data.id;
    for (const status of ['REGISTRATION', 'IN_PROGRESS', 'ENDED']) {
      expect((await app.inject({ method: 'POST', url: `/api/admin/activities/${id}/state`, headers: { cookie: leadCookie }, payload: { status } })).statusCode).toBe(200);
    }
    const boundary = '----guild-result-boundary';
    const body = Buffer.from([
      `--${boundary}\r\nContent-Disposition: form-data; name="summary"\r\n\r\n舞台成果记录\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="result.txt"\r\nContent-Type: text/plain\r\n\r\nactivity result bytes\r\n`,
      `--${boundary}--\r\n`,
    ].join(''));
    const uploaded = await app.inject({ method: 'POST', url: `/api/admin/activities/${id}/results/upload`, headers: { cookie: leadCookie, 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: body });
    expect(uploaded.statusCode).toBe(201);
    expect(uploaded.json().data).toMatchObject({ activityId: id, fileId: expect.any(String), summary: '舞台成果记录' });
    expect((await app.inject({ method: 'POST', url: `/api/admin/activities/${id}/state`, headers: { cookie: leadCookie }, payload: { status: 'ARCHIVED' } })).statusCode).toBe(200);
  });

  it('confirms a completed task once and derives contribution from the event', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/member/tasks/task-cos-1/complete', headers: { cookie: memberCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/admin/tasks/task-cos-1/confirm', headers: { cookie: leadCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/admin/tasks/task-cos-1/confirm', headers: { cookie: leadCookie } })).statusCode).toBe(409);
    const dashboard = await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: adminCookie } });
    const member = dashboard.json().data.contributions.find((entry: { userId: string }) => entry.userId === 'user-member');
    expect(member.points).toBeGreaterThanOrEqual(18);
    const contributions = await app.inject({ method: 'GET', url: '/api/member/contributions', headers: { cookie: memberCookie } });
    expect(contributions.statusCode).toBe(200);
    expect(contributions.json().data.points).toBe(member.points);
    expect(contributions.json().data.events).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'TASK_CONFIRMED', points: 5 })]));
  });

  it('publishes privacy-aware member homepages and an authenticated directory', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/member/directory' })).statusCode).toBe(401);
    const updated = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: {
      displayName: '白羽见习者', bio: '负责幻装协作与活动记录', guildTitle: '幻装见习生', college: '艺术设计学院', grade: '2025级',
      skills: ['角色塑造', '道具整理'], interests: ['动画', '摄影'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS',
    } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.profile).toMatchObject({ displayName: '白羽见习者', guildTitle: '幻装见习生', skills: ['角色塑造', '道具整理'] });
    const directory = await app.inject({ method: 'GET', url: '/api/member/directory?q=白羽', headers: { cookie: leadCookie } });
    expect(directory.statusCode).toBe(200);
    expect(directory.json().data.items).toEqual([expect.objectContaining({ id: 'user-member', guildTitle: '幻装见习生', departmentName: 'COS部' })]);
    const memberUid = directory.json().data.items[0].uid as string;
    expect(memberUid).toMatch(/^\d{5}$/);
    const directoryByUid = await app.inject({ method: 'GET', url: `/api/member/directory?q=${memberUid}`, headers: { cookie: leadCookie } });
    expect(directoryByUid.json().data.items).toEqual([expect.objectContaining({ id: 'user-member', uid: memberUid })]);
    const adminByUid = await app.inject({ method: 'GET', url: `/api/admin/members?q=${memberUid}`, headers: { cookie: adminCookie } });
    expect(adminByUid.json().data.items).toEqual([expect.objectContaining({ id: 'user-member', uid: memberUid })]);
    const homepage = await app.inject({ method: 'GET', url: '/api/member/profiles/user-member', headers: { cookie: leadCookie } });
    expect(homepage.statusCode).toBe(200);
    expect(homepage.json().data.profile).toMatchObject({ displayName: '白羽见习者', skills: ['角色塑造', '道具整理'] });
    expect(homepage.json().data.stats).toMatchObject({ publishedWorks: expect.any(Number), attendedActivities: expect.any(Number), contributionPoints: expect.any(Number) });

    expect((await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { profileVisibility: 'PRIVATE' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/member/profiles/user-member', headers: { cookie: leadCookie } })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/api/member/profiles/user-member', headers: { cookie: adminCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { profileVisibility: 'MEMBERS' } })).statusCode).toBe(200);
  });

  it('lets every member change their unique ID and upload a profile avatar', async () => {
    const changed = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { uid: '白羽_2026' } });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().data.profile.uid).toBe('白羽_2026');
    const duplicate = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: leadCookie }, payload: { uid: '白羽_2026' } });
    expect(duplicate.statusCode).toBe(409);

    const boundary = '----guild-avatar-boundary';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\n`),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const uploaded = await app.inject({ method: 'POST', url: '/api/member/profile/avatar', headers: { cookie: memberCookie, 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: body });
    expect(uploaded.statusCode).toBe(201);
    const avatarUrl = uploaded.json().data.avatarUrl as string;
    expect(avatarUrl).toContain('/api/public/avatars/user-member');
    const avatar = await app.inject({ method: 'GET', url: avatarUrl });
    expect(avatar.statusCode).toBe(200);
    expect(avatar.headers['content-type']).toContain('image/png');
  });

  it('closes direct and department chat with unread, reply, edit, delete, and ownership rules', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/member/conversations', headers: { cookie: memberCookie } });
    expect(list.statusCode).toBe(200);
    expect(list.json().data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'conversation-dept-cos', type: 'DEPARTMENT' }),
      expect.objectContaining({ id: 'conversation-demo-direct', type: 'DIRECT', unreadCount: expect.any(Number) }),
    ]));

    const direct = await app.inject({ method: 'POST', url: '/api/member/conversations/direct', headers: { cookie: memberCookie }, payload: { userId: 'user-lead' } });
    const duplicate = await app.inject({ method: 'POST', url: '/api/member/conversations/direct', headers: { cookie: memberCookie }, payload: { userId: 'user-lead' } });
    expect(direct.statusCode).toBe(200);
    expect(duplicate.json().data.conversation.id).toBe(direct.json().data.conversation.id);
    expect((await app.inject({ method: 'GET', url: '/api/member/conversations/conversation-demo-direct/messages', headers: { cookie: adminCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/member/conversations/conversation-demo-direct/messages', headers: { cookie: memberCookie }, payload: { content: '   ' } })).statusCode).toBe(400);

    const sent = await app.inject({ method: 'POST', url: '/api/member/conversations/conversation-demo-direct/messages', headers: { cookie: memberCookie }, payload: {
      content: '尺寸表已上传，请查收。', replyToId: 'message-direct-02',
    } });
    expect(sent.statusCode).toBe(201);
    const messageId = sent.json().data.message.id as string;
    const leadList = await app.inject({ method: 'GET', url: '/api/member/conversations', headers: { cookie: leadCookie } });
    expect(leadList.json().data.items.find((item: { id: string }) => item.id === 'conversation-demo-direct').unreadCount).toBeGreaterThan(0);
    const history = await app.inject({ method: 'GET', url: '/api/member/conversations/conversation-demo-direct/messages?pageSize=2', headers: { cookie: leadCookie } });
    expect(history.statusCode).toBe(200);
    expect(history.json().data.items).toHaveLength(2);
    expect(history.json().data.hasMore).toBe(true);
    expect((await app.inject({ method: 'POST', url: '/api/member/conversations/conversation-demo-direct/read', headers: { cookie: leadCookie } })).statusCode).toBe(200);
    const cleared = await app.inject({ method: 'GET', url: '/api/member/conversations', headers: { cookie: leadCookie } });
    expect(cleared.json().data.items.find((item: { id: string }) => item.id === 'conversation-demo-direct').unreadCount).toBe(0);

    expect((await app.inject({ method: 'PATCH', url: `/api/member/messages/${messageId}`, headers: { cookie: leadCookie }, payload: { content: '越权修改' } })).statusCode).toBe(403);
    const edited = await app.inject({ method: 'PATCH', url: `/api/member/messages/${messageId}`, headers: { cookie: memberCookie }, payload: { content: '尺寸表与清单均已上传。' } });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().data.message).toMatchObject({ content: '尺寸表与清单均已上传。', editedAt: expect.any(String) });
    expect((await app.inject({ method: 'DELETE', url: `/api/member/messages/${messageId}`, headers: { cookie: leadCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'DELETE', url: `/api/member/messages/${messageId}`, headers: { cookie: memberCookie } })).statusCode).toBe(200);
    const afterDelete = await app.inject({ method: 'GET', url: '/api/member/conversations/conversation-demo-direct/messages?pageSize=20', headers: { cookie: memberCookie } });
    expect(afterDelete.json().data.items.find((item: { id: string }) => item.id === messageId).content).toBe('消息已撤回');
  });
});

describe.sequential('Guild tavern, resonance match and announcement content', () => {
  let app: FastifyInstance;
  let root: string;
  let adminCookie: string;
  let viceCookie: string;
  let leadCookie: string;
  let techLeadCookie: string;
  let memberCookie: string;

  beforeAll(async () => {
    root = await mkdtemp(tempRoot);
    app = await createApp({
      databasePath: `${root}/guild.sqlite`,
      uploadRoot: `${root}/uploads`,
      seed: true,
      sessionSecret: 'integration-test-secret-that-is-long',
    });
    adminCookie = await login(app, 'admin', 'DemoAdmin!2026');
    viceCookie = await login(app, 'vice.president', 'DemoVice!2026');
    leadCookie = await login(app, 'cos.lead', 'DemoLead!2026');
    const { sqlite } = await openDatabase(`${root}/guild.sqlite`);
    const leadPassword = sqlite.prepare("SELECT password_hash FROM users WHERE id='user-lead'").get() as { password_hash: string };
    sqlite.prepare("UPDATE users SET username='tech.lead',password_hash=? WHERE id='user-tech-01'").run(leadPassword.password_hash);
    sqlite.close();
    techLeadCookie = await login(app, 'tech.lead', 'DemoLead!2026');
    memberCookie = await login(app, 'cos.member', 'DemoMember!2026');
  });

  afterAll(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });

  it('lets technical department members post guestbook notes and its managers moderate them', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/member/departments/tech/guestbook' })).statusCode).toBe(401);
    const crossDepartment = await app.inject({ method: 'POST', url: '/api/member/departments/tech/guestbook', headers: { cookie: memberCookie }, payload: { content: '跨部门留言' } });
    expect(crossDepartment.statusCode).toBe(403);

    const posted = await app.inject({ method: 'POST', url: '/api/member/departments/tech/guestbook', headers: { cookie: techLeadCookie }, payload: { content: '今晚检查直播机位。' } });
    expect(posted.statusCode).toBe(201);
    const messageId = posted.json().data.message.id as string;

    const edited = await app.inject({ method: 'PATCH', url: `/api/admin/departments/tech/guestbook/${messageId}`, headers: { cookie: techLeadCookie }, payload: { content: '今晚八点检查直播机位。' } });
    expect(edited.statusCode).toBe(200);
    const list = await app.inject({ method: 'GET', url: '/api/member/departments/tech/guestbook', headers: { cookie: memberCookie } });
    expect(list.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: messageId, content: '今晚八点检查直播机位。' })]));

    expect((await app.inject({ method: 'DELETE', url: `/api/admin/departments/tech/guestbook/${messageId}`, headers: { cookie: leadCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'DELETE', url: `/api/admin/departments/tech/guestbook/${messageId}`, headers: { cookie: techLeadCookie } })).statusCode).toBe(200);
  });

  it('shows technical department applicants to its department managers', async () => {
    const submitted = await app.inject({ method: 'POST', url: '/api/public/applications', payload: {
      displayName: '技术申请人', email: 'tech-applicant@example.test', college: '计算机学院', departmentIds: ['dept-tech', 'dept-music'], reason: '希望参加拍摄与后期工作。',
    }, headers: { cookie: memberCookie } });
    expect(submitted.statusCode).toBe(201);
    const applications = await app.inject({ method: 'GET', url: '/api/admin/applications?page=1&pageSize=100', headers: { cookie: techLeadCookie } });
    expect(applications.statusCode).toBe(200);
    expect(applications.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ display_name: '技术申请人', departmentIds: expect.arrayContaining(['dept-tech']) })]));
  });

  it('migrates announcements content, user attributes and tavern seed data', async () => {
    const announcements = await app.inject({ method: 'GET', url: '/api/public/announcements?page=1&pageSize=20' });
    expect(announcements.statusCode).toBe(200);
    const posts = await app.inject({ method: 'GET', url: '/api/member/posts?page=1&pageSize=20', headers: { cookie: memberCookie } });
    expect(posts.statusCode).toBe(200);
    expect(posts.json().data.total).toBeGreaterThanOrEqual(7);
    expect(posts.json().data.items[0]).toMatchObject({ id: 'post-welcome', pinned: true });
    expect(posts.json().data.items[0].author.displayName).toBe('星门总管');
    const directory = await app.inject({ method: 'GET', url: '/api/public/forum/categories' });
    expect(directory.statusCode).toBe(200);
    expect(directory.json().data.groups).toHaveLength(7);
    expect(directory.json().data.groups[0]).toMatchObject({ id: 'guild', slug: 'guild', name: '佐佑动漫社' });
    expect(directory.json().data.groups.find((group: { slug: string }) => group.slug === 'publicity')).toEqual(expect.objectContaining({
      name: '外宣&幻想研', topicCount: expect.any(Number), replyCount: expect.any(Number),
      subboards: expect.arrayContaining([expect.objectContaining({ id: 'subboard-publicity-anime', name: '番剧吐槽', topicCount: expect.any(Number) })]),
    }));
    const topics = await app.inject({ method: 'GET', url: '/api/public/forum/topics?departmentSlug=publicity&page=1&pageSize=20' });
    expect(topics.statusCode).toBe(200);
    expect(topics.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'post-anime-weekly', latestAuthorName: '白羽见习者' })]));
    const homepage = await app.inject({ method: 'GET', url: '/api/public/posts/board' });
    expect(homepage.statusCode).toBe(200);
    expect(homepage.json().data.pinned).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'post-welcome' })]));
    expect(homepage.json().data.latest.length).toBeGreaterThan(0);
  });

  it('persists editable page content and enforces homepage and department scope', async () => {
    const homeConfig = {
      hiddenSectionIds: [],
      hiddenImageUrls: [],
      hiddenPresetIds: [],
      sectionOverrides: [],
      items: [{ id: 'welcome-card', sectionId: 'home-entry', title: '本周活动', body: '欢迎来看看。', imageUrl: null, linkUrl: null }],
      imageLinks: [{ imageUrl: '/assets/example.webp', linkUrl: 'https://example.com/activity' }],
    };
    const adminSave = await app.inject({
      method: 'PUT', url: '/api/admin/page-content/home', headers: { cookie: adminCookie }, payload: homeConfig,
    });
    expect(adminSave.statusCode).toBe(200);
    const publicHome = await app.inject({ method: 'GET', url: '/api/public/page-content/home' });
    expect(publicHome.json().data.config).toEqual(homeConfig);

    const updatedHomeConfig = {
      ...homeConfig,
      hiddenSectionIds: ['home-tavern'],
      items: [{ ...homeConfig.items[0], body: '本周活动安排已经更新。' }],
    };
    expect((await app.inject({
      method: 'PUT', url: '/api/admin/page-content/home', headers: { cookie: adminCookie }, payload: updatedHomeConfig,
    })).statusCode).toBe(200);
    const publicHistory = await app.inject({ method: 'GET', url: '/api/public/page-content/home/history?page=1&pageSize=20' });
    expect(publicHistory.statusCode).toBe(200);
    expect(publicHistory.json().data.total).toBe(2);
    expect(publicHistory.json().data.items[0]).toMatchObject({
      revisionNo: 2,
      changeType: 'UPDATE',
      actor: { displayName: '星门总管' },
      changedSections: expect.arrayContaining([
        expect.objectContaining({ sectionId: 'home-entry', changeKinds: expect.arrayContaining(['ITEMS']) }),
        expect.objectContaining({ sectionId: 'home-tavern', changeKinds: expect.arrayContaining(['VISIBILITY']) }),
      ]),
    });
    const firstRevisionId = publicHistory.json().data.items[1].id as string;
    const historicalSnapshot = await app.inject({ method: 'GET', url: `/api/public/page-content/home/history/${firstRevisionId}` });
    expect(historicalSnapshot.statusCode).toBe(200);
    expect(historicalSnapshot.json().data).toMatchObject({
      pageKey: 'home', config: homeConfig, revision: { id: firstRevisionId, revisionNo: 1, changeType: 'UPDATE' },
    });
    expect((await app.inject({
      method: 'POST', url: `/api/admin/page-content/home/history/${firstRevisionId}/restore`, headers: { cookie: leadCookie },
    })).statusCode).toBe(403);
    const restored = await app.inject({
      method: 'POST', url: `/api/admin/page-content/home/history/${firstRevisionId}/restore`, headers: { cookie: viceCookie },
    });
    expect(restored.statusCode).toBe(200);
    expect(restored.json().data.config).toEqual(homeConfig);
    const historyAfterRestore = await app.inject({ method: 'GET', url: '/api/public/page-content/home/history?page=1&pageSize=20' });
    expect(historyAfterRestore.json().data.items[0]).toMatchObject({
      revisionNo: 3, changeType: 'RESTORE', restoredFromId: firstRevisionId, restoredFromRevisionNo: 1,
    });
    expect((await app.inject({ method: 'GET', url: '/api/public/page-content/home' })).json().data.config).toEqual(homeConfig);

    const musicConfig = {
      hiddenSectionIds: [], hiddenImageUrls: [], hiddenPresetIds: ['preset-music-members-1'], imageLinks: [],
      sectionOverrides: [{ sectionId: 'music-members', title: '乐队成员', subtitle: 'BAND MEMBERS', description: '不同的声音，组成同一个乐队。' }],
      items: [{ id: 'preset-music-members-0', sectionId: 'music-members', title: '小音', body: '负责低音声部。', imageUrl: '/assets/member.webp', linkUrl: null, instrument: '贝斯' }],
    };
    expect((await app.inject({
      method: 'PUT', url: '/api/admin/page-content/department%3Amusic', headers: { cookie: adminCookie }, payload: musicConfig,
    })).statusCode).toBe(200);
    const publicMusic = await app.inject({ method: 'GET', url: '/api/public/page-content/department%3Amusic' });
    expect(publicMusic.json().data.config).toEqual(musicConfig);

    const departmentConfig = {
      hiddenSectionIds: ['cos-henshin'],
      hiddenImageUrls: [],
      hiddenPresetIds: [],
      sectionOverrides: [],
      items: [{ id: 'cos-note', sectionId: 'cos-wardrobe', title: '道具通知', body: '新增展示内容', imageUrl: '/assets/example.webp', linkUrl: null }],
      imageLinks: [],
    };
    expect((await app.inject({
      method: 'PUT', url: '/api/admin/page-content/department%3Acos', headers: { cookie: leadCookie }, payload: departmentConfig,
    })).statusCode).toBe(200);
    const cosHistory = await app.inject({ method: 'GET', url: '/api/public/page-content/department%3Acos/history?page=1&pageSize=20' });
    const cosRevisionId = cosHistory.json().data.items[0].id as string;
    expect((await app.inject({
      method: 'POST', url: `/api/admin/page-content/department%3Acos/history/${cosRevisionId}/restore`, headers: { cookie: leadCookie },
    })).statusCode).toBe(403);
    expect((await app.inject({
      method: 'PUT', url: '/api/admin/page-content/department%3Atech', headers: { cookie: leadCookie }, payload: departmentConfig,
    })).statusCode).toBe(403);
    expect((await app.inject({
      method: 'PUT', url: '/api/admin/page-content/home', headers: { cookie: leadCookie }, payload: homeConfig,
    })).statusCode).toBe(403);
    expect((await app.inject({
      method: 'PUT', url: '/api/admin/page-content/department%3Acos', headers: { cookie: memberCookie }, payload: departmentConfig,
    })).statusCode).toBe(403);
  });

  it('uploads local images for editable pages within the editors scope', async () => {
    const boundary = '----guild-page-image-boundary';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="page.webp"\r\nContent-Type: image/webp\r\n\r\n`),
      Buffer.from('RIFF-test-WEBP'),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const upload = (cookie: string, pageKey: string) => app.inject({ method: 'POST', url: `/api/admin/page-images?pageKey=${encodeURIComponent(pageKey)}`, headers: { cookie, 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: body });
    expect((await upload(memberCookie, 'department:cos')).statusCode).toBe(403);
    expect((await upload(leadCookie, 'department:tech')).statusCode).toBe(403);
    const uploaded = await upload(leadCookie, 'department:cos');
    expect(uploaded.statusCode).toBe(201);
    const imageUrl = uploaded.json().data.image.url as string;
    const publicImage = await app.inject({ method: 'GET', url: imageUrl });
    expect(publicImage.statusCode).toBe(200);
    expect(publicImage.headers['content-type']).toContain('image/webp');
  });

  it('loads Bilibili title and cover data for music-page editors', async () => {
    expect((await app.inject({
      method: 'GET', url: '/api/admin/bilibili-preview?url=https%3A%2F%2Fwww.bilibili.com%2Fvideo%2FBV1XhVn6UED5', headers: { cookie: memberCookie },
    })).statusCode).toBe(403);
    expect((await app.inject({
      method: 'GET', url: '/api/admin/bilibili-preview?url=https%3A%2F%2Fexample.com%2Fvideo%2FBV1XhVn6UED5', headers: { cookie: adminCookie },
    })).statusCode).toBe(400);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      data: {
        bvid: 'BV1XhVn6UED5', title: '轻音部原创曲测试', pic: 'http://i0.hdslb.com/bfs/archive/test.jpg', duration: 241, pubdate: 1788105600,
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    try {
      const response = await app.inject({
        method: 'GET', url: '/api/admin/bilibili-preview?url=https%3A%2F%2Fwww.bilibili.com%2Fvideo%2FBV1XhVn6UED5', headers: { cookie: adminCookie },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().data).toMatchObject({
        bvid: 'BV1XhVn6UED5', title: '轻音部原创曲测试', cover: 'https://i0.hdslb.com/bfs/archive/test.jpg', duration: '4:01', href: 'https://www.bilibili.com/video/BV1XhVn6UED5',
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('stores and serves announcement body content', async () => {
    const payload = {
      title: '星辉祭筹备说明',
      summary: '舞台、摊位与外宣的完整筹备安排。',
      content: '第一阶段：各部门提交节目单。\n第二阶段：联合彩排与物料清点。',
      category: 'NOTICE',
      href: '/chronicle',
      pinned: false,
      published: true,
      publishedAt: '2026-08-09T08:00:00.000Z',
    };
    const created = await app.inject({ method: 'POST', url: '/api/admin/announcements', headers: { cookie: adminCookie }, payload });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id as string;
    const detail = await app.inject({ method: 'GET', url: `/api/public/announcements/${id}` });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().data.announcement.content).toBe(payload.content);

    const patched = await app.inject({ method: 'PATCH', url: `/api/admin/announcements/${id}`, headers: { cookie: adminCookie }, payload: { content: '更新后的正文。' } });
    expect(patched.statusCode).toBe(200);
    const afterPatch = await app.inject({ method: 'GET', url: `/api/public/announcements/${id}` });
    expect(afterPatch.json().data.announcement.content).toBe('更新后的正文。');
    expect(afterPatch.json().data.announcement.title).toBe(payload.title);
  });

  it('lets members post, comment and delete their own tavern content', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/member/posts' })).statusCode).toBe(401);

    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: {
      title: '周末道具修补互助',
      content: '周六下午在活动室修补巡游道具，需要帮忙的同学可以过来。',
      departmentId: 'dept-cos',
    } });
    expect(created.statusCode).toBe(201);
    const postId = created.json().data.post.id as string;
    expect(created.json().data.post.author.displayName).toBe('白羽见习者');

    expect((await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: { title: '短', content: '内容不足五个字吗' } })).statusCode).toBe(400);

    const list = await app.inject({ method: 'GET', url: '/api/member/posts?page=1&pageSize=50', headers: { cookie: memberCookie } });
    const item = list.json().data.items.find((post: { id: string }) => post.id === postId);
    expect(item).toMatchObject({ title: '周末道具修补互助', commentCount: 0, pinned: false });

    const comment = await app.inject({ method: 'POST', url: `/api/member/posts/${postId}/comments`, headers: { cookie: leadCookie }, payload: { content: '我带热熔胶枪过去。' } });
    expect(comment.statusCode).toBe(201);
    const detail = await app.inject({ method: 'GET', url: `/api/member/posts/${postId}`, headers: { cookie: memberCookie } });
    expect(detail.json().data.post.commentCount).toBe(1);
    expect(detail.json().data.comments[0]).toMatchObject({ content: '我带热熔胶枪过去。' });
    const commentId = detail.json().data.comments[0].id as string;

    expect((await app.inject({ method: 'DELETE', url: `/api/member/posts/${postId}`, headers: { cookie: leadCookie } })).statusCode).toBe(200);
    const afterDelete = await app.inject({ method: 'GET', url: `/api/member/posts/${postId}`, headers: { cookie: memberCookie } });
    expect(afterDelete.statusCode).toBe(404);
    const audit = await app.inject({ method: 'GET', url: '/api/admin/audit-log?page=1&pageSize=100', headers: { cookie: adminCookie } });
    expect(audit.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'POST_DELETED', entity_id: postId, target_user_id: 'user-member' })]));

    expect((await app.inject({ method: 'DELETE', url: `/api/member/comments/${commentId}`, headers: { cookie: leadCookie } })).statusCode).toBe(200);
  });

  it('forbids members from deleting or pinning others posts while leads can moderate', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: leadCookie }, payload: {
      title: 'COS 部部长工作贴', content: '用于验证本部门管理边界。', departmentId: 'dept-cos',
    } });
    const postId = created.json().data.post.id as string;
    expect((await app.inject({ method: 'DELETE', url: `/api/member/posts/${postId}`, headers: { cookie: memberCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}/pin`, headers: { cookie: memberCookie }, payload: { pinned: true } })).statusCode).toBe(403);

    const pinned = await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}/pin`, headers: { cookie: leadCookie }, payload: { pinned: true } });
    expect(pinned.statusCode).toBe(200);
    expect(pinned.json().data.post.pinned).toBe(true);
    const list = await app.inject({ method: 'GET', url: '/api/member/posts?page=1&pageSize=50', headers: { cookie: memberCookie } });
    const ids = list.json().data.items.map((post: { id: string }) => post.id);
    expect(ids.indexOf(postId)).toBeLessThan(ids.indexOf('post-photo-recruit'));

    const audit = await app.inject({ method: 'GET', url: '/api/admin/audit-log?page=1&pageSize=100', headers: { cookie: adminCookie } });
    expect(audit.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'POST_PINNED', entity_id: postId })]));
  });

  it('publishes structured blog posts with scoped placement, editing and member voting', async () => {
    const boundary = '----guild-post-image-boundary';
    const imageBody = Buffer.from([
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="prop.png"\r\nContent-Type: image/png\r\n\r\nfake-png-bytes\r\n`,
      `--${boundary}--\r\n`,
    ].join(''));
    const uploaded = await app.inject({ method: 'POST', url: '/api/member/post-assets', headers: { cookie: memberCookie, 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: imageBody });
    expect(uploaded.statusCode).toBe(201);
    const assetId = uploaded.json().data.asset.id as string;
    const attachmentBoundary = '----guild-post-attachment-boundary';
    const attachmentBody = Buffer.from([
      `--${attachmentBoundary}\r\nContent-Disposition: form-data; name="file"; filename="道具制作说明.pdf"\r\nContent-Type: application/pdf\r\n\r\nfake-pdf-bytes\r\n`,
      `--${attachmentBoundary}--\r\n`,
    ].join(''));
    const attachmentUpload = await app.inject({ method: 'POST', url: '/api/member/post-attachments', headers: { cookie: memberCookie, 'content-type': `multipart/form-data; boundary=${attachmentBoundary}` }, payload: attachmentBody });
    expect(attachmentUpload.statusCode).toBe(201);
    const attachmentId = attachmentUpload.json().data.attachment.id as string;
    expect(attachmentUpload.json().data.attachment).toMatchObject({ name: '道具制作说明.pdf', mimeType: 'application/pdf' });

    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: {
      title: '幻装工坊网络日志', subtitle: '世纪初风格测试页', content: '今天完成了新道具的上色。', departmentId: 'dept-cos',
      body: [
        { type: 'PARAGRAPH', text: '今天完成了新道具的上色。' },
        { type: 'IMAGE', assetId, alt: '上色后的道具' },
        { type: 'LINK', url: 'https://www.bilibili.com/video/BV1test', label: '查看制作记录' },
      ],
      attachmentIds: [attachmentId],
    } });
    expect(created.statusCode).toBe(201);
    const postId = created.json().data.post.id as string;
    expect(created.json().data.post).toMatchObject({ subtitle: '世纪初风格测试页', departmentId: 'dept-cos', departmentName: 'COS部' });
    expect(created.json().data.post.attachments).toEqual([expect.objectContaining({ id: attachmentId, name: '道具制作说明.pdf', mimeType: 'application/pdf' })]);
    const memberAttachment = await app.inject({ method: 'GET', url: `/api/member/post-attachments/${attachmentId}/content`, headers: { cookie: memberCookie } });
    expect(memberAttachment.statusCode).toBe(200);
    expect(memberAttachment.body).toBe('fake-pdf-bytes');
    expect(memberAttachment.headers['content-disposition']).toContain("filename*=UTF-8''");
    expect((await app.inject({ method: 'GET', url: `/api/public/post-attachments/${attachmentId}/content` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: `/api/public/post-assets/${assetId}` })).statusCode).toBe(200);

    expect((await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}`, headers: { cookie: memberCookie }, payload: { title: '发帖人自行校对', content: '发帖人可以编辑自己的帖子。', departmentId: 'dept-cos', body: [{ type: 'PARAGRAPH', text: '发帖人可以编辑自己的帖子。' }, { type: 'IMAGE', assetId, alt: '上色后的道具' }], attachmentIds: [attachmentId] } })).statusCode).toBe(200);
    const edited = await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}`, headers: { cookie: leadCookie }, payload: { title: '幻装工坊网络日志（已校对）', subtitle: '部长校对', content: '内容已经完成校对。', departmentId: 'dept-cos', body: [{ type: 'PARAGRAPH', text: '内容已经完成校对。' }, { type: 'IMAGE', assetId, alt: '上色后的道具' }] } });
    expect(edited.statusCode).toBe(200);

    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: memberCookie }, payload: { scope: 'DEPARTMENT', departmentId: 'dept-cos', visible: true } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: leadCookie }, payload: { scope: 'DEPARTMENT', departmentId: 'dept-tech', visible: true } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: leadCookie }, payload: { scope: 'DEPARTMENT', departmentId: 'dept-cos', visible: true, pinned: true } })).statusCode).toBe(200);
    const publicImage = await app.inject({ method: 'GET', url: `/api/public/post-assets/${assetId}` });
    expect(publicImage.statusCode).toBe(200);
    expect(publicImage.body).toBe('fake-png-bytes');
    const publicAttachment = await app.inject({ method: 'GET', url: `/api/public/post-attachments/${attachmentId}/content` });
    expect(publicAttachment.statusCode).toBe(200);
    expect(publicAttachment.body).toBe('fake-pdf-bytes');
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: leadCookie }, payload: { scope: 'GUILD', visible: true } })).statusCode).toBe(200);

    const upvote = await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/rating`, headers: { cookie: memberCookie }, payload: { value: 1 } });
    expect(upvote.json().data).toEqual({ myRating: 1, upvoteCount: 1, downvoteCount: 0, score: 1 });
    const departmentBoard = await app.inject({ method: 'GET', url: '/api/public/posts/board?departmentSlug=cos' });
    expect(departmentBoard.statusCode).toBe(200);
    expect(departmentBoard.json().data.pinned).toEqual(expect.arrayContaining([expect.objectContaining({ id: postId, pinned: true, upvoteCount: 1, downvoteCount: 0, score: 1 })]));
    const guildBoard = await app.inject({ method: 'GET', url: '/api/public/posts/board' });
    expect(guildBoard.json().data.featured).toEqual(expect.arrayContaining([expect.objectContaining({ id: postId, score: 1 })]));

    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/rating`, headers: { cookie: adminCookie }, payload: { value: -1 } })).statusCode).toBe(200);
    const ratedDetail = await app.inject({ method: 'GET', url: `/api/member/posts/${postId}`, headers: { cookie: memberCookie } });
    expect(ratedDetail.json().data.post).toMatchObject({ upvoteCount: 1, downvoteCount: 1, score: 0, myRating: 1 });
    expect(ratedDetail.json().data.supporters).toEqual([expect.objectContaining({ id: 'user-member', displayName: '白羽见习者' })]);
    expect(ratedDetail.json().data.supporters).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'user-admin' })]));
    const neutralBoard = await app.inject({ method: 'GET', url: '/api/public/posts/board' });
    expect(neutralBoard.json().data.featured).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: postId })]));

    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/rating`, headers: { cookie: adminCookie }, payload: { value: 0 } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: leadCookie }, payload: { scope: 'GUILD', visible: true, featured: true } })).statusCode).toBe(200);
    const manualFeatured = await app.inject({ method: 'GET', url: '/api/public/posts/board' });
    expect(manualFeatured.json().data.featured).toEqual(expect.arrayContaining([expect.objectContaining({ id: postId, featured: true })]));
    expect((await app.inject({ method: 'GET', url: `/api/public/posts/${postId}` })).statusCode).toBe(200);

    const guildPost = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: { title: '全社团随笔', content: '这是一篇全社团范围的随笔。' } });
    const guildPostId = guildPost.json().data.post.id as string;
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${guildPostId}/placement`, headers: { cookie: leadCookie }, payload: { scope: 'GUILD', visible: true } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${guildPostId}/placement`, headers: { cookie: adminCookie }, payload: { scope: 'GUILD', visible: true } })).statusCode).toBe(200);
  });

  it('adds a guild-wide board and lets authors and executives manage post history within scope', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: { title: '全社团共同话题', subtitle: '第一版', content: '这是面向全社团成员的帖子。' } });
    expect(created.statusCode).toBe(201);
    const postId = created.json().data.post.id as string;

    const topics = await app.inject({ method: 'GET', url: '/api/public/forum/topics?departmentSlug=guild' });
    expect(topics.statusCode).toBe(200);
    expect(topics.json().data.department).toMatchObject({ id: 'guild', name: '佐佑动漫社' });
    expect(topics.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: postId })]));

    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: leadCookie }, payload: { scope: 'GUILD', visible: true, pinned: true } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: viceCookie }, payload: { scope: 'GUILD', visible: true, pinned: true } })).statusCode).toBe(200);

    const edited = await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}`, headers: { cookie: memberCookie }, payload: { title: '全社团共同话题（作者修订）', subtitle: '第二版', content: '作者完成了第二版内容。' } });
    expect(edited.statusCode).toBe(200);
    const history = await app.inject({ method: 'GET', url: `/api/member/posts/${postId}/history`, headers: { cookie: memberCookie } });
    expect(history.statusCode).toBe(200);
    expect(history.json().data.items).toHaveLength(2);
    const firstRevisionId = history.json().data.items[1].id as string;

    const restored = await app.inject({ method: 'POST', url: `/api/member/posts/${postId}/history/${firstRevisionId}/restore`, headers: { cookie: memberCookie } });
    expect(restored.statusCode).toBe(200);
    expect(restored.json().data.post).toMatchObject({ title: '全社团共同话题', subtitle: '第一版' });
    const restoredHistory = await app.inject({ method: 'GET', url: `/api/member/posts/${postId}/history`, headers: { cookie: memberCookie } });
    expect(restoredHistory.json().data.items[0]).toMatchObject({ changeType: 'RESTORE', restoredFromId: firstRevisionId });

    expect((await app.inject({ method: 'DELETE', url: `/api/member/posts/${postId}`, headers: { cookie: memberCookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'DELETE', url: `/api/member/posts/${postId}`, headers: { cookie: viceCookie } })).statusCode).toBe(200);
  });

  it('creates department subboards with scoped management and filters their public posts', async () => {
    const payload = { departmentId: 'dept-cos', name: '番剧吐槽', description: '交流当季动画与补番心得' };
    expect((await app.inject({ method: 'POST', url: '/api/member/post-subboards', headers: { cookie: memberCookie }, payload })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/member/post-subboards', headers: { cookie: techLeadCookie }, payload })).statusCode).toBe(403);

    const deputyCookie = await login(app, 'cos.deputy', 'DemoDeputy!2026');
    const createdSubboard = await app.inject({ method: 'POST', url: '/api/member/post-subboards', headers: { cookie: deputyCookie }, payload });
    expect(createdSubboard.statusCode).toBe(201);
    const subboardId = createdSubboard.json().data.subboard.id as string;
    expect(createdSubboard.json().data.subboard).toMatchObject({ name: '番剧吐槽', departmentId: 'dept-cos', departmentSlug: 'cos' });
    expect((await app.inject({ method: 'POST', url: '/api/member/post-subboards', headers: { cookie: leadCookie }, payload })).statusCode).toBe(409);

    const invalidPost = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: { title: '跨部门子板块', content: '不应允许跨部门选择子板块。', departmentId: 'dept-tech', subboardId } });
    expect(invalidPost.statusCode).toBe(400);
    expect(invalidPost.json().error.code).toBe('INVALID_SUBBOARD');

    const createdPost = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: { title: '本周番剧讨论', content: '来聊聊本周更新的动画内容。', departmentId: 'dept-cos', subboardId } });
    expect(createdPost.statusCode).toBe(201);
    const postId = createdPost.json().data.post.id as string;
    expect(createdPost.json().data.post).toMatchObject({ subboardId, subboardName: '番剧吐槽', departmentId: 'dept-cos' });
    expect((await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: leadCookie }, payload: { scope: 'DEPARTMENT', departmentId: 'dept-cos', visible: true } })).statusCode).toBe(200);

    const search = await app.inject({ method: 'GET', url: '/api/public/post-subboards?departmentSlug=cos&q=%E7%95%AA%E5%89%A7' });
    expect(search.statusCode).toBe(200);
    expect(search.json().data.items).toEqual([expect.objectContaining({ id: subboardId, name: '番剧吐槽', postCount: 1 })]);
    const filtered = await app.inject({ method: 'GET', url: `/api/public/posts/board?departmentSlug=cos&subboardId=${subboardId}` });
    expect(filtered.statusCode).toBe(200);
    expect(filtered.json().data.latest).toEqual(expect.arrayContaining([expect.objectContaining({ id: postId, subboardName: '番剧吐槽' })]));
    const topicList = await app.inject({ method: 'GET', url: `/api/public/forum/topics?departmentSlug=cos&subboardId=${subboardId}` });
    expect(topicList.statusCode).toBe(200);
    expect(topicList.json().data).toMatchObject({ total: 1, subboard: { id: subboardId, name: '番剧吐槽' } });
    expect(topicList.json().data.items[0]).toMatchObject({ id: postId, subboardName: '番剧吐槽' });
  });

  it('limits every public board section to five posts and rejects a sixth manual pin or feature', async () => {
    const postIds: string[] = [];
    for (let index = 1; index <= 6; index += 1) {
      const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: adminCookie }, payload: {
        title: `技术部边界日志 ${index}`, content: `用于验证五帖展示上限的正文 ${index}。`, departmentId: 'dept-tech',
      } });
      expect(created.statusCode).toBe(201);
      postIds.push(created.json().data.post.id as string);
    }

    for (const postId of postIds.slice(0, 5)) {
      const placement = await app.inject({ method: 'PUT', url: `/api/member/posts/${postId}/placement`, headers: { cookie: adminCookie }, payload: { scope: 'DEPARTMENT', departmentId: 'dept-tech', visible: true, pinned: true, featured: true } });
      expect(placement.statusCode).toBe(200);
    }

    const sixthPinned = await app.inject({ method: 'PUT', url: `/api/member/posts/${postIds[5]}/placement`, headers: { cookie: adminCookie }, payload: { scope: 'DEPARTMENT', departmentId: 'dept-tech', visible: true, pinned: true } });
    expect(sixthPinned.statusCode).toBe(409);
    expect(sixthPinned.json().error).toEqual({ code: 'PINNED_POST_LIMIT', message: '置顶贴数量已到上限' });

    const sixthFeatured = await app.inject({ method: 'PUT', url: `/api/member/posts/${postIds[5]}/placement`, headers: { cookie: adminCookie }, payload: { scope: 'DEPARTMENT', departmentId: 'dept-tech', visible: true, featured: true } });
    expect(sixthFeatured.statusCode).toBe(409);
    expect(sixthFeatured.json().error).toEqual({ code: 'FEATURED_POST_LIMIT', message: '精选贴数量已到上限' });

    const board = await app.inject({ method: 'GET', url: '/api/public/posts/board?departmentSlug=tech' });
    expect(board.statusCode).toBe(200);
    expect(board.json().data.pinned).toHaveLength(5);
    expect(board.json().data.featured).toHaveLength(5);
    expect(board.json().data.latest).toHaveLength(5);
  });

  it('forbids a department head from editing another departments post', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: {
      title: 'COS 部跨部门编辑边界', content: '这篇帖子只能由 COS 部管理层校对。', departmentId: 'dept-cos',
    } });
    const postId = created.json().data.post.id as string;

    const response = await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}`, headers: { cookie: techLeadCookie }, payload: {
      title: '技术部越权编辑', content: '不应允许跨部门修改。', departmentId: 'dept-cos',
    } });

    expect(response.statusCode).toBe(403);
  });

  it('forbids a department manager from moving a post into another department', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: {
      title: 'COS 部归属边界', content: '帖子所属部门不能被部门管理者跨区迁移。', departmentId: 'dept-cos',
    } });
    const postId = created.json().data.post.id as string;

    const response = await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}`, headers: { cookie: leadCookie }, payload: {
      title: '尝试迁入技术部', content: '不应允许改变所属部门。', departmentId: 'dept-tech',
    } });

    expect(response.statusCode).toBe(403);
  });

  it('forbids a department head from deleting another departments post', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: {
      title: 'COS 部跨部门删除边界', content: '这篇帖子不能由技术部删除。', departmentId: 'dept-cos',
    } });
    const postId = created.json().data.post.id as string;

    const response = await app.inject({ method: 'DELETE', url: `/api/member/posts/${postId}`, headers: { cookie: techLeadCookie } });

    expect(response.statusCode).toBe(403);
  });

  it('forbids a department head from deleting comments on another departments post', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: {
      title: 'COS 部评论管理边界', content: '评论应由帖子所属部门管理。', departmentId: 'dept-cos',
    } });
    const postId = created.json().data.post.id as string;
    const comment = await app.inject({ method: 'POST', url: `/api/member/posts/${postId}/comments`, headers: { cookie: leadCookie }, payload: { content: 'COS 部内部校对意见。' } });
    const commentId = comment.json().data.comment.id as string;

    const response = await app.inject({ method: 'DELETE', url: `/api/member/comments/${commentId}`, headers: { cookie: techLeadCookie } });

    expect(response.statusCode).toBe(403);
  });

  it('forbids the legacy pin endpoint from bypassing department scope', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/member/posts', headers: { cookie: memberCookie }, payload: {
      title: 'COS 部置顶权限边界', content: '旧接口也必须遵守部门范围。', departmentId: 'dept-cos',
    } });
    const postId = created.json().data.post.id as string;

    const response = await app.inject({ method: 'PATCH', url: `/api/member/posts/${postId}/pin`, headers: { cookie: techLeadCookie }, payload: { pinned: true } });

    expect(response.statusCode).toBe(403);
  });

  it('round-trips profile attributes and ranks resonance matches', async () => {
    const invalid = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { attributes: ['not-in-pool'] } });
    expect(invalid.statusCode).toBe(400);

    const updated = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { attributes: ['cosplay', 'photography', 'trpg'] } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.profile.attributes).toEqual(['cosplay', 'photography', 'trpg']);

    const match = await app.inject({ method: 'GET', url: '/api/member/match', headers: { cookie: memberCookie } });
    expect(match.statusCode).toBe(200);
    expect(match.json().data.myAttributes).toEqual(['cosplay', 'photography', 'trpg']);
    const items = match.json().data.items as Array<{ score: number; sharedAttributes: string[]; profile: { id: string; displayName: string } }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(12);
    expect(items.every((item) => item.score > 0 && item.score <= 100 && item.profile.id !== 'user-member')).toBe(true);
    const lead = items.find((item) => item.profile.id === 'user-lead');
    expect(lead).toBeDefined();
    expect(lead!.sharedAttributes).toEqual(expect.arrayContaining(['cosplay', 'photography']));
    expect(items[0].score).toBeGreaterThanOrEqual(items[items.length - 1].score);
  });
});

describe.sequential('Pixel world plaza', () => {
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
    adminCookie = await login(app, 'admin', 'DemoAdmin!2026');
    leadCookie = await login(app, 'cos.lead', 'DemoLead!2026');
    memberCookie = await login(app, 'cos.member', 'DemoMember!2026');
  });

  afterAll(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });

  it('lists the guild hall plus six department areas with online counts', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/member/world/areas' })).statusCode).toBe(401);
    const response = await app.inject({ method: 'GET', url: '/api/member/world/areas', headers: { cookie: memberCookie } });
    expect(response.statusCode).toBe(200);
    const items = response.json().data.items as Array<{ id: string; name: string; color: string; online: number }>;
    expect(items.map((area) => area.id)).toEqual(['hall', 'publicity', 'tech', 'original', 'dance', 'cos', 'music']);
    expect(items[0]).toMatchObject({ name: '公会大厅广场', online: 0 });
    expect(items.every((area) => /^#[0-9a-f]{6}$/i.test(area.color))).toBe(true);
  });

  it('validates movement bounds and tracks presence per area', async () => {
    const outOfBounds = await app.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: memberCookie }, payload: { areaId: 'hall', x: 1200, y: 100, dir: 'right' } });
    expect(outOfBounds.statusCode).toBe(400);
    const unknownArea = await app.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: memberCookie }, payload: { areaId: 'dungeon', x: 100, y: 100, dir: 'down' } });
    expect(unknownArea.statusCode).toBe(400);

    const moved = await app.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: memberCookie }, payload: { areaId: 'hall', x: 320, y: 240, dir: 'up-right' } });
    expect(moved.statusCode).toBe(200);
    await app.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: leadCookie }, payload: { areaId: 'hall', x: 640, y: 300, dir: 'left' } });

    const state = await app.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: memberCookie } });
    expect(state.statusCode).toBe(200);
    const members = state.json().data.members as Array<{ userId: string; x: number; y: number; dir: string; sprite: string; self: boolean }>;
    expect(members).toHaveLength(2);
    expect(members.find((member) => member.userId === 'user-member')).toMatchObject({ x: 320, y: 240, dir: 'up-right', self: true });
    expect(members.every((member) => typeof member.sprite === 'string' && member.sprite.length > 0)).toBe(true);
    expect(state.json().data.area.id).toBe('hall');

    const areas = await app.inject({ method: 'GET', url: '/api/member/world/areas', headers: { cookie: memberCookie } });
    expect(areas.json().data.items.find((area: { id: string }) => area.id === 'hall').online).toBe(2);

    const movedToCos = await app.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: leadCookie }, payload: { areaId: 'cos', x: 100, y: 100, dir: 'down' } });
    expect(movedToCos.statusCode).toBe(200);
    const hallAfter = await app.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: memberCookie } });
    expect(hallAfter.json().data.members).toHaveLength(1);

    const left = await app.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: memberCookie }, payload: { areaId: 'hall', x: 320, y: 240, dir: 'down', leaving: true } });
    expect(left.statusCode).toBe(200);
    const hallEmpty = await app.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: memberCookie } });
    expect(hallEmpty.json().data.members).toHaveLength(0);
  });

  it('serves seeded area messages and supports incremental chat', async () => {
    const initial = await app.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: memberCookie } });
    const seeded = initial.json().data.messages as Array<{ id: string; content: string }>;
    expect(seeded.length).toBeGreaterThanOrEqual(2);
    expect(seeded.map((message) => message.content)).toContain('欢迎来到公会大厅广场，用方向键四处走走吧。');

    const posted = await app.inject({ method: 'POST', url: '/api/member/world/areas/hall/messages', headers: { cookie: memberCookie }, payload: { content: '广场喷泉旁边集合拍照！' } });
    expect(posted.statusCode).toBe(201);
    const messageId = posted.json().data.message.id as string;

    const tooLong = await app.inject({ method: 'POST', url: '/api/member/world/areas/hall/messages', headers: { cookie: memberCookie }, payload: { content: '字'.repeat(201) } });
    expect(tooLong.statusCode).toBe(400);

    const incremental = await app.inject({ method: 'GET', url: `/api/member/world/areas/hall/state?after=${seeded[seeded.length - 1].id}`, headers: { cookie: leadCookie } });
    const newMessages = incremental.json().data.messages as Array<{ id: string; content: string }>;
    expect(newMessages).toHaveLength(1);
    expect(newMessages[0]).toMatchObject({ id: messageId, content: '广场喷泉旁边集合拍照！' });

    expect((await app.inject({ method: 'DELETE', url: `/api/member/world/messages/${messageId}`, headers: { cookie: leadCookie } })).statusCode).toBe(403);
    const adminDelete = await app.inject({ method: 'DELETE', url: `/api/member/world/messages/${messageId}`, headers: { cookie: adminCookie } });
    expect(adminDelete.statusCode).toBe(200);
    const afterDelete = await app.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: memberCookie } });
    expect((afterDelete.json().data.messages as Array<{ id: string }>).some((message) => message.id === messageId)).toBe(false);
    const audit = await app.inject({ method: 'GET', url: '/api/admin/audit-log?page=1&pageSize=100', headers: { cookie: adminCookie } });
    expect(audit.json().data.items).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'AREA_MESSAGE_DELETED', entity_id: messageId, target_user_id: 'user-member' })]));
  });

  it('lets a member delete their own area message', async () => {
    const posted = await app.inject({ method: 'POST', url: '/api/member/world/areas/cos/messages', headers: { cookie: memberCookie }, payload: { content: '幻装间临时占用十分钟。' } });
    const messageId = posted.json().data.message.id as string;
    const removed = await app.inject({ method: 'DELETE', url: `/api/member/world/messages/${messageId}`, headers: { cookie: memberCookie } });
    expect(removed.statusCode).toBe(200);
    const state = await app.inject({ method: 'GET', url: '/api/member/world/areas/cos/state', headers: { cookie: memberCookie } });
    expect((state.json().data.messages as Array<{ id: string }>).some((message) => message.id === messageId)).toBe(false);
  });

  it('expires presence after fifteen seconds without movement reports', async () => {
    const clockRoot = await mkdtemp('D:/Temp/guild-world-clock-');
    let clockValue = Date.parse('2026-08-12T08:00:00.000Z');
    const clockApp = await createApp({
      databasePath: `${clockRoot}/guild.sqlite`,
      uploadRoot: `${clockRoot}/uploads`,
      seed: true,
      sessionSecret: 'integration-test-secret-that-is-long',
      clock: () => clockValue,
    });
    try {
      const clockMember = await login(clockApp, 'cos.member', 'DemoMember!2026');
      await clockApp.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: clockMember }, payload: { areaId: 'hall', x: 200, y: 200, dir: 'down' } });
      let state = await clockApp.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: clockMember } });
      expect(state.json().data.members).toHaveLength(1);
      clockValue += 16_000;
      state = await clockApp.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: clockMember } });
      expect(state.json().data.members).toHaveLength(0);
    } finally {
      await clockApp.close();
      await rm(clockRoot, { recursive: true, force: true });
    }
  });
});

describe.sequential('Pixel avatar builder', () => {
  let app: FastifyInstance;
  let root: string;
  let memberCookie: string;
  let leadCookie: string;

  beforeAll(async () => {
    root = await mkdtemp(tempRoot);
    app = await createApp({
      databasePath: `${root}/guild.sqlite`,
      uploadRoot: `${root}/uploads`,
      seed: true,
      sessionSecret: 'integration-test-secret-that-is-long',
    });
    memberCookie = await login(app, 'cos.member', 'DemoMember!2026');
    leadCookie = await login(app, 'cos.lead', 'DemoLead!2026');
  });

  afterAll(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });

  it('rejects avatar configs with values outside the enums', async () => {
    const valid = { style: 'chibi', klass: 'knight', skin: 'light', hairStyle: 'short', hairColor: 'brown', eyes: 'round', accessory: 'none', accent: 'teal' };
    const invalid = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { avatarConfig: { ...valid, hairStyle: 'mohawk' } } });
    expect(invalid.statusCode).toBe(400);
    const badKlass = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { avatarConfig: { ...valid, klass: 'paladin' } } });
    expect(badKlass.statusCode).toBe(400);
    const missing = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { avatarConfig: { ...valid, skin: undefined } } });
    expect(missing.statusCode).toBe(400);
  });

  it('persists avatar config through profile update and directory payloads', async () => {
    const config = { style: 'mame', klass: 'mage', skin: 'tan', hairStyle: 'afro', hairColor: 'purple', eyes: 'sparkle', accessory: 'headphones', accent: 'gold' };
    const updated = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { avatarConfig: config } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.profile.avatarConfig).toEqual(config);

    const profile = await app.inject({ method: 'GET', url: '/api/member/profile', headers: { cookie: memberCookie } });
    expect(profile.json().data.profile.avatarConfig).toEqual(config);

    const directory = await app.inject({ method: 'GET', url: '/api/member/directory?q=白羽&page=1&pageSize=10', headers: { cookie: memberCookie } });
    expect(directory.json().data.items[0].avatarConfig).toEqual(config);

    // 旧格式（无 style/klass、带废弃 outfit 字段）PATCH 后归一化：补默认值并剥离 outfit
    const legacy = { skin: 'warm', hairStyle: 'bun', hairColor: 'black', eyes: 'closed', outfit: 'hanfu', accessory: 'glasses', accent: 'gold' };
    const legacyUpdate = await app.inject({ method: 'PATCH', url: '/api/member/profile', headers: { cookie: memberCookie }, payload: { avatarConfig: legacy } });
    const normalized = legacyUpdate.json().data.profile.avatarConfig;
    expect(normalized).toMatchObject({ skin: 'warm', hairStyle: 'bun', style: 'chibi', klass: 'knight' });
    expect('outfit' in normalized).toBe(false);
  });

  it('derives stable defaults for members without a saved config', async () => {
    const { deriveAvatarConfig } = await import('@guild/contracts');
    const directory = await app.inject({ method: 'GET', url: '/api/member/directory?q=星序旅人013&page=1&pageSize=10', headers: { cookie: memberCookie } });
    const fiction = directory.json().data.items[0];
    expect(fiction.avatarConfig).toEqual(deriveAvatarConfig(fiction.id));
  });

  it('includes avatarConfig in world state members', async () => {
    await app.inject({ method: 'POST', url: '/api/member/world/move', headers: { cookie: leadCookie }, payload: { areaId: 'hall', x: 300, y: 300, dir: 'down' } });
    const state = await app.inject({ method: 'GET', url: '/api/member/world/areas/hall/state', headers: { cookie: memberCookie } });
    const lead = (state.json().data.members as Array<{ userId: string; avatarConfig: { hairStyle: string; klass: string } }>).find((member) => member.userId === 'user-lead');
    expect(lead).toBeDefined();
    // user-lead 在种子里保存了捏脸配置
    expect(lead!.avatarConfig).toMatchObject({ hairStyle: 'long', klass: 'ranger', accent: 'rose' });
  });
});
