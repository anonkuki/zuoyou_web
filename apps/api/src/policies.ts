import type { FileVisibility, Role } from '@guild/contracts';

export interface Principal {
  role: Role;
  departmentId: string | null;
}

export interface FilePolicyResource {
  visibility: FileVisibility;
  departmentId: string | null;
  deletedAt: string | null;
}

export function canAccessDepartment(principal: Principal, departmentId: string): boolean {
  return principal.role === 'ADMIN'
    || (principal.role === 'DEPARTMENT_LEAD' && principal.departmentId === departmentId);
}

export function canAccessFile(principal: Principal | null, file: FilePolicyResource): boolean {
  if (file.deletedAt) return false;
  if (file.visibility === 'PUBLIC') return true;
  if (!principal) return false;
  if (file.visibility === 'MEMBERS') return true;
  if (file.visibility === 'ADMINS') return principal.role === 'ADMIN';
  return principal.role === 'ADMIN' || principal.departmentId === file.departmentId;
}

