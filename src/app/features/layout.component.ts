import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PusherService } from '../services/pusher.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {
  public readonly authService = inject(AuthService);
  private readonly pusherService = inject(PusherService);
  private readonly toastService = inject(ToastrService);
  private readonly router = inject(Router);
  
  private pusherSubscription?: Subscription;

  readonly canAccessAdminDashboard = computed(() => this.authService.canAccessAdminDashboard());
  readonly canAccessPos = computed(() => this.authService.canAccessPos());

  readonly isSidebarOpen = signal(false);
  notifications = signal<any[]>([]);

  ngOnInit() {
    // Escuchar notificaciones de nuevos pedidos vía Pusher
    this.pusherSubscription = this.pusherService.orderNotifications$.subscribe(data => {
      this.handleNewOrder(data);
    });
  }

  ngOnDestroy() {
    if (this.pusherSubscription) {
      this.pusherSubscription.unsubscribe();
    }
  }

  private handleNewOrder(data: any) {
    // Mostrar Toast informativo para el administrador/staff
    this.toastService.info(
      `Nuevo pedido #${data.orderId || ''} recibido`, 
      '¡ALERTA DE PEDIDO!',
      { 
        timeOut: 10000, 
        progressBar: true,
        closeButton: true,
        enableHtml: true
      }
    );
    
    // Añadir a la lista local de notificaciones
    this.notifications.update(prev => [data, ...prev].slice(0, 5));
    
    // Opcional: Reproducir un sonido de notificación
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
