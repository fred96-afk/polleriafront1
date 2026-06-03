export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  permissionIds: number[];
}

export interface UpdateRoleRequest {
  name: string;
  permissionIds: number[];
}
