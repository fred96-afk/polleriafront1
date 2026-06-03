import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backendbaseurl}/api/Reports`;

  downloadSalesPdf(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get(`${this.apiUrl}/sales/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  downloadSalesExcel(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get(`${this.apiUrl}/sales/excel`, {
      params,
      responseType: 'blob'
    });
  }
}
