import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import { ClienteRequest, ClienteResponse } from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Clientes`;

  getClientes(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(this.apiUrl);
  }

  getClienteById(id: number): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.apiUrl}/${id}`);
  }

  createCliente(request: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.apiUrl, request);
  }

  updateCliente(id: number, request: ClienteRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
