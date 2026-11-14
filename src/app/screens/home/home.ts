import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { SectionTitle } from '../../shared/section-title';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Avatar } from '../../shared/avatar';
import { AuthService } from '../../core/auth';
import { Team, TEAMS } from '../../data/teams';
import { Api, NewsFeed } from '../../core/api';

@Component({
  selector: 'app-home-screen',
  imports: [ScreenShell, SectionTitle, Icon, RouterLink, Avatar, DatePipe],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-5 pt-3">
        <!-- branding -->
        <header class="flex items-center justify-between">
          <h1 class="text-gradient font-display text-[22px] font-black leading-normal">
            BaseDex Fan
          </h1>
          <a
            routerLink="/profile"
            (click)="fb.tap()"
            class="pressable -mr-1.5 flex h-11 w-11 items-center justify-center"
            aria-label="Abrir perfil"
          >
            <app-avatar
              [name]="user()?.displayName || user()?.email || ''"
              [photo]="user()?.photoURL ?? null"
              [size]="32"
            />
          </a>
        </header>

        <!-- hero-mascot-card -->
        <section
          class="relative h-[320px] w-full overflow-hidden rounded-card border border-line bg-gradient-to-r from-white/[0.06] to-white/[0.01] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <img
            src="assets/figma/hero-mascot.webp"
            class="absolute inset-0 h-full w-full scale-110 object-cover [object-position:63%_47%]"
            alt=""
            fetchpriority="high"
          />
          <div
            class="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-transparent to-[rgba(12,12,18,0.98)] p-5"
          >
            <div class="flex flex-col gap-1">
              <p class="font-display text-[18px] font-bold leading-normal text-white">
                SCAN. PLAY. COLLECT.
              </p>
              <p class="font-sans text-[12px] font-semibold leading-normal text-[#f73e92]">
                Experience the stadium with AR from your phone
              </p>
            </div>
          </div>
        </section>

        <!-- start-ar-cta -->
        <a
          routerLink="/scan"
          (click)="fb.tap()"
          class="pressable flex h-[60px] w-full items-center justify-center gap-3 rounded-cta bg-cta text-white shadow-[0_0_8px_#9d4edd]"
        >
          <app-icon name="Aperture" [size]="24" />
          <span class="font-display text-[16px] font-black leading-normal">START AR SCANNER</span>
        </a>

        <!-- team-slider-section -->
        <section class="flex flex-col gap-3">
          <app-section-title text="Canales oficiales" />
          <div class="no-scrollbar -mx-5 flex gap-[14px] overflow-x-auto px-5 pb-1">
            <button
              type="button"
              (click)="selectLeague()"
              [attr.aria-pressed]="selected() === 'mlb'"
              aria-label="Canal de MLB"
              class="pressable flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                class="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-surface font-display text-[13px] font-black text-white"
                [class.border-pink]="selected() === 'mlb'"
                [class.border-line]="selected() !== 'mlb'"
                >MLB</span
              >
              <span class="font-sans text-[11px] font-bold text-white">MLB</span>
            </button>
            @for (team of teams; track team.id) {
              <button
                type="button"
                (click)="select(team)"
                class="pressable flex shrink-0 flex-col items-center gap-1.5"
                [attr.aria-pressed]="selected() === team.id"
                [attr.aria-label]="'Canal de ' + team.city + ' ' + team.name"
              >
                <span
                  class="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-surface transition-colors"
                  [class.border-pink]="selected() === team.id"
                  [class.border-line]="selected() !== team.id"
                >
                  @if (team.logo) {
                    <img
                      [src]="team.logo"
                      width="48"
                      height="48"
                      class="h-12 w-12 rounded-full object-cover"
                      alt=""
                    />
                  } @else {
                    <span class="font-display text-[12px] font-bold" [style.color]="team.color">{{
                      team.abbr
                    }}</span>
                  }
                </span>
                <span
                  class="font-sans text-[11px] font-bold leading-normal"
                  [class.text-white]="selected() === team.id"
                  [class.text-muted]="selected() !== team.id"
                  >{{ team.abbr }}</span
                >
              </button>
            }
          </div>
        </section>
        <section
          aria-label="Noticias oficiales"
          aria-live="polite"
          class="flex flex-col gap-3 pb-4"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-[15px] font-bold text-white">{{ channelTitle() }}</h2>
            <button
              type="button"
              (click)="loadNews()"
              [disabled]="newsLoading()"
              aria-label="Actualizar noticias"
              class="pressable flex h-11 w-11 items-center justify-center rounded-full border border-line text-pink disabled:opacity-40"
            >
              <app-icon name="RefreshCw" [size]="18" />
            </button>
          </div>
          <p class="font-sans text-[11px] text-muted">
            RSS oficial de MLB.com · titulares en inglés
          </p>
          @if (newsLoading()) {
            <p
              class="rounded-card border border-line bg-surface p-5 font-sans text-[13px] text-muted"
            >
              Cargando noticias…
            </p>
          } @else if (newsError()) {
            <div
              class="rounded-card border border-line bg-surface p-5 font-sans text-[13px] text-white"
            >
              <p>No pudimos cargar este canal.</p>
              <button type="button" (click)="loadNews()" class="mt-3 min-h-11 font-bold text-pink">
                Reintentar
              </button>
              <a
                href="https://www.mlb.com/news"
                target="_blank"
                rel="noopener noreferrer"
                class="ml-4 text-muted underline"
                >Noticias en MLB.com ↗</a
              >
            </div>
          } @else if (feed(); as news) {
            @if (news.stale) {
              <p class="font-sans text-[11px] text-muted">
                Mostramos la última actualización disponible.
              </p>
            }
            @for (item of news.items; track item.url) {
              <a
                [href]="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="pressable flex gap-3 rounded-card border border-line bg-surface p-3"
              >
                @if (item.image) {
                  <img
                    [src]="item.image"
                    loading="lazy"
                    alt=""
                    class="h-20 w-24 shrink-0 rounded-row object-cover"
                  />
                }
                <div class="min-w-0 flex-1">
                  <p class="font-sans text-[13px] font-bold leading-snug text-white">
                    {{ item.title }}
                  </p>
                  <p class="mt-2 font-sans text-[10px] text-muted">
                    MLB.com
                    @if (item.publishedAt) {
                      · {{ item.publishedAt | date: 'dd/MM/yyyy HH:mm' }}
                    }
                    · Leer noticia ↗
                  </p>
                </div>
              </a>
            }
            <a
              [href]="news.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-11 py-3 text-center font-sans text-[12px] font-bold text-pink"
              >Ver canal oficial completo ↗</a
            >
          }
        </section>
      </div>
    </app-screen-shell>
  `,
})
export class HomeScreen {
  protected readonly fb = inject(Feedback);
  protected readonly user = inject(AuthService).user;
  protected readonly teams = TEAMS;
  private readonly api = inject(Api);
  protected readonly selected = signal<string>('mlb');
  protected readonly feed = signal<NewsFeed | null>(null);
  protected readonly newsLoading = signal(true);
  protected readonly newsError = signal(false);
  private newsRequest = 0;

  constructor() {
    void this.loadNews();
  }

  protected channelTitle(): string {
    return this.selected() === 'mlb'
      ? 'Noticias de MLB'
      : 'Noticias de ' + (TEAMS.find((team) => team.id === this.selected())?.name ?? 'MLB');
  }

  protected selectLeague(): void {
    this.fb.tap();
    this.selected.set('mlb');
    void this.loadNews();
  }

  protected async loadNews(): Promise<void> {
    const request = ++this.newsRequest;
    this.feed.set(null);
    this.newsLoading.set(true);
    this.newsError.set(false);
    try {
      const feed = await this.api.news(this.selected());
      if (request === this.newsRequest) this.feed.set(feed);
    } catch {
      if (request === this.newsRequest) this.newsError.set(true);
    } finally {
      if (request === this.newsRequest) this.newsLoading.set(false);
    }
  }

  protected select(team: Team): void {
    this.fb.tap();
    this.selected.set(team.id);
    void this.loadNews();
  }
}
