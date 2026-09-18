import { describe, expect, it } from 'vitest';
import { isNotificationEmail, maskContact, maskEmail, sanitizeAuditDetails } from '../src/privacy.js';

describe('personal information protection helpers', () => {
  it('masks email addresses and contact values without losing operational hints', () => {
    expect(maskEmail('member@example.com')).toBe('m***@example.com');
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
    expect(maskEmail('invalid@')).toBe('****lid@');
    expect(maskContact('13800000001')).toBe('*******0001');
    expect(maskContact('member@example.com')).toBe('m***@example.com');
  });

  it('sanitizes nested audit details before they are persisted', () => {
    expect(sanitizeAuditDetails({
      email: 'member@example.com',
      contact: '13800000001',
      password: 'Plaintext!2026',
      contacts: ['13800000002'],
      contactMethods: [{ value: 'wechat_lengj123' }],
      nested: { activationToken: 'secret-token', note: '联系 member@example.com，电话 13800000003' },
      tags: ['public', 'member@example.com'],
    })).toEqual({
      email: 'm***@example.com',
      contact: '*******0001',
      password: '[REDACTED]',
      contacts: ['*******0002'],
      contactMethods: [{ value: '***********j123' }],
      nested: { activationToken: '[REDACTED]', note: '联系 m***@example.com，电话 *******0003' },
      tags: ['public', 'm***@example.com'],
    });
  });

  it('accepts only deliverable-looking email addresses for notifications', () => {
    expect(isNotificationEmail('member@example.com')).toBe(true);
    expect(isNotificationEmail('user-123@registration.invalid')).toBe(false);
    expect(isNotificationEmail('13800000001')).toBe(false);
  });
});
