import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Pollería "El Sabroso"
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Inicia sesión para gestionar tus ventas
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div class="mb-4">
              <label for="email-address" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email-address"
                formControlName="email"
                type="email"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                id="password"
                formControlName="password"
                type="password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          @if (error()) {
            <div class="text-red-500 text-sm text-center">
              {{ error() }}
            </div>
          }

          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || loading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              @if (loading()) {
                <span class="animate-spin mr-2">...</span>
              }
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.error.set(null);
      
      const { email, password } = this.loginForm.value;
      
      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          // Simplificación: Guardar token y navegar
          localStorage.setItem('token', 'fake-token'); // Simulado por ahora
          this.router.navigate(['/admin/sales']);
        },
        error: (err) => {
          this.error.set('Credenciales inválidas');
          this.loading.set(false);
        }
      });
    }
  }
}
