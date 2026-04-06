import { Routes } from '@angular/router';
import { CustomerComponent } from './features/customer/customer.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { AdminLoginComponent } from './features/auth/admin-login.component';
import { LayoutComponent } from './features/layout.component';
import { SalesComponent } from './features/sales/sales.component';
import { AdminComponent } from './features/admin/admin.component';
import { CheckoutResultComponent } from './features/customer/checkout-result.component';

import { AdminProductsComponent } from './features/admin/admin-products.component';
import { AdminClientsComponent } from './features/admin/admin-clients.component';
import { AdminOrdersComponent } from './features/admin/admin-orders.component';
import { AdminCategoriesComponent } from './features/admin/admin-categories.component';

export const routes: Routes = [
  // Parte Pública (Cliente)
  { path: '', component: CustomerComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'checkout/success', component: CheckoutResultComponent },
  { path: 'checkout/failure', component: CheckoutResultComponent },
  { path: 'checkout/pending', component: CheckoutResultComponent },

  // Parte Administrativa
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin',
    component: LayoutComponent,
    children: [
      { path: 'sales', component: SalesComponent },
      { 
        path: 'dashboard', 
        component: AdminComponent,
        children: [
          { path: 'products', component: AdminProductsComponent },
          { path: 'categories', component: AdminCategoriesComponent },
          { path: 'clients', component: AdminClientsComponent },
          { path: 'orders', component: AdminOrdersComponent },
          { path: '', redirectTo: 'products', pathMatch: 'full' }
        ]
      },
      { path: '', redirectTo: 'sales', pathMatch: 'full' }
    ]
  },

  // Comodín
  { path: '**', redirectTo: '' }
];
