import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Icon, IconName } from './icon';

interface Tab {
  label: string;
  path: string;
  icon: IconName;
  /** Otras rutas que mantienen esta pestaña activa (p. ej. /ar mantiene Scan). */
  also?: string[];
}

@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, Icon],
  template: `
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-safe-bottom"
      aria-label="Navegación principal"
    >
      <ul class="flex h-[72px] items-stretch justify-between px-4">
        @for (tab of tabs; track tab.path) {
          <li class="flex w-16">
            <a
              [routerLink]="tab.path"
              [class.is-active]="active() === tab.path"
              [attr.aria-current]="active() === tab.path ? 'page' : null"
              class="pressable group flex min-h-[44px] w-full flex-col items-center justify-center gap-1 text-muted"
            >
              <app-icon [name]="tab.icon" [size]="22" class="group-[.is-active]:text-pink" />
              <span
                class="font-sans text-[10px] font-medium leading-none group-[.is-active]:font-bold group-[.is-active]:text-white"
                >{{ tab.label }}</span
              >
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TabBar {
  readonly tabs: Tab[] = [
    { label: 'Home', path: '/home', icon: 'Home' },
    { label: 'Videos', path: '/videos', icon: 'CirclePlay' },
    { label: 'Scan', path: '/scan', icon: 'Aperture', also: ['/ar'] },
    { label: 'TCG Vault', path: '/vault', icon: 'Layers' },
    { label: 'Game', path: '/game', icon: 'Gamepad2' },
  ];

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly url = signal(this.router.url);

  readonly active = computed(() => {
    const url = this.url().split('?')[0];
    const tab = this.tabs.find((t) => url.startsWith(t.path) || t.also?.some((p) => url.startsWith(p)));
    return tab?.path ?? null;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }
}
