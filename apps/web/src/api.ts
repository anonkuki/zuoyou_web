import type { AvatarConfig } from '@guild/contracts';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const AUTH_SESSION_EXPIRED_EVENT = 'guild:auth-session-expired';

function notifyExpiredSession(path: string, status: number) {
  if (status !== 401 || typeof window === 'undefined' || path.startsWith('/api/auth/login') || path.startsWith('/api/auth/activate')) return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: init?.body instanceof FormData
      ? init.headers
      : init?.body === undefined
        ? init?.headers
        : { 'Content-Type': 'application/json', ...init?.headers },
  });
  notifyExpiredSession(path, response.status);
  let envelope: ApiEnvelope<T>;
  try {
    envelope = await response.json() as ApiEnvelope<T>;
  } catch {
    throw new ApiError(response.status, 'INVALID_RESPONSE', response.ok ? '服务器返回了无法识别的响应' : '请求失败');
  }
  if (!response.ok || !envelope.ok || envelope.data === undefined) {
    throw new ApiError(response.status, envelope.error?.code ?? 'REQUEST_FAILED', envelope.error?.message ?? '请求失败');
  }
  return envelope.data;
}

export function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export interface PageData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface User {
  id: string;
  uid: string;
  username: string | null;
  displayName: string;
  email: string;
  role: 'MEMBER' | 'DEPARTMENT_ADMIN' | 'DEPARTMENT_HEAD' | 'VICE_PRESIDENT' | 'PRESIDENT';
  departmentId: string | null;
  departmentIds?: string[];
  bio: string;
  guildTitle: string;
  college: string;
  grade: string;
  skills: string[];
  interests: string[];
  attributes?: string[];
  avatarColor: string;
  avatarConfig?: AvatarConfig | null;
  avatarUrl?: string | null;
  profileVisibility: 'MEMBERS' | 'PRIVATE';
  lastSeenAt?: string | null;
}
