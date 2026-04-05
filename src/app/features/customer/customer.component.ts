import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { ProductResponse } from '../../models/product.model';
import { OrderDetailRequest } from '../../models/order.model';
import { RouterLink } from '@angular/router';

interface CartItem extends ProductResponse {
  quantity: number;
}

@Component({
  selector: 'app-customer',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <nav class="bg-white shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center">
              <span class="text-2xl font-black text-orange-600">POLLERÍA EL SABROSO 🍗</span>
            </div>
            <div class="flex items-center space-x-4">
              <a routerLink="/admin/login" class="text-sm text-gray-500 hover:text-orange-600 font-medium">Acceso Staff</a>
              <div class="relative">
                <span class="text-2xl">🛒</span>
                @if (cartCount() > 0) {
                  <span class="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {{ cartCount() }}
                  </span>
                }
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="bg-orange-600 py-12 px-4 text-center text-white">
        <h1 class="text-4xl md:text-5xl font-extrabold mb-4">¡El mejor sabor a la brasa!</h1>
        <p class="text-orange-100 text-lg">Haz tu pedido ahora y recíbelo en la puerta de tu casa.</p>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col lg:flex-row gap-8">
          
          <!-- Menu -->
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 italic">Nuestro Menú</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              @for (product of products(); track product.id) {
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div class="h-48 bg-orange-50 flex items-center justify-center text-5xl">🍗</div>
                  <div class="p-5">
                    <h3 class="font-bold text-lg text-gray-800">{{ product.name }}</h3>
                    <p class="text-gray-500 text-sm mb-4 line-clamp-2">{{ product.description }}</p>
                    <div class="flex justify-between items-center">
                      <span class="text-xl font-black text-gray-900">S/ {{ product.basePrice.toFixed(2) }}</span>
                      <button 
                        (click)="addToCart(product)"
                        class="bg-orange-600 text-white px-4 py-2 rounded-full font-bold hover:bg-orange-700 transition-colors text-sm"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Mini Cart (Desktop) -->
          <div class="w-full lg:w-80 bg-white rounded-2xl shadow-xl p-6 h-fit sticky top-24 border border-orange-100">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Tu Pedido</h2>
            
            <div class="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
              @if (cart().length === 0) {
                <p class="text-gray-400 text-center py-4 text-sm italic">Tu carrito está vacío...</p>
              } @else {
                @for (item of cart(); track item.id) {
                  <div class="flex justify-between text-sm">
                    <span class="font-medium">{{ item.quantity }}x {{ item.name }}</span>
                    <span class="text-gray-600">S/ {{ (item.basePrice * item.quantity).toFixed(2) }}</span>
                  </div>
                }
              }
            </div>

            <div class="border-t pt-4">
              <div class="flex justify-between items-center mb-6">
                <span class="text-gray-600 font-bold">Total:</span>
                <span class="text-2xl font-black text-orange-600">S/ {{ totalPrice().toFixed(2) }}</span>
              </div>
              <button 
                [disabled]="cart().length === 0 || loading()"
                (click)="confirmOrder()"
                class="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
              >
                @if (loading()) {
                   Procesando...
                } @else {
                   Hacer Pedido YA
                }
              </button>
              <p class="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-widest font-bold">Pago contra entrega disponible</p>
            </div>
          </div>

        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-400 py-12 mt-20">
        <div class="max-w-7xl mx-auto px-4 text-center">
          <p class="font-bold text-white mb-2">POLLERÍA EL SABROSO</p>
          <p class="text-sm">Abierto todos los días de 11:00 AM - 11:00 PM</p>
        </div>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerComponent {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);

  products = signal<ProductResponse[]>([]);
  cart = signal<CartItem[]>([]);
  loading = signal(false);

  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));
  totalPrice = computed(() => this.cart().reduce((acc, item) => acc + (item.basePrice * item.quantity), 0));

  constructor() {
    this.productService.getProducts().subscribe(data => this.products.set(data));
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

  confirmOrder() {
    this.loading.set(true);
    const details: OrderDetailRequest[] = this.cart().map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    this.orderService.createOrder({
      userId: 999, // ID Genérico para clientes web
      details: details
    }).subscribe({
      next: (order) => {
        if (order.checkoutUrl) {
          // Redirección oficial de Mercado Pago
          window.location.href = order.checkoutUrl;
        } else {
          alert('¡Pedido enviado! Prepararemos tu pollo en breve.');
          this.cart.set([]);
          this.loading.set(false);
        }
      },
      error: () => {
        alert('Error al enviar pedido');
        this.loading.set(false);
      }
    });
  }
}
