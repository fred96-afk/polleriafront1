import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { OrderResponse } from '../../models/order.model';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersComponent {
  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastrService);
  orders = signal<OrderResponse[]>([]);
  loading = signal(false);

  constructor() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getOrders().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => this.orders.set(data),
      error: () => this.toastService.error('Error al cargar órdenes')
    });
  }

  deleteOrder(id: number) {
    if (confirm('¿Cancelar esta orden?')) {
      this.orderService.deleteOrder(id).subscribe({
        next: () => {
          this.toastService.success('Orden cancelada');
          this.loadOrders();
        },
        error: () => this.toastService.error('No se pudo cancelar')
      });
    }
  }
}
