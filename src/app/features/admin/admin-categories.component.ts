import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { CategoryResponse, CategoryRequest } from '../../models/category.model';
import { ToastrService } from 'ngx-toastr';
import { Observable, finalize } from 'rxjs';

@Component({
  selector: 'app-admin-categories',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">Gestión de Categorías</h2>
        <button 
          (click)="openModal()"
          class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center"
        >
          <span class="material-icons-outlined mr-2">add</span> Nueva Categoría
        </button>
      </div>

      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
          <tr>
            <th class="px-6 py-4">Imagen</th>
            <th class="px-6 py-4">Nombre</th>
            <th class="px-6 py-4">Descripción</th>
            <th class="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <tr class="animate-pulse">
                <td class="px-6 py-4"><div class="w-12 h-12 bg-gray-200 rounded-lg"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-3/4"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-full"></div></td>
                <td class="px-6 py-4"><div class="flex justify-center gap-2"><div class="w-8 h-8 bg-gray-200 rounded"></div><div class="w-8 h-8 bg-gray-200 rounded"></div></div></td>
              </tr>
            }
          } @else {
            @for (c of categories(); track c.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  @if (c.imageUrl) {
                    <img [src]="c.imageUrl" class="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-100" alt="Category image">
                  } @else {
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <span class="material-icons-outlined">category</span>
                    </div>
                  }
                </td>
                <td class="px-6 py-4 font-semibold text-gray-700">{{ c.name }}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">{{ c.description }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-center space-x-2">
                    <button (click)="openModal(c)" class="text-blue-600 hover:text-blue-800 p-1">
                      <span class="material-icons-outlined">edit</span>
                    </button>
                    <button (click)="deleteCategory(c.id)" class="text-red-600 hover:text-red-800 p-1">
                      <span class="material-icons-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 class="text-xl font-bold text-gray-800">
                {{ editingId() ? 'Editar Categoría' : 'Nueva Categoría' }}
              </h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
                <span class="material-icons-outlined">close</span>
              </button>
            </div>

            <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  formControlName="name"
                  placeholder="Ej: Pollos, Bebidas, etc."
                  class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                >
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea 
                  formControlName="description"
                  placeholder="Descripción de la categoría..."
                  rows="3"
                  class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Imagen (Opcional)</label>
                <input 
                  type="file" 
                  (change)="onFileChange($event)"
                  accept="image/*"
                  class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                >
              </div>

              <div class="pt-4 flex gap-3">
                <button 
                  type="button" 
                  (click)="closeModal()"
                  class="flex-1 px-4 py-2 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  [disabled]="categoryForm.invalid || loading()"
                  class="flex-1 px-4 py-2 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 shadow-lg shadow-orange-200 transition-all"
                >
                  @if (loading()) {
                    <span class="animate-spin inline-block mr-2">...</span> Guardando
                  } @else {
                    Guardar Categoría
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
export class AdminCategoriesComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastrService);

  categories = signal<CategoryResponse[]>([]);
  showModal = signal(false);
  loading = signal(false);
  editingId = signal<number | null>(null);
  selectedFile: File | null = null;

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]]
  });

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.categoryService.getCategories().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(data => this.categories.set(data));
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  openModal(category?: CategoryResponse) {
    if (category) {
      this.editingId.set(category.id);
      this.categoryForm.patchValue({
        name: category.name,
        description: category.description
      });
    } else {
      this.editingId.set(null);
      this.categoryForm.reset();
    }
    this.selectedFile = null;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.categoryForm.reset();
    this.selectedFile = null;
  }

  saveCategory() {
    if (this.categoryForm.invalid) return;

    this.loading.set(true);
    const request: CategoryRequest = {
      name: this.categoryForm.value.name,
      description: this.categoryForm.value.description,
      image: this.selectedFile
    };

    const operation: Observable<any> = this.editingId() 
      ? this.categoryService.updateCategory(this.editingId()!, request)
      : this.categoryService.createCategory(request);

    operation.subscribe({
      next: () => {
        this.toastService.success(
          this.editingId() ? 'Categoría actualizada' : 'Categoría creada', 
          '¡Éxito!'
        );
        this.loadCategories();
        this.closeModal();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al guardar categoría:', err);
        this.toastService.error('Ocurrió un error al guardar la categoría', 'Error');
        this.loading.set(false);
      }
    });
  }

  deleteCategory(id: number) {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.toastService.success('Categoría eliminada', '¡Éxito!');
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error al eliminar categoría:', err);
          this.toastService.error('No se pudo eliminar la categoría', 'Error');
        }
      });
    }
  }
}
