import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('jwt');
  if (token) return true;
  router.navigateByUrl('/login');
  return false;
};
