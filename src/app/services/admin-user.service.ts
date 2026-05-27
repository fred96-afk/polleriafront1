import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import {
  ADMINISTRATIVE_ROLE_IDS,
  AdministrativeUser,
  getAdministrativeRoleName
} from '../models/admin-user.model';
import { UserRequest } from '../models/auth.model';
import { PagedResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly usersApiUrl = `${enviroment.backenbaseurl}/api/Users`;

  getAdministrativeUsers(): Observable<AdministrativeUser[]> {
    return this.http.get<unknown>(this.usersApiUrl).pipe(
      map((response) => this.extractCollection(response)),
      map((users) => users.map((user) => this.normalizeUser(user)).filter((user): user is AdministrativeUser => user !== null)),
      map((users) => users.filter((user) => ADMINISTRATIVE_ROLE_IDS.has(user.roleId)))
    );
  }

  getPagedAdministrativeUsers(pageNumber: number, pageSize: number): Observable<PagedResponse<AdministrativeUser>> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<unknown>(`${this.usersApiUrl}/paged`, { params }).pipe(
      map((response: any) => ({
        ...response,
        items: (response.items || []).map((user: any) => this.normalizeUser(user)).filter((user: any) => user !== null && ADMINISTRATIVE_ROLE_IDS.has(user.roleId))
      }))
    );
  }

  createAdministrativeUser(request: UserRequest): Observable<void> {
    if (!ADMINISTRATIVE_ROLE_IDS.has(request.roleId)) {
      throw new Error('Solo se permiten roles administrativos');
    }

    return this.http.post<void>(this.usersApiUrl, request);
  }

  updateAdministrativeUser(id: number, request: UserRequest): Observable<void> {
    if (!ADMINISTRATIVE_ROLE_IDS.has(request.roleId)) {
      throw new Error('Solo se permiten roles administrativos');
    }

    return this.http.put<void>(`${this.usersApiUrl}/${id}`, request);
  }

  private extractCollection(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const container = response as Record<string, unknown>;
    const candidateKeys = ['data', 'items', 'users', 'usuarios', 'value'];

    for (const key of candidateKeys) {
      const value = container[key];
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  private normalizeUser(raw: unknown): AdministrativeUser | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as Record<string, unknown>;
    const id = this.toNumber(source['id'] ?? source['Id']);
    const roleId = this.toNumber(source['roleId'] ?? source['RoleId']);
    const email = this.toString(source['email'] ?? source['Email']);
    const name = this.toString(source['name'] ?? source['Name']);
    const roleNameRaw = this.toString(source['roleName'] ?? source['RoleName'] ?? source['role'] ?? source['Role']);

    if (id === null || roleId === null) {
      return null;
    }

    return {
      id,
      roleId,
      email: email ?? 'Sin correo',
      name: name ?? 'Sin nombre',
      roleName: roleNameRaw ?? getAdministrativeRoleName(roleId)
    };
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
  }
}
