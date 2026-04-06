import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ProductResponse, ProductRequest } from '../../models/product.model';
import { CategoryResponse } from '../../models/category.model';
import { ToastrService } from 'ngx-toastr';
import { Observable, finalize } from 'rxjs';

@Component({
  selector: 'app-admin-products',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">Gestión de Productos</h2>
        <button 
          (click)="openModal()"
          class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center"
        >
          <span class="material-icons-outlined mr-2">add</span> Nuevo Producto
        </button>
      </div>

      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
          <tr>
            <th class="px-6 py-4">Imagen</th>
            <th class="px-6 py-4">Nombre</th>
            <th class="px-6 py-4">Categoría</th>
            <th class="px-6 py-4">Descripción</th>
            <th class="px-6 py-4">Precio Base</th>
            <th class="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <tr class="animate-pulse">
                <td class="px-6 py-4"><div class="w-12 h-12 bg-gray-200 rounded-lg"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-3/4"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-1/2"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-full"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded w-1/4"></div></td>
                <td class="px-6 py-4"><div class="flex justify-center gap-2"><div class="w-8 h-8 bg-gray-200 rounded"></div><div class="w-8 h-8 bg-gray-200 rounded"></div></div></td>
              </tr>
            }
          } @else {
            @for (p of productsWithCategory(); track p.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  @if (p.imageUrl) {
                    <img [src]="p.imageUrl" class="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-100" alt="Product image">
                  } @else {
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <span class="material-icons-outlined">inventory_2</span>
                    </div>
                  }
                </td>
                <td class="px-6 py-4 font-semibold text-gray-700">{{ p.name }}</td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                    {{ p.categoryName || 'Sin categoría' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm">{{ p.description }}</td>
                <td class="px-6 py-4 text-orange-600 font-bold">S/ {{ p.basePrice.toFixed(2) }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-center space-x-2">
                    <button (click)="openModal(p)" class="text-blue-600 hover:text-blue-800 p-1">
                      <span class="material-icons-outlined">edit</span>
                    </button>
                    <button (click)="deleteProduct(p.id)" class="text-red-600 hover:text-red-800 p-1">
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
                {{ editingId() ? 'Editar Producto' : 'Nuevo Producto' }}
              </h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
                <span class="material-icons-outlined">close</span>
              </button>
            </div>

            <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  formControlName="name"
                  placeholder="Ej: Pollo a la Brasa"
                  class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                >
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                <select 
                  formControlName="categoryId"
                  class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                >
                  <option [ngValue]="null">Seleccionar categoría...</option>
                  @for (cat of categories(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea 
                  formControlName="description"
                  placeholder="Descripción detallada..."
                  rows="3"
                  class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Precio Base (S/)</label>
                <input 
                  type="number" 
                  formControlName="basePrice"
                  step="0.10"
                  class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                >
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
                  [disabled]="productForm.invalid || loading()"
                  class="flex-1 px-4 py-2 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 shadow-lg shadow-orange-200 transition-all"
                >
                  @if (loading()) {
                    <span class="animate-spin inline-block mr-2">...</span> Guardando
                  } @else {
                    Guardar Producto
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
export class AdminProductsComponent {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastrService);

  products = signal<ProductResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  showModal = signal(false);
  loading = signal(false);
  editingId = signal<number | null>(null);
  selectedFile: File | null = null;

  // Signal computada para unir productos con sus nombres de categoría
  productsWithCategory = computed(() => {
    const prods = this.products();
    const cats = this.categories();
    return prods.map(p => ({
      ...p,
      categoryName: p.categoryName || cats.find(c => c.id === p.categoryId)?.name
    }));
  });

  productForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    basePrice: [0, [Validators.required, Validators.min(0.1)]],
    categoryId: [null as number | null, [Validators.required]]
  });

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    this.loading.set(true);
    this.productService.getProducts().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(data => this.products.set(data));
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe(data => this.categories.set(data));
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  openModal(product?: ProductResponse) {
    if (product) {
      this.editingId.set(product.id);
      this.productForm.patchValue({
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        categoryId: product.categoryId
      });
    } else {
      this.editingId.set(null);
      this.productForm.reset({ basePrice: 0, categoryId: null });
    }
    this.selectedFile = null;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.productForm.reset();
    this.selectedFile = null;
  }

  saveProduct() {
    if (this.productForm.invalid) return;

    this.loading.set(true);
    const request: ProductRequest = {
      name: this.productForm.value.name,
      description: this.productForm.value.description,
      basePrice: this.productForm.value.basePrice ?? 0,
      categoryId: this.productForm.value.categoryId,
      image: this.selectedFile
    };

    const operation: Observable<any> = this.editingId() 
      ? this.productService.updateProduct(this.editingId()!, request)
      : this.productService.createProduct(request);

    operation.subscribe({
      next: () => {
        this.toastService.success(
          this.editingId() ? 'Producto actualizado' : 'Producto creado', 
          '¡Éxito!'
        );
        this.loadProducts();
        this.closeModal();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al guardar producto:', err);
        this.toastService.error('Ocurrió un error al guardar el producto', 'Error');
        this.loading.set(false);
      }
    });
  }

  deleteProduct(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.toastService.success('Producto eliminado', '¡Éxito!');
          this.loadProducts();
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          this.toastService.error('No se pudo eliminar the producto', 'Error');
        }
      });
    }
  }
}
