import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token') || '';
  const router = inject(Router);

  // Consider anything under /api/ as backend calls (both relative and absolute)
  const isApiCall = req.url.includes('/api/');
  // Don’t attach token to auth endpoints (login/register/refresh)
  const isAuthEndpoint = req.url.includes('/api/auth/');

  let cloned = req;

  if (token && isApiCall && !isAuthEndpoint) {
    cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(cloned).pipe(
    // Optional: keep users on the page for "expected" 401s (like invalid OTP / bad current password).
    // We only redirect to /login if there is NO token at all or the request wasn't a security/password change.
    // eslint-disable-next-line rxjs/no-ignored-observable
    // tap({ error: (err) => {
    //   if (err instanceof HttpErrorResponse && err.status === 401) {
    //     const bodyMsg = (err.error?.message || err.error?.error || '').toString().toLowerCase();
    //     const isPwdChange = cloned.url.includes('/api/me/security/password/change');
    //     const hasToken = !!token;
    //     const isExpected = bodyMsg.includes('invalid otp') || bodyMsg.includes('current password is incorrect');
    //     if (!isPwdChange && !isExpected && !hasToken) {
    //       router.navigateByUrl('/login');
    //     }
    //   }
    // }})
  );
};
