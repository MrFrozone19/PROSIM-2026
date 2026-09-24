import {
  AnimationAction,
  AnimationMixer,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from '../../vendor/mind-ar/mindar-image-three.prod.js';

export interface ArEngineTarget {
  /** Índice de la imagen dentro del archivo .mind. */
  index: number;
  /** Agrupa varias imágenes detonadoras bajo el mismo contenido (ej. id del equipo). */
  key: string;
  /** URL del modelo glTF/GLB. */
  model: string;
}

export interface ArEngineOptions {
  container: HTMLElement;
  targetsSrc: string;
  targets: ArEngineTarget[];
  onFound: (key: string) => void;
  onLost: (key: string) => void;
  /** Lado del recorte de detección de MindAR (potencia de 2). 512 cubre lo visible en vertical; 256 es más barato. */
  detectionCropSize?: number;
}

/** Falla al pedir la cámara (permiso rechazado o cámara ocupada), distinta de un error de carga. */
export class CameraError extends Error {}

interface Rig {
  key: string;
  /** Se cuelga del ancla del marcador o del grupo libre frente a la cámara. */
  holder: Group;
  /** Rotación y escala que controla el usuario con los dedos. */
  pivot: Group;
  /** Giro de 360° del botón Info. */
  spinner: Group;
  /** Animación de respaldo para modelos sin clips. */
  motion: Group;
  mixer?: AnimationMixer;
  actions: AnimationAction[];
  clock: number;
}

const SPIN_MS = 2400;
const FREE_DISTANCE = 1000;

/**
 * Seguimiento de imágenes con MindAR + escena de three.js.
 * - Al reconocer un marcador, el modelo de ese target aparece anclado a él.
 * - Si el marcador se pierde, el modelo pasa a "modo libre": flota frente a la cámara para seguir interactuando.
 * - Un dedo rota el modelo, dos dedos lo escalan.
 * - La animación (clips del GLB, o una de respaldo si no trae) se puede pausar y reanudar.
 */
export class ArEngine {
  private readonly mindar: MindARThree;
  private readonly rigs = new Map<string, Rig>();
  private readonly freeGroup = new Group();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private readonly abort = new AbortController();
  private active: Rig | null = null;
  private animating = true;
  private panelOpen = false;
  private spinStart = 0;
  private pinchStart = 0;
  private scaleStart = 1;
  private last = 0;
  private targetsUrl?: string;
  private stopped = false;

  constructor(private readonly opts: ArEngineOptions) {
    this.mindar = new MindARThree({
      container: opts.container,
      imageTargetSrc: '',
      maxTrack: 1,
      uiLoading: 'no',
      uiScanning: 'no',
      uiError: 'no',
      // Un poco más de suavizado que el valor por defecto: los logos planos dan pocos puntos y el modelo tiembla.
      filterMinCF: 0.0005,
      filterBeta: 0.01,
      // Con 640x480 el logo en la retícula mide ~150 px en el video y da menos de 20 puntos de referencia;
      // con 1280x720 mide ~220 px. El recorte de detección (parche propio) se amplía para que quepa completo.
      videoConstraints: { width: { ideal: 1280 }, height: { ideal: 720 } },
      detectionCropSize: opts.detectionCropSize ?? 512,
      // Cuadros seguidos con el marcador antes de mostrarlo (rápido) y sin él antes de darlo por perdido (paciente).
      warmupTolerance: 2,
      missTolerance: 12,
    });
  }

  async start(): Promise<void> {
    const { scene } = this.mindar;
    scene.add(new HemisphereLight(0xffffff, 0x30304a, 2.2));
    const sun = new DirectionalLight(0xffffff, 2.6);
    sun.position.set(1.5, 2.5, 3);
    scene.add(sun, this.freeGroup);

    // Se descargan antes de arrancar MindAR para que un 404 falle aquí y no deje la promesa de start() colgada.
    const [targets] = await Promise.all([this.fetchBlobUrl(this.opts.targetsSrc), this.loadModels()]);
    if (this.stopped) return;
    this.targetsUrl = targets;
    (this.mindar as unknown as { imageTargetSrc: string }).imageTargetSrc = targets;

    for (const t of this.opts.targets) {
      const anchor = this.mindar.addAnchor(t.index);
      anchor.onTargetFound = () => this.attachToAnchor(t.key, anchor.group);
      anchor.onTargetLost = () => this.release(t.key);
    }

    try {
      await this.mindar.start();
    } catch (e) {
      throw e instanceof Error ? e : new CameraError('No se pudo abrir la cámara');
    }
    if (this.stopped) {
      this.teardown();
      return;
    }
    this.bindGestures();
    this.last = performance.now();
    this.mindar.renderer.setAnimationLoop(() => this.frame());
  }

  stop(): void {
    this.stopped = true;
    this.teardown();
  }

  isAnimating(): boolean {
    return this.animating;
  }

  /** Pausa o reanuda la animación del modelo; al pausar se queda congelado en la pose actual. */
  setAnimating(on: boolean): void {
    this.animating = on;
  }

  /** Con un panel inferior abierto, el modelo en modo libre sube y se achica para no quedar tapado. */
  setPanelOpen(open: boolean): void {
    this.panelOpen = open;
  }

  /**
   * Foto de lo que se ve: cuadro de la cámara (con el mismo encuadre que en pantalla) y el modelo 3D encima,
   * sin la interfaz. Es síncrona a propósito: la hoja de compartir del sistema solo se puede abrir dentro del
   * gesto del usuario, y un toBlob asíncrono lo rompería en Safari.
   */
  capture(caption?: string): Blob {
    const { renderer, scene, camera, video } = this.mindar;
    const el = this.opts.container;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const out = document.createElement('canvas');
    out.width = Math.round(w * dpr);
    out.height = Math.round(h * dpr);
    const ctx = out.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0c0c12';
    ctx.fillRect(0, 0, w, h);
    if (video) {
      // MindAR posiciona el <video> con estilos para cubrir el contenedor; se reproduce el mismo recorte.
      const s = video.style;
      ctx.drawImage(video, parseFloat(s.left) || 0, parseFloat(s.top) || 0, parseFloat(s.width) || w, parseFloat(s.height) || h);
    }
    // El canvas WebGL no conserva el buffer entre cuadros: se vuelve a dibujar justo antes de copiarlo.
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, 0, 0, w, h);
    if (caption) {
      ctx.font = '700 12px Inter, system-ui, sans-serif';
      const pad = 8;
      const tw = ctx.measureText(caption).width;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(w - tw - pad * 2 - 12, h - 34, tw + pad * 2, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.fillText(caption, w - tw - pad - 12, h - 22);
    }
    // Conversión síncrona (dataURL → bytes) por la misma razón de arriba.
    const dataUrl = out.toDataURL('image/jpeg', 0.92);
    const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  /** Giro completo de 360° (botón Info). */
  spin(): void {
    this.spinStart = performance.now();
  }

  /** Oculta el modelo y regresa a buscar marcadores. */
  reset(): void {
    if (!this.active) return;
    this.active.holder.removeFromParent();
    this.active.pivot.rotation.set(0, 0, 0);
    this.active.pivot.scale.setScalar(1);
    this.active = null;
    this.spinStart = 0;
  }

  private async fetchBlobUrl(src: string): Promise<string> {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`No se pudo cargar ${src} (HTTP ${res.status})`);
    return URL.createObjectURL(await res.blob());
  }

  private async loadModels(): Promise<void> {
    const loader = new GLTFLoader();
    const byKey = new Map(this.opts.targets.map((t) => [t.key, t.model]));
    await Promise.all(
      [...byKey].map(async ([key, url]) => {
        const gltf = await loader.loadAsync(url);

        // Normaliza: centro en el origen y dimensión mayor = 1 (el ancho del marcador).
        const inner = new Group();
        inner.add(gltf.scene);
        const box = new Box3().setFromObject(gltf.scene);
        const size = box.getSize(new Vector3());
        const scale = 1 / Math.max(size.x, size.y, size.z, 1e-6);
        inner.scale.setScalar(scale);
        inner.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale);

        const motion = new Group();
        motion.add(inner);
        const spinner = new Group();
        spinner.add(motion);
        const pivot = new Group();
        pivot.add(spinner);
        const holder = new Group();
        holder.add(pivot);

        const rig: Rig = { key, holder, pivot, spinner, motion, actions: [], clock: 0 };
        if (gltf.animations.length) {
          rig.mixer = new AnimationMixer(gltf.scene);
          rig.actions = gltf.animations.map((clip) => rig.mixer!.clipAction(clip).play());
        }
        this.rigs.set(key, rig);
      }),
    );
  }

  private attachToAnchor(key: string, anchorGroup: Group): void {
    const rig = this.rigs.get(key);
    if (!rig) return;
    if (this.active && this.active !== rig) this.reset();
    this.active = rig;
    anchorGroup.add(rig.holder);
    rig.holder.position.set(0, 0, 0.15);
    rig.holder.scale.setScalar(1);
    // El marcador suele estar en vertical (pantalla, póster): se inclina para que se vea la parte de arriba.
    rig.holder.rotation.set(0.35, 0, 0);
    this.opts.onFound(key);
  }

  private release(key: string): void {
    const rig = this.rigs.get(key);
    if (!rig || this.active !== rig) return;
    this.freeGroup.add(rig.holder);
    rig.holder.position.set(0, 0, 0);
    rig.holder.scale.setScalar(1);
    rig.holder.rotation.set(0.35, 0, 0);
    this.opts.onLost(key);
  }

  private frame(): void {
    const now = performance.now();
    const delta = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const rig = this.active;

    if (rig) {
      if (this.animating) {
        if (rig.mixer) rig.mixer.update(delta);
        else {
          rig.clock += delta;
          rig.motion.rotation.y = rig.clock * 1.6;
          rig.motion.position.y = Math.abs(Math.sin(rig.clock * 3)) * 0.18;
        }
      }
      if (this.spinStart) {
        const p = Math.min(1, (now - this.spinStart) / SPIN_MS);
        rig.spinner.rotation.y = MathUtils.smootherstep(p, 0, 1) * Math.PI * 2;
        if (p === 1) {
          rig.spinner.rotation.y = 0;
          this.spinStart = 0;
        }
      }
      if (rig.holder.parent === this.freeGroup) this.placeFreeGroup();
    }

    this.mindar.renderer.render(this.mindar.scene, this.mindar.camera);
  }

  /** Coloca el grupo libre centrado (un poco arriba, por el dock) y con tamaño relativo a la pantalla. */
  private placeFreeGroup(): void {
    const cam = this.mindar.camera;
    const height = 2 * FREE_DISTANCE * Math.tan(MathUtils.degToRad(cam.fov) / 2);
    const width = height * cam.aspect;
    const k = this.panelOpen ? 0.6 : 1;
    this.freeGroup.position.set(0, height * (this.panelOpen ? 0.2 : 0.04), -FREE_DISTANCE);
    this.freeGroup.scale.setScalar(Math.min(height * 0.34, width * 0.62) * k);
  }

  private bindGestures(): void {
    const el = this.opts.container;
    const signal = this.abort.signal;
    el.style.touchAction = 'none';

    el.addEventListener(
      'pointerdown',
      (e) => {
        if (!this.active) return;
        el.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pointers.size === 2) {
          this.pinchStart = this.pinchDistance();
          this.scaleStart = this.active.pivot.scale.x;
        }
      },
      { signal },
    );

    el.addEventListener(
      'pointermove',
      (e) => {
        const prev = this.pointers.get(e.pointerId);
        const rig = this.active;
        if (!prev || !rig) return;
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        prev.x = e.clientX;
        prev.y = e.clientY;
        if (this.pointers.size === 1) {
          rig.pivot.rotation.y += dx * 0.012;
          rig.pivot.rotation.x = MathUtils.clamp(rig.pivot.rotation.x + dy * 0.01, -1.3, 1.3);
        } else if (this.pointers.size === 2 && this.pinchStart > 0) {
          const s = (this.scaleStart * this.pinchDistance()) / this.pinchStart;
          rig.pivot.scale.setScalar(MathUtils.clamp(s, 0.4, 3));
        }
      },
      { signal },
    );

    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      this.pinchStart = 0;
    };
    el.addEventListener('pointerup', end, { signal });
    el.addEventListener('pointercancel', end, { signal });
  }

  private pinchDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private teardown(): void {
    this.abort.abort();
    const { renderer, cssRenderer, video } = this.mindar;
    renderer.setAnimationLoop(null);
    try {
      this.mindar.stop();
    } catch {
      // MindAR no llegó a arrancar por completo: se libera la cámara a mano.
      (video?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
      video?.remove();
    }
    // MindAR deja un listener de resize en window; sin video no hace nada.
    this.mindar.video = null;
    renderer.dispose();
    renderer.domElement.remove();
    cssRenderer.domElement.remove();
    if (this.targetsUrl) URL.revokeObjectURL(this.targetsUrl);
    this.rigs.clear();
    this.active = null;
  }
}
