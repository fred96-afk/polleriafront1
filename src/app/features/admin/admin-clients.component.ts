import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService } from '../../services/client.service';
import { ClientResponse } from '../../models/client.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-clients',
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">Directorio de Clientes</h2>
        <button class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center">
          <span class="material-icons-outlined mr-2">person_add</span> Nuevo Cliente
        </button>
      </div>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
          <tr>
            <th class="px-6 py-4">Nombre</th>
            <th class="px-6 py-4">Teléfono</th>
            <th class="px-6 py-4">Dirección</th>
            <th class="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <tr class="animate-pulse">
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-3/4"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-1/2"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-full"></div></td>
                <td class="px-6 py-4"><div class="flex justify-center gap-2"><div class="w-8 h-8 bg-gray-200 rounded"></div><div class="w-8 h-8 bg-gray-200 rounded"></div></div></td>
              </tr>
            }
          } @else {
            @for (c of clients(); track c.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-semibold text-gray-700">{{ c.name }}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">{{ c.phone }}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">{{ c.address }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-center space-x-2">
                    <button class="text-blue-600 hover:text-blue-800 p-1">
                      <span class="material-icons-outlined">edit</span>
                    </button>
                    <button class="text-red-600 hover:text-red-800 p-1">
                      <span class="material-icons-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminClientsComponent {
  private readonly clientService = inject(ClientService);
  clients = signal<ClientResponse[]>([]);
  loading = signal(false);

  constructor() {
    this.loadClients();
  }

  loadClients() {
    this.loading.set(true);
    this.clientService.getClients().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(data => this.clients.set(data));
  }
}
