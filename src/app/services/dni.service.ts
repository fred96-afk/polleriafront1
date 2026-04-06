import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { Observable, map, catchError, of } from 'rxjs';

export interface ConsultaData {
  nombre?: string;
  razonSocial?: string;
  numero: string;
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DniService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://dniruc.apisperu.com/api/v1';
  private readonly token = enviroment.apisPeruToken;

  consultarDocumento(num: string): Observable<ConsultaData> {
    const isRuc = num.length === 11;
    const type = isRuc ? 'ruc' : 'dni';
    const url = `${this.baseUrl}/${type}/${num}?token=${this.token}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        if (res && (res.nombre || res.razonSocial)) {
          // Si es DNI devuelve 'nombre', si es RUC devuelve 'razonSocial'
          return {
            success: true,
            nombre: res.nombre || res.razonSocial,
            numero: res.numero || num
          } as ConsultaData;
        }
        return { success: false, message: 'No se encontraron resultados' } as ConsultaData;
      }),
      catchError(err => {
        console.error(`Error en consulta ${type.toUpperCase()}:`, err);
        return of({ success: false, message: 'Error de conexión con el API' } as ConsultaData);
      })
    );
  }
}
