import { z } from 'zod';

export const RoleSchema = z.enum(['MEMBER', 'DEPARTMENT_ADMIN', 'DEPARTMENT_HEAD', 'VICE_PRESIDENT', 'PRESIDENT']);
export type Role = z.infer<typeof RoleSchema>;

export const roleLabels: Record<Role, string> = {
  MEMBER: '普通成员',
  DEPARTMENT_ADMIN: '副部长',
  DEPARTMENT_HEAD: '部长',
  VICE_PRESIDENT: '副社长',
  PRESIDENT: '社长',
};

export const isExecutiveRole = (role: Role): boolean => role === 'PRESIDENT' || role === 'VICE_PRESIDENT';
export const isDepartmentManagementRole = (role: Role): boolean => role === 'DEPARTMENT_HEAD' || role === 'DEPARTMENT_ADMIN';
export const isManagementRole = (role: Role): boolean => isExecutiveRole(role) || isDepartmentManagementRole(role);

export const ActivityStatusSchema = z.enum(['PREPARING', 'REGISTRATION', 'IN_PROGRESS', 'ENDED', 'ARCHIVED']);
export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;

export const ApplicationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const WorkStatusSchema = z.enum(['PENDING', 'PUBLISHED', 'REJECTED']);
export type WorkStatus = z.infer<typeof WorkStatusSchema>;

export const FileVisibilitySchema = z.enum(['PUBLIC', 'MEMBERS', 'DEPARTMENT', 'ADMINS']);
export type FileVisibility = z.infer<typeof FileVisibilitySchema>;

export const AnnouncementCategorySchema = z.enum(['RECRUITMENT', 'ACTIVITY', 'NOTICE']);
export type AnnouncementCategory = z.infer<typeof AnnouncementCategorySchema>;

export const ProfileVisibilitySchema = z.enum(['MEMBERS', 'PRIVATE']);
export type ProfileVisibility = z.infer<typeof ProfileVisibilitySchema>;

export const ConversationTypeSchema = z.enum(['DIRECT', 'DEPARTMENT']);
export type ConversationType = z.infer<typeof ConversationTypeSchema>;

export const memberAttributePool = [
  { id: 'drawing', label: '绘画', category: '创作', icon: 'palette' },
  { id: 'photography', label: '摄影', category: '创作', icon: 'camera' },
  { id: 'writing', label: '写作', category: '创作', icon: 'pen-line' },
  { id: 'video', label: '剪辑', category: '创作', icon: 'clapperboard' },
  { id: 'cosplay', label: 'COS', category: '舞台', icon: 'shirt' },
  { id: 'dance', label: '宅舞', category: '舞台', icon: 'footprints' },
  { id: 'band', label: '乐队', category: '舞台', icon: 'guitar' },
  { id: 'voice', label: '配音', category: '舞台', icon: 'mic' },
  { id: 'coding', label: '编程', category: '技术', icon: 'code' },
  { id: 'planning', label: '策划', category: '技术', icon: 'notebook-pen' },
  { id: 'rhythm', label: '音游', category: '游戏', icon: 'music' },
  { id: 'console', label: '主机游戏', category: '游戏', icon: 'gamepad-2' },
  { id: 'trpg', label: '跑团', category: '聚会', icon: 'dices' },
  { id: 'boardgame', label: '桌游', category: '聚会', icon: 'puzzle' },
  { id: 'expo', label: '逛展', category: '聚会', icon: 'ticket' },
  { id: 'merch', label: '吃谷', category: '聚会', icon: 'shopping-bag' },
] as const;
export type MemberAttributeId = (typeof memberAttributePool)[number]['id'];
export const memberAttributeIdSchema = z.enum(memberAttributePool.map((attribute) => attribute.id) as [MemberAttributeId, ...MemberAttributeId[]]);

