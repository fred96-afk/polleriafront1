import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ProductResponse } from '../../models/product.model';
import { OrderDetailRequest } from '../../models/order.model';
import { RouterLink, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

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
          <div class="flex justify-between h-20 items-center">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-12 h-12 bg-orange-600 rounded-xl shadow-lg shadow-orange-200">
                <span class="material-icons-outlined text-white text-3xl">restaurant</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xl font-black text-gray-900 leading-none">EL SABROSO</span>
                <span class="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Pollería & Brasas</span>
              </div>
            </div>
            
            <div class="flex items-center space-x-6">
              <a routerLink="/login" class="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors">
                <span class="material-icons-outlined">account_circle</span>
                <span class="hidden sm:inline italic">Mi Cuenta</span>
              </a>
              
              <button (click)="toggleCart()" class="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-all">
                <span class="material-icons-outlined text-3xl">shopping_cart</span>
                @if (cartCount() > 0) {
                  <span class="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {{ cartCount() }}
                  </span>
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Overlay Carrito -->
      @if (isCartOpen()) {
        <div class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity" (click)="toggleCart()"></div>
        <aside class="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col animate-slide-in">
          <div class="p-6 border-b flex justify-between items-center">
            <h2 class="text-2xl font-black text-gray-800">Tu Pedido</h2>
            <button (click)="toggleCart()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            @if (cart().length === 0) {
              <div class="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <span class="material-icons-outlined text-6xl">shopping_basket</span>
                <p class="italic">Tu carrito está vacío...</p>
              </div>
            } @else {
              @for (item of cart(); track item.id) {
                <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div class="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" class="w-full h-full object-cover" [alt]="item.name">
                    } @else {
                      <span class="material-icons-outlined text-orange-600">lunch_dining</span>
                    }
                  </div>
                  <div class="flex-1">
                    <h4 class="font-bold text-gray-800">{{ item.name }}</h4>
                    <p class="text-sm text-gray-500">S/ {{ item.basePrice.toFixed(2) }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <button (click)="removeFromCart(item.id)" class="text-gray-400 hover:text-red-600">
                      <span class="material-icons-outlined text-xl">remove_circle_outline</span>
                    </button>
                    <span class="font-bold w-4 text-center">{{ item.quantity }}</span>
                    <button (click)="addToCart(item)" class="text-orange-600 hover:text-orange-700">
                      <span class="material-icons-outlined text-xl">add_circle</span>
                    </button>
                  </div>
                </div>
              }
            }
          </div>

          <div class="p-6 border-t bg-gray-50 rounded-t-3xl">
            <div class="flex justify-between items-center mb-6">
              <span class="text-gray-500 font-bold">Total a pagar:</span>
              <span class="text-3xl font-black text-orange-600">S/ {{ totalPrice().toFixed(2) }}</span>
            </div>
            <button 
              [disabled]="cart().length === 0 || loading()"
              (click)="confirmOrder()"
              class="w-full bg-orange-600 text-white py-4 rounded-2xl font-black hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              @if (loading()) {
                <span class="material-icons-outlined animate-spin">sync</span>
                PROCESANDO...
              } @else {
                <span class="material-icons-outlined">payments</span>
                PAGAR CON MERCADO PAGO
              }
            </button>
          </div>
        </aside>
      }

      <!-- Hero Section -->
      <header class="bg-gradient-to-br from-orange-600 to-orange-500 py-16 px-4 text-center text-white relative overflow-hidden">
        <div class="relative z-10">
          <h1 class="text-5xl md:text-6xl font-black mb-4 tracking-tight">¡El sabor que une a la familia! 🍗</h1>
          <p class="text-orange-100 text-xl font-medium max-w-2xl mx-auto">Nuestro secreto está en la brasa. Pide ahora y recíbelo en tiempo record.</p>
        </div>
        <span class="material-icons-outlined absolute -bottom-10 -left-10 text-[200px] text-white/5 rotate-12">restaurant</span>
        <span class="material-icons-outlined absolute -top-10 -right-10 text-[200px] text-white/5 -rotate-12">local_fire_department</span>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 class="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <span class="material-icons-outlined text-orange-600 text-4xl">menu_book</span>
          NUESTRA CARTA
        </h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          @if (loadingProducts()) {
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div class="h-56 bg-gray-200"></div>
                <div class="p-6">
                  <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div class="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                  <div class="flex justify-between items-center">
                    <div class="space-y-2">
                      <div class="h-2 bg-gray-200 rounded w-8"></div>
                      <div class="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div class="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            }
          } @else {
            @for (product of products(); track product.id) {
              <div class="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div class="h-56 bg-orange-50 flex items-center justify-center relative overflow-hidden">
                  @if (product.imageUrl) {
                    <img [src]="product.imageUrl" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" [alt]="product.name">
                  } @else {
                    <span class="material-icons-outlined text-8xl text-orange-200 group-hover:scale-110 transition-transform duration-500">lunch_dining</span>
                  }
                  <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black text-orange-600 shadow-sm">
                    DESTACADO
                  </div>
                </div>
                <div class="p-6">
                  <h3 class="font-black text-xl text-gray-800 mb-2">{{ product.name }}</h3>
                  <p class="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">{{ product.description }}</p>
                  <div class="flex justify-between items-center">
                    <div class="flex flex-col">
                      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Precio</span>
                      <span class="text-2xl font-black text-gray-900">S/ {{ product.basePrice.toFixed(2) }}</span>
                    </div>
                    <button 
                      (click)="addToCart(product)"
                      class="bg-orange-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100 group-hover:scale-105"
                    >
                      <span class="material-icons-outlined">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-950 text-gray-500 py-16 mt-20">
        <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div class="space-y-4">
            <div class="flex items-center gap-3 justify-center md:justify-start">
              <div class="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <span class="material-icons-outlined text-white">restaurant</span>
              </div>
              <span class="text-xl font-black text-white">EL SABROSO</span>
            </div>
            <p class="text-sm">Tradición y sabor en cada bocado desde hace más de 20 años.</p>
          </div>
          <div class="space-y-4 text-center">
            <h4 class="text-white font-bold uppercase tracking-widest text-sm">Horario</h4>
            <p class="text-sm">Lunes a Domingo<br>11:00 AM - 11:00 PM</p>
          </div>
          <div class="space-y-4 text-center md:text-right">
            <h4 class="text-white font-bold uppercase tracking-widest text-sm">Contacto</h4>
            <p class="text-sm">Av. El Sabor 123 - Lima<br>Central: (01) 456-7890</p>
            <div class="pt-4">
              <a 
                routerLink="/admin/login" 
                class="inline-flex items-center gap-2 text-[10px] font-black text-gray-600 hover:text-orange-500 uppercase tracking-[0.2em] transition-colors border border-gray-800 px-4 py-2 rounded-lg hover:border-orange-900"
              >
                <span class="material-icons-outlined text-sm">admin_panel_settings</span>
                Acceso Administrativo
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerComponent {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastrService);

  products = signal<ProductResponse[]>([]);
  cart = signal<CartItem[]>([]);
  loading = signal(false);
  loadingProducts = signal(true);
  isCartOpen = signal(false);

  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));
  totalPrice = computed(() => this.cart().reduce((acc, item) => acc + (item.basePrice * item.quantity), 0));

  constructor() {
    this.productService.getProducts().pipe(
      finalize(() => this.loadingProducts.set(false))
    ).subscribe(data => this.products.set(data));
  }

  toggleCart() {
    this.isCartOpen.update(v => !v);
  }

  addToCart(product: ProductResponse) {
    this.cart.update(current => {
      const existing = current.find(i => i.id === product.id);
      if (existing) {
        return current.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...current, { ...product, quantity: 1 }];
    });
    if (!this.isCartOpen()) {
      this.isCartOpen.set(true);
    }
  }

  removeFromCart(productId: number) {
    this.cart.update(current => {
      const existing = current.find(i => i.id === productId);
      if (existing && existing.quantity > 1) {
        return current.map(i => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return current.filter(i => i.id !== productId);
    });
  }

  confirmOrder() {
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Por favor, inicia sesión para completar tu pedido', 'Autenticación Requerida');
      this.router.navigate(['/login']);
      return;
    }

    const userId = this.authService.userId;
    if (!userId) {
      this.toastService.error('Error al obtener información del usuario', 'Error');
      return;
    }

    this.loading.set(true);
    const details: OrderDetailRequest[] = this.cart().map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    this.orderService.createOrder({
      userId: userId,
      clientId: 1, // Cliente genérico para pedidos públicos
      isPos: false,
      details: details
    }).subscribe({
      next: (order) => {
        if (order.checkoutUrl) {
          window.location.href = order.checkoutUrl;
        } else {
          this.toastService.success('¡Pedido enviado!', '¡Éxito!');
          this.cart.set([]);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error al enviar pedido:', err);
        this.toastService.error('Error al enviar pedido', 'Error');
        this.loading.set(false);
      }
    });
  }
}
