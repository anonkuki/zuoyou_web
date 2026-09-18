import { z } from 'zod';

const emailPattern = /([\p{L}\p{N}._%+-]+)@([\p{L}\p{N}.-]+\.[\p{L}]{2,})/gu;
const phonePattern = /(?<!\d)(1[3-9]\d{9})(?!\d)/g;
const secretKeyPattern = /(password|passwd|secret|token|cookie|authorization|session)/i;

export function isNotificationEmail(value: string): boolean {
  const normalized = value.trim();
  if (!z.email().safeParse(normalized).success) return false;
  const domain = normalized.slice(normalized.lastIndexOf('@') + 1).toLowerCase();
  return domain !== 'invalid' && !domain.endsWith('.invalid');
}

export function maskEmail(value: string): string {
  const normalized = value.trim();
  const match = normalized.match(/^([^@]+)@([^@]+)$/);
  if (!match) {
    const characters = Array.from(normalized);
    if (characters.length <= 4) return '*'.repeat(characters.length);
    return `${'*'.repeat(characters.length - 4)}${characters.slice(-4).join('')}`;
  }
  return `${Array.from(match[1])[0] ?? '*'}***@${match[2]}`;
}

export function maskContact(value: string): string {
  const normalized = value.trim();
  if (normalized.includes('@')) return maskEmail(normalized);
  const characters = Array.from(normalized);
  if (characters.length <= 4) return '*'.repeat(characters.length);
  return `${'*'.repeat(characters.length - 4)}${characters.slice(-4).join('')}`;
}

function sanitizeText(value: string): string {
  return value
    .replace(emailPattern, (_match, local: string, domain: string) => `${Array.from(local)[0] ?? '*'}***@${domain}`)
    .replace(phonePattern, (phone) => maskContact(phone));
}

export function sanitizeAuditDetails(value: unknown, key = '', contactContext = /contact|phone|mobile/i.test(key)): unknown {
  if (secretKeyPattern.test(key)) return '[REDACTED]';
  if (typeof value === 'string') {
    if (/email/i.test(key)) return maskEmail(value);
    if (contactContext) return maskContact(value);
    return sanitizeText(value);
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditDetails(item, key, contactContext));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      sanitizeAuditDetails(childValue, childKey, contactContext || /contact|phone|mobile/i.test(childKey)),
    ]));
  }
  return value;
}
