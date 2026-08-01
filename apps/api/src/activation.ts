import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface ActivationRecord {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createActivationToken(userId: string, issuedAt = new Date()): { rawToken: string; record: ActivationRecord } {
  const rawToken = randomBytes(24).toString('base64url');
  return {
    rawToken,
    record: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(issuedAt.getTime() + SEVEN_DAYS_MS).toISOString(),
      usedAt: null,
    },
  };
}

export function consumeActivationToken(record: ActivationRecord, rawToken: string, now = new Date()): { ok: boolean } {
  if (record.usedAt || now.getTime() > new Date(record.expiresAt).getTime()) return { ok: false };
  const actual = Buffer.from(hashToken(rawToken), 'hex');
  const expected = Buffer.from(record.tokenHash, 'hex');
  return { ok: actual.length === expected.length && timingSafeEqual(actual, expected) };
}

