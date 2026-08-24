import { describe, expect, it } from 'vitest';
import {
  ActivityStatusSchema,
  AnnouncementCategorySchema,
  ApplicationStatusSchema,
  FileVisibilitySchema,
  announcementInputSchema,
  avatarConfigSchema,
  avatarKlasses,
  avatarStyles,
  deriveAvatarConfig,
  resolveAvatarConfig,
  homeDataSchema,
  RoleSchema,
  WorkStatusSchema,
  pageQuerySchema,
  ConversationTypeSchema,
  ProfileVisibilitySchema,
  directConversationInputSchema,
  memberProfileUpdateSchema,
  messageCreateSchema,
  postRatingSchema,
} from '../src/index.js';

describe('shared contracts', () => {
  it('accepts only the exact role values', () => {
    expect(RoleSchema.options).toEqual(['MEMBER', 'DEPARTMENT_ADMIN', 'DEPARTMENT_HEAD', 'VICE_PRESIDENT', 'PRESIDENT']);
    expect(RoleSchema.safeParse('OWNER').success).toBe(false);
  });

  it('keeps workflow and visibility enums exact', () => {
    expect(ActivityStatusSchema.options).toEqual(['PREPARING', 'REGISTRATION', 'IN_PROGRESS', 'ENDED', 'ARCHIVED']);
    expect(ApplicationStatusSchema.options).toEqual(['PENDING', 'APPROVED', 'REJECTED']);
    expect(WorkStatusSchema.options).toEqual(['PENDING', 'PUBLISHED', 'REJECTED']);
    expect(FileVisibilitySchema.options).toEqual(['PUBLIC', 'MEMBERS', 'DEPARTMENT', 'ADMINS']);
  });

  it('accepts only upvote, downvote, or rating removal', () => {
    expect([-1, 0, 1].every((value) => postRatingSchema.safeParse({ value }).success)).toBe(true);
    expect(postRatingSchema.safeParse({ value: 2 }).success).toBe(false);
    expect(postRatingSchema.safeParse({ value: '1' }).success).toBe(false);
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

  it('supports avatar styles and stays compatible with legacy configs without style', () => {
    expect(avatarStyles).toEqual(['chibi', 'mame', 'sharp']);
    expect(avatarKlasses).toHaveLength(8);
    // 旧数据：无 style/klass，且带有已废弃的 outfit 字段与 cap 配饰
    const legacy = { skin: 'warm', hairStyle: 'bun', hairColor: 'black', eyes: 'closed', outfit: 'hanfu', accessory: 'cap', accent: 'gold' };
    const parsed = avatarConfigSchema.parse(legacy);
    expect(parsed.style).toBe('chibi');
    expect(parsed.klass).toBe('knight');
    expect(parsed.accessory).toBe('none'); // cap 已废弃，catch 为 none
    expect('outfit' in parsed).toBe(false); // outfit 键被剥离
    expect(avatarConfigSchema.parse({ ...legacy, style: 'mame', klass: 'mage' })).toMatchObject({ style: 'mame', klass: 'mage' });
    expect(avatarConfigSchema.safeParse({ ...legacy, style: 'pixel' }).success).toBe(false);
    expect(avatarConfigSchema.safeParse({ ...legacy, klass: 'paladin' }).success).toBe(false);
    // 旧库存储的 JSON 没有 style/klass 字段，resolve 后应回退而不是丢弃整份配置
    const resolved = resolveAvatarConfig('user-legacy', JSON.stringify(legacy));
    expect(resolved).toMatchObject({ skin: 'warm', hairStyle: 'bun', style: 'chibi', klass: 'knight', accessory: 'none' });
    expect(avatarStyles).toContain(resolveAvatarConfig('user-legacy', 'not-json').style);
    expect(avatarKlasses).toContain(deriveAvatarConfig('user-legacy').klass);
  });
});
