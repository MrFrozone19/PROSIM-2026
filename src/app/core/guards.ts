import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

/** Pantallas de la app: sin sesión manda a /login y recuerda a dónde iba. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.user() ? true : router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};

/** /login: con sesión ya abierta manda al inicio. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.user() ? router.createUrlTree(['/home']) : true;
};
