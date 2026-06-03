import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { DashboardStats, DashboardStatsResponse } from '../models/dashboard.model';
import { ClientService } from './client.service';
import { catchError, combineLatest, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly clientService = inject(ClientService);
  private readonly apiUrl = `${enviroment.backendbaseurl}/api/Dashboard`;

  getStats(): Observable<DashboardStats> {
    return combineLatest({
      dashboard: this.http.get<DashboardStatsResponse>(this.apiUrl),
      clients: this.clientService.getClients().pipe(catchError(() => of([])))
    }).pipe(
      map(({ dashboard, clients }) => ({
        totalSales: Number(dashboard.totalSales ?? dashboard.totalRevenue ?? 0),
        totalOrders: Number(dashboard.totalOrders ?? 0),
        pendingOrders: Number(dashboard.pendingOrders ?? 0),
        totalProducts: Number(dashboard.totalProducts ?? 0),
        totalCustomers: dashboard.totalCustomers ?? clients.length,
        recentOrders: (dashboard.recentOrders ?? []).map((order) => ({
          id: Number(order.id ?? 0),
          clientName: order.clientName ?? 'Cliente',
          totalAmount: Number(order.totalAmount ?? order.total ?? 0),
          orderDate: order.orderDate ?? order.date ?? ''
        })),
        topProducts: (dashboard.topProducts ?? []).map((product) => ({
          name: product.name ?? product.productName ?? 'Sin nombre',
          quantity: Number(product.quantity ?? product.quantitySold ?? 0)
        })),
        salesByDay: (dashboard.salesByDay ?? dashboard.salesLast7Days ?? []).map((sale) => ({
          date: sale.date ?? sale.day ?? '',
          amount: Number(sale.amount ?? sale.total ?? 0)
        }))
      }))
    );
  }
}
