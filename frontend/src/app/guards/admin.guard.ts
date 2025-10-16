// src/app/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/** Decode a JWT payload without extra deps (Base64URL -> JSON) */
function decodeJwtPayload(token: string): any | null {
  try {
    const part = token.split('.')[1] || '';
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Read roles from token, supports string "(ADMIN,USER)" or array ["ADMIN","USER"] */
function getRoles(): string[] {
  const token = localStorage.getItem('token'); // <-- your app stores 'token', not 'jwt'
  if (!token) return [];
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  const raw = payload.roles;
  if (Array.isArray(raw)) {
    return raw.map((r: string) => String(r).trim().toUpperCase());
  }
  return String(raw || '')
    .split(',')
    .map((r: string) => r.trim().toUpperCase())
    .filter(Boolean);
}

/** Require BOTH ADMIN and USER privileges */
function hasAdminUser(): boolean {
  const roles = getRoles();
  return roles.includes('ADMIN') && roles.includes('USER');
}

/** Admin route guard */
export const AdminGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);

  // No token? go to login
  const token = localStorage.getItem('token');
  if (!token) return router.parseUrl('/login');

  // Enforce ADMIN + USER
  if (hasAdminUser()) return true;

  // Auth but not enough privilege -> send to main app
  return router.parseUrl('/app');
};
