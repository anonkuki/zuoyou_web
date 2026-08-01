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

export async function openDatabase(databasePath: string): Promise<DatabaseContext> {
  await mkdir(dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec('CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = sqlite.prepare('SELECT 1 FROM __migrations WHERE name = ?').get('0000_initial');
  if (!applied) {
    const migration = readFileSync(new URL('../drizzle/0000_initial.sql', import.meta.url), 'utf8');
    sqlite.transaction(() => {
      sqlite.exec(migration);
      sqlite.prepare('INSERT INTO __migrations(name, applied_at) VALUES (?, ?)').run('0000_initial', new Date().toISOString());
    })();
  }
  return { sqlite, orm: drizzle(sqlite, { schema }) };
}

export async function seedDatabase(sqlite: Database.Database, options: { adminPassword?: string; production?: boolean } = {}): Promise<void> {
  const existing = sqlite.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (existing.count > 0) return;
  if (options.production && !options.adminPassword) throw new Error('ADMIN_PASSWORD is required in production');
  const now = new Date().toISOString();
  const adminPassword = options.adminPassword ?? 'DemoAdmin!2026';
  const adminHash = await hashPassword(adminPassword);
  const [leadHash, memberHash] = options.production
    ? [null, null]
    : await Promise.all([hashPassword('DemoLead!2026'), hashPassword('DemoMember!2026')]);

  const insertDepartment = sqlite.prepare('INSERT INTO departments(id,slug,name,title,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  for (const [id, slug, name, title] of departments) insertDepartment.run(id, slug, name, title, `${name}的公会驻地与专业协作小组`, now, now);

  const insertUser = sqlite.prepare('INSERT INTO users(id,username,password_hash,display_name,email,role,department_id,bio,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  insertUser.run('user-admin', 'admin', adminHash, '星门总管', 'admin@guild.example', 'ADMIN', null, '负责公会运营与秩序', 1, now, now);
  insertUser.run('user-lead', options.production ? null : 'cos.lead', leadHash, '绯月幻装师', 'cos.lead@guild.example', 'DEPARTMENT_LEAD', 'dept-cos', '负责幻装与舞台呈现', 1, now, now);
  insertUser.run('user-member', options.production ? null : 'cos.member', memberHash, '白羽见习者', 'cos.member@guild.example', 'MEMBER', 'dept-cos', '热爱角色塑造与活动协作', 1, now, now);

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
  sqlite.prepare('INSERT INTO activity_registrations(id,activity_id,user_id,registered_at) VALUES (?,?,?,?)').run('registration-live-member', 'activity-live', 'user-member', now);

  const insertChronicle = sqlite.prepare('INSERT INTO chronicles(id,title,content,occurred_at,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  insertChronicle.run('chronicle-1', '冒险者协会成立', '六个专业部门在星门大厅签署协作章程。', '2023-05-01T00:00:00.000Z', 1, now, now);
  insertChronicle.run('chronicle-2', '首届星辉祭', '成员共同完成舞台、音乐与外宣协作。', '2024-08-15T00:00:00.000Z', 1, now, now);

  const insertWork = sqlite.prepare('INSERT INTO works(id,user_id,department_id,title,description,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)');
  insertWork.run('work-tech-pending', 'user-tech-01', 'dept-tech', '便携魔导灯原型', '虚构的互动装置设计', 'PENDING', now, now);
  insertWork.run('work-public-1', 'user-member', 'dept-cos', '银翼幻装记录', '已公开的活动作品', 'PUBLISHED', now, now);

  const insertFile = sqlite.prepare('INSERT INTO files(id,owner_id,department_id,name,storage_key,mime_type,size,visibility,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
  insertFile.run('file-public', 'user-admin', null, '公会手册.pdf', 'public/guild-guide.pdf', 'application/pdf', 1024, 'PUBLIC', now, now);
  insertFile.run('file-members', 'user-admin', null, '成员须知.pdf', 'members/member-guide.pdf', 'application/pdf', 2048, 'MEMBERS', now, now);
  insertFile.run('file-cos', 'user-lead', 'dept-cos', '幻装素材包.zip', 'departments/cos/assets.zip', 'application/zip', 4096, 'DEPARTMENT', now, now);
  insertFile.run('file-tech', 'user-tech-01', 'dept-tech', '机关图纸.pdf', 'departments/tech/blueprint.pdf', 'application/pdf', 3072, 'DEPARTMENT', now, now);
  insertFile.run('file-admin', 'user-admin', null, '管理备忘录.txt', 'admins/memo.txt', 'text/plain', 128, 'ADMINS', now, now);

  sqlite.prepare('INSERT INTO department_tasks(id,department_id,assignee_id,title,description,due_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .run('task-cos-1', 'dept-cos', 'user-member', '整理幻装道具清单', '完成分类与状态标记', '2026-08-20T00:00:00.000Z', now, now);
  sqlite.prepare('INSERT INTO applications(id,status_token_hash,display_name,email,department_id,reason,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run('application-history', 'historical-token-hash', '云岚旅人', 'cloud@example.test', 'dept-publicity', '参与公会传播', 'REJECTED', now, now);
  const insertSetting = sqlite.prepare('INSERT INTO site_settings(key,value,updated_at) VALUES (?,?,?)');
  insertSetting.run('siteName', '星辉冒险者协会', now);
  insertSetting.run('recruitmentOpen', 'true', now);
}