export const avatarStyles = ['chibi', 'mame', 'sharp'] as const;
/** DND 职业：决定服装/头饰/手持物，与 style（脸型/比例）正交组合 */
export const avatarKlasses = ['knight', 'mage', 'assassin', 'ranger', 'bard', 'mercenary', 'cleric', 'berserker'] as const;
export const avatarSkins = ['porcelain', 'light', 'warm', 'tan', 'deep'] as const;
export const avatarHairStyles = ['short', 'long', 'twintails', 'bun', 'ahoge', 'curtain', 'afro', 'bald'] as const;
export const avatarHairColors = ['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'purple', 'white'] as const;
export const avatarEyes = ['round', 'sharp', 'closed', 'sparkle'] as const;
export const avatarAccessories = ['none', 'glasses', 'cat-ears', 'headphones', 'mask'] as const;
export const avatarAccents = ['red', 'orange', 'gold', 'teal', 'blue', 'purple', 'pink', 'rose'] as const;

export const avatarConfigSchema = z.object({
  /** 美术风格；旧数据缺省时按 chibi 解析 */
  style: z.enum(avatarStyles).default('chibi'),
  /** 职业；旧数据（含已废弃的 outfit 字段）缺省时按 knight 解析 */
  klass: z.enum(avatarKlasses).default('knight'),
  skin: z.enum(avatarSkins),
  hairStyle: z.enum(avatarHairStyles),
  hairColor: z.enum(avatarHairColors),
  eyes: z.enum(avatarEyes),
  accessory: z.enum(avatarAccessories).catch('none'),
  accent: z.enum(avatarAccents),
});
export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

export const defaultAvatarConfig: AvatarConfig = {
  style: 'chibi', klass: 'knight', skin: 'light', hairStyle: 'short', hairColor: 'brown', eyes: 'round', accessory: 'none', accent: 'teal',
};

/** 无捏脸配置的成员按 id 哈希派生稳定默认形象，保证永不空白 */
export function deriveAvatarConfig(seed: string): AvatarConfig {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  // 每个字段重新打散哈希（imul 保证 32 位精度），避免字段间相关性导致大片成员形象雷同
  const pick = <T,>(list: readonly T[]): T => {
    hash = (Math.imul(hash, 1103515245) + 12345) >>> 0;
    return list[hash % list.length];
  };
  return {
    style: pick(avatarStyles),
    klass: pick(avatarKlasses),
    skin: pick(avatarSkins),
    hairStyle: pick(avatarHairStyles),
    hairColor: pick(avatarHairColors),
    eyes: pick(avatarEyes),
    accessory: pick(avatarAccessories),
    accent: pick(avatarAccents),
  };
}

/** 解析存储的 JSON 配置；缺失或非法时回退到派生默认 */
export function resolveAvatarConfig(seed: string, raw: string | null | undefined): AvatarConfig {
  if (raw) {
    try {
      const parsed = avatarConfigSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    } catch {
      // fall through to derived default
    }
  }
  return deriveAvatarConfig(seed);
}

const profileTagSchema = z.string().trim().min(1).max(20);
export const memberProfileUpdateSchema = z.object({
  uid: z.string().trim().min(3).max(24).regex(/^[\p{L}\p{N}_.-]+$/u, 'ID 只能包含中文、字母、数字、下划线、短横线或点').optional(),
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(500).optional(),
  guildTitle: z.string().trim().max(40).optional(),
  college: z.string().trim().max(80).optional(),
  grade: z.string().trim().max(30).optional(),
  skills: z.array(profileTagSchema).max(8).optional(),
  interests: z.array(profileTagSchema).max(8).optional(),
  attributes: z.array(memberAttributeIdSchema).max(8).optional(),
  avatarConfig: avatarConfigSchema.optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  profileVisibility: ProfileVisibilitySchema.optional(),
}).refine((value) => Object.keys(value).length > 0, '至少提供一个修改字段');
export type MemberProfileUpdate = z.infer<typeof memberProfileUpdateSchema>;

export const postBodyBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PARAGRAPH'), text: z.string().trim().min(1).max(4000) }),
  z.object({ type: z.literal('IMAGE'), assetId: z.string().trim().min(1).max(100), alt: z.string().trim().max(160).optional() }),
  z.object({ type: z.literal('LINK'), url: z.url().refine((url) => /^https?:\/\//i.test(url), '仅支持 http/https 链接'), label: z.string().trim().max(160).optional() }),
]);
export type PostBodyBlock = z.infer<typeof postBodyBlockSchema>;

export const postCreateSchema = z.object({
  title: z.string().trim().min(2).max(100),
  subtitle: z.string().trim().max(160).optional().default(''),
  content: z.string().trim().min(1).max(12000),
  departmentId: z.string().trim().min(1).nullable().default(null),
  subboardId: z.string().trim().min(1).nullable().default(null),
  body: z.array(postBodyBlockSchema).min(1).max(80).optional(),
  attachmentIds: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
});
export type PostCreate = z.infer<typeof postCreateSchema>;

export const postSubboardCreateSchema = z.object({
  departmentId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().max(160).optional().default(''),
});
export type PostSubboardCreate = z.infer<typeof postSubboardCreateSchema>;

export const postPlacementSchema = z.object({
  scope: z.enum(['GUILD', 'DEPARTMENT']),
  departmentId: z.string().trim().min(1).nullable().default(null),
  visible: z.boolean().default(true),
  pinned: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const postRatingSchema = z.object({ value: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });
export type PostRating = z.infer<typeof postRatingSchema>;

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});
export type CommentCreate = z.infer<typeof commentCreateSchema>;

export const worldMapWidth = 960;
export const worldMapHeight = 540;

export const worldAreas = [
  { id: 'hall', name: '公会大厅广场', color: '#c99a45', departmentSlug: null },
  { id: 'publicity', name: '外宣&幻想研据点', color: '#e0342f', departmentSlug: 'publicity' },
  { id: 'tech', name: '技术部工房', color: '#ff9f43', departmentSlug: 'tech' },
  { id: 'original', name: '原创部画室', color: '#f7a8b8', departmentSlug: 'original' },
  { id: 'dance', name: '舞装部舞台', color: '#ff4d8d', departmentSlug: 'dance' },
  { id: 'cos', name: 'COS部幻装间', color: '#d6336c', departmentSlug: 'cos' },
  { id: 'music', name: '轻音部琴房', color: '#f5c96b', departmentSlug: 'music' },
] as const;
export type WorldArea = (typeof worldAreas)[number];
export const worldAreaIds = worldAreas.map((area) => area.id) as [WorldArea['id'], ...Array<WorldArea['id']>];

export const worldDirectionSchema = z.enum(['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right']);
export type WorldDirection = z.infer<typeof worldDirectionSchema>;

export const worldMoveSchema = z.object({
  areaId: z.enum(worldAreaIds),
  x: z.number().min(0).max(worldMapWidth),
  y: z.number().min(0).max(worldMapHeight),
  dir: worldDirectionSchema.default('down'),
  leaving: z.boolean().default(false),
});
export type WorldMove = z.infer<typeof worldMoveSchema>;

export const areaMessageCreateSchema = z.object({
  content: z.string().trim().min(1).max(200),
});
export type AreaMessageCreate = z.infer<typeof areaMessageCreateSchema>;

export const directConversationInputSchema = z.object({ userId: z.string().trim().min(1).max(100) });
export const messageCreateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  replyToId: z.string().trim().min(1).max(100).nullable().optional(),
});
export const messageUpdateSchema = z.object({ content: z.string().trim().min(1).max(2000) });

