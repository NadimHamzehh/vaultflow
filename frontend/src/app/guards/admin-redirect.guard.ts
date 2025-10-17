// src/app/guards/admin-redirect.guard.ts
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

type JWTPayload = { roles?: string | string[] };

export const adminRedirectGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  const token = localStorage.getItem('token'); // keep the same key you use at login

  if (!token) {
    // Not logged in? Let other guards/routes decide; do NOT send to /admin.
    return true;
  }

  try {
    const payload = jwtDecode<JWTPayload>(token);
    const rolesRaw = Array.isArray(payload.roles)
      ? payload.roles.join(',')
      : (payload.roles || '');
    const roles = rolesRaw.split(',').map(r => r.trim().toUpperCase());

    // If user is ADMIN, redirect them away from /app to /admin
    if (roles.includes('ADMIN')) {
      return router.parseUrl('/admin');
    }
  } catch {
    // bad token -> just allow; your auth guard can handle login redirects
  }

  // Normal users proceed to /app
  return true;
};
