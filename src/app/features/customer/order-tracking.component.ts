import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { OrderResponse } from '../../models/order.model';
import { PusherService } from '../../services/pusher.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-tracking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderTrackingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  public readonly authService = inject(AuthService);
  private readonly pusherService = inject(PusherService);

  orderId = signal<number | null>(null);
  order = signal<OrderResponse | null>(null);
  activeOrders = signal<OrderResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchId = '';

  // Estados posibles: 1-Pendiente, 2-En preparacion, 3-En camino, 4-Entregado, 5-Anulado
  orderStatus = computed(() => {
    const s = this.order()?.status;
    if (s === null || s === undefined) return 'pendiente';
    return s.toString().toLowerCase();
  });

  orderProgress = computed(() => {
    const status = this.orderStatus();
    if (status === '1' || status.includes('pend')) return 1;
    if (status === '2' || status.includes('prepar') || status.includes('cocina') || status.includes('preparing')) return 2;
    if (status === '3' || status.includes('camino') || status.includes('onway') || status.includes('way') || status.includes('shipped')) return 3;
    if (status === '4' || status.includes('entreg') || status.includes('deliv') || status.includes('completed')) return 4;
    return 1;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId.set(Number(id));
        this.fetchOrder();
        this.subscribeToUpdates();
      } else {
        this.orderId.set(null);
        this.order.set(null);
        this.loadActiveOrders();
      }
    });
  }

  loadActiveOrders() {
    if (!this.authService.isAuthenticated()) {
      this.loading.set(false);
      return;
    }

    const currentUserId = this.authService.userId;
    this.loading.set(true);
    
    this.orderService.getOrders().subscribe({
      next: (data) => {
        // Mostramos TODOS los pedidos del usuario, ordenados por los más recientes
        const allOrders = data.filter(o => o.userId === currentUserId)
                              .sort((a, b) => b.id - a.id);
        
        this.activeOrders.set(allOrders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    if (this.searchId.trim()) {
      this.router.navigate(['/order-tracking', this.searchId.trim()]);
    }
  }

  fetchOrder() {
    const id = this.orderId();
    if (!id) return;

    this.loading.set(true);
    this.orderService.getOrderTracking(id).subscribe({
      next: (data) => {
        console.log('[TRACKING] Datos recibidos:', data);
        this.order.set(data);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('[TRACKING] Error:', err);
        this.error.set('No encontramos información para el pedido #' + id);
        this.loading.set(false);
      }
    });
  }

  subscribeToUpdates() {
    const id = this.orderId();
    if (!id) return;

    this.pusherService.subscribeToChannel('orders-channel', `order-updated-${id}`, (data: any) => {
      console.log('[TRACKING] Pusher Update:', data);
      this.fetchOrder(); 
    });
  }

  getStatusClass(step: number) {
    const progress = this.orderProgress();
    if (progress >= step) return 'bg-orange-600 text-white shadow-lg shadow-orange-200';
    return 'bg-gray-100 text-gray-300';
  }

  getStatusLabel(status?: any): string {
    const s = (status || this.orderStatus()).toString().toLowerCase();
    
    if (s === '1' || s.includes('pend')) return 'Recibido';
    if (s.includes('accept')) return 'Confirmado';
    if (s === '2' || s.includes('prepar') || s.includes('cocina') || s.includes('preparing')) return 'En Cocina';
    if (s === '3' || s.includes('camino') || s.includes('way') || s.includes('shipped')) return 'En Camino';
    if (s === '4' || s.includes('entreg') || s.includes('deliv') || s.includes('completed')) return '¡Entregado!';
    if (s === '5' || s.includes('anul') || s.includes('cancel')) return 'Cancelado';
    
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  getStatusColor(status: any): string {
    const s = status?.toString().toLowerCase() || '';
    if (s === '1' || s.includes('pend')) return 'bg-blue-50 text-blue-600';
    if (s === '2' || s.includes('prepar') || s.includes('cocina') || s.includes('preparing')) return 'bg-orange-50 text-orange-600';
    if (s === '3' || s.includes('camino') || s.includes('way') || s.includes('shipped')) return 'bg-purple-50 text-purple-600';
    if (s === '4' || s.includes('entreg') || s.includes('deliv') || s.includes('completed')) return 'bg-green-50 text-green-600';
    if (s === '5' || s.includes('anul') || s.includes('cancel')) return 'bg-red-50 text-red-600';
    return 'bg-gray-50 text-gray-600';
  }

  getIconForStatus(status: any): string {
    const s = status?.toString().toLowerCase() || '';
    if (s === '4' || s.includes('entreg') || s.includes('deliv') || s.includes('completed')) return 'verified';
    if (s === '3' || s.includes('camino') || s.includes('way') || s.includes('shipped')) return 'motorcycle';
    if (s === '5' || s.includes('anul') || s.includes('cancel')) return 'error_outline';
    return 'restaurant';
  }

  isCompleted(status: any): boolean {
    const s = status?.toString().toLowerCase() || '';
    return s === '4' || s.includes('entreg') || s.includes('deliv') || s.includes('completed');
  }
}
