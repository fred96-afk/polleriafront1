import { inject, Injectable } from '@angular/core';
import { BannerService } from './banner.service';
import { ProductService } from './product.service';
import { CatalogoService } from './catalogo.service';
import { forkJoin, Observable, of, tap } from 'rxjs';
import { HttpCacheService } from './http-cache.service';
import { Banner } from '../models/banner.model';
import { PagedResponse, ProductResponse } from '../models/product.model';
import { TipoDocumento } from '../models/catalogo.model';

export interface HomeData {
  banners: Banner[];
  products: PagedResponse<ProductResponse>;
  tiposDocumento: TipoDocumento[];
}

@Injectable({
  providedIn: 'root'
})
export class HomeCacheService {
  private readonly bannerService = inject(BannerService);
  private readonly productService = inject(ProductService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly cache = inject(HttpCacheService);

  private readonly CACHE_KEY = 'home_main_data';

  getHomeData(page: number, size: number, term: string = '', forceRefresh = false): Observable<HomeData> {
    // Solo cacheamos la primera página sin búsqueda por defecto para "Home Data"
    // Pero si quieren cachear todo, podríamos usar una clave compuesta
    const cacheKey = `${this.CACHE_KEY}_${page}_${size}_${term}`;
    
    if (!forceRefresh) {
      const cached = this.cache.get<HomeData>(cacheKey);
      if (cached) {
        console.log('Serving home data from cache:', cacheKey);
        return of(cached);
      }
    }

    return forkJoin({
      banners: this.bannerService.getBanners(),
      products: this.productService.getPagedProducts(page, size, term),
      tiposDocumento: this.catalogoService.getTiposDocumento()
    }).pipe(
      tap(data => {
        this.cache.set(cacheKey, data);
        console.log('Home data cached:', cacheKey);
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}
