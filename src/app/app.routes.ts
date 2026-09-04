import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadComponent: () => import('./screens/home/home').then((m) => m.HomeScreen) },
  { path: 'videos', loadComponent: () => import('./screens/videos/videos').then((m) => m.VideosScreen) },
  { path: 'scan', loadComponent: () => import('./screens/scan/scan').then((m) => m.ScanScreen) },
  { path: 'ar', loadComponent: () => import('./screens/ar/ar').then((m) => m.ArScreen) },
  { path: 'vault', loadComponent: () => import('./screens/vault/vault').then((m) => m.VaultScreen) },
  { path: 'game', loadComponent: () => import('./screens/game/game').then((m) => m.GameScreen) },
  { path: 'profile', loadComponent: () => import('./screens/profile/profile').then((m) => m.ProfileScreen) },
  { path: '**', redirectTo: 'home' },
];
