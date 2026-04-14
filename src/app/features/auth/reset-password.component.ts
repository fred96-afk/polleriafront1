import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = signal(false);
  showPassword = signal(false);
  token = signal<string | null>(null);

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: (group) => {
      const pass = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { mismatch: true };
    }
  });

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.toastService.error('Token de recuperación no válido o ausente.', 'Error');
      this.router.navigate(['/login']);
      return;
    }
    this.token.set(token);
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const newPassword = this.resetForm.value.password!;

    this.authService.resetPassword({
      token: this.token(),
      newPassword: newPassword
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.toastService.success('Tu contraseña ha sido restablecida con éxito.', '¡Hecho!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error en reset password:', err);
        this.toastService.error('Hubo un problema al restablecer la contraseña. El enlace puede haber expirado.', 'Error');
      }
    });
  }
}
