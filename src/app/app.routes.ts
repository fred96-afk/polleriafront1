import { Routes } from '@angular/router';
import { CustomerComponent } from './features/customer/customer.component';
import { LoginComponent } from './features/auth/login.component';
import { LayoutComponent } from './features/layout.component';
import { SalesComponent } from './features/sales/sales.component';
import { AdminComponent } from './features/admin/admin.component';

export const routes: Routes = [
  // Parte Pública (Cliente)
  { path: '', component: CustomerComponent },

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
