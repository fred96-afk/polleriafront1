import { HttpInterceptorFn } from '@angular/common/http';
import { enviroment } from '../../enviroments/enviroments.development';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const isBackendRequest = req.url.startsWith(enviroment.backendbaseurl);
  
  if (token && isBackendRequest) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};
