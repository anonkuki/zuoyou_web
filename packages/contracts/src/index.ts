import { z } from 'zod';

export const RoleSchema = z.enum(['MEMBER', 'DEPARTMENT_LEAD', 'ADMIN']);
export type Role = z.infer<typeof RoleSchema>;

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

const internalHrefSchema = z.string().trim().min(1).max(240)
  .regex(/^\/(?!\/)[A-Za-z0-9/_?=&%#.-]*$/, '公告链接必须是站内路径');

export const announcementInputSchema = z.object({
  title: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(2).max(240),
  category: AnnouncementCategorySchema,
  href: internalHrefSchema,
  pinned: z.boolean().default(false),
  published: z.boolean().default(false),
  publishedAt: z.iso.datetime(),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

export const announcementUpdateSchema = announcementInputSchema.partial()
  .refine((value) => Object.keys(value).length > 0, '至少提供一个修改字段');

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
