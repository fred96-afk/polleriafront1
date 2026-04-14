import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import { PedidoRequest, PedidoResponse } from '../models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Pedidos`;

  getPedidos(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(this.apiUrl);
  }

  getPedidoById(id: number): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${this.apiUrl}/${id}`);
  }

  createPedido(request: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(this.apiUrl, request);
  }

  updatePedido(id: number, request: PedidoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deletePedido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
