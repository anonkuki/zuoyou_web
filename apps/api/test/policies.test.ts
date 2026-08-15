import { describe, expect, it } from 'vitest';
import { canAccessDepartment, canAccessFile } from '../src/policies.js';
import { canTransitionActivity } from '../src/activity.js';
import { calculateContribution } from '../src/contribution.js';
import { consumeActivationToken, createActivationToken } from '../src/activation.js';

describe('RBAC policies', () => {
  it('gives admins global scope and leads only their department', () => {
    expect(canAccessDepartment({ role: 'ADMIN', departmentId: null }, 'dept-b')).toBe(true);
    expect(canAccessDepartment({ role: 'DEPARTMENT_LEAD', departmentId: 'dept-a' }, 'dept-a')).toBe(true);
    expect(canAccessDepartment({ role: 'DEPARTMENT_LEAD', departmentId: 'dept-a' }, 'dept-b')).toBe(false);
    expect(canAccessDepartment({ role: 'MEMBER', departmentId: 'dept-a' }, 'dept-a')).toBe(false);
  });
});

describe('activity lifecycle', () => {
  it('allows only the specified forward transitions', () => {
    expect(canTransitionActivity('PREPARING', 'REGISTRATION')).toBe(true);
    expect(canTransitionActivity('REGISTRATION', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionActivity('IN_PROGRESS', 'ENDED')).toBe(true);
    expect(canTransitionActivity('ENDED', 'ARCHIVED')).toBe(true);
    expect(canTransitionActivity('PREPARING', 'IN_PROGRESS')).toBe(false);
    expect(canTransitionActivity('ENDED', 'REGISTRATION')).toBe(false);
  });
});

describe('contribution formula', () => {
  it('derives points from confirmed events and counts each event once', () => {
    expect(calculateContribution([
      { eventId: 'task-1', kind: 'TASK_CONFIRMED' },
      { eventId: 'task-1', kind: 'TASK_CONFIRMED' },
      { eventId: 'activity-1', kind: 'ACTIVITY_CHECK_IN' },
      { eventId: 'work-1', kind: 'WORK_PUBLISHED' },
    ])).toEqual({ points: 18, eventCount: 3 });
  });
});

describe('activation tokens', () => {
  it('expires after seven days, is hashed at rest, and is one-time', () => {
    const issued = new Date('2026-08-01T00:00:00.000Z');
    const { rawToken, record } = createActivationToken('user-1', issued);
    expect(record.tokenHash).not.toContain(rawToken);
    expect(consumeActivationToken(record, rawToken, new Date('2026-08-07T23:59:59.000Z')).ok).toBe(true);
    expect(consumeActivationToken({ ...record, usedAt: issued.toISOString() }, rawToken, issued).ok).toBe(false);
    expect(consumeActivationToken(record, rawToken, new Date('2026-08-08T00:00:01.000Z')).ok).toBe(false);
  });
});

describe('file visibility', () => {
  const member = { role: 'MEMBER' as const, departmentId: 'dept-a' };
  it('enforces public, member, department and admin visibility', () => {
    expect(canAccessFile(null, { visibility: 'PUBLIC', departmentId: null, deletedAt: null })).toBe(true);
    expect(canAccessFile(null, { visibility: 'MEMBERS', departmentId: null, deletedAt: null })).toBe(false);
    expect(canAccessFile(member, { visibility: 'DEPARTMENT', departmentId: 'dept-a', deletedAt: null })).toBe(true);
    expect(canAccessFile(member, { visibility: 'DEPARTMENT', departmentId: 'dept-b', deletedAt: null })).toBe(false);
    expect(canAccessFile(member, { visibility: 'ADMINS', departmentId: null, deletedAt: null })).toBe(false);
    expect(canAccessFile({ role: 'ADMIN', departmentId: null }, { visibility: 'ADMINS', departmentId: null, deletedAt: null })).toBe(true);
    expect(canAccessFile({ role: 'ADMIN', departmentId: null }, { visibility: 'PUBLIC', departmentId: null, deletedAt: '2026-01-01' })).toBe(false);
  });

  it('allows access for every department a member has joined', () => {
    const multiDepartmentMember = { role: 'MEMBER' as const, departmentId: 'dept-a', departmentIds: ['dept-a', 'dept-b'] };
    expect(canAccessFile(multiDepartmentMember, { visibility: 'DEPARTMENT', departmentId: 'dept-a', deletedAt: null })).toBe(true);
    expect(canAccessFile(multiDepartmentMember, { visibility: 'DEPARTMENT', departmentId: 'dept-b', deletedAt: null })).toBe(true);
    expect(canAccessFile(multiDepartmentMember, { visibility: 'DEPARTMENT', departmentId: 'dept-c', deletedAt: null })).toBe(false);
  });
});
