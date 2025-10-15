import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Match both relative `/api/...` and absolute `http://localhost:8080/api/...`
  const isApi = req.url.includes('/api/');
  const isAuth = req.url.includes('/api/auth/');

  if (token && isApi && !isAuth) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
