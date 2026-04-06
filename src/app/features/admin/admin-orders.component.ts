import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { OrderResponse } from '../../models/order.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <h2 class="text-xl font-bold text-gray-800 mb-6">Historial de Órdenes</h2>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
          <tr>
            <th class="px-6 py-4">ID</th>
            <th class="px-6 py-4">Fecha</th>
            <th class="px-6 py-4">Cliente ID</th>
            <th class="px-6 py-4">Detalles</th>
            <th class="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <tr class="animate-pulse">
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-12"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-32"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-16"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-20"></div></td>
                <td class="px-6 py-4"><div class="flex justify-center"><div class="h-4 bg-gray-200 rounded w-20"></div></div></td>
              </tr>
            }
          } @else {
            @for (o of orders(); track o.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-bold text-gray-700">#{{ o.id }}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">{{ o.orderDate | date:'short' }}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">{{ o.clientId || 'N/A' }}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">{{ o.details?.length || 0 }} items</td>
                <td class="px-6 py-4">
                  <div class="flex justify-center">
                    <button (click)="deleteOrder(o.id)" class="text-red-600 hover:text-red-800 flex items-center gap-1 font-bold text-sm">
                      <span class="material-icons-outlined text-base">cancel</span> Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersComponent {
  private readonly orderService = inject(OrderService);
  orders = signal<OrderResponse[]>([]);
  loading = signal(false);

  constructor() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getOrders().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(data => this.orders.set(data));
  }

  deleteOrder(id: number) {
    if (confirm('¿Cancelar orden?')) {
      this.orderService.deleteOrder(id).subscribe(() => this.loadOrders());
    }
  }
}
