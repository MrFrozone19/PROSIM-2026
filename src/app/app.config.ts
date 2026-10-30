import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash routing: funciona en cualquier hosting estático (Firebase, Cloudflare, Pages) sin configurar redirecciones.
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
};
