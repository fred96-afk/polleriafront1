import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments.development';
import { Banner, PagedResponse } from '../models/banner.model';

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${enviroment.backenbaseurl}/api/Banners`;

  getBanners(): Observable<Banner[]> {
    return this.http.get<Banner[]>(this.apiUrl);
  }

  getPagedBanners(pageNumber: number, pageSize: number): Observable<PagedResponse<Banner>> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());
    return this.http.get<PagedResponse<Banner>>(`${this.apiUrl}/paged`, { params });
  }

  getBannerById(id: number): Observable<Banner> {
    return this.http.get<Banner>(`${this.apiUrl}/${id}`);
  }

  createBanner(formData: FormData): Observable<void> {
    return this.http.post<void>(this.apiUrl, formData);
  }

  updateBanner(id: number, formData: FormData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData);
  }

  deleteBanner(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
