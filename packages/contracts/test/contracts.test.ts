import { describe, expect, it } from 'vitest';
import {
  ActivityStatusSchema,
  ApplicationStatusSchema,
  FileVisibilitySchema,
  RoleSchema,
  WorkStatusSchema,
  pageQuerySchema,
} from '../src/index.js';

describe('shared contracts', () => {
  it('accepts only the exact role values', () => {
    expect(RoleSchema.options).toEqual(['MEMBER', 'DEPARTMENT_LEAD', 'ADMIN']);
    expect(RoleSchema.safeParse('OWNER').success).toBe(false);
  });

  it('keeps workflow and visibility enums exact', () => {
    expect(ActivityStatusSchema.options).toEqual(['PREPARING', 'REGISTRATION', 'IN_PROGRESS', 'ENDED', 'ARCHIVED']);
    expect(ApplicationStatusSchema.options).toEqual(['PENDING', 'APPROVED', 'REJECTED']);
    expect(WorkStatusSchema.options).toEqual(['PENDING', 'PUBLISHED', 'REJECTED']);
    expect(FileVisibilitySchema.options).toEqual(['PUBLIC', 'MEMBERS', 'DEPARTMENT', 'ADMINS']);
  });

  it('validates and bounds paging input', () => {
    expect(pageQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(pageQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});

