import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
  Aperture,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  Camera,
  CameraOff,
  Check,
  ChevronRight,
  CircleHelp,
  CirclePlay,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Home,
  IconNode,
  Info,
  Layers,
  Lock,
  Maximize,
  Medal,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  ScanLine,
  Search,
  Settings,
  Share2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  User,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide';

/** Solo los iconos que usa la app, para que el bundle no cargue el set completo. */
const ICONS = {
  Aperture,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  Camera,
  CameraOff,
  Check,
  ChevronRight,
  CircleHelp,
  CirclePlay,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Home,
  Info,
  Layers,
  Lock,
  Maximize,
  Medal,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  ScanLine,
  Search,
  Settings,
  Share2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  User,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

/** Icono Lucide inline (trazo 2px, extremos redondeados). Color = currentColor. */
@Component({
  selector: 'app-icon',
  template: `<span
    class="inline-flex shrink-0 leading-none [&>svg]:h-full [&>svg]:w-full"
    [style.width.px]="size()"
    [style.height.px]="size()"
    [innerHTML]="svg()"
    aria-hidden="true"
  ></span>`,
  host: { class: 'inline-flex leading-none' },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);
  readonly strokeWidth = input(2);

  private readonly sanitizer = inject(DomSanitizer);

  readonly svg = computed(() => {
    const node = ICONS[this.name()];
    const inner = node
      .map(([tag, attrs]) => {
        const a = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        return `<${tag} ${a}/>`;
      })
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${this.strokeWidth()}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });
}
