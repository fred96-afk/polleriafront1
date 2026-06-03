import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../enviroments/enviroments.development';
import { ClientRequest, ClientResponse } from '../models/client.model';
import { PagedResponse } from '../models/product.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backendbaseurl}/api/Clients`;

  getClients(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.apiUrl);
  }

  getPagedClients(pageNumber: number, pageSize: number): Observable<PagedResponse<ClientResponse>> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<PagedResponse<ClientResponse>>(`${this.apiUrl}/paged`, { params });
  }

  getClientById(id: number): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.apiUrl}/${id}`);
  }

  createClient(request: ClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.apiUrl, request);
  }

  updateClient(id: number, request: ClientRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
