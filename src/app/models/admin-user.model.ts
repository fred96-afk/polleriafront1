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

export const ADMINISTRATIVE_ROLE_OPTIONS: AdministrativeRoleOption[] = [
  { id: 1, name: 'Administrador' },
  { id: 2, name: 'Mozo' },
  { id: 3, name: 'Delivery' }
];

export const ADMINISTRATIVE_ROLE_IDS = new Set(
  ADMINISTRATIVE_ROLE_OPTIONS.map((role) => role.id)
);

export function getAdministrativeRoleName(roleId: number): string {
  return ADMINISTRATIVE_ROLE_OPTIONS.find((role) => role.id === roleId)?.name ?? `Rol ${roleId}`;
}
