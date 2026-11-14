import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api, TriviaQuestion, TriviaSession } from '../../core/api';
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

const flushPromises = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};
function session(questions: TriviaQuestion[], extra: Partial<TriviaSession> = {}): TriviaSession {
  return {
    id: '10000000-0000-4000-8000-000000000000',
    teamId: 'nyy',
    questions,
    serverNow: new Date().toISOString(),
    completedAt: null,
    retryAt: null,
    cooldownSeconds: 300,
    ...extra,
  };
}
function setup() {
  const api = {
    trivia: vi.fn(),
    triviaSession: vi.fn(),
    retryTrivia: vi.fn(),
    answer: vi.fn(),
    event: vi.fn(),
  };
  api.triviaSession.mockImplementation(async (teamId: string) =>
    session(await api.trivia(teamId), { teamId }),
  );
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

afterEach(() => {
  TestBed.resetTestingModule();
  vi.useRealTimers();
});

describe('Contenido AR al reconocer otro equipo', () => {
  it('muestra el cooldown y habilita otro intento exactamente después de 5 minutos', async () => {
    vi.useFakeTimers();
    const { fixture, api, click, text } = setup();
    const now = new Date().toISOString();
    const done = [
      {
        id: 4,
        teamId: 'nyy',
        question: 'Completada',
        options: ['A', 'B'],
        chosen: 0,
        answer: 0,
        correct: true,
      },
    ];
    api.triviaSession.mockResolvedValueOnce(
      session(done, {
        serverNow: now,
        completedAt: now,
        retryAt: new Date(Date.parse(now) + 300_000).toISOString(),
      }),
    );
    click('Trivia');
    await flushPromises();
    fixture.detectChanges();
    expect(text()).toContain('NUEVO INTENTO EN 5:00');
    vi.advanceTimersByTime(299_000);
    fixture.detectChanges();
    expect(text()).toContain('NUEVO INTENTO EN 0:01');
    expect(api.retryTrivia).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    api.retryTrivia.mockResolvedValueOnce(
      session(
        [{ id: 4, teamId: 'nyy', question: 'Nuevo intento', options: ['A', 'B'], chosen: null }],
        { id: '20000000-0000-4000-8000-000000000000' },
      ),
    );
    click('VOLVER A JUGAR');
    await flushPromises();
    fixture.detectChanges();
    expect(api.retryTrivia).toHaveBeenCalledWith('nyy', '10000000-0000-4000-8000-000000000000');
    expect(text()).toContain('Nuevo intento');
    expect(text()).not.toContain('TRIVIA COMPLETADA');
  });

  it('restaura el tiempo restante del servidor al volver a abrir la trivia', async () => {
    const { fixture, api, click, text } = setup();
    const now = new Date().toISOString();
    api.triviaSession.mockResolvedValueOnce(
      session(
        [
          {
            id: 4,
            teamId: 'nyy',
            question: 'Anterior',
            options: ['A'],
            chosen: 0,
            answer: 0,
            correct: true,
          },
        ],
        {
          serverNow: now,
          completedAt: new Date(Date.parse(now) - 180_000).toISOString(),
          retryAt: new Date(Date.parse(now) + 120_000).toISOString(),
        },
      ),
    );
    click('Trivia');
    await flushPromises();
    fixture.detectChanges();
    expect(text()).toContain('NUEVO INTENTO EN 2:00');
    click('VER MIS RESPUESTAS');
    expect(text()).toContain('Tu respuesta: A');
  });

  it('abre la grabadora real desde Video sin reproducir un clip pregrabado', () => {
    const { fixture, click } = setup();
    const opened = vi.fn();
    fixture.componentRef.setInput('recordVideo', true);
    fixture.componentInstance.videoRequested.subscribe(opened);
    fixture.detectChanges();
    click('Video');
    expect(opened).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('termina la trivia y permite revisar sin contestar de nuevo', async () => {
    const { fixture, api, click, text } = setup();
    api.trivia.mockResolvedValueOnce([
      { id: 4, teamId: 'nyy', question: 'Primera', options: ['A', 'B'] },
      { id: 5, teamId: 'nyy', question: 'Última', options: ['C', 'D'] },
    ]);
    click('Trivia');
    await flushPromises();
    fixture.detectChanges();
    api.answer.mockResolvedValueOnce({ answer: 0, chosen: 0, correct: true });
    click('A');
    await flushPromises();
    fixture.detectChanges();
    click('SIGUIENTE');
    api.answer.mockResolvedValueOnce({ answer: 0, chosen: 1, correct: false });
    click('D');
    await flushPromises();
    fixture.detectChanges();
    click('VER RESULTADO');
    expect(text()).toContain('TRIVIA COMPLETADA');
    expect(text()).toContain('1 de 2 respuestas correctas.');
    click('VER MIS RESPUESTAS');
    expect(text()).toContain('Tu respuesta: D');
    expect(text()).toContain('Correcta: C');
    expect(api.answer).toHaveBeenCalledTimes(2);
    expect(text()).not.toContain('SIGUIENTE');
  });

  it('restaura el intento completado desde la cuenta', async () => {
    const { fixture, api, click, text } = setup();
    api.trivia.mockResolvedValueOnce([
      {
        id: 4,
        teamId: 'nyy',
        question: 'Ya contestada',
        options: ['A', 'B'],
        chosen: 1,
        answer: 0,
        correct: false,
      },
    ]);
    click('Trivia');
    await flushPromises();
    fixture.detectChanges();
    expect(text()).toContain('TRIVIA COMPLETADA');
    click('VER MIS RESPUESTAS');
    expect(text()).toContain('Tu respuesta: B');
    expect(api.answer).not.toHaveBeenCalled();
  });

  it('reanuda la pregunta pendiente y permite reintentar si falló la conexión', async () => {
    const { fixture, api, click, text } = setup();
    api.trivia.mockResolvedValueOnce([
      { id: 4, question: 'Anterior', options: ['A', 'B'], chosen: 0, answer: 0, correct: true },
      { id: 5, question: 'Pendiente', options: ['C', 'D'], chosen: null },
    ]);
    click('Trivia');
    await flushPromises();
    fixture.detectChanges();
    expect(text()).toContain('Pendiente');
    expect(text()).not.toContain('Anterior');
    api.answer.mockRejectedValueOnce(Error('offline'));
    click('C');
    await flushPromises();
    fixture.detectChanges();
    expect(text()).toContain('No se pudo guardar la respuesta.');
    api.answer.mockResolvedValueOnce({ answer: 0, chosen: 0, correct: true });
    click('C');
    await flushPromises();
    fixture.detectChanges();
    click('VER RESULTADO');
    expect(text()).toContain('2 de 2 respuestas correctas.');
  });

  it('actualiza la descripción del modelo al cambiar de equipo', () => {
    const { fixture, click, text } = setup();
    fixture.componentRef.setInput('modelLabel', 'Bate metálico');
    fixture.detectChanges();
    click('Info');
    expect(text()).toContain('En realidad aumentada se muestra: Bate metálico.');
    fixture.componentRef.setInput('team', TEAM_BY_ID['kc']);
    fixture.componentRef.setInput('modelLabel', 'Dado dorado');
    fixture.detectChanges();
    click('Info');
    expect(text()).toContain('En realidad aumentada se muestra: Dado dorado.');
    expect(text()).not.toContain('Bate metálico');
    expect(text()).not.toContain('El cubo con su logo');
  });

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
    expect(text()).toContain(
      'Para grabar video con el modelo, abre el escáner con una cámara real.',
    );
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
    await flushPromises();
    fixture.detectChanges();

    api.trivia.mockResolvedValueOnce([
      { id: 101362, teamId: 'sea', question: 'Pregunta de Mariners', options: ['1977', '1969'] },
    ]);
    click('Trivia');
    await flushPromises();
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
    await flushPromises();
    fixture.detectChanges();
    const answer = deferred<unknown>();
    api.answer.mockReturnValueOnce(answer.promise);
    click('Highlanders');

    fixture.componentRef.setInput('team', TEAM_BY_ID['tb']);
    fixture.detectChanges();
    answer.resolve({ answer: 0, correct: true, xpGained: 50 });
    await answer.promise;
    await flushPromises();
    fixture.detectChanges();
    expect(text()).not.toContain('¡CORRECTO!');
    expect(text()).not.toContain('Pregunta anterior');
    expect(progress.celebrate).not.toHaveBeenCalled();
  });
});
