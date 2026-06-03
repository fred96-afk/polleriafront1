import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PusherService } from '../../services/pusher.service';
import { OrderResponse } from '../../models/order.model';
import { finalize, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-delivery-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './delivery-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryOrdersComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly catalogoService = inject(CatalogoService);
  public readonly authService = inject(AuthService);
  private readonly pusherService = inject(PusherService);
  private readonly toastService = inject(ToastrService);
  private readonly sanitizer = inject(DomSanitizer);

  private pusherSubscription?: Subscription;

  orders = signal<OrderResponse[]>([]);
  estados = signal<any[]>([]);
  loading = signal(false);
  activeTab = signal<'available' | 'my-deliveries'>('available');
  selectedOrderId = signal<number | null>(null);

  availableOrders = computed(() => 
    this.orders().filter(o => !o.deliveryUserId && o.status?.toLowerCase() === 'ready')
  );

  myDeliveries = computed(() => {
    const userId = this.authService.userId;
    return this.orders().filter(o => o.deliveryUserId === userId && o.status?.toLowerCase() !== 'delivered');
  });

  ngOnInit() {
    console.log('[DELIVERY] Componente de entregas cargado correctamente.');
    this.loadOrders();
    this.loadCatalogs();
    this.subscribeToPusher();
  }

  ngOnDestroy() {
    this.pusherSubscription?.unsubscribe();
  }

  subscribeToPusher() {
    // Escuchar nuevos pedidos
    this.pusherSubscription = this.pusherService.orderNotifications$.subscribe({
      next: (data) => {
        console.log('[DELIVERY] WebSocket: Nuevo pedido detectado!', data);
        this.toastService.info(`Nuevo pedido disponible (#${data.id || ''})`, '¡Nuevo Pedido!', {
          positionClass: 'toast-bottom-right'
        });
        this.loadOrders();
      }
    });

    // También podemos escuchar actualizaciones generales si el backend las emite
    this.pusherService.subscribeToChannel('orders-channel', 'order-updated-global', (data) => {
      console.log('[DELIVERY] WebSocket: Actualización global de pedido', data);
      this.loadOrders();
    });
  }

  loadCatalogs() {
    this.catalogoService.getEstadosPedido().subscribe({
        next: (data: any[]) => {
          console.log('[DELIVERY] Catálogo de estados cargado:', data);
          this.estados.set(data);
        },
        error: (err: any) => console.error('Error cargando estados:', err)
    });
  }

  loadOrders() {
    this.loading.set(true);
    // Usamos el nuevo endpoint específico para delivery
    this.orderService.getDeliveryOrders().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data: OrderResponse[]) => {
        console.log('[DELIVERY] Órdenes de delivery recibidas:', data);
        this.orders.set(data);
      },
      error: (err) => {
        console.error('[DELIVERY] Error cargando órdenes de delivery:', err);
        this.toastService.error('Error al cargar órdenes disponibles');
      }
    });
  }

  acceptOrder(id: number) {
    const userId = this.authService.userId;
    if (!userId) return;

    this.orderService.acceptDelivery(id, userId).subscribe({
      next: () => {
        this.toastService.success('Pedido asignado correctamente');
        this.loadOrders();
        this.activeTab.set('my-deliveries');
        this.selectedOrderId.set(id);
      },
      error: () => this.toastService.error('No se pudo asignar el pedido')
    });
  }

  toggleOrderDetails(id: number) {
    if (this.selectedOrderId() === id) {
      this.selectedOrderId.set(null);
    } else {
      this.selectedOrderId.set(id);
    }
  }

  updateStatus(id: number, technicalStatus: string) {
    // El backend en .NET usa "OnTheWay" (con 'The') para el estado en camino
    const backendStatus = technicalStatus === 'onway' ? 'OnTheWay' : 
                          technicalStatus === 'delivered' ? 'Delivered' : 
                          technicalStatus === 'preparing' ? 'Preparing' :
                          technicalStatus === 'pending' ? 'Pending' :
                          technicalStatus === 'cancelled' ? 'Cancelled' : technicalStatus;

    console.log(`[DELIVERY] Enviando actualización oficial para pedido ${id}:`, {
      valor: backendStatus
    });

    this.orderService.updateOrderStatus(id, backendStatus).subscribe({
      next: () => {
        this.toastService.success(`Estado actualizado a: ${backendStatus}`);
        this.loadOrders();
      },
      error: (err) => {
        console.group('%c [DELIVERY STATUS ERROR] ', 'background: #d32f2f; color: #fff; font-weight: bold;');
        console.error('Status:', err.status);
        console.error('Detalle:', err.error);
        console.groupEnd();

        const serverMsg = err.error?.errors ? JSON.stringify(err.error.errors) : (err.error?.title || 'Error desconocido');
        this.toastService.error(`Error ${err.status}: ${serverMsg}`, 'No se pudo actualizar', {
          timeOut: 8000
        });
      }
    });
  }

  openNavigation(address: string | null | undefined) {
    if (!address) return;
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  }

  getMapUrl(address: string | null | undefined): SafeResourceUrl {
    if (!address || address === 'RECOJO EN TIENDA') return '';
    const encodedAddress = encodeURIComponent(address);
    const freeUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(freeUrl);
  }

  getStatusLabel(status: string | null | undefined): string {
    switch (status?.toString().toLowerCase()) {
      case '1':
      case 'pendiente':
      case 'pending': return 'Pendiente';
      case '2':
      case 'en preparacion':
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo para envío';
      case '3':
      case 'en camino':
      case 'ontheway': return 'En camino';
      case '4':
      case 'entregado':
      case 'delivered': return 'Entregado';
      case '5':
      case 'anulado':
      case 'cancelled': return 'Cancelado';
      default: return status || 'Recibido';
    }
  }

  getStatusClass(status: string | null | undefined): string {
    switch (status?.toString().toLowerCase()) {
      case '1':
      case 'pendiente':
      case 'pending': return 'bg-orange-100 text-orange-700';
      case '2':
      case 'en preparacion':
      case 'preparing': return 'bg-blue-100 text-blue-700';
      case 'ready': return 'bg-yellow-100 text-yellow-700';
      case '3':
      case 'en camino':
      case 'ontheway': return 'bg-purple-100 text-purple-700';
      case '4':
      case 'entregado':
      case 'delivered': return 'bg-green-100 text-green-700';
      case '5':
      case 'anulado':
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
