import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { hashPassword } from './security.js';
import { schema } from './schema.js';

export interface DatabaseContext {
  sqlite: Database.Database;
  orm: ReturnType<typeof drizzle<typeof schema>>;
}

const departments = [
  ['dept-cos', 'cos', 'COS部', '幻术师'],
  ['dept-tech', 'tech', '技术部', '魔导工程师'],
  ['dept-music', 'music', '轻音部', '吟游诗人'],
  ['dept-original', 'original', '原创部', '绘卷术士'],
  ['dept-dance', 'dance', '舞装部', '舞刃使'],
  ['dept-publicity', 'publicity', '外宣部', '传令官'],
] as const;

const archiveThemes = [
  ['dept-cos', '幻装工坊回顾'], ['dept-tech', '魔导影像技术交流'], ['dept-music', '月下轻音排练'],
  ['dept-original', '原创绘卷共创'], ['dept-dance', '宅舞舞台排演'], ['dept-publicity', '番剧鉴赏与外宣周常'],
] as const;

function ensureHomeShowcaseData(sqlite: Database.Database, timestamp: string): void {
  sqlite.transaction(() => {
    const insertActivity = sqlite.prepare('INSERT OR IGNORE INTO activities(id,department_id,title,description,status,capacity,check_in_code,result_summary,starts_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (let index = 1; index <= 327; index += 1) {
      const [departmentId, title] = archiveThemes[(index - 1) % archiveThemes.length];
      const year = 2018 + ((index - 1) % 8);
      const month = String(((index - 1) % 12) + 1).padStart(2, '0');
      const day = String(((index * 3) % 27) + 1).padStart(2, '0');
      insertActivity.run(`activity-archive-${String(index).padStart(3, '0')}`, departmentId, `${title} · ${String(index).padStart(3, '0')}`, '虚构的社团历史活动记录', 'ARCHIVED', 40, null, '活动记录与成果已归档', `${year}-${month}-${day}T10:00:00.000Z`, timestamp, timestamp);
    }

    const insertSetting = sqlite.prepare('INSERT OR IGNORE INTO site_settings(key,value,updated_at) VALUES (?,?,?)');
    for (const [key, value] of [['guildLevel', '12'], ['guildLevelCurrent', '2390'], ['guildLevelTarget', '3000'], ['honorCount', '56'], ['foundedYear', '2018']] as const) {
      insertSetting.run(key, value, timestamp);
    }

    const insertAnnouncement = sqlite.prepare('INSERT OR IGNORE INTO announcements(id,title,summary,category,href,pinned,published,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    insertAnnouncement.run('announcement-recruitment-2026', '2026 秋季招新现已开启', '六大部门联合招募，欢迎新的冒险者加入公会。', 'RECRUITMENT', '/join', 1, 1, '2026-08-08T00:00:00.000Z', timestamp, timestamp);
    insertAnnouncement.run('announcement-exhibition-2026', '六部门夏日联合成果展', '幻装、技术、轻音、原创、舞装与外宣作品集中展示。', 'ACTIVITY', '/activities', 1, 1, '2026-08-06T00:00:00.000Z', timestamp, timestamp);
    insertAnnouncement.run('announcement-music-2026', '月下轻音会活动报名', '轻音部专场开放成员报名。', 'ACTIVITY', '/activities', 0, 1, '2026-08-03T00:00:00.000Z', timestamp, timestamp);
    insertAnnouncement.run('announcement-review-2025', '2025 社团年度回顾已收录', '年度活动足迹与六部门故事已经写入公会编年史。', 'NOTICE', '/chronicle', 0, 1, '2026-07-28T00:00:00.000Z', timestamp, timestamp);
  })();
}

function ensureSocialShowcaseData(sqlite: Database.Database, timestamp: string): void {
  const profile = sqlite.prepare(`UPDATE users SET guild_title=?,college=?,grade=?,skills=?,interests=?,avatar_color=?,profile_visibility='MEMBERS',last_seen_at=?,updated_at=? WHERE id=?`);
  profile.run('星门总管', '社团联合事务中心', '运营组', '["活动统筹","成员服务","文档管理"]', '["像素艺术","社团建设"]', '#b26b3f', timestamp, timestamp, 'user-admin');
  profile.run('首席幻装师', '数字媒体学院', '2023级', '["服装制作","舞台妆造","摄影协作"]', '["角色设计","舞台演出","漫展"]', '#c75f88', timestamp, timestamp, 'user-lead');
  profile.run('幻装见习生', '艺术设计学院', '2025级', '["角色塑造","道具整理","活动协作"]', '["动画","COSPLAY","摄影"]', '#5279a8', timestamp, timestamp, 'user-member');

  const insertConversation = sqlite.prepare('INSERT OR IGNORE INTO conversations(id,type,direct_key,department_id,title,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  for (const [departmentId, , name] of departments) insertConversation.run(`conversation-${departmentId}`, 'DEPARTMENT', null, departmentId, `${name}协作频道`, timestamp, timestamp);
  insertConversation.run('conversation-demo-direct', 'DIRECT', 'user-lead:user-member', null, '', timestamp, timestamp);

  const insertParticipant = sqlite.prepare('INSERT OR IGNORE INTO conversation_participants(conversation_id,user_id,last_read_at,muted,joined_at) VALUES (?,?,?,?,?)');
  sqlite.prepare(`SELECT id,department_id FROM users WHERE is_active=1 AND department_id IS NOT NULL`).all().forEach((row) => {
    const member = row as { id: string; department_id: string };
    insertParticipant.run(`conversation-${member.department_id}`, member.id, timestamp, 0, timestamp);
  });
  insertParticipant.run('conversation-demo-direct', 'user-lead', timestamp, 0, timestamp);
  insertParticipant.run('conversation-demo-direct', 'user-member', '2026-08-10T08:00:00.000Z', 0, timestamp);

  const insertMessage = sqlite.prepare('INSERT OR IGNORE INTO messages(id,conversation_id,sender_id,content,reply_to_id,created_at) VALUES (?,?,?,?,?,?)');
  insertMessage.run('message-cos-01', 'conversation-dept-cos', 'user-lead', '欢迎来到 COS 部协作频道，近期道具清单请在任务区确认。', null, '2026-08-10T08:10:00.000Z');
  insertMessage.run('message-cos-02', 'conversation-dept-cos', 'user-member', '收到，我会在今晚完成分类标记。', 'message-cos-01', '2026-08-10T08:18:00.000Z');
  insertMessage.run('message-direct-01', 'conversation-demo-direct', 'user-member', '学姐，夏日幻装工坊的服装尺寸表已经整理好了。', null, '2026-08-10T09:00:00.000Z');
  insertMessage.run('message-direct-02', 'conversation-demo-direct', 'user-lead', '辛苦啦！发到内部文件后我来复核，注意不要包含个人联系方式。', 'message-direct-01', '2026-08-10T09:04:00.000Z');
  insertMessage.run('message-tech-01', 'conversation-dept-tech', 'user-tech-01', '魔导机关展的交互装置进入联调阶段。', null, '2026-08-10T10:00:00.000Z');
  insertMessage.run('message-publicity-01', 'conversation-dept-publicity', 'user-fiction-006', '本周活动海报排期已更新，请负责人确认发布时间。', null, '2026-08-10T11:00:00.000Z');
}

export async function openDatabase(databasePath: string): Promise<DatabaseContext> {
  await mkdir(dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec('CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  for (const name of ['0000_initial', '0001_work_files', '0002_activity_location_file_category', '0003_recruitment_and_activity_results', '0004_announcements', '0005_member_profiles_chat']) {
    const applied = sqlite.prepare('SELECT 1 FROM __migrations WHERE name = ?').get(name);
    if (applied) continue;
    const migration = readFileSync(new URL(`../drizzle/${name}.sql`, import.meta.url), 'utf8');
    sqlite.transaction(() => {
      sqlite.exec(migration);
      sqlite.prepare('INSERT INTO __migrations(name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString());
    })();
  }
  return { sqlite, orm: drizzle(sqlite, { schema }) };
}

export async function seedDatabase(sqlite: Database.Database, options: { adminPassword?: string; production?: boolean } = {}): Promise<void> {
  if (options.production) {
    const password = options.adminPassword?.trim();
    if (!password) throw new Error('ADMIN_PASSWORD is required in production');
    const normalized = password.toLowerCase();
    if (password.length < 12 || ['required', 'replace', 'change-me', 'placeholder', 'demoadmin!2026'].some((marker) => normalized.includes(marker))) {
      throw new Error('Production ADMIN_PASSWORD must be a non-placeholder secret of at least 12 characters');
    }
  }
  const existing = sqlite.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (existing.count > 0) {
    if (options.production) {
      const demoAccount = sqlite.prepare("SELECT 1 FROM users WHERE username IN ('admin','cos.lead','cos.member') AND (username!='admin' OR email='admin@guild.example') LIMIT 1").get();
      const seedProfile = sqlite.prepare("SELECT value FROM site_settings WHERE key='seedProfile'").get() as { value: string } | undefined;
      if (demoAccount || seedProfile?.value === 'development') throw new Error('Refusing production startup: development demo credentials detected in existing database');
    }
    if (!options.production) {
      const timestamp = new Date().toISOString();
      ensureHomeShowcaseData(sqlite, timestamp);
      ensureSocialShowcaseData(sqlite, timestamp);
    }
    return;
  }
  const now = new Date().toISOString();
  const adminPassword = options.adminPassword ?? 'DemoAdmin!2026';
  const adminHash = await hashPassword(adminPassword);
  const [leadHash, memberHash] = options.production
    ? [null, null]
    : await Promise.all([hashPassword('DemoLead!2026'), hashPassword('DemoMember!2026')]);

  const insertDepartment = sqlite.prepare('INSERT INTO departments(id,slug,name,title,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  for (const [id, slug, name, title] of departments) insertDepartment.run(id, slug, name, title, `${name}的公会驻地与专业协作小组`, now, now);

  const insertUser = sqlite.prepare('INSERT INTO users(id,username,password_hash,display_name,email,role,department_id,bio,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  insertUser.run('user-admin', 'admin', adminHash, '星门总管', options.production ? 'initial-admin@local.invalid' : 'admin@guild.example', 'ADMIN', null, '负责公会运营与秩序', 1, '2018-05-01T00:00:00.000Z', now);
  insertUser.run('user-lead', options.production ? null : 'cos.lead', leadHash, '绯月幻装师', 'cos.lead@guild.example', 'DEPARTMENT_LEAD', 'dept-cos', '负责幻装与舞台呈现', 1, '2023-05-01T00:00:00.000Z', now);
  insertUser.run('user-member', options.production ? null : 'cos.member', memberHash, '白羽见习者', 'cos.member@guild.example', 'MEMBER', 'dept-cos', '热爱角色塑造与活动协作', 1, '2025-09-01T00:00:00.000Z', now);

  const departmentIds = departments.map(([id]) => id);
  const leaders: Record<string, string> = { 'dept-cos': 'user-lead' };
  for (let index = 1; index <= 79; index += 1) {
    const departmentId = index === 1 ? 'dept-tech' : departmentIds[(index - 1) % departmentIds.length];
    const id = index === 1 ? 'user-tech-01' : `user-fiction-${String(index).padStart(3, '0')}`;
    const firstForDepartment = !leaders[departmentId];
    const role = firstForDepartment ? 'DEPARTMENT_LEAD' : 'MEMBER';
    if (firstForDepartment) leaders[departmentId] = id;
    insertUser.run(id, null, null, `星序旅人${String(index).padStart(3, '0')}`, `fiction${index}@guild.example`, role, departmentId, `虚构成员档案 ${index}`, 1, now, now);
  }
  const setLeader = sqlite.prepare('UPDATE departments SET leader_id = ?, updated_at = ? WHERE id = ?');
  for (const [departmentId, userId] of Object.entries(leaders)) setLeader.run(userId, now, departmentId);

  const insertActivity = sqlite.prepare('INSERT INTO activities(id,department_id,title,description,status,capacity,check_in_code,result_summary,starts_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  insertActivity.run('activity-open', 'dept-cos', '夏日幻装工坊', '小型角色造型交流', 'REGISTRATION', 1, null, null, '2026-08-10T10:00:00.000Z', now, now);
  insertActivity.run('activity-live', 'dept-cos', '星灯巡游', '在场签到演练', 'IN_PROGRESS', 20, 'STAR42', null, '2026-08-02T10:00:00.000Z', now, now);
  insertActivity.run('activity-preparing', 'dept-tech', '魔导机关展', '活动筹备中', 'PREPARING', 30, null, null, '2026-09-01T10:00:00.000Z', now, now);
  insertActivity.run('activity-ended', 'dept-music', '月下轻音会', '等待成果归档', 'ENDED', 50, 'MOON88', null, '2026-07-20T10:00:00.000Z', now, now);
  sqlite.prepare('INSERT INTO activity_registrations(id,activity_id,user_id,registered_at) VALUES (?,?,?,?)')
    .run('registration-live-member', 'activity-live', 'user-member', now);
  const insertShowcaseRegistration = sqlite.prepare('INSERT INTO activity_registrations(id,activity_id,user_id,registered_at,checked_in_at) VALUES (?,?,?,?,?)');
  insertShowcaseRegistration.run('registration-lead-ended', 'activity-ended', 'user-lead', '2026-07-10T08:00:00.000Z', '2026-07-20T10:01:00.000Z');

  const insertChronicle = sqlite.prepare('INSERT INTO chronicles(id,title,content,occurred_at,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  insertChronicle.run('chronicle-1', '冒险者协会成立', '六个专业部门在星门大厅签署协作章程。', '2023-05-01T00:00:00.000Z', 1, now, now);
  insertChronicle.run('chronicle-2', '首届星辉祭', '成员共同完成舞台、音乐与外宣协作。', '2024-08-15T00:00:00.000Z', 1, now, now);

  const insertWork = sqlite.prepare('INSERT INTO works(id,user_id,department_id,title,description,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)');
  insertWork.run('work-tech-pending', 'user-tech-01', 'dept-tech', '便携魔导灯原型', '虚构的互动装置设计', 'PENDING', now, now);
  insertWork.run('work-public-1', 'user-member', 'dept-cos', '银翼幻装记录', '已公开的活动作品', 'PUBLISHED', now, now);
  insertWork.run('work-lead-stage', 'user-lead', 'dept-cos', '星灯巡游幻装视觉册', '收录巡游角色造型、舞台站位与幕后协作过程。', 'PUBLISHED', '2026-08-03T08:00:00.000Z', '2026-08-03T08:00:00.000Z');
  insertWork.run('work-lead-workshop', 'user-lead', 'dept-cos', '夏日工坊造型手记', '面向新成员的服装测量、道具安全与妆造协作记录。', 'PUBLISHED', '2026-07-28T08:00:00.000Z', '2026-07-28T08:00:00.000Z');

  const insertShowcaseContribution = sqlite.prepare('INSERT INTO audit_logs(id,actor_id,target_user_id,action,entity_type,entity_id,details,created_at) VALUES (?,?,?,?,?,?,?,?)');
  insertShowcaseContribution.run('audit-lead-work-stage', 'user-admin', 'user-lead', 'WORK_PUBLISHED', 'WORK', 'work-lead-stage', '作品发布贡献', '2026-08-03T08:00:00.000Z');
  insertShowcaseContribution.run('audit-lead-work-workshop', 'user-admin', 'user-lead', 'WORK_PUBLISHED', 'WORK', 'work-lead-workshop', '作品发布贡献', '2026-07-28T08:00:00.000Z');
  insertShowcaseContribution.run('audit-lead-checkin-ended', 'user-lead', 'user-lead', 'ACTIVITY_CHECK_IN', 'ACTIVITY', 'activity-ended', '活动签到贡献', '2026-07-20T10:01:00.000Z');
  insertShowcaseContribution.run('audit-member-work', 'user-admin', 'user-member', 'WORK_PUBLISHED', 'WORK', 'work-public-1', '作品发布贡献', now);

  const insertFile = sqlite.prepare('INSERT INTO files(id,owner_id,department_id,name,storage_key,mime_type,size,visibility,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
  insertFile.run('file-public', 'user-admin', null, '公会手册.pdf', 'public/guild-guide.pdf', 'application/pdf', 1024, 'PUBLIC', now, now);
  insertFile.run('file-members', 'user-admin', null, '成员须知.pdf', 'members/member-guide.pdf', 'application/pdf', 2048, 'MEMBERS', now, now);
  insertFile.run('file-cos', 'user-lead', 'dept-cos', '幻装素材包.zip', 'departments/cos/assets.zip', 'application/zip', 4096, 'DEPARTMENT', now, now);
  insertFile.run('file-tech', 'user-tech-01', 'dept-tech', '机关图纸.pdf', 'departments/tech/blueprint.pdf', 'application/pdf', 3072, 'DEPARTMENT', now, now);
  insertFile.run('file-admin', 'user-admin', null, '管理备忘录.txt', 'admins/memo.txt', 'text/plain', 128, 'ADMINS', now, now);
  insertFile.run('file-photo-anniversary', 'user-admin', null, '佐佑动漫社周年社庆合影.jpg', 'members/photos/club-anniversary.jpg', 'image/jpeg', 406931, 'MEMBERS', now, now);
  insertFile.run('file-photo-memory-01', 'user-admin', null, '佐佑动漫社活动留影一.jpg', 'members/photos/club-memory-01.jpg', 'image/jpeg', 238129, 'MEMBERS', now, now);
  insertFile.run('file-photo-memory-02', 'user-admin', null, '佐佑动漫社活动留影二.jpg', 'members/photos/club-memory-02.jpg', 'image/jpeg', 228589, 'MEMBERS', now, now);

  sqlite.prepare('INSERT INTO department_tasks(id,department_id,assignee_id,title,description,due_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .run('task-cos-1', 'dept-cos', 'user-member', '整理幻装道具清单', '完成分类与状态标记', '2026-08-20T00:00:00.000Z', now, now);
  sqlite.prepare('INSERT INTO applications(id,status_token_hash,display_name,email,department_id,reason,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run('application-history', 'historical-token-hash', '云岚旅人', 'cloud@example.test', 'dept-publicity', '参与公会传播', 'REJECTED', now, now);
  const insertSetting = sqlite.prepare('INSERT INTO site_settings(key,value,updated_at) VALUES (?,?,?)');
  insertSetting.run('siteName', '星辉冒险者协会', now);
  insertSetting.run('recruitmentOpen', 'true', now);
  insertSetting.run('seedProfile', options.production ? 'production' : 'development', now);
  ensureHomeShowcaseData(sqlite, now);
  if (!options.production) ensureSocialShowcaseData(sqlite, now);
}
