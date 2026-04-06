import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';
import { DniService } from '../../services/dni.service';
import { ProductResponse } from '../../models/product.model';
import { OrderDetailRequest } from '../../models/order.model';
import { ToastrService } from 'ngx-toastr';
import { switchMap, finalize } from 'rxjs';

interface CartItem extends ProductResponse {
  quantity: number;
}

@Component({
  selector: 'app-sales',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="h-full flex flex-col space-y-6">
      <header class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 class="text-2xl font-bold text-gray-800 font-mono tracking-tighter">POS - PUNTO DE VENTA</h1>
        <div class="flex items-center space-x-4">
          <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-black border border-orange-200 uppercase">
            CAJERO: {{ (authService.currentUser()?.email || 'Admin').split('@')[0] }}
          </span>
        </div>
      </header>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Product Grid -->
        <div class="lg:col-span-2 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            @if (loadingProducts()) {
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-50 animate-pulse">
                  <div class="h-32 bg-gray-200 rounded-lg mb-3"></div>
                  <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div class="flex justify-between items-center">
                    <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div class="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              }
            } @else {
              @for (product of products(); track product.id) {
                <button 
                  (click)="addToCart(product)"
                  class="bg-white p-4 rounded-xl shadow-sm border-2 border-transparent hover:border-orange-500 hover:shadow-md transition-all text-left group"
                >
                  <div class="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-gray-50">
                     @if (product.imageUrl) {
                       <img [src]="product.imageUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                     } @else {
                       <span class="material-icons-outlined text-4xl text-gray-300">restaurant</span>
                     }
                  </div>
                  <h3 class="font-black text-gray-800 text-sm leading-tight uppercase">{{ product.name }}</h3>
                  <p class="text-[10px] text-gray-400 font-bold mb-3 italic">CATEGORÍA: {{ product.categoryName || 'S/C' }}</p>
                  <div class="flex justify-between items-center">
                    <span class="text-orange-600 font-black">S/ {{ product.basePrice.toFixed(2) }}</span>
                    <span class="bg-gray-100 px-2 py-1 rounded text-[10px] font-black group-hover:bg-orange-600 group-hover:text-white uppercase">+ AGREGAR</span>
                  </div>
                </button>
              }
            }
          </div>
        </div>

        <!-- Order Summary (Cart) -->
        <div class="bg-white rounded-2xl shadow-xl flex flex-col sticky top-6 max-h-[calc(100vh-160px)] border border-gray-100 overflow-hidden">
          <div class="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 class="text-xl font-black text-gray-800 flex items-center gap-2">
              <span class="material-icons-outlined text-orange-600">receipt_long</span> 
              RESUMEN DE VENTA
            </h2>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @if (cart().length === 0) {
              <div class="text-center py-12 text-gray-300">
                <span class="material-icons-outlined text-6xl mb-4">shopping_cart</span>
                <p class="font-bold italic">LISTA VACÍA</p>
              </div>
            } @else {
              @for (item of cart(); track item.id) {
                <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div class="flex-1">
                    <h4 class="font-black text-gray-800 text-xs uppercase">{{ item.name }}</h4>
                    <p class="text-[10px] font-bold text-gray-500 italic">S/ {{ item.basePrice.toFixed(2) }} x {{ item.quantity }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="removeFromCart(item.id)" class="text-gray-400 hover:text-red-500 transition-colors">
                      <span class="material-icons-outlined text-xl">remove_circle_outline</span>
                    </button>
                    <span class="font-black text-sm w-4 text-center">{{ item.quantity }}</span>
                    <button (click)="addToCart(item)" class="text-orange-600 hover:text-orange-700 transition-colors">
                      <span class="material-icons-outlined text-xl">add_circle</span>
                    </button>
                  </div>
                  <div class="ml-4 font-black text-gray-900 text-xs min-w-[60px] text-right">
                    S/ {{ (item.basePrice * item.quantity).toFixed(2) }}
                  </div>
                </div>
              }
            }
          </div>

          <div class="p-6 bg-gray-950 text-white">
            <div class="flex justify-between items-center mb-6">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Total venta:</span>
              <span class="text-3xl font-black text-orange-500">S/ {{ totalPrice().toFixed(2) }}</span>
            </div>
            <button 
              [disabled]="cart().length === 0 || loading()"
              (click)="showClientModal.set(true)"
              class="w-full bg-orange-600 text-white py-4 rounded-xl font-black hover:bg-orange-700 transition-all shadow-xl shadow-orange-950/20 disabled:opacity-50 text-sm tracking-widest uppercase"
            >
              FINALIZAR COMPRA
            </button>
          </div>
        </div>
      </div>

      <!-- Modal POS DNI/RUC/NOMBRE (APIs Perú) -->
      @if (showClientModal()) {
        <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b bg-gray-50 flex justify-between items-center border-orange-100">
              <div>
                <h3 class="text-xl font-black text-gray-800 uppercase tracking-tighter">Identificación Fiscal</h3>
                <p class="text-[10px] font-black text-orange-600 uppercase italic">Validación con RENIEC / SUNAT</p>
              </div>
              <button (click)="showClientModal.set(false)" class="text-gray-400 hover:text-gray-600 p-2">
                <span class="material-icons-outlined">close</span>
              </button>
            </div>

            <form [formGroup]="clientForm" (ngSubmit)="processSale()" class="p-8 space-y-6">
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Número de Documento (DNI/RUC)</label>
                <div class="relative flex items-center">
                  <input 
                    type="text" 
                    formControlName="phone"
                    placeholder="8 o 11 dígitos"
                    maxlength="11"
                    class="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none transition-all font-black text-xl bg-gray-50 pr-16"
                  >
                  <button 
                    type="button"
                    (click)="searchDocument()"
                    [disabled]="searchingDocument()"
                    class="absolute right-2 bg-orange-600 text-white p-2 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    @if (searchingDocument()) {
                      <span class="material-icons-outlined animate-spin text-sm">sync</span>
                    } @else {
                      <span class="material-icons-outlined text-sm font-bold">search</span>
                    }
                  </button>
                </div>
                <p class="text-[10px] text-gray-400 font-bold mt-1 uppercase italic">DNI: 8 dígitos | RUC: 11 dígitos</p>
              </div>

              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombres / Razón Social</label>
                <input 
                  type="text" 
                  formControlName="name"
                  placeholder="Se autocompletará o escribe manual"
                  class="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none transition-all font-black text-gray-700 text-sm uppercase"
                >
              </div>

              <div class="pt-6 flex gap-4">
                <button 
                  type="button" 
                  (click)="showClientModal.set(false)"
                  class="flex-1 py-4 rounded-2xl font-black border-2 border-gray-100 text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  [disabled]="clientForm.invalid || loading()"
                  class="flex-1 py-4 rounded-2xl font-black bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                >
                  @if (loading()) {
                    <span class="material-icons-outlined animate-spin text-sm">sync</span>
                    GENERANDO...
                  } @else {
                    EMITIR COMPROBANTE
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly clientService = inject(ClientService);
  private readonly dniService = inject(DniService);
  public readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastrService);

  products = signal<ProductResponse[]>([]);
  cart = signal<CartItem[]>([]);
  loading = signal(false);
  loadingProducts = signal(true);
  searchingDocument = signal(false);
  showClientModal = signal(false);

  clientForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,11}$/)]],
    address: ['Venta POS']
  });

  totalPrice = computed(() => {
    return this.cart().reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
  });

  constructor() {
    this.productService.getProducts().pipe(
      finalize(() => this.loadingProducts.set(false))
    ).subscribe(products => {
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
      const existing = current.find(i => id === i.id);
      if (existing && existing.quantity > 1) {
        return current.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return current.filter(i => i.id !== id);
    });
  }

  searchDocument() {
    const docNum = this.clientForm.get('phone')?.value;
    if (!docNum || (docNum.length !== 8 && docNum.length !== 11)) {
      this.toastService.warning('Ingrese 8 dígitos para DNI u 11 para RUC', 'Formato Inválido');
      return;
    }

    this.searchingDocument.set(true);
    this.dniService.consultarDocumento(docNum).pipe(
      finalize(() => this.searchingDocument.set(false))
    ).subscribe({
      next: (data) => {
        if (data.success && data.nombre) {
          this.clientForm.patchValue({ name: data.nombre.toUpperCase() });
          const type = docNum.length === 11 ? 'RUC (SUNAT)' : 'DNI (RENIEC)';
          this.toastService.success(`${type} Validado`, 'Éxito');
        } else {
          this.toastService.warning('No se encontraron datos. Ingrese manual.', 'Aviso');
        }
      },
      error: () => {
        this.toastService.error('Error de conexión con el API de identificación', 'Error');
      }
    });
  }

  processSale() {
    if (this.clientForm.invalid) return;

    const userId = this.authService.userId;
    if (!userId) {
      this.toastService.error('Error de sesión del personal', 'Error');
      return;
    }

    this.loading.set(true);

    this.clientService.createClient(this.clientForm.value as any).pipe(
      switchMap(client => {
        const details: OrderDetailRequest[] = this.cart().map(item => ({
          productId: item.id,
          quantity: item.quantity
        }));

        return this.orderService.createOrder({
          userId: userId,
          clientId: client.id,
          isPos: true,
          details: details
        });
      }),
      switchMap(order => {
        // Nueva llamada al endpoint de comprobantes (Nubefact)
        return this.orderService.generateInvoice(order.id);
      })
    ).subscribe({
      next: (res: any) => {
        console.log('Respuesta de generación de comprobante:', res);
        this.toastService.success('Venta completada y comprobante emitido', '¡Éxito!');
        
        // Detectar URL en la respuesta (res puede ser un objeto o el string directo)
        let invoiceUrl: string | null = null;
        if (typeof res === 'string' && res.startsWith('http')) {
          invoiceUrl = res;
        } else {
          invoiceUrl = res?.pdfUrl || res?.invoiceUrl || res?.enlace_del_pdf || res?.enlace || res?.pdf_url || res?.url;
        }

        if (invoiceUrl) {
          const opened = window.open(invoiceUrl, '_blank');
          if (!opened) {
            this.toastService.info('Pop-up bloqueado. Haz clic aquí para ver el comprobante', 'Aviso', {
              timeOut: 10000,
            }).onTap.subscribe(() => window.open(invoiceUrl!, '_blank'));
          }
        } else {
          console.warn('No se pudo determinar la URL del comprobante');
        }

        this.cart.set([]);
        this.clientForm.reset({ address: 'Venta POS' });
        this.showClientModal.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error en la venta POS:', err);
        this.toastService.error('Error al procesar la venta', 'Error');
        this.loading.set(false);
      }
    });
  }
}
