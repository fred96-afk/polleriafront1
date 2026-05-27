import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { OrderRequest, OrderResponse } from '../models/order.model';
import { PagedResponse } from '../models/product.model';
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

  getPagedOrders(pageNumber: number, pageSize: number): Observable<PagedResponse<OrderResponse>> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<PagedResponse<OrderResponse>>(`${this.apiUrl}/paged`, { params });
  }

  getDeliveryOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/delivery`);
  }

  getOrderById(id: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/${id}`);
  }

  getOrderTracking(id: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/rastreo/${id}`);
  }

  createOrder(request: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, request);
  }

  generateInvoice(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/invoice`, {});
  }

  updateOrderStatus(id: number, status: string): Observable<void> {
    const body = { status: status, valor: status }; // Enviamos ambos por si acaso según el nuevo schema StatusUpdateRequest
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, body, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  updatePaymentStatus(id: number, status: string): Observable<void> {
    const body = { status: status, valor: status };
    return this.http.patch<void>(`${this.apiUrl}/${id}/payment-status`, body, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  acceptDelivery(id: number, deliveryUserId: number): Observable<void> {
    const body = { deliveryUserId: deliveryUserId }; // Según AcceptDeliveryRequest schema
    return this.http.post<void>(`${this.apiUrl}/${id}/accept-delivery`, body, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
