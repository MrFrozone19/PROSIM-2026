import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Feedback } from '../../shared/feedback';
import { FlightStage, FlightFinish } from './flight-stage';

function setup() {
  let now = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const context = new Proxy({ createLinearGradient: () => ({ addColorStop: vi.fn() }) } as any, {
    get(target, key) {
      return target[key] ?? (() => {});
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  TestBed.configureTestingModule({
    imports: [FlightStage],
    providers: [{ provide: Feedback, useValue: { success: vi.fn(), error: vi.fn() } }],
  });
  const fixture = TestBed.createComponent(FlightStage);
  fixture.componentRef.setInput('session', { id: 'run-1', seed: 1, rulesVersion: 1 });
  const finishes: FlightFinish[] = [];
  fixture.componentInstance.finished.subscribe((result) => finishes.push(result));
  fixture.detectChanges();
  const surface = fixture.nativeElement.querySelector('[role="application"]') as HTMLElement;
  const key = (key: string) => {
    surface.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };
  const tick = (fixture.componentInstance as unknown as { frame: FrameRequestCallback }).frame;
  const frames = (count: number) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      tick(now);
    }
    fixture.detectChanges();
  };
  return { fixture, surface, finishes, key, frames };
}

afterEach(() => {
  TestBed.resetTestingModule();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Controles de Diamond Flight', () => {
  it('arranca con Espacio y solo emite un resultado al chocar', () => {
    const { fixture, key, frames, finishes } = setup();
    expect(fixture.nativeElement.textContent).toContain('LISTO PARA VOLAR');
    key(' ');
    frames(180);
    expect(finishes).toHaveLength(1);
    expect(finishes[0]).toMatchObject({ score: 0, won: false, flaps: [0] });
    frames(180);
    expect(finishes).toHaveLength(1);
  });
  it('pausa con teclado y no avanza la física mientras está pausado', () => {
    const { fixture, key, frames, finishes } = setup();
    key('ArrowUp');
    frames(2);
    key('p');
    frames(300);
    expect(fixture.nativeElement.textContent).toContain('PAUSA');
    expect(finishes).toHaveLength(0);
    key(' ');
    frames(180);
    expect(finishes).toHaveLength(1);
    expect(finishes[0].flaps).toEqual([0]);
  });
});
