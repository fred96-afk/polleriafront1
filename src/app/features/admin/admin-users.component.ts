import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminUserService } from '../../services/admin-user.service';
import {
  ADMINISTRATIVE_ROLE_OPTIONS,
  AdministrativeUser
} from '../../models/admin-user.model';

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent {
  private readonly adminUserService = inject(AdminUserService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastrService);

  readonly administrativeRoles = ADMINISTRATIVE_ROLE_OPTIONS;
  readonly users = signal<AdministrativeUser[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showModal = signal(false);
  readonly listError = signal('');
  readonly editingId = signal<number | null>(null);
  private readonly passwordMatchValidator = (group: AbstractControl) => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    const editingId = this.editingId();

    if (editingId && !password && !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { mismatch: true };
  };

  readonly userForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      roleId: [this.administrativeRoles[0].id, [Validators.required]]
    },
    { validators: this.passwordMatchValidator }
  );

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.listError.set('');

    this.adminUserService.getAdministrativeUsers().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (users) => this.users.set(users),
      error: () => {
        this.users.set([]);
        this.listError.set(
          'No se pudo cargar el listado de usuarios administrativos. Verifica que el backend exponga GET /api/Users.'
        );
      }
    });
  }

  openModal(user?: AdministrativeUser) {
    if (user) {
      this.editingId.set(user.id);
      this.userForm.reset({
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: '',
        roleId: user.roleId
      });
      this.userForm.controls.password.setValidators([Validators.minLength(6)]);
      this.userForm.controls.confirmPassword.clearValidators();
    } else {
      this.editingId.set(null);
      this.userForm.reset({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleId: this.administrativeRoles[0].id
      });
      this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.controls.confirmPassword.setValidators([Validators.required]);
    }

    this.userForm.controls.password.updateValueAndValidity();
    this.userForm.controls.confirmPassword.updateValueAndValidity();
    this.userForm.updateValueAndValidity();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { name, email, password, roleId } = this.userForm.getRawValue();
    this.saving.set(true);

    const request = {
      name,
      email,
      password: password || undefined,
      roleId
    };

    const operation: Observable<void> = this.editingId()
      ? this.adminUserService.updateAdministrativeUser(this.editingId()!, request)
      : this.adminUserService.createAdministrativeUser(request);

    operation.pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.toastService.success(
          this.editingId() ? 'Usuario administrativo actualizado correctamente' : 'Usuario administrativo creado correctamente',
          'Éxito'
        );
        this.closeModal();
        this.loadUsers();
      },
      error: () => {
        this.toastService.error(
          this.editingId() ? 'No se pudo actualizar el usuario administrativo' : 'No se pudo crear el usuario administrativo',
          'Error'
        );
      }
    });
  }

}
