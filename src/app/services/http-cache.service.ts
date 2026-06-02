import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpCacheService {
  private readonly cacheKey = 'el_gigante_home_cache';

  set(key: string, data: any): void {
    const fullCache = this.getAll();
    fullCache[key] = {
      data,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(fullCache));
    } catch (e) {
      console.error('Error saving to cache', e);
      // If localStorage is full, clear it and try again or just skip
    }
  }

  get<T>(key: string): T | null {
    const fullCache = this.getAll();
    const item = fullCache[key];
    return item ? item.data : null;
  }

  getAll(): any {
    try {
      const data = localStorage.getItem(this.cacheKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  clear(): void {
    localStorage.removeItem(this.cacheKey);
  }
}
