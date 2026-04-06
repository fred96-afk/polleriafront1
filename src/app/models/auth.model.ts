export interface LoginRequest {
  email?: string | null;
  password?: string | null;
}

export interface UserRequest {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  roleId: number;
}

export interface AuthResponse {
  token: string;
}
