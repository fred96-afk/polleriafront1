import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { ProductRequest, ProductResponse } from '../models/product.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Products`;

  getProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  createProduct(request: ProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, request);
  }

  updateProduct(id: number, request: ProductRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
