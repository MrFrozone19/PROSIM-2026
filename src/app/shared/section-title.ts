import { Component, input } from '@angular/core';

/** Etiqueta de sección: Unbounded Bold 12, color muted, mayúsculas. */
@Component({
  selector: 'app-section-title',
  template: `
    <div class="flex items-center justify-between">
      <h2 class="font-display text-[12px] font-bold uppercase tracking-wide text-muted">
        {{ text() }}
      </h2>
      <ng-content />
    </div>
  `,
  host: { class: 'block' },
})
export class SectionTitle {
  readonly text = input.required<string>();
}
