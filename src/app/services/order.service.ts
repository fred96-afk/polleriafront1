import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { OrderRequest, OrderResponse } from '../models/order.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Orders`;

  getOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(this.apiUrl);
  }

  getOrderById(id: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/${id}`);
  }

  createOrder(request: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, request);
  }

  generateInvoice(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/invoice`, {});
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
