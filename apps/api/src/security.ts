import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), 64) as Buffer;
  const expected = Buffer.from(hashHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function encryptionKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptSecret(value: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

export function decryptSecret(value: string, secret: string): string {
  const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

