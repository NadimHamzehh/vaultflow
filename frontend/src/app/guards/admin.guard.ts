import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode'; // <-- named import



export const AdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const t = localStorage.getItem('jwt');
  if (!t) { router.navigateByUrl('/login'); return false; }
  try {
    const payload: any = jwtDecode(t);
    const roles: string = payload['roles'] || '';
    if (roles.split(',').map(r=>r.trim().toUpperCase()).includes('ADMIN')) return true;
  } catch {}
  router.navigateByUrl('/transfer');
  return false;
};
