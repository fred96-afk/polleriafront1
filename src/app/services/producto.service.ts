import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import { ProductoRequest, ProductoResponse } from '../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Productos`;

  getProductos(): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(this.apiUrl);
  }

  getProductoById(id: number): Observable<ProductoResponse> {
    return this.http.get<ProductoResponse>(`${this.apiUrl}/${id}`);
  }

  createProducto(request: ProductoRequest): Observable<ProductoResponse> {
    return this.http.post<ProductoResponse>(this.apiUrl, request);
  }

  updateProducto(id: number, request: ProductoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