const internalHrefSchema = z.string().trim().min(1).max(240)
  .regex(/^\/(?!\/)[A-Za-z0-9/_?=&%#.-]*$/, '公告链接必须是站内路径');

export const announcementInputSchema = z.object({
  title: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(2).max(240),
  content: z.string().trim().max(5000).default(''),
  category: AnnouncementCategorySchema,
  href: internalHrefSchema,
  pinned: z.boolean().default(false),
  published: z.boolean().default(false),
  publishedAt: z.iso.datetime(),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

export const announcementUpdateSchema = z.object({
  title: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(2).max(240),
  content: z.string().trim().max(5000),
  category: AnnouncementCategorySchema,
  href: internalHrefSchema,
  pinned: z.boolean(),
  published: z.boolean(),
  publishedAt: z.iso.datetime(),
}).partial().refine((value) => Object.keys(value).length > 0, '至少提供一个修改字段');

export const announcementSchema = announcementInputSchema.extend({
  id: z.string().min(1),
});
export type Announcement = z.infer<typeof announcementSchema>;

export const guildHomeStatsSchema = z.object({
  guildLevel: z.number().int().min(1).max(999),
  levelProgress: z.object({
    current: z.number().int().nonnegative(),
    target: z.number().int().positive(),
  }).refine((value) => value.current <= value.target, '等级进度不可超过目标'),
  memberCount: z.number().int().nonnegative(),
  onlineCount: z.number().int().nonnegative(),
  completedActivityCount: z.number().int().nonnegative(),
  honorCount: z.number().int().nonnegative(),
  foundedYear: z.number().int().min(1900).max(2200),
});
export type GuildHomeStats = z.infer<typeof guildHomeStatsSchema>;

export const homeDataSchema = z.object({
  stats: guildHomeStatsSchema,
  announcements: z.array(announcementSchema).max(10),
});
export type HomeData = z.infer<typeof homeDataSchema>;

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const successResponse = <T>(data: T) => ({ ok: true as const, data });
