import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  status = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('error');
      this.errorMessage.set('Token de verificación no encontrado.');
      return;
    }

    this.verify(token);
  }

  verify(token: string) {
    this.authService.verifyEmail(token).pipe(
      finalize(() => {})
    ).subscribe({
      next: () => {
        this.status.set('success');
        this.toastr.success('Tu correo ha sido verificado con éxito.', '¡Éxito!');
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(err.error?.message || 'Hubo un problema al verificar tu correo.');
        this.toastr.error('No se pudo verificar el correo.', 'Error');
      }
    });
  }
}
