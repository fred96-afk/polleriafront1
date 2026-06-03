export interface AdministrativeRoleOption {
  id: number;
  name: string;
}

export interface AdministrativeUser {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
}

export function getAdministrativeRoleName(roleId: number): string {
  return `Rol ${roleId}`;
}
