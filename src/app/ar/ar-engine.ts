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
      missTolerance: 8,
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
