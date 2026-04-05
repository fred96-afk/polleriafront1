import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { LoginRequest } from '../models/auth.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Auth`;

  login(request: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, request);
  }
}
