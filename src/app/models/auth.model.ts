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

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  roleId: number;
  isVerified: boolean;
  verificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetTokenExpiresAt?: string | null;
}

export interface AuthResponse {
  token: string;
}

export interface ForgotPasswordRequest {
  email?: string | null;
}

export interface ResetPasswordRequest {
  token?: string | null;
  newPassword?: string | null;
}
