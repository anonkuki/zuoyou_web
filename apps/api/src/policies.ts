import { isDepartmentManagementRole, isExecutiveRole, type FileVisibility, type Role } from '@guild/contracts';

export interface Principal {
  role: Role;
  departmentId: string | null;
  departmentIds?: string[];
}

export interface FilePolicyResource {
  visibility: FileVisibility;
  departmentId: string | null;
  deletedAt: string | null;
}

export function canAccessDepartment(principal: Principal, departmentId: string): boolean {
  return isExecutiveRole(principal.role)
    || (isDepartmentManagementRole(principal.role) && principal.departmentId === departmentId);
}

export function canAccessFile(principal: Principal | null, file: FilePolicyResource): boolean {
  if (file.deletedAt) return false;
  if (file.visibility === 'PUBLIC') return true;
  if (!principal) return false;
  if (file.visibility === 'MEMBERS') return true;
  if (file.visibility === 'ADMINS') return isExecutiveRole(principal.role);
  return isExecutiveRole(principal.role) || principal.departmentId === file.departmentId || Boolean(file.departmentId && principal.departmentIds?.includes(file.departmentId));
}
