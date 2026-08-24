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

export function allocateUserUid(sqlite: Database.Database): string {
  const row = sqlite.prepare("SELECT MAX(CAST(uid AS INTEGER)) max_uid FROM users WHERE length(uid)=5 AND uid NOT GLOB '*[^0-9]*'").get() as { max_uid: number | null };
  const next = Math.max(10001, (row.max_uid ?? 10000) + 1);
  if (next > 99999) throw new Error('Five-digit user UID space is exhausted');
  return String(next).padStart(5, '0');
}

const departments = [
  ['dept-cos', 'cos', 'COS部', '幻术师', '角色造型、服装道具与舞台呈现'],
  ['dept-tech', 'tech', '技术部', '魔导工程师', '摄影摄像、直播与活动技术支持'],
  ['dept-music', 'music', '轻音部', '吟游诗人', '乐队排练、歌曲编排与现场演出'],
  ['dept-original', 'original', '原创部', '绘卷术士', '绘画、设定创作与社团原创企划'],
  ['dept-dance', 'dance', '舞装部', '舞刃使', '宅舞排练、舞台编排与演出'],
  ['dept-publicity', 'publicity', '外宣&幻想研', '传令官', '宣传运营、影像记录与动漫文化研究'],
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
    insertAnnouncement.run('announcement-recruitment-2026', '2026 秋季招新现已开启', '社员申请现已开放，可同时选择多个感兴趣的部门。', 'RECRUITMENT', '/join', 1, 1, '2026-08-08T00:00:00.000Z', timestamp, timestamp);
    insertAnnouncement.run('announcement-exhibition-2026', '六部门夏日联合成果展', '幻装、技术、轻音、原创、舞装与外宣作品集中展示。', 'ACTIVITY', '/activities', 1, 1, '2026-08-06T00:00:00.000Z', timestamp, timestamp);
    insertAnnouncement.run('announcement-music-2026', '月下轻音会活动报名', '轻音部专场开放成员报名。', 'ACTIVITY', '/activities', 0, 1, '2026-08-03T00:00:00.000Z', timestamp, timestamp);
    insertAnnouncement.run('announcement-review-2025', '2025 社团年度回顾已收录', '年度活动足迹与六部门故事已经写入公会编年史。', 'NOTICE', '/chronicle', 0, 1, '2026-07-28T00:00:00.000Z', timestamp, timestamp);
  })();
}

function ensureDepartmentConversations(sqlite: Database.Database, timestamp: string): void {
  const insertConversation = sqlite.prepare('INSERT OR IGNORE INTO conversations(id,type,direct_key,department_id,title,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  for (const [departmentId, , name] of departments) {
    const existing = sqlite.prepare("SELECT 1 FROM conversations WHERE type='DEPARTMENT' AND department_id=? LIMIT 1").get(departmentId);
    if (!existing) insertConversation.run(`conversation-${departmentId}`, 'DEPARTMENT', null, departmentId, `${name}协作频道`, timestamp, timestamp);
  }
}

