import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import {
  Cargo,
  CategoriaProducto,
  EstadoPedido,
  MetodoPago,
  TipoComprobante,
  TipoDocumento,
} from '../models/catalogo.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Catalogos`;

  getTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<any>(`${this.apiUrl}/tipos-documento`).pipe(
      map(res => this.mapCollection(res))
    );
  }

  getMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<any>(`${this.apiUrl}/metodos-pago`).pipe(
      map(res => this.mapCollection(res))
    );
  }

  getTiposComprobante(): Observable<TipoComprobante[]> {
    return this.http.get<any>(`${this.apiUrl}/tipos-comprobante`).pipe(
      map(res => this.mapCollection(res))
    );
  }

  getEstadosPedido(): Observable<EstadoPedido[]> {
    return this.http.get<any>(`${this.apiUrl}/estados-pedido`).pipe(
      map(res => this.mapCollection(res))
    );
  }

  getCargos(): Observable<Cargo[]> {
    return this.http.get<any>(`${this.apiUrl}/cargos`).pipe(
      map(res => this.mapCollection(res))
    );
  }

  getCategoriasProducto(): Observable<CategoriaProducto[]> {
    return this.http.get<any>(`${this.apiUrl}/categorias-producto`).pipe(
      map(res => this.mapCollection(res))
    );
  }

  private mapCollection(response: any): any[] {
    let data = response;
    if (response && !Array.isArray(response) && typeof response === 'object') {
      data = response.data || response.value || response.items || [];
    }
    
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      id: item.id ?? item.Id ?? item.idTipoDocumento ?? item.idEstado ?? item.idMetodo ?? item.idCargo ?? item.idCategoria ?? item.idComprobante,
      nombre: item.nombre ?? item.Nombre ?? item.descripcion ?? item.name ?? item.Name,
      ...item
    }));
  }
}
