import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon, IconName } from './icon';

interface Tab {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-safe-bottom"
      aria-label="Navegación principal"
    >
      <ul class="flex h-[72px] items-stretch justify-around px-1">
        @for (tab of tabs; track tab.path) {
          <li class="flex flex-1">
            <a
              [routerLink]="tab.path"
              routerLinkActive="is-active"
              class="pressable group flex min-h-[44px] w-full flex-col items-center justify-center gap-1.5 text-muted"
            >
              <app-icon [name]="tab.icon" [size]="24" class="group-[.is-active]:text-pink" />
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
    { label: 'Scan', path: '/scan', icon: 'Aperture' },
    { label: 'TCG Vault', path: '/vault', icon: 'Layers' },
    { label: 'Game', path: '/game', icon: 'Gamepad2' },
  ];
}
