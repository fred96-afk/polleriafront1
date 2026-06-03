import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { RoleService } from '../../services/role.service';
import { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../../models/role.model';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-roles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRolesComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastrService);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  loading = signal(false);
  saving = signal(false);
  showModal = signal(false);
  editingId = signal<number | null>(null);

  roleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    permissionIds: this.fb.array([])
  });

  ngOnInit() {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles() {
    this.loading.set(true);
    this.roleService.getRoles().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => this.roles.set(data),
      error: () => this.toastService.error('Error al cargar roles')
    });
  }

  loadPermissions() {
    this.roleService.getPermissions().subscribe({
      next: (data) => this.permissions.set(data),
      error: () => this.toastService.error('Error al cargar permisos')
    });
  }

  get permissionIds() {
    return this.roleForm.get('permissionIds') as FormArray;
  }

  onPermissionChange(event: any) {
    const id = parseInt(event.target.value);
    if (event.target.checked) {
      this.permissionIds.push(new FormControl(id));
    } else {
      const index = this.permissionIds.controls.findIndex(x => x.value === id);
      this.permissionIds.removeAt(index);
    }
  }

  isPermissionSelected(id: number): boolean {
    return this.permissionIds.value.includes(id);
  }

  openModal(role?: Role) {
    this.permissionIds.clear();
    if (role) {
      this.editingId.set(role.id);
      this.roleForm.patchValue({ name: role.name });
      role.permissions.forEach(p => {
        this.permissionIds.push(new FormControl(p.id));
      });
    } else {
      this.editingId.set(null);
      this.roleForm.reset();
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.roleForm.reset();
    this.permissionIds.clear();
  }

  saveRole() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const { name, permissionIds } = this.roleForm.getRawValue();
    this.saving.set(true);

    const request: CreateRoleRequest = {
      name: name!,
      permissionIds: permissionIds as number[]
    };

    const operation: Observable<any> = this.editingId()
      ? this.roleService.updateRole(this.editingId()!, request)
      : this.roleService.createRole(request);

    operation.pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.toastService.success(
          this.editingId() ? 'Rol actualizado correctamente' : 'Rol creado correctamente',
          'Éxito'
        );
        this.closeModal();
        this.loadRoles();
      },
      error: () => {
        this.toastService.error('Ocurrió un error al guardar el rol', 'Error');
      }
    });
  }

  deleteRole(id: number) {
    if (confirm('¿Estás seguro de eliminar este rol?')) {
      this.roleService.deleteRole(id).subscribe({
        next: () => {
          this.toastService.success('Rol eliminado correctamente');
          this.loadRoles();
        },
        error: () => this.toastService.error('No se pudo eliminar el rol')
      });
    }
  }
}
