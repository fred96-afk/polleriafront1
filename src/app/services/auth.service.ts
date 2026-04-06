import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { AuthResponse, LoginRequest, UserRequest } from '../models/auth.model';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface UserToken {
  // Claves comunes en tokens JWT de .NET
  nameid?: string;
  sub?: string;
  id?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  email?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  role?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Auth`;
  
  private token = signal<string | null>(localStorage.getItem('token'));
  
  currentUser = computed(() => {
    const t = this.token();
    console.log('Token actual en localStorage:', t ? 'Presente' : 'No encontrado');
    if (!t || t === 'undefined' || t === 'null') return null;
    try {
      const decoded = jwtDecode<UserToken>(t);
      console.log('Token decodificado exitosamente:', decoded);
      return decoded;
    } catch (e) {
      console.error('Error crítico decodificando token:', e);
      return null;
    }
  });

  get userId(): number | null {
    const user = this.currentUser();
    if (!user) {
      console.warn('No hay usuario decodificado para extraer el ID');
      return null;
    }

    // Priorizar la clave larga de .NET que contiene el ID numérico ("4")
    const rawId = user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                  user.nameid || 
                  user.id ||
                  user.sub; // sub suele ser el email en .NET, dejarlo al final

    console.log('ID extraído (raw):', rawId);
    
    if (!rawId) {
      console.error('No se encontró ninguna clave de ID compatible en el token. Claves disponibles:', Object.keys(user));
      return null;
    }

    const numericId = parseInt(rawId, 10);
    if (isNaN(numericId)) {
      console.error('El ID extraído no es un número válido:', rawId);
      return null;
    }

    return numericId;
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

  register(request: UserRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request);
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
}
