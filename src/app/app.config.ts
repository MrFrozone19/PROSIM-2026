import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash routing: funciona en GitHub Pages (subcarpeta) sin configurar redirecciones.
    provideRouter(routes, withHashLocation()),
  ],
};
