import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { ClientService } from '../../services/client.service';
import { OrderService } from '../../services/order.service';
import { ProductResponse } from '../../models/product.model';
import { ClientResponse } from '../../models/client.model';
import { OrderResponse } from '../../models/order.model';

@Component({
  selector: 'app-admin',
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <header class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 class="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        <p class="text-gray-500">Gestiona los recursos de tu pollería</p>
      </header>

      <!-- Tabs -->
      <div class="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-md">
        <button 
          (click)="activeTab.set('products')"
          [class.bg-orange-600]="activeTab() === 'products'"
          [class.text-white]="activeTab() === 'products'"
          class="flex-1 py-2 px-4 rounded-lg transition-all font-semibold text-gray-600 hover:bg-gray-50"
        >
          Productos
        </button>
        <button 
          (click)="activeTab.set('clients')"
          [class.bg-orange-600]="activeTab() === 'clients'"
          [class.text-white]="activeTab() === 'clients'"
          class="flex-1 py-2 px-4 rounded-lg transition-all font-semibold text-gray-600 hover:bg-gray-50"
        >
          Clientes
        </button>
        <button 
          (click)="activeTab.set('orders')"
          [class.bg-orange-600]="activeTab() === 'orders'"
          [class.text-white]="activeTab() === 'orders'"
          class="flex-1 py-2 px-4 rounded-lg transition-all font-semibold text-gray-600 hover:bg-gray-50"
        >
          Órdenes
        </button>
      </div>

      <!-- Tab Content -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        <!-- Products Tab -->
        @if (activeTab() === 'products') {
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-bold text-gray-800">Gestión de Productos</h2>
              <button class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                + Nuevo Producto
              </button>
            </div>
            <table class="w-full text-left">
              <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th class="px-6 py-4">Nombre</th>
                  <th class="px-6 py-4">Descripción</th>
                  <th class="px-6 py-4">Precio Base</th>
                  <th class="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (p of products(); track p.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-semibold text-gray-700">{{ p.name }}</td>
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ p.description }}</td>
                    <td class="px-6 py-4 text-orange-600 font-bold">S/ {{ p.basePrice.toFixed(2) }}</td>
                    <td class="px-6 py-4">
                      <div class="flex justify-center space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">✏️</button>
                        <button (click)="deleteProduct(p.id)" class="text-red-600 hover:text-red-800">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Clients Tab -->
        @if (activeTab() === 'clients') {
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-bold text-gray-800">Directorio de Clientes</h2>
              <button class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                + Nuevo Cliente
              </button>
            </div>
            <table class="w-full text-left">
              <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th class="px-6 py-4">Nombre</th>
                  <th class="px-6 py-4">Teléfono</th>
                  <th class="px-6 py-4">Dirección</th>
                  <th class="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (c of clients(); track c.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-semibold text-gray-700">{{ c.name }}</td>
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ c.phone }}</td>
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ c.address }}</td>
                    <td class="px-6 py-4">
                      <div class="flex justify-center space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">✏️</button>
                        <button class="text-red-600 hover:text-red-800">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Orders Tab -->
        @if (activeTab() === 'orders') {
          <div class="p-6">
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
                @for (o of orders(); track o.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-gray-700">#{{ o.id }}</td>
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ o.orderDate | date:'short' }}</td>
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ o.clientId || 'N/A' }}</td>
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ o.details?.length || 0 }} items</td>
                    <td class="px-6 py-4">
                      <div class="flex justify-center">
                        <button (click)="deleteOrder(o.id)" class="text-red-600 hover:text-red-800">🗑️ Cancelar</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  private readonly productService = inject(ProductService);
  private readonly clientService = inject(ClientService);
  private readonly orderService = inject(OrderService);

  activeTab = signal<'products' | 'clients' | 'orders'>('products');
  
  products = signal<ProductResponse[]>([]);
  clients = signal<ClientResponse[]>([]);
  orders = signal<OrderResponse[]>([]);

  constructor() {
    this.loadData();
  }

  loadData() {
    this.productService.getProducts().subscribe(data => this.products.set(data));
    this.clientService.getClients().subscribe(data => this.clients.set(data));
    this.orderService.getOrders().subscribe(data => this.orders.set(data));
  }

  deleteProduct(id: number) {
    if (confirm('¿Eliminar producto?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadData());
    }
  }

  deleteOrder(id: number) {
    if (confirm('¿Cancelar orden?')) {
      this.orderService.deleteOrder(id).subscribe(() => this.loadData());
    }
  }
}
