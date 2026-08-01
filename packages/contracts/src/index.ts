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

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const successResponse = <T>(data: T) => ({ ok: true as const, data });

