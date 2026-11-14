export interface ArRecording {
  blob: Blob;
  durationMs: number;
}
export interface RecordingCallbacks {
  elapsed: (ms: number) => void;
  finished: (take: ArRecording) => void;
  failed: () => void;
  audio: (enabled: boolean) => void;
}
export const MAX_AR_RECORDING_MS = 30_000;

/** Graba el lienzo compuesto; sus pistas se liberan sin detener la cámara del escáner. */
export class ArRecorder {
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private microphone?: MediaStream;
  private tick?: ReturnType<typeof setInterval>;
  private started = 0;
  private disposed = false;
  private failed = false;
  private readonly abort = new AbortController();

  constructor(
    private readonly source: () => MediaStream,
    private readonly release: () => void,
    private readonly callbacks: RecordingCallbacks,
  ) {}

  async start(withAudio = true): Promise<void> {
    if (typeof MediaRecorder === 'undefined')
      throw Error('Este navegador no permite grabar video.');
    if (withAudio) {
      try {
        this.microphone = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        /* Con micrófono bloqueado se conserva la grabación de video. */
      }
    }
    if (this.disposed) {
      this.cleanup();
      return;
    }
    try {
      this.stream = this.source();
      this.microphone?.getAudioTracks().forEach((track) => this.stream!.addTrack(track));
      this.callbacks.audio(Boolean(this.microphone?.getAudioTracks().length));
      const mimeType = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(this.stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 2_500_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        this.failed = true;
        this.stop();
        this.cleanup();
        if (!this.disposed) this.callbacks.failed();
      };
      recorder.onstop = () => {
        const durationMs = Math.min(
          MAX_AR_RECORDING_MS,
          Math.round(performance.now() - this.started),
        );
        this.cleanup();
        if (this.disposed || this.failed) return;
        const blob = new Blob(chunks, {
          type: (recorder.mimeType || mimeType || 'video/webm').split(';')[0],
        });
        if (blob.size) this.callbacks.finished({ blob, durationMs });
        else this.callbacks.failed();
      };
      this.recorder = recorder;
      this.started = performance.now();
      recorder.start(250);
      this.tick = setInterval(() => {
        const elapsed = performance.now() - this.started;
        this.callbacks.elapsed(Math.min(MAX_AR_RECORDING_MS, elapsed));
        if (elapsed >= MAX_AR_RECORDING_MS) this.stop();
      }, 200);
      document.addEventListener(
        'visibilitychange',
        () => {
          if (document.hidden) this.stop();
        },
        { signal: this.abort.signal },
      );
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  stop(): void {
    clearInterval(this.tick);
    if (this.recorder?.state === 'recording') this.recorder.stop();
  }

  dispose(): void {
    this.disposed = true;
    this.abort.abort();
    this.stop();
    this.cleanup();
  }

  private cleanup(): void {
    clearInterval(this.tick);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.microphone?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.microphone = undefined;
    this.release();
  }
}
