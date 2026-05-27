import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function denyAccess(router: Router, authService: AuthService, redirectTo: string) {
  authService.logout();
  return router.createUrlTree([redirectTo]);
}

export const internalAccessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  if (authService.canAccessAdminDashboard() || authService.canAccessPos()) {
    return true;
  }

  return denyAccess(router, authService, '/admin/login');
};

export const adminDashboardGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  if (authService.canAccessAdminDashboard()) {
    return true;
  }

  if (authService.canAccessPos()) {
    return router.createUrlTree(['/admin/sales']);
  }

  return denyAccess(router, authService, '/admin/login');
};

export const deliveryGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Los repartidores son staff, deben loguearse en la parte administrativa
    return router.createUrlTree(['/admin/login']);
  }

  if (authService.isDelivery() || authService.isAdministrator()) {
    return true;
  }

  // Si está logueado pero no es delivery, lo mandamos al inicio
  return router.createUrlTree(['/']);
};

export const posGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  if (authService.canAccessPos()) {
    return true;
  }

  if (authService.canAccessAdminDashboard()) {
    return router.createUrlTree(['/admin/dashboard/products']);
  }

  return denyAccess(router, authService, '/admin/login');
};
