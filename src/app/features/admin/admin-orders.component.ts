import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { OrderResponse } from '../../models/order.model';
import { finalize, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { PusherService } from '../../services/pusher.service';

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastrService);
  private readonly pusherService = inject(PusherService);
  
  private pusherSubscription?: Subscription;

  orders = signal<OrderResponse[]>([]);
  loading = signal(false);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  totalCount = signal(0);

  ngOnInit() {
    this.loadOrders();
    this.subscribeToPusher();
  }

  ngOnDestroy() {
    this.pusherSubscription?.unsubscribe();
  }

  subscribeToPusher() {
    this.pusherSubscription = this.pusherService.orderNotifications$.subscribe({
      next: (data) => {
        console.log('[ADMIN] WebSocket: Nuevo pedido detectado!', data);
        this.toastService.info(`Nuevo pedido recibido (#${data.id || ''})`, '¡Venta en Línea!');
        this.loadOrders();
      }
    });

    this.pusherService.subscribeToChannel('orders-channel', 'order-updated-global', () => {
      this.loadOrders();
    });
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getPagedOrders(this.currentPage(), this.pageSize()).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => {
        // Ordenar por ID descendente por si el backend no lo hace
        const sortedItems = [...data.items].sort((a, b) => b.id - a.id);
        this.orders.set(sortedItems);
        this.totalPages.set(data.totalPages);
        this.totalCount.set(data.totalCount);
      },
      error: () => {
        // Fallback si el endpoint /paged falla (tal vez no existe aún en el backend)
        this.orderService.getOrders().pipe(
          finalize(() => this.loading.set(false))
        ).subscribe({
          next: (data) => {
            const sorted = data.sort((a, b) => b.id - a.id);
            this.totalCount.set(sorted.length);
            this.totalPages.set(Math.ceil(sorted.length / this.pageSize()));
            
            const start = (this.currentPage() - 1) * this.pageSize();
            const end = start + this.pageSize();
            this.orders.set(sorted.slice(start, end));
          },
          error: () => this.toastService.error('Error al cargar órdenes')
        });
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
    }
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
