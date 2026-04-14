import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastrService);
  private readonly router = inject(Router);

  loading = signal(false);
  emailSent = signal(false);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const email = this.forgotForm.value.email!;

    this.authService.forgotPassword({ email }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.emailSent.set(true);
        this.toastService.success('Se ha enviado un enlace de recuperación a tu correo.', '¡Éxito!');
      },
      error: (err) => {
        console.error('Error en forgot password:', err);
        this.toastService.error('No se pudo procesar la solicitud. Verifica el correo ingresado.', 'Error');
      }
    });
  }
}
