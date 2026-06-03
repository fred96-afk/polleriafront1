import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import { CreateRoleRequest, Permission, Role, UpdateRoleRequest } from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backendbaseurl}/api/Roles`;

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getRoleById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  createRole(request: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, request);
  }

  updateRole(id: number, request: UpdateRoleRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`);
  }
}
