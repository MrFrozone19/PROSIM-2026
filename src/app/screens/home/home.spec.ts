import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeScreen } from './home';
import { AuthService } from '../../core/auth';
import { Api, NewsFeed } from '../../core/api';
import { Feedback } from '../../shared/feedback';

const feed = (channel: string): NewsFeed => ({
  channel,
  source: 'MLB.com',
  sourceUrl: 'https://www.mlb.com/news',
  stale: false,
  fetchedAt: new Date().toISOString(),
  items: [
    {
      title: 'Noticia ' + channel,
      url: 'https://www.mlb.com/news/' + channel,
      publishedAt: null,
      image: null,
    },
  ],
});
function setup() {
  const api = { news: vi.fn().mockResolvedValue(feed('mlb')) };
  TestBed.configureTestingModule({
    imports: [HomeScreen],
    providers: [
      provideRouter([]),
      { provide: Api, useValue: api },
      { provide: AuthService, useValue: { user: signal(null) } },
      { provide: Feedback, useValue: { tap: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(HomeScreen);
  fixture.detectChanges();
  return {
    api,
    fixture,
    text: () => fixture.nativeElement.textContent as string,
    click: (label: string) => {
      fixture.nativeElement.querySelector(`[aria-label="${label}"]`).click();
      fixture.detectChanges();
    },
  };
}
afterEach(() => TestBed.resetTestingModule());
it('muestra MLB al iniciar y carga el canal oficial al tocar un equipo', async () => {
  const { api, fixture, text, click } = setup();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(text()).toContain('Noticia mlb');
  api.news.mockResolvedValueOnce(feed('nyy'));
  click('Canal de New York Yankees');
  await fixture.whenStable();
  fixture.detectChanges();
  expect(api.news).toHaveBeenLastCalledWith('nyy');
  expect(text()).toContain('Noticia nyy');
  expect(text()).not.toContain('Noticia mlb');
  expect(fixture.nativeElement.querySelector('a[href="https://www.mlb.com/news/nyy"]').target).toBe(
    '_blank',
  );
});
it('ignora noticias de un canal anterior que responde después', async () => {
  const { api, fixture, text, click } = setup();
  await fixture.whenStable();
  let finish!: (value: NewsFeed) => void;
  api.news.mockReturnValueOnce(
    new Promise<NewsFeed>((resolve) => {
      finish = resolve;
    }),
  );
  click('Canal de New York Yankees');
  api.news.mockResolvedValueOnce(feed('bos'));
  click('Canal de Boston Red Sox');
  await Promise.resolve();
  fixture.detectChanges();
  finish(feed('nyy'));
  await fixture.whenStable();
  fixture.detectChanges();
  expect(text()).toContain('Noticia bos');
  expect(text()).not.toContain('Noticia nyy');
});
it('permite reintentar cuando un feed falla', async () => {
  const { api, fixture, text, click } = setup();
  await fixture.whenStable();
  api.news.mockRejectedValueOnce(Error('offline'));
  click('Canal de New York Yankees');
  await fixture.whenStable();
  fixture.detectChanges();
  expect(text()).toContain('No pudimos cargar este canal.');
  api.news.mockResolvedValueOnce(feed('nyy'));
  const retry = [...fixture.nativeElement.querySelectorAll('button')].find(
    (el: any) => el.textContent.trim() === 'Reintentar',
  ) as HTMLButtonElement;
  retry.click();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(text()).toContain('Noticia nyy');
});
