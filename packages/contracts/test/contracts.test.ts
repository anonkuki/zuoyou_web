import { describe, expect, it } from 'vitest';
import {
  ActivityStatusSchema,
  AnnouncementCategorySchema,
  ApplicationStatusSchema,
  FileVisibilitySchema,
  announcementInputSchema,
  homeDataSchema,
  RoleSchema,
  WorkStatusSchema,
  pageQuerySchema,
  ConversationTypeSchema,
  ProfileVisibilitySchema,
  directConversationInputSchema,
  memberProfileUpdateSchema,
  messageCreateSchema,
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

  it('validates homepage announcements as safe internal navigation', () => {
    expect(AnnouncementCategorySchema.options).toEqual(['RECRUITMENT', 'ACTIVITY', 'NOTICE']);
    expect(announcementInputSchema.safeParse({
      title: '2026 秋季招新开启',
      summary: '六部门联合招募新成员',
      category: 'RECRUITMENT',
      href: '/join',
      pinned: true,
      published: true,
      publishedAt: '2026-08-08T00:00:00.000Z',
    }).success).toBe(true);
    expect(announcementInputSchema.safeParse({
      title: '外部跳转', summary: '不允许公告后台写入外链', category: 'NOTICE', href: 'https://example.com',
      pinned: false, published: true, publishedAt: '2026-08-08T00:00:00.000Z',
    }).success).toBe(false);
  });

  it('bounds database-driven homepage values', () => {
    expect(homeDataSchema.safeParse({
      stats: {
        guildLevel: 12,
        levelProgress: { current: 2390, target: 3000 },
        memberCount: 82,
        completedActivityCount: 328,
        honorCount: 56,
        foundedYear: 2018,
      },
      announcements: [],
    }).success).toBe(true);
    expect(homeDataSchema.safeParse({
      stats: {
        guildLevel: -1,
        levelProgress: { current: 0, target: 0 },
        memberCount: 82,
        completedActivityCount: 328,
        honorCount: 56,
        foundedYear: 2018,
      },
      announcements: [],
    }).success).toBe(false);
  });

  it('validates profile privacy, structured tags, and conversation payloads', () => {
    expect(ProfileVisibilitySchema.options).toEqual(['MEMBERS', 'PRIVATE']);
    expect(ConversationTypeSchema.options).toEqual(['DIRECT', 'DEPARTMENT']);
    expect(memberProfileUpdateSchema.parse({
      guildTitle: '幻装见习生', college: '艺术设计学院', grade: '2025级',
      skills: ['角色塑造', '活动协作'], interests: ['动画'], avatarColor: '#5279a8', profileVisibility: 'MEMBERS',
    })).toMatchObject({ guildTitle: '幻装见习生', skills: ['角色塑造', '活动协作'] });
    expect(memberProfileUpdateSchema.safeParse({ skills: Array.from({ length: 9 }, (_, index) => `技能${index}`) }).success).toBe(false);
    expect(memberProfileUpdateSchema.safeParse({ avatarColor: 'red' }).success).toBe(false);
    expect(directConversationInputSchema.safeParse({ userId: '' }).success).toBe(false);
    expect(messageCreateSchema.parse({ content: '  明天大厅见！  ' }).content).toBe('明天大厅见！');
    expect(messageCreateSchema.safeParse({ content: '   ' }).success).toBe(false);
  });
});
