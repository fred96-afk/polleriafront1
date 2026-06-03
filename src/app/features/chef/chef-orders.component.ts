import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { PusherService } from '../../services/pusher.service';
import { OrderResponse } from '../../models/order.model';
import { finalize, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-chef-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chef-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChefOrdersComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastrService);
  private readonly pusherService = inject(PusherService);
  public readonly authService = inject(AuthService);

  private pusherSubscription?: Subscription;

  orders = signal<OrderResponse[]>([]);
  loading = signal(false);
  selectedOrderId = signal<number | null>(null);

  pendingOrders = computed(() => 
    this.orders().filter(o => o.status?.toLowerCase() === 'pending' || o.status === '1')
  );

  preparingOrders = computed(() => 
    this.orders().filter(o => o.status?.toLowerCase() === 'inpreparation' || o.status === '2')
  );

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
        this.toastService.info(`Nuevo pedido recibido (#${data.id || ''})`, '¡Oído Cocina!', {
          positionClass: 'toast-top-right'
        });
        this.loadOrders();
      }
    });

    this.pusherService.subscribeToChannel('orders-channel', 'order-updated-global', () => {
      this.loadOrders();
    });
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getOrders().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => {
        this.orders.set(data);
      },
      error: () => this.toastService.error('Error al cargar pedidos para cocina')
    });
  }

  acceptOrder(id: number) {
    this.orderService.updateOrderStatus(id, 'InPreparation').subscribe({
      next: () => {
        this.toastService.success('Pedido en preparación');
        this.loadOrders();
      },
      error: () => this.toastService.error('Error al aceptar pedido')
    });
  }

  finishOrder(id: number) {
    this.orderService.updateOrderStatus(id, 'Ready').subscribe({
      next: () => {
        this.toastService.success('Pedido listo para entrega');
        this.loadOrders();
      },
      error: () => this.toastService.error('Error al finalizar pedido')
    });
  }

  toggleDetails(id: number) {
    this.selectedOrderId.set(this.selectedOrderId() === id ? null : id);
  }
}
