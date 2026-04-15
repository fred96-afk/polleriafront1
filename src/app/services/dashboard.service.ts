import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { DashboardStats } from '../models/dashboard.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Dashboard`;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}
