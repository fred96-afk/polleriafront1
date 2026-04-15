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
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Pedidos`;

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

  updateOrderStatus(id: number, status: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, `"${status}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  updatePaymentStatus(id: number, status: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/payment-status`, `"${status}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  acceptDelivery(id: number, deliveryUserId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/accept-delivery`, deliveryUserId);
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
