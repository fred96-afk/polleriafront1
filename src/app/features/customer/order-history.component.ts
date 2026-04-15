import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { OrderResponse } from '../../models/order.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-order-history',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderHistoryComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);

  orders = signal<OrderResponse[]>([]);
  expandedOrderId = signal<number | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.orderService.getOrders().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => {
        // Ordenar pedidos por fecha (más recientes primero)
        const sorted = data.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          return dateB - dateA;
        });
        this.orders.set(sorted);
      },
      error: (err) => {
        console.error('Error loading history data:', err);
        this.error.set('No se pudo cargar tu historial de pedidos.');
      }
    });
  }

  toggleDetails(orderId: number) {
    if (this.expandedOrderId() === orderId) {
      this.expandedOrderId.set(null);
    } else {
      this.expandedOrderId.set(orderId);
    }
  }

  getStatusLabel(status: string | null | undefined): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'onway': return 'En camino';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status || 'Recibido';
    }
  }

  getStatusClass(status: string | null | undefined): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'preparing': return 'bg-blue-100 text-blue-700';
      case 'onway': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
