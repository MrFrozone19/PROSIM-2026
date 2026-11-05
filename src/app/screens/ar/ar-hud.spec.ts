import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api, TriviaQuestion } from '../../core/api';
import { Progress } from '../../core/progress';
import { TEAM_BY_ID } from '../../data/teams';
import { Feedback } from '../../shared/feedback';
import { ArHud } from './ar-hud';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((ok) => {
    resolve = ok;
  });
  return { promise, resolve };
};

function setup() {
  const api = { trivia: vi.fn(), answer: vi.fn(), event: vi.fn() };
  const progress = { celebrate: vi.fn(), track: vi.fn() };
  const feedback = { tap: vi.fn(), success: vi.fn(), error: vi.fn() };
  TestBed.configureTestingModule({
    imports: [ArHud],
    providers: [
      { provide: Api, useValue: api },
      { provide: Progress, useValue: progress },
      { provide: Feedback, useValue: feedback },
    ],
  });
  const fixture = TestBed.createComponent(ArHud);
  fixture.componentRef.setInput('team', TEAM_BY_ID['nyy']);
  fixture.detectChanges();
  const click = (label: string) => {
    const button = [
      ...(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>),
    ].find((el) => el.textContent?.trim() === label);
    expect(button, `Botón ${label}`).toBeDefined();
    button!.click();
    fixture.detectChanges();
  };
  const text = () => fixture.nativeElement.textContent as string;
  return { fixture, api, progress, feedback, click, text };
}

afterEach(() => TestBed.resetTestingModule());

describe('Contenido AR al reconocer otro equipo', () => {
  it('muestra la división completa del nuevo equipo y no le atribuye un video ajeno', () => {
    const { fixture, click, text } = setup();
    fixture.componentRef.setInput('team', TEAM_BY_ID['tb']);
    fixture.detectChanges();
    click('Stats');
    const stats = fixture.nativeElement.querySelector('[role="dialog"]').textContent;
    for (const name of ['Rays', 'Yankees', 'Red Sox', 'Blue Jays', 'Orioles']) {
      expect(stats).toContain(name);
    }
    expect(stats).not.toContain('Astros');
    fixture.nativeElement.querySelector('[aria-label="Cerrar panel"]').click();
    fixture.detectChanges();
    click('Video');
    expect(text()).toContain('El video de Rays estará disponible próximamente.');
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
  });

  it('ignora una trivia pendiente del equipo anterior y carga la del nuevo', async () => {
    const { fixture, api, click, text } = setup();
    const old = deferred<TriviaQuestion[]>();
    api.trivia.mockReturnValueOnce(old.promise);
    click('Trivia');
    expect(api.trivia).toHaveBeenCalledWith('nyy');

    fixture.componentRef.setInput('team', TEAM_BY_ID['sea']);
    fixture.detectChanges();
    expect(text()).not.toContain('Cargando preguntas');
    old.resolve([{ id: 4, teamId: 'nyy', question: 'Pregunta de Yankees', options: ['A', 'B'] }]);
    await old.promise;
    await Promise.resolve();
    fixture.detectChanges();

    api.trivia.mockResolvedValueOnce([
      { id: 101362, teamId: 'sea', question: 'Pregunta de Mariners', options: ['1977', '1969'] },
    ]);
    click('Trivia');
    await Promise.resolve();
    fixture.detectChanges();
    expect(api.trivia).toHaveBeenLastCalledWith('sea');
    expect(text()).toContain('Pregunta de Mariners');
    expect(text()).not.toContain('Pregunta de Yankees');
  });

  it('no muestra la respuesta pendiente de Yankees en la trivia de otro equipo', async () => {
    const { fixture, api, click, text, progress } = setup();
    api.trivia.mockResolvedValueOnce([
      { id: 4, teamId: 'nyy', question: 'Pregunta anterior', options: ['Highlanders', 'Bombers'] },
    ]);
    click('Trivia');
    await Promise.resolve();
    fixture.detectChanges();
    const answer = deferred<unknown>();
    api.answer.mockReturnValueOnce(answer.promise);
    click('Highlanders');

    fixture.componentRef.setInput('team', TEAM_BY_ID['tb']);
    fixture.detectChanges();
    answer.resolve({ answer: 0, correct: true, xpGained: 50 });
    await answer.promise;
    await Promise.resolve();
    fixture.detectChanges();
    expect(text()).not.toContain('¡CORRECTO!');
    expect(text()).not.toContain('Pregunta anterior');
    expect(progress.celebrate).not.toHaveBeenCalled();
  });
});
