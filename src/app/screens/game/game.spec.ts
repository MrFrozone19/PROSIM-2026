import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api, GameResult, GameSession } from '../../core/api';
import { Progress } from '../../core/progress';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { GameScreen } from './game';
import { FlightStage, FlightFinish } from './flight-stage';

@Component({
  selector: 'app-flight-stage',
  template: `<button (click)="finished.emit({ flaps: [0], score: 0, won: false })">
    Finalizar prueba
  </button>`,
})
class TestStage {
  readonly session = input.required<GameSession>();
  readonly canRestart = input(false);
  readonly finished = output<FlightFinish>();
  readonly restarted = output<void>();
}

function setup() {
  const api = {
    leaderboard: vi.fn().mockResolvedValue({ entries: [], me: { points: 0, rank: null } }),
    gameStatus: vi
      .fn()
      .mockResolvedValue({
        rules: { version: 1 },
        stats: { bestScore: 0, wins: 0, xpRemaining: 300 },
        weekly: { trivia: 0, game: 0, exploration: 0, achievements: 0, total: 0 },
      }),
    triviaSummary: vi.fn().mockResolvedValue({ total: 77, general: 2, teams: [] }),
    startGame: vi.fn().mockResolvedValue({ id: 'run-1', seed: 1, rulesVersion: 1 }),
    finishGame: vi.fn(),
  };
  const progress = {
    me: signal({ level: 1 }),
    refresh: vi.fn().mockResolvedValue(null),
    celebrate: vi.fn(),
  };
  const toast = { message: signal(null), show: vi.fn() };
  TestBed.configureTestingModule({
    imports: [GameScreen],
    providers: [
      provideRouter([]),
      { provide: Api, useValue: api },
      { provide: Progress, useValue: progress },
      { provide: Toast, useValue: toast },
      { provide: Feedback, useValue: { tap: vi.fn() } },
    ],
  });
  TestBed.overrideComponent(GameScreen, {
    remove: { imports: [FlightStage] },
    add: { imports: [TestStage] },
  });
  const fixture = TestBed.createComponent(GameScreen);
  fixture.detectChanges();
  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  };
  const click = (text: string) => {
    const button = [
      ...(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>),
    ].find((b) => b.textContent?.replace(/\s+/g, ' ').trim() === text);
    expect(button).toBeDefined();
    button!.click();
    fixture.detectChanges();
  };
  return { fixture, api, progress, toast, flush, click };
}

const saved: GameResult = {
  duplicate: false,
  run: { score: 0, won: false, xpEarned: 0 },
  stats: { runs: 1, wins: 0, bestScore: 0, gates: 0, xp24h: 0, xpRemaining: 300 },
  xp: 0,
  xpGained: 0,
  level: 1,
  leveledUp: false,
  card: null,
  trophies: [],
  badges: [],
};

afterEach(() => TestBed.resetTestingModule());

describe('Guardado y marcador de Fan Arcade', () => {
  it('conserva el mismo ID y los saltos al reintentar después de un fallo de red', async () => {
    const { api, progress, fixture, flush, click } = setup();
    await flush();
    api.finishGame
      .mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }))
      .mockResolvedValueOnce(saved);
    click('JUGAR AHORA');
    await flush();
    click('Finalizar prueba');
    await flush();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(progress.celebrate).not.toHaveBeenCalled();
    click('Reintentar guardado');
    await flush();
    expect(api.finishGame.mock.calls).toEqual([
      ['run-1', [0]],
      ['run-1', [0]],
    ]);
    expect(progress.celebrate).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('PARTIDA GUARDADA');
    expect(api.leaderboard).toHaveBeenCalledTimes(2);
  });
  it('actualiza la clasificación y distingue la XP de la partida del total con logros', async () => {
    const { api, fixture, flush, click } = setup();
    await flush();
    api.leaderboard.mockResolvedValue({
      entries: [{ rank: 1, name: 'Fan', points: 200, me: true }],
      me: { rank: 1, points: 200 },
    });
    api.finishGame.mockResolvedValue({
      ...saved,
      xp: 200,
      xpGained: 200,
      run: { score: 10, won: true, xpEarned: 150 },
      stats: { ...saved.stats, wins: 1, bestScore: 10, xpRemaining: 150 },
    });
    click('JUGAR AHORA');
    await flush();
    click('Finalizar prueba');
    await flush();
    expect(fixture.nativeElement.textContent).toContain('+150 XP');
    expect(fixture.nativeElement.textContent).toContain('200');
    expect(fixture.nativeElement.textContent).toContain('¡Victoria!');
  });
});
