import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { BannerService } from '../../services/banner.service';
import { CatalogoService } from '../../services/catalogo.service';
import { DniService } from '../../services/dni.service';
import { ClientService } from '../../services/client.service';
import { ProductResponse } from '../../models/product.model';
import { Banner } from '../../models/banner.model';
import { OrderDetailRequest, OrderRequest } from '../../models/order.model';
import { TipoDocumento } from '../../models/catalogo.model';
import { ClientResponse } from '../../models/client.model';
import { RouterLink, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize, map, switchMap } from 'rxjs';

interface CartItem extends ProductResponse {
  quantity: number;
}

@Component({
  selector: 'app-customer',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './customer.component.html',
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out forwards;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fade-in 0.7s ease-out forwards;
    }
    @keyframes slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up {
      animation: slide-up 0.7s ease-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  public readonly authService = inject(AuthService);
  private readonly bannerService = inject(BannerService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly dniService = inject(DniService);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  products = signal<ProductResponse[]>([]);
  banners = signal<Banner[]>([]);
  tiposDocumento = signal<TipoDocumento[]>([]);
  currentBannerIndex = signal(0);
  private bannerInterval: any;

  // Pagination and Search
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(8);
  totalPages = signal(1);
  totalCount = signal(0);

  cart = signal<CartItem[]>([]);
  loading = signal(false);
  loadingProducts = signal(true);
  loadingDni = signal(false);
  isCartOpen = signal(false);
  showCheckoutModal = signal(false);
  showUserDropdown = signal(false);

  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));
  totalPrice = computed(() => this.cart().reduce((acc, item) => acc + (item.basePrice * item.quantity), 0));

  checkoutForm = this.fb.group({
    idTipoDocumento: [null as number | null, [Validators.required]],
    numeroDocumento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(11)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    deliveryMethod: ['delivery', [Validators.required]],
    notes: ['']
  });

  constructor() {
    this.loadProducts();

    this.bannerService.getBanners().subscribe(data => {
      this.banners.set(data.filter(b => b.isActive).sort((a, b) => a.order - b.order));
    });

    this.catalogoService.getTiposDocumento().subscribe(data => {
      this.tiposDocumento.set(data);
      if (data.length > 0 && !this.checkoutForm.value.idTipoDocumento) {
        this.checkoutForm.patchValue({ idTipoDocumento: data[0].id });
      }
      
      // Intentar cargar datos del cliente después de tener los tipos de documento
      this.loadClientData();
    });

    if (this.authService.isAuthenticated()) {
      this.checkoutForm.patchValue({ name: this.authService.displayName });
    }

    this.loadCatalogos();

    // Escuchar cambios en deliveryMethod para ajustar validación de dirección
    this.checkoutForm.get('deliveryMethod')?.valueChanges.subscribe(method => {
      const addressControl = this.checkoutForm.get('address');
      if (method === 'pickup') {
        addressControl?.clearValidators();
      } else {
        addressControl?.setValidators([Validators.required, Validators.minLength(5)]);
      }
      addressControl?.updateValueAndValidity();
    });
  }

  loadClientData() {
    const clientId = this.authService.clientId;
    if (clientId) {
      this.clientService.getClientById(clientId).subscribe({
        next: (client: ClientResponse) => {
          this.checkoutForm.patchValue({
            name: client.name || this.authService.displayName,
            phone: client.phone || '',
            address: client.address || '',
            numeroDocumento: client.documentNumber || '',
          });

          if (client.documentType) {
            const type = this.tiposDocumento().find(t => 
              t.nombre?.toLowerCase() === client.documentType?.toLowerCase()
            );
            if (type) {
              this.checkoutForm.patchValue({ idTipoDocumento: type.id });
            }
          }
        },
        error: (err: any) => console.error('Error cargando datos del cliente:', err)
      });
    }
  }

  loadProducts() {
    this.loadingProducts.set(true);
    this.productService.getPagedProducts(this.currentPage(), this.pageSize(), this.searchTerm()).pipe(
      finalize(() => this.loadingProducts.set(false))
    ).subscribe(data => {
      this.products.set(data.items);
      this.totalPages.set(data.totalPages);
      this.totalCount.set(data.totalCount);
    });
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadProducts();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  loadCatalogos() {
    this.catalogoService.getTiposDocumento().subscribe(data => {
      this.tiposDocumento.set(data);
      if (data.length > 0 && !this.checkoutForm.value.idTipoDocumento) {
        this.checkoutForm.patchValue({ idTipoDocumento: data[0].id });
      }
    });
  }

  ngOnInit() {
    this.startBannerInterval();
  }

  ngOnDestroy() {
    this.stopBannerInterval();
  }

  private startBannerInterval() {
    this.bannerInterval = setInterval(() => {
      this.nextBanner();
    }, 5000);
  }

  private stopBannerInterval() {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }

  nextBanner() {
    if (this.banners().length === 0) return;
    this.currentBannerIndex.update(idx => (idx + 1) % this.banners().length);
  }

  prevBanner() {
    if (this.banners().length === 0) return;
    this.currentBannerIndex.update(idx => (idx - 1 + this.banners().length) % this.banners().length);
  }

  setBanner(index: number) {
    this.currentBannerIndex.set(index);
    this.stopBannerInterval();
    this.startBannerInterval();
  }

  buscarDocumento() {
    const num = this.checkoutForm.value.numeroDocumento;
    if (!num || (num.length !== 8 && num.length !== 11)) {
      this.toastService.warning('Ingresa un DNI (8 dígitos) o RUC (11 dígitos) válido', 'Aviso');
      return;
    }

    this.loadingDni.set(true);
    this.dniService.consultarDocumento(num).pipe(
      finalize(() => this.loadingDni.set(false))
    ).subscribe({
      next: (res) => {
        if (res.success && res.nombre) {
          this.checkoutForm.patchValue({ name: res.nombre });
          
          if (res.direccion) {
            this.checkoutForm.patchValue({ address: res.direccion });
            this.toastService.success('Datos y dirección encontrados', '¡Éxito!');
          } else {
            this.toastService.success('Datos encontrados', '¡Éxito!');
          }
        } else {
          this.toastService.warning(res.message || 'No se encontraron resultados', 'Aviso');
        }
      },
      error: () => this.toastService.error('Error al consultar el documento', 'Error')
    });
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
    if (!this.isCartOpen() && !this.showCheckoutModal()) {
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

  openCheckout() {
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Por favor, inicia sesión para completar tu pedido', 'Autenticación Requerida');
      this.router.navigate(['/login']);
      return;
    }
    this.loadCatalogos();
    this.isCartOpen.set(false);
    this.showCheckoutModal.set(true);
  }

  onLogout() {
    this.authService.logout();
    this.showUserDropdown.set(false);
    this.toastService.info('Sesión cerrada correctamente', 'Adiós');
  }

  goDelivery() {
    if (!this.authService.isAuthenticated()) {
      // Si no está logueado, lo mandamos directo al login de staff
      this.router.navigate(['/admin/login']);
    } else if (this.authService.isDelivery() || this.authService.isAdministrator()) {
      // Si ya está logueado como delivery o admin, va al portal
      this.router.navigate(['/delivery']);
    } else {
      // Si está logueado como cliente, le avisamos que necesita cuenta de staff
      this.toastService.warning('Tu sesión actual es de Cliente. Por favor, ingresa con una cuenta de Repartidor.', 'Acceso Staff Requerido');
      this.router.navigate(['/admin/login']);
    }
  }

  processOrder() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.userId;
    if (!userId) {
      this.toastService.error('Información de usuario no encontrada', 'Error');
      return;
    }

    this.loading.set(true);

    // Abrir ventana en blanco inmediatamente para evitar bloqueadores de popups
    const paymentWindow = window.open('', '_blank');
    if (paymentWindow) {
      paymentWindow.document.title = 'Preparando pago...';
      paymentWindow.document.body.innerHTML = `
        <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f9fafb; color: #374151;">
          <div style="border: 4px solid #f3f3f3; border-top: 4px solid #ea580c; border-radius: 50%; w-width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
          <h2 style="margin-top: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">Redirigiendo a Mercado Pago...</h2>
          <p style="color: #6b7280; font-style: italic;">Por favor, no cierres esta ventana.</p>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        </div>
      `;
    }

    const tipoDocId = this.checkoutForm.value.idTipoDocumento;
    const tipoDocNombre = this.tiposDocumento().find(t => t.id === tipoDocId)?.nombre || 'DNI';

    const deliveryMethod = this.checkoutForm.value.deliveryMethod;
    const customerAddress = deliveryMethod === 'pickup' ? 'RECOJO EN TIENDA' : this.checkoutForm.value.address;
    const notes = `MÉTODO: ${deliveryMethod === 'pickup' ? 'RECOJO' : 'DELIVERY'}. ${this.checkoutForm.value.notes || ''}`.trim();

    // Lógica unificada: Actualizar cliente y luego crear pedido
    const clientData = {
      name: this.checkoutForm.value.name,
      phone: this.checkoutForm.value.phone,
      address: this.checkoutForm.value.address,
      documentNumber: this.checkoutForm.value.numeroDocumento,
      documentType: tipoDocNombre
    };

    const details: OrderDetailRequest[] = this.cart().map(item => ({
      productId: item.id,
      quantity: item.quantity,
      sideId: null // Opcional según Swagger
    }));

    const clientUpdate$ = this.authService.clientId 
      ? this.clientService.updateClient(this.authService.clientId, clientData).pipe(map(() => ({ id: this.authService.clientId })))
      : this.clientService.createClient(clientData);

    clientUpdate$.pipe(
      switchMap((client: any) => {
        const orderBody: any = {
          userId: userId!,
          clientId: client?.id || this.authService.clientId || null,
          isPos: false,
          details,
          customerName: this.checkoutForm.value.name,
          customerAddress: customerAddress,
          customerPhone: this.checkoutForm.value.phone,
          documentNumber: this.checkoutForm.value.numeroDocumento,
          documentType: tipoDocNombre,
          customerEmail: this.authService.email,
          isPickup: deliveryMethod === 'pickup' // Campo nuevo del API
        };

        console.log('[DEBUG] Enviando pedido final:', orderBody);
        return this.orderService.createOrder(orderBody);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (order: any) => {
        if (order.paymentUrl) {
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.location.href = order.paymentUrl;
            paymentWindow.focus();
            this.toastService.success('Se ha abierto la pestaña de pago.', '¡Pedido Creado!');
          } else {
            // Fallback si la ventana fue cerrada o no se pudo abrir
            window.location.href = order.paymentUrl;
          }
        } else {
          // Si no hay URL de pago, cerramos la ventana auxiliar
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }
        }
        
        this.toastService.success(`Pedido #${order.id} enviado con éxito!`, '¡Éxito!');
        this.cart.set([]);
        this.showCheckoutModal.set(false);
        
        // Redirigir a la página de seguimiento en la pestaña actual
        this.router.navigate(['/order-tracking', order.id]);
      },
      error: (err: any) => {
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close();
        }
        const timestamp = new Date().toISOString();
        console.group(`%c [DELIVERY ORDER ERROR] ${timestamp} `, 'background: #d32f2f; color: #fff; font-weight: bold; padding: 4px;');
        console.error('%cDetalle del Error:%c', 'font-weight: bold', '', err);
        console.warn('%cEstado del Proceso:%c', 'font-weight: bold', '', {
          userId,
          clientId: null,
          formData: this.checkoutForm.value,
          cartCount: this.cartCount(),
          total: this.totalPrice(),
          customerEmail: this.authService.email
        });
        console.groupEnd();

        this.toastService.error('No se pudo procesar el pedido', 'Error');
      }
    });
  }
}
