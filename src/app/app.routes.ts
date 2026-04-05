import { Routes } from '@angular/router';
import { CustomerComponent } from './features/customer/customer.component';
import { LoginComponent } from './features/auth/login.component';
import { LayoutComponent } from './features/layout.component';
import { SalesComponent } from './features/sales/sales.component';
import { AdminComponent } from './features/admin/admin.component';
import { CheckoutResultComponent } from './features/customer/checkout-result.component';

export const routes: Routes = [
  // Parte Pública (Cliente)
  { path: '', component: CustomerComponent },
  { path: 'checkout/success', component: CheckoutResultComponent },
  { path: 'checkout/failure', component: CheckoutResultComponent },
  { path: 'checkout/pending', component: CheckoutResultComponent },

  // Parte Administrativa
  { path: 'admin/login', component: LoginComponent },
  {
    path: 'admin',
    component: LayoutComponent,
    children: [
      { path: 'sales', component: SalesComponent },
      { path: 'dashboard', component: AdminComponent },
      { path: '', redirectTo: 'sales', pathMatch: 'full' }
    ]
  },

  // Comodín
  { path: '**', redirectTo: '' }
];
