import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import { EmpleadoRequest, EmpleadoResponse } from '../models/empleado.model';

@Injectable({
  providedIn: 'root',
})
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Empleados`;

  getEmpleados(): Observable<EmpleadoResponse[]> {
    return this.http.get<EmpleadoResponse[]>(this.apiUrl);
  }

  getEmpleadoById(id: number): Observable<EmpleadoResponse> {
    return this.http.get<EmpleadoResponse>(`${this.apiUrl}/${id}`);
  }

  createEmpleado(request: EmpleadoRequest): Observable<EmpleadoResponse> {
    return this.http.post<EmpleadoResponse>(this.apiUrl, request);
  }

  updateEmpleado(id: number, request: EmpleadoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
