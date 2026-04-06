import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 bg-orange-700 text-white shadow-xl">
        <div class="p-6 text-2xl font-bold border-b border-orange-600">
          Pollería El Sabroso
        </div>
        <nav class="mt-6 flex flex-col space-y-2 px-4">
          <a routerLink="/admin/sales" routerLinkActive="bg-orange-600 shadow-md" class="flex items-center p-3 hover:bg-orange-600 rounded-lg transition-colors">
            <span class="material-icons-outlined mr-3">point_of_sale</span> Ventas Staff
          </a>
          
          <div class="pt-4 pb-2 px-3 text-xs font-bold text-orange-300 uppercase tracking-wider">
            Administración
          </div>

          <a routerLink="/admin/dashboard/products" routerLinkActive="bg-orange-600 shadow-md" class="flex items-center p-3 hover:bg-orange-600 rounded-lg transition-colors">
            <span class="material-icons-outlined mr-3">inventory_2</span> Productos
          </a>
          <a routerLink="/admin/dashboard/categories" routerLinkActive="bg-orange-600 shadow-md" class="flex items-center p-3 hover:bg-orange-600 rounded-lg transition-colors">
            <span class="material-icons-outlined mr-3">category</span> Categorías
          </a>
          <a routerLink="/admin/dashboard/clients" routerLinkActive="bg-orange-600 shadow-md" class="flex items-center p-3 hover:bg-orange-600 rounded-lg transition-colors">
            <span class="material-icons-outlined mr-3">people</span> Clientes
          </a>
          <a routerLink="/admin/dashboard/orders" routerLinkActive="bg-orange-600 shadow-md" class="flex items-center p-3 hover:bg-orange-600 rounded-lg transition-colors">
            <span class="material-icons-outlined mr-3">receipt_long</span> Órdenes
          </a>

          <button (click)="logout()" class="flex items-center p-3 hover:bg-red-600 rounded-lg mt-10 transition-colors w-full text-left">
            <span class="material-icons-outlined mr-3">logout</span> Cerrar Sesión
          </button>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-6 md:p-10">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private readonly router = inject(Router);

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