function ensureGuildTavernData(sqlite: Database.Database): void {
  const insertPost = sqlite.prepare('INSERT OR IGNORE INTO posts(id,user_id,title,content,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  insertPost.run('post-welcome', 'user-admin', '欢迎来到冒险者酒馆', '这里是社团成员的公开交流区。\n分享创作进度、招募协作伙伴、约跑团或逛展都可以。\n请保持友善，遵守社团公约。', 1, '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z');
  insertPost.run('post-cos-progress', 'user-lead', '夏日幻装工坊进度集中贴', '服装测量与道具安全清单已经更新。\n参加巡游的成员请在本帖回复确认尺寸。', 0, '2026-08-05T09:00:00.000Z', '2026-08-05T09:00:00.000Z');
  insertPost.run('post-photo-recruit', 'user-member', '招募摄影搭档拍正片', '周末想去江边拍一组角色正片。\n希望找一位有外拍经验的摄影搭档，欢迎私信或留言。', 0, '2026-08-07T10:00:00.000Z', '2026-08-07T10:00:00.000Z');
  insertPost.run('post-tech-share', 'user-tech-01', '魔导灯原型的灯光调试记录', '记录了便携魔导灯的灯带排布与供电方案。\n对互动装置感兴趣的同学可以在评论区交流。', 0, '2026-08-08T11:00:00.000Z', '2026-08-08T11:00:00.000Z');
  insertPost.run('post-band-setlist', 'user-fiction-002', '轻音会歌单投票', '月下轻音会的候选歌单已整理。\n大家在评论区留下想听的曲目编号即可。', 0, '2026-08-09T12:00:00.000Z', '2026-08-09T12:00:00.000Z');
  insertPost.run('post-trpg-recruit', 'user-fiction-003', '周五晚跑团缺一pl', '周五晚上的团缺一位玩家。\n规则是轻量奇幻，新手也完全欢迎，车卡会现场协助。', 0, '2026-08-10T13:00:00.000Z', '2026-08-10T13:00:00.000Z');
  insertPost.run('post-expo-plan', 'user-fiction-004', '秋日逛展同行召集', '计划结伴去秋日的同人展。\n打算上午集合，下午自由逛，想一起的请在评论里报名。', 0, '2026-08-11T14:00:00.000Z', '2026-08-11T14:00:00.000Z');

  const insertComment = sqlite.prepare('INSERT OR IGNORE INTO post_comments(id,post_id,user_id,content,created_at) VALUES (?,?,?,?,?)');
  insertComment.run('comment-cos-1', 'post-cos-progress', 'user-member', '尺寸表我今晚核对后回复。', '2026-08-05T10:00:00.000Z');
  insertComment.run('comment-cos-2', 'post-cos-progress', 'user-tech-01', '道具运输我来协调推车。', '2026-08-05T11:00:00.000Z');
  insertComment.run('comment-photo-1', 'post-photo-recruit', 'user-lead', '我可以带反光板，周六上午有空。', '2026-08-07T12:00:00.000Z');
  insertComment.run('comment-trpg-1', 'post-trpg-recruit', 'user-member', '新手想试试，私信你啦。', '2026-08-10T15:00:00.000Z');
  insertComment.run('comment-band-1', 'post-band-setlist', 'user-fiction-005', '投 3 号和 7 号曲目一票。', '2026-08-09T13:00:00.000Z');

  const insertAreaMessage = sqlite.prepare('INSERT OR IGNORE INTO area_messages(id,area_id,sender_id,content,created_at) VALUES (?,?,?,?,?)');
  insertAreaMessage.run('area-message-hall-1', 'hall', 'user-admin', '欢迎来到公会大厅广场，用方向键四处走走吧。', '2026-08-10T08:00:00.000Z');
  insertAreaMessage.run('area-message-hall-2', 'hall', 'user-lead', '今晚八点在广场集合确认巡游动线。', '2026-08-10T09:00:00.000Z');
  insertAreaMessage.run('area-message-cos-1', 'cos', 'user-member', '幻装间里新增了布料架，大家按需取用。', '2026-08-10T10:00:00.000Z');
}

function ensureSocialShowcaseData(sqlite: Database.Database, timestamp: string): void {
  const profile = sqlite.prepare(`UPDATE users SET guild_title=?,college=?,grade=?,skills=?,interests=?,attributes=?,avatar_color=?,profile_visibility='MEMBERS',last_seen_at=?,updated_at=? WHERE id=?`);
  profile.run('星门总管', '社团联合事务中心', '运营组', '["活动统筹","成员服务","文档管理"]', '["像素艺术","社团建设"]', '["planning","boardgame","expo"]', '#b26b3f', timestamp, timestamp, 'user-admin');
  profile.run('首席幻装师', '数字媒体学院', '2023级', '["服装制作","舞台妆造","摄影协作"]', '["角色设计","舞台演出","漫展"]', '["cosplay","photography","dance","expo"]', '#c75f88', timestamp, timestamp, 'user-lead');
  profile.run('幻装见习生', '艺术设计学院', '2025级', '["角色塑造","道具整理","活动协作"]', '["动画","COSPLAY","摄影"]', '["cosplay","photography","drawing","trpg"]', '#5279a8', timestamp, timestamp, 'user-member');

  const fictionAttributes = sqlite.prepare('UPDATE users SET attributes=? WHERE id=?');
  fictionAttributes.run('["coding","console","rhythm"]', 'user-tech-01');
  fictionAttributes.run('["band","rhythm","merch"]', 'user-fiction-002');
  fictionAttributes.run('["trpg","boardgame","writing"]', 'user-fiction-003');
  fictionAttributes.run('["expo","merch","photography"]', 'user-fiction-004');
  fictionAttributes.run('["drawing","writing","console"]', 'user-fiction-005');
  fictionAttributes.run('["dance","cosplay","video"]', 'user-fiction-006');

  const seedAvatar = sqlite.prepare('UPDATE users SET avatar_config=? WHERE id=?');
  seedAvatar.run(JSON.stringify({ style: 'sharp', klass: 'ranger', skin: 'light', hairStyle: 'long', hairColor: 'red', eyes: 'sharp', accessory: 'none', accent: 'rose' }), 'user-lead');
  seedAvatar.run(JSON.stringify({ style: 'chibi', klass: 'bard', skin: 'porcelain', hairStyle: 'twintails', hairColor: 'blue', eyes: 'sparkle', accessory: 'headphones', accent: 'blue' }), 'user-member');
  seedAvatar.run(JSON.stringify({ style: 'mame', klass: 'cleric', skin: 'warm', hairStyle: 'bun', hairColor: 'black', eyes: 'round', accessory: 'glasses', accent: 'gold' }), 'user-admin');

  ensureGuildTavernData(sqlite);

  ensureDepartmentConversations(sqlite, timestamp);
  const insertConversation = sqlite.prepare('INSERT OR IGNORE INTO conversations(id,type,direct_key,department_id,title,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
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

async function ensureDevelopmentTestAccounts(sqlite: Database.Database, timestamp: string): Promise<void> {
  const accounts = [
    ['user-vice', 'vice.president', 'DemoVice!2026', '星轨副社长', 'vice.president@guild.example', 'VICE_PRESIDENT', null, '协助社长统筹跨部门事务'],
    ['user-deputy', 'cos.deputy', 'DemoDeputy!2026', '绯羽副部长', 'cos.deputy@guild.example', 'DEPARTMENT_ADMIN', 'dept-cos', '协助部长管理 COS 部日常事务'],
  ] as const;
  const president = sqlite.prepare("SELECT id FROM users WHERE role='PRESIDENT' AND is_active=1 ORDER BY created_at LIMIT 1").get() as { id: string } | undefined;
  for (const [id, username, password, displayName, email, role, departmentId, bio] of accounts) {
    if (!sqlite.prepare('SELECT 1 FROM users WHERE username=?').get(username)) {
      sqlite.prepare(`INSERT INTO users(id,uid,username,password_hash,display_name,email,role,department_id,bio,is_active,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(id, allocateUserUid(sqlite), username, await hashPassword(password), displayName, email, role, departmentId, bio, 1, timestamp, timestamp);
    }
    if (departmentId) sqlite.prepare('INSERT OR IGNORE INTO user_departments(user_id,department_id,is_primary,joined_at) VALUES (?,?,1,?)').run(id, departmentId, timestamp);
    sqlite.prepare('INSERT OR IGNORE INTO role_assignments(id,user_id,role,department_id,granted_by,granted_at) VALUES (?,?,?,?,?,?)')
      .run(`role-seed-${id}`, id, role, departmentId, president?.id ?? null, timestamp);
  }
}

export async function openDatabase(databasePath: string): Promise<DatabaseContext> {
  await mkdir(dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec('CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  for (const name of ['0000_initial', '0001_work_files', '0002_activity_location_file_category', '0003_recruitment_and_activity_results', '0004_announcements', '0005_member_profiles_chat', '0006_multi_department_membership', '0007_department_conversations', '0008_guild_posts_attributes', '0009_area_messages', '0010_avatar_config', '0011_publicity_fantasy_lab', '0012_four_level_admin_hierarchy', '0013_blog_post_publishing', '0014_post_ratings', '0015_user_uid']) {
    const applied = sqlite.prepare('SELECT 1 FROM __migrations WHERE name = ?').get(name);
    if (applied) continue;
    const migration = readFileSync(new URL(`../drizzle/${name}.sql`, import.meta.url), 'utf8');
    const rebuildsReferencedTable = name === '0012_four_level_admin_hierarchy';
    if (rebuildsReferencedTable) sqlite.pragma('foreign_keys = OFF');
    try {
      sqlite.transaction(() => {
        sqlite.exec(migration);
        sqlite.prepare('INSERT INTO __migrations(name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString());
      })();
    } catch (error) {
      if (rebuildsReferencedTable) {
        const legacyAdmins = (sqlite.prepare("SELECT COUNT(*) count FROM users WHERE role='ADMIN'").get() as { count: number }).count;
        if (legacyAdmins > 1) throw new Error('Role hierarchy migration requires a single legacy ADMIN; designate the president before retrying', { cause: error });
      }
      throw error;
    } finally {
      if (rebuildsReferencedTable) sqlite.pragma('foreign_keys = ON');
    }
    if (rebuildsReferencedTable) {
      const violations = sqlite.pragma('foreign_key_check') as unknown[];
      if (violations.length) throw new Error('Foreign key validation failed after role hierarchy migration');
    }
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
      await ensureDevelopmentTestAccounts(sqlite, timestamp);
      ensureHomeShowcaseData(sqlite, timestamp);
      ensureSocialShowcaseData(sqlite, timestamp);
    } else {
      ensureDepartmentConversations(sqlite, new Date().toISOString());
    }
    return;
  }
  const now = new Date().toISOString();
  const adminPassword = options.adminPassword ?? 'DemoAdmin!2026';
  const adminHash = await hashPassword(adminPassword);
  const [viceHash, leadHash, deputyHash, memberHash] = options.production
    ? [null, null, null, null]
    : await Promise.all([hashPassword('DemoVice!2026'), hashPassword('DemoLead!2026'), hashPassword('DemoDeputy!2026'), hashPassword('DemoMember!2026')]);

  const insertDepartment = sqlite.prepare('INSERT INTO departments(id,slug,name,title,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  for (const [id, slug, name, title, description] of departments) insertDepartment.run(id, slug, name, title, description, now, now);

  const insertUser = sqlite.prepare('INSERT INTO users(id,uid,username,password_hash,display_name,email,role,department_id,bio,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const addUser = (...values: [string, string | null, string | null, string, string, string, string | null, string, number, string, string]) => insertUser.run(values[0], allocateUserUid(sqlite), ...values.slice(1));
  addUser('user-admin', 'admin', adminHash, '星门总管', options.production ? 'initial-admin@local.invalid' : 'admin@guild.example', 'PRESIDENT', null, '负责公会运营与秩序', 1, '2018-05-01T00:00:00.000Z', now);
  if (!options.production) addUser('user-vice', 'vice.president', viceHash, '星轨副社长', 'vice.president@guild.example', 'VICE_PRESIDENT', null, '协助社长统筹跨部门事务', 1, '2020-05-01T00:00:00.000Z', now);
  addUser('user-lead', options.production ? null : 'cos.lead', leadHash, '绯月幻装师', 'cos.lead@guild.example', 'DEPARTMENT_HEAD', 'dept-cos', '负责幻装与舞台呈现', 1, '2023-05-01T00:00:00.000Z', now);
  if (!options.production) addUser('user-deputy', 'cos.deputy', deputyHash, '绯羽副部长', 'cos.deputy@guild.example', 'DEPARTMENT_ADMIN', 'dept-cos', '协助部长管理 COS 部日常事务', 1, '2024-05-01T00:00:00.000Z', now);
  addUser('user-member', options.production ? null : 'cos.member', memberHash, '白羽见习者', 'cos.member@guild.example', 'MEMBER', 'dept-cos', '热爱角色塑造与活动协作', 1, '2025-09-01T00:00:00.000Z', now);

  const departmentIds = departments.map(([id]) => id);
  const leaders: Record<string, string> = { 'dept-cos': 'user-lead' };
  for (let index = 1; index <= 79; index += 1) {
    const departmentId = index === 1 ? 'dept-tech' : departmentIds[(index - 1) % departmentIds.length];
    const id = index === 1 ? 'user-tech-01' : `user-fiction-${String(index).padStart(3, '0')}`;
    const firstForDepartment = !leaders[departmentId];
    const role = firstForDepartment ? 'DEPARTMENT_HEAD' : 'MEMBER';
    if (firstForDepartment) leaders[departmentId] = id;
    addUser(id, null, null, `星序旅人${String(index).padStart(3, '0')}`, `fiction${index}@guild.example`, role, departmentId, `虚构成员档案 ${index}`, 1, now, now);
  }
  sqlite.prepare(`INSERT OR IGNORE INTO user_departments(user_id,department_id,is_primary,joined_at)
    SELECT id,department_id,1,created_at FROM users WHERE department_id IS NOT NULL`).run();
  const setLeader = sqlite.prepare('UPDATE departments SET leader_id = ?, updated_at = ? WHERE id = ?');
  for (const [departmentId, userId] of Object.entries(leaders)) setLeader.run(userId, now, departmentId);
  const insertRoleAssignment = sqlite.prepare('INSERT INTO role_assignments(id,user_id,role,department_id,granted_by,granted_at) VALUES (?,?,?,?,?,?)');
  insertRoleAssignment.run('role-seed-president', 'user-admin', 'PRESIDENT', null, null, '2018-05-01T00:00:00.000Z');
  if (!options.production) insertRoleAssignment.run('role-seed-vice', 'user-vice', 'VICE_PRESIDENT', null, 'user-admin', now);
  for (const [departmentId, userId] of Object.entries(leaders)) {
    insertRoleAssignment.run(`role-seed-${departmentId}`, userId, 'DEPARTMENT_HEAD', departmentId, 'user-admin', now);
  }
  if (!options.production) insertRoleAssignment.run('role-seed-deputy', 'user-deputy', 'DEPARTMENT_ADMIN', 'dept-cos', 'user-lead', now);

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
    .run('application-history', 'historical-token-hash', '云岚同学', 'cloud@example.test', 'dept-publicity', '希望参与社团宣传工作', 'REJECTED', now, now);
  sqlite.prepare('INSERT INTO application_departments(application_id,department_id,preference_order) VALUES (?,?,?)')
    .run('application-history', 'dept-publicity', 0);
  const insertSetting = sqlite.prepare('INSERT INTO site_settings(key,value,updated_at) VALUES (?,?,?)');
  insertSetting.run('siteName', '星辉冒险者协会', now);
  insertSetting.run('recruitmentOpen', 'true', now);
  insertSetting.run('seedProfile', options.production ? 'production' : 'development', now);
  ensureHomeShowcaseData(sqlite, now);
  if (!options.production) ensureSocialShowcaseData(sqlite, now);
  else ensureDepartmentConversations(sqlite, now);
}
