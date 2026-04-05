import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { ProductResponse } from '../../models/product.model';
import { OrderDetailRequest } from '../../models/order.model';

interface CartItem extends ProductResponse {
  quantity: number;
}

@Component({
  selector: 'app-sales',
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col space-y-6">
      <header class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 class="text-2xl font-bold text-gray-800">Nueva Venta</h1>
        <div class="flex items-center space-x-4">
          <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold border border-orange-200">
            Mesa: #1 (Simulado)
          </span>
        </div>
      </header>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Product Grid -->
        <div class="lg:col-span-2 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            @for (product of products(); track product.id) {
              <button 
                (click)="addToCart(product)"
                class="bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-orange-500 hover:shadow-md transition-all text-left"
              >
                <div class="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-3xl">
                   🍗
                </div>
                <h3 class="font-bold text-gray-800">{{ product.name }}</h3>
                <p class="text-xs text-gray-500 line-clamp-2 mb-2">{{ product.description }}</p>
                <div class="flex justify-between items-center">
                  <span class="text-orange-600 font-bold">S/ {{ product.basePrice.toFixed(2) }}</span>
                  <span class="bg-gray-100 p-1 rounded text-xs">+ Agregar</span>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Order Summary (Cart) -->
        <div class="bg-white rounded-xl shadow-lg flex flex-col sticky top-6 max-h-[calc(100vh-160px)]">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-xl font-bold text-gray-800 flex items-center">
              <span class="mr-2">📋</span> Resumen de Orden
            </h2>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            @if (cart().length === 0) {
              <div class="text-center py-10 text-gray-400">
                <div class="text-4xl mb-2">🛒</div>
                <p>El carrito está vacío</p>
              </div>
            } @else {
              @for (item of cart(); track item.id) {
                <div class="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-700 text-sm">{{ item.name }}</h4>
                    <p class="text-xs text-gray-500">S/ {{ item.basePrice.toFixed(2) }} x {{ item.quantity }}</p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button (click)="removeFromCart(item.id)" class="text-gray-400 hover:text-red-500 p-1 text-lg">-</button>
                    <span class="font-bold min-w-[20px] text-center">{{ item.quantity }}</span>
                    <button (click)="addToCart(item)" class="text-gray-400 hover:text-orange-500 p-1 text-lg">+</button>
                  </div>
                  <div class="ml-4 font-bold text-gray-800 text-sm">
                    S/ {{ (item.basePrice * item.quantity).toFixed(2) }}
                  </div>
                </div>
              }
            }
          </div>

          <div class="p-6 bg-gray-50 rounded-b-xl border-t border-gray-200">
            <div class="flex justify-between items-center mb-4">
              <span class="text-gray-600">Total a pagar:</span>
              <span class="text-2xl font-black text-orange-600">S/ {{ totalPrice().toFixed(2) }}</span>
            </div>
            <button 
              [disabled]="cart().length === 0 || loading()"
              (click)="processOrder()"
              class="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 disabled:opacity-50"
            >
              @if (loading()) {
                 <span class="animate-spin mr-2">...</span> Procesando...
              } @else {
                 Confirmar Pedido
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);

  products = signal<ProductResponse[]>([]);
  cart = signal<CartItem[]>([]);
  loading = signal(false);

  totalPrice = computed(() => {
    return this.cart().reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
  });

  constructor() {
    this.productService.getProducts().subscribe(products => {
      this.products.set(products);
    });
  }

  addToCart(product: ProductResponse) {
    this.cart.update(current => {
      const existing = current.find(i => i.id === product.id);
      if (existing) {
        return current.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  removeFromCart(id: number) {
    this.cart.update(current => {
      const existing = current.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return current.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return current.filter(i => i.id !== id);
    });
  }

  processOrder() {
    this.loading.set(true);
    const details: OrderDetailRequest[] = this.cart().map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    this.orderService.createOrder({
      userId: 1, // Simulado
      details: details
    }).subscribe({
      next: () => {
        alert('Pedido realizado con éxito');
        this.cart.set([]);
        this.loading.set(false);
      },
      error: () => {
        alert('Error al realizar el pedido');
        this.loading.set(false);
      }
    });
  }
}
