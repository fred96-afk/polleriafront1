import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { AuthResponse, LoginRequest, UserRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../models/auth.model';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface UserToken {
  // Claves comunes en tokens JWT de .NET
  nameid?: string;
  sub?: string;
  id?: string;
  unique_name?: string;
  given_name?: string;
  name?: string;
  roleId?: string | number;
  RoleId?: string | number;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  email?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'?: string;
  role?: string;
  Role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backendbaseurl}/api/Auth`;
  
  private token = signal<string | null>(localStorage.getItem('token'));
  
  currentUser = computed(() => {
    const t = this.token();
    if (!t || t === 'undefined' || t === 'null') return null;
    try {
      return jwtDecode<UserToken>(t);
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  });

  private parseNumericClaim(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  get roleName(): string | null {
    const user = this.currentUser();
    if (!user) return null;

    const role = user['role'] || 
                 user['Role'] || 
                 user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                 user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];

    return typeof role === 'string' && role.trim() !== '' ? role.trim() : null;
  }

  get displayName(): string {
    const user = this.currentUser();
    if (!user) return 'Usuario';

    const candidateName = user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
      user.name ||
      user.unique_name ||
      user.given_name;

    if (typeof candidateName === 'string' && candidateName.trim() !== '') {
      return candidateName.trim();
    }

    const candidateEmail = user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      user.email;

    if (typeof candidateEmail === 'string' && candidateEmail.includes('@')) {
      return candidateEmail.split('@')[0];
    }

    return 'Usuario';
  }

  get email(): string | null {
    const user = this.currentUser();
    if (!user) return null;

    const candidateEmail = user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      user.email ||
      user.sub;

    return typeof candidateEmail === 'string' && candidateEmail.trim() !== ''
      ? candidateEmail.trim()
      : null;
  }

  get roleId(): number | null {
    const user = this.currentUser();
    if (!user) return null;

    const rawRoleId = user['roleId'] ?? 
                      user['RoleId'] ?? 
                      user['roleid'] ??
                      user['http://schemas.microsoft.com/ws/2008/06/identity/claims/roleid'];

    if (typeof rawRoleId === 'number' && Number.isFinite(rawRoleId)) {
      return rawRoleId;
    }

    if (typeof rawRoleId === 'string' && rawRoleId.trim() !== '') {
      const parsed = Number(rawRoleId);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  get userId(): number | null {
    const user = this.currentUser();
    if (!user) return null;

    const rawId = user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                  user['nameid'] || 
                  user['id'] ||
                  user['Id'] ||
                  user['sub'];

    return this.parseNumericClaim(rawId);
  }

  get clientId(): number | null {
    const user = this.currentUser();
    if (!user) {
      console.warn('[AUTH] No hay usuario logueado al intentar obtener clientId');
      return null;
    }

    const rawClientId = user['clientId'] ??
                        user['ClientId'] ??
                        user['clientid'] ??
                        user['http://schemas.microsoft.com/ws/2008/06/identity/claims/userdata'];

    return this.parseNumericClaim(rawClientId);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  adminLogin(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/adminlogin`, request).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  registerClient(request: UserRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/registerclient`, request);
  }

  verifyEmail(token: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/verify-email`, {
      params: { token },
      responseType: 'text'
    });
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/reset-password`, request, {
      responseType: 'text'
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
    this.token.set(token);
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  isAdministrator(): boolean {
    const name = this.roleName?.toLowerCase() || '';
    const id = this.roleId;
    return name.includes('admin') || id === 1;
  }

  isWaiter(): boolean {
    const name = this.roleName?.toLowerCase() || '';
    const id = this.roleId;
    return name.includes('mozo') || name.includes('waiter') || id === 2;
  }

  isDelivery(): boolean {
    const name = this.roleName?.toLowerCase() || '';
    const id = this.roleId;
    return name.includes('delivery') || id === 3;
  }

  canAccessAdminDashboard(): boolean {
    return this.isAdministrator();
  }

  canAccessPos(): boolean {
    // Permitir acceso al POS tanto a mozos como a administradores
    return this.isWaiter() || this.isAdministrator();
  }
}
