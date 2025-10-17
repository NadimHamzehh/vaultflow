// src/app/guards/admin.guard.ts
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

type JWTPayload = { roles?: string | string[] };

export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  if (!token) return router.parseUrl('/login');

  try {
    const payload = jwtDecode<JWTPayload>(token);
    const rolesRaw = Array.isArray(payload.roles)
      ? payload.roles.join(',')
      : (payload.roles || '');
    const roles = rolesRaw.split(',').map(r => r.trim().toUpperCase());
    return roles.includes('ADMIN') ? true : router.parseUrl('/app');
  } catch {
    return router.parseUrl('/login');
  }
};
