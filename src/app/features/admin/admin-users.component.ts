import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Observable, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminUserService } from '../../services/admin-user.service';
import { PusherService } from '../../services/pusher.service';
import {
  ADMINISTRATIVE_ROLE_OPTIONS,
  AdministrativeUser
} from '../../models/admin-user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private readonly adminUserService = inject(AdminUserService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastrService);
  private readonly pusherService = inject(PusherService);

  readonly administrativeRoles = ADMINISTRATIVE_ROLE_OPTIONS;
  readonly users = signal<AdministrativeUser[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showModal = signal(false);
  readonly listError = signal('');
  readonly editingId = signal<number | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  totalCount = signal(0);

  private pusherSubscription?: Subscription;

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

  ngOnInit() {
    this.loadUsers();
    this.subscribeToPusher();
  }

  ngOnDestroy() {
    this.pusherSubscription?.unsubscribe();
  }

  subscribeToPusher() {
    this.pusherSubscription = this.pusherService.orderNotifications$.subscribe({
      next: (data) => {
        console.log('[ADMIN] WebSocket: Nuevo pedido detectado!', data);
        this.toastService.info(`Nuevo pedido recibido (#${data.id || ''})`, '¡Venta en Línea!');
        this.loadUsers();
      }
    });

    this.pusherService.subscribeToChannel('orders-channel', 'order-updated-global', () => {
      this.loadUsers();
    });
  }

  loadUsers() {
    this.loading.set(true);
    this.listError.set('');

    this.adminUserService.getPagedAdministrativeUsers(this.currentPage(), this.pageSize()).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => {
        this.users.set(data.items.sort((a, b) => b.id - a.id));
        this.totalPages.set(data.totalPages);
        this.totalCount.set(data.totalCount);
      },
      error: () => {
        // Fallback
        this.adminUserService.getAdministrativeUsers().pipe(
          finalize(() => this.loading.set(false))
        ).subscribe({
          next: (users) => {
            const sorted = users.sort((a, b) => b.id - a.id);
            this.totalCount.set(sorted.length);
            this.totalPages.set(Math.ceil(sorted.length / this.pageSize()));
            const start = (this.currentPage() - 1) * this.pageSize();
            this.users.set(sorted.slice(start, start + this.pageSize()));
          },
          error: () => {
            this.users.set([]);
            this.listError.set(
              'No se pudo cargar el listado de usuarios administrativos. Verifica que el backend exponga GET /api/Users.'
            );
          }
        });
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
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
