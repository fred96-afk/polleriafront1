import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { OrderResponse } from '../../models/order.model';
import { PusherService } from '../../services/pusher.service';

@Component({
  selector: 'app-order-tracking',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-tracking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderTrackingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly pusherService = inject(PusherService);

  orderId = signal<number | null>(null);
  order = signal<OrderResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Estados posibles basados en el JSON (Pending, Preparing, etc.)
  orderStatus = computed(() => this.order()?.status?.toLowerCase() || 'pending');

  orderProgress = computed(() => {
    const status = this.orderStatus();
    switch (status) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'onway': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId.set(Number(id));
      this.fetchOrder();
      this.subscribeToUpdates();
    } else {
      this.loading.set(false);
      this.error.set('No se proporcionó un ID de pedido válido.');
    }
  }

  fetchOrder() {
    const id = this.orderId();
    if (!id) return;

    this.loading.set(true);
    this.orderService.getOrderById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching order:', err);
        this.error.set('No se pudo cargar la información del pedido.');
        this.loading.set(false);
      }
    });
  }

  subscribeToUpdates() {
    const id = this.orderId();
    if (!id) return;

    // Suscribirse a un canal específico para este pedido si el backend lo soporta
    // O escuchar en el canal general y filtrar
    this.pusherService.subscribeToChannel('orders-channel', `order-updated-${id}`, (data: any) => {
      console.log('Order update received:', data);
      this.fetchOrder(); // Recargar datos cuando hay actualización
    });
  }

  getStatusClass(step: number) {
    const current = this.orderStatus();
    let stepActive = false;
    
    switch (step) {
      case 1: stepActive = ['pending', 'preparing', 'onway', 'delivered'].includes(current); break;
      case 2: stepActive = ['preparing', 'onway', 'delivered'].includes(current); break;
      case 3: stepActive = ['onway', 'delivered'].includes(current); break;
      case 4: stepActive = ['delivered'].includes(current); break;
    }

    if (stepActive) return 'bg-orange-600 text-white';
    return 'bg-gray-200 text-gray-400';
  }

  getStatusLabel() {
    switch (this.orderStatus()) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'onway': return 'En camino';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return this.order()?.status || 'Recibido';
    }
  }
}
