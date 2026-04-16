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
import { switchMap, finalize, map } from 'rxjs';

interface CartItem extends ProductResponse {
  quantity: number;
}

interface SaleResult {
  orderId: number;
  invoiceResponse: any;
}

@Component({
  selector: 'app-sales',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sales.component.html',
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
  showCartMobile = signal(false);
  cashierName = computed(() => this.authService.displayName.toUpperCase());

  clientForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    documentNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,11}$/)]],
    address: ['Venta POS']
  });

  totalPrice = computed(() => {
    return this.cart().reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
  });

  private extractInvoicePdfUrl(invoiceResponse: unknown): string | null {
    if (!invoiceResponse || typeof invoiceResponse !== 'object') {
      return null;
    }

    const response = invoiceResponse as Record<string, unknown>;
    const candidates = [
      response['pdfUrl'],
      response['pdfURL'],
      response['pdf_url'],
      response['enlaceDelPdf'],
      response['enlace_del_pdf'],
      response['urlPdf'],
      response['url_pdf'],
      response['url'],
      response['link']
    ];

    const pdfUrl = candidates.find(value => typeof value === 'string' && value.trim().length > 0);
    return typeof pdfUrl === 'string' ? pdfUrl : null;
  }

  private openPdfWindow(pdfUrl: string, fallbackWindow: Window | null) {
    if (fallbackWindow && !fallbackWindow.closed) {
      fallbackWindow.location.href = pdfUrl;
      fallbackWindow.focus();
      return true;
    }

    const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.focus();
      return true;
    }

    return false;
  }

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
    const docNum = this.clientForm.get('documentNumber')?.value;
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
          this.toastService.success(`Documento Validado`, 'Éxito');
        } else {
          this.toastService.warning('No encontrado. Ingrese manual.', 'Aviso');
        }
      },
      error: () => this.toastService.error('Error de conexión', 'Error')
    });
  }

  processSale() {
    if (this.clientForm.invalid) return;

    const userId = this.authService.userId;
    if (!userId) {
      this.toastService.error('Error de sesión');
      return;
    }

    this.loading.set(true);
    const pendingPdfWindow = window.open('', '_blank');
    if (pendingPdfWindow) {
      pendingPdfWindow.document.title = 'Generando comprobante...';
      pendingPdfWindow.document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
          <h2 style="margin: 0 0 12px;">Generando comprobante...</h2>
          <p style="margin: 0;">La venta fue enviada. Esta pestaña se actualizará cuando el PDF esté listo.</p>
        </div>
      `;
    }

    const formVal = this.clientForm.value;
    const clientData = {
      name: formVal.name,
      documentNumber: formVal.documentNumber,
      documentType: formVal.documentNumber?.length === 11 ? 'RUC' : 'DNI',
      address: formVal.address,
      phone: '' // Explicitly empty to avoid backend filling it with doc number if they have logic for that
    };

    this.clientService.createClient(clientData as any).pipe(
      switchMap(client => {
        const details: OrderDetailRequest[] = this.cart().map(item => ({
          productId: item.id,
          quantity: item.quantity
        }));

        return this.orderService.createOrder({
          userId: userId,
          clientId: client.id,
          isPos: true,
          details: details,
          customerName: client.name,
          documentNumber: client.documentNumber,
          documentType: client.documentType
        });
      }),
      switchMap(order => {
        const orderId = order.id;
        return this.orderService.generateInvoice(orderId).pipe(
          map(invoiceResponse => ({ orderId, invoiceResponse }))
        );
      })
    ).subscribe({
      next: ({ orderId, invoiceResponse }) => {
        const pdfUrl = this.extractInvoicePdfUrl(invoiceResponse);
        const openedPdf = pdfUrl ? this.openPdfWindow(pdfUrl, pendingPdfWindow) : false;

        this.toastService.success(`Venta #${orderId} procesada`);

        if (pdfUrl) {
          if (openedPdf) {
            this.toastService.success('Comprobante abierto en una nueva pestaña', 'PDF generado');
          } else {
            this.toastService.warning('El navegador bloqueó la pestaña del comprobante', 'PDF generado');
          }
        } else {
          if (pendingPdfWindow && !pendingPdfWindow.closed) {
            pendingPdfWindow.close();
          }
          this.toastService.warning('La venta se procesó, pero no llegó la URL del PDF', 'Comprobante pendiente');
          console.warn('[POS SALE] Respuesta de comprobante sin URL de PDF', invoiceResponse);
        }

        this.cart.set([]);
        this.clientForm.reset({
          name: '',
          documentNumber: '',
          address: 'Venta POS'
        });
        this.showClientModal.set(false);
        this.showCartMobile.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        if (pendingPdfWindow && !pendingPdfWindow.closed) {
          pendingPdfWindow.close();
        }
        const timestamp = new Date().toISOString();
        console.group(`%c [POS SALE ERROR] ${timestamp} `, 'background: #d32f2f; color: #fff; font-weight: bold; padding: 4px;');
        console.error('%cDetalle del Error:%c', 'font-weight: bold', '', err);
        console.warn('%cEstado del Proceso:%c', 'font-weight: bold', '', {
          userId: this.authService.userId,
          clientData: this.clientForm.value,
          cartItems: this.cart().length,
          total: this.totalPrice()
        });
        console.groupEnd();

        this.toastService.error('Error al procesar venta o generar comprobante', 'Error POS');
        this.loading.set(false);
      }
    });
  }
}
