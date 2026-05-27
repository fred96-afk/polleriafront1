import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import { EmpleadoRequest, EmpleadoResponse } from '../models/empleado.model';
import { PagedResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Empleados`;

  getEmpleados(): Observable<EmpleadoResponse[]> {
    return this.http.get<EmpleadoResponse[]>(this.apiUrl);
  }

  getPagedEmpleados(pageNumber: number, pageSize: number): Observable<PagedResponse<EmpleadoResponse>> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<PagedResponse<EmpleadoResponse>>(`${this.apiUrl}/paged`, { params });
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
