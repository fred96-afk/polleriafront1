import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-result',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        
        @if (status() === 'success') {
          <div class="mb-6">
            <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span class="material-icons-outlined text-4xl">check_circle</span>
            </div>
            <h1 class="text-3xl font-black text-gray-800 mb-2">¡Pago Exitoso!</h1>
            <p class="text-gray-500 text-sm flex items-center justify-center gap-1">
              Tu pedido ha sido procesado correctamente. ¡El pollo ya está en camino! 
              <span class="material-icons-outlined text-orange-600 text-base">restaurant</span>
            </p>
          </div>
        } @else if (status() === 'failure') {
          <div class="mb-6">
            <div class="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span class="material-icons-outlined text-4xl">error_outline</span>
            </div>
            <h1 class="text-3xl font-black text-gray-800 mb-2">Pago Fallido</h1>
            <p class="text-gray-500 text-sm">Hubo un problema al procesar tu pago. Por favor, intenta de nuevo o contacta con soporte.</p>
          </div>
        } @else {
          <div class="mb-6">
            <div class="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span class="material-icons-outlined text-4xl">pending_actions</span>
            </div>
            <h1 class="text-3xl font-black text-gray-800 mb-2">Pago Pendiente</h1>
            <p class="text-gray-500 text-sm">Estamos esperando la confirmación de tu pago. Te notificaremos pronto.</p>
          </div>
        }

        <div class="space-y-3">
          <a routerLink="/" class="block w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100">
            Volver al Inicio
          </a>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          Pollería El Sabroso
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  status = signal<'success' | 'failure' | 'pending'>('success');

  ngOnInit() {
    const path = window.location.pathname;
    if (path.includes('success')) this.status.set('success');
    else if (path.includes('failure')) this.status.set('failure');
    else if (path.includes('pending')) this.status.set('pending');
  }
}
