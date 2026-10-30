import { Component, computed, input, signal } from '@angular/core';
import { initials } from './prefs';

/** Foto de perfil (Google) o, si no hay o falla, círculo con iniciales sobre el gradiente de la marca. */
@Component({
  selector: 'app-avatar',
  template: `
    @if (photo() && !failed()) {
      <img
        [src]="photo()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        class="rounded-full object-cover"
        referrerpolicy="no-referrer"
        (error)="failed.set(true)"
        alt=""
      />
    } @else {
      <span
        class="flex items-center justify-center rounded-full bg-cta font-display font-black text-white"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="size() * 0.34"
        >{{ letters() }}</span
      >
    }
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class Avatar {
  readonly name = input('');
  readonly photo = input<string | null>(null);
  readonly size = input(32);
  protected readonly failed = signal(false);
  protected readonly letters = computed(() => initials(this.name()));
}
