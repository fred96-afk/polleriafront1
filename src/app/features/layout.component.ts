import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 bg-orange-700 text-white shadow-xl">
        <div class="p-6 text-2xl font-bold border-b border-orange-600">
          Pollería El Sabroso
        </div>
        <nav class="mt-6 flex flex-col space-y-2 px-4">
          <a routerLink="/admin/sales" class="flex items-center p-3 hover:bg-orange-600 rounded-lg transition-colors">
            <span class="mr-3 text-xl">🛒</span> Ventas Staff
          </a>
          <a routerLink="/admin/dashboard" class="flex items-center p-3 hover:bg-orange-600 rounded-lg transition-colors">
            <span class="mr-3 text-xl">⚙️</span> Dashboard Admin
          </a>
          <button (click)="logout()" class="flex items-center p-3 hover:bg-red-600 rounded-lg mt-10 transition-colors w-full text-left">
            <span class="mr-3 text-xl">🚪</span> Cerrar Sesión
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
