import type { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

export interface MindARAnchor {
  group: Group;
  targetIndex: number;
  visible: boolean;
  onTargetFound: (() => void) | null;
  onTargetLost: (() => void) | null;
  onTargetUpdate: (() => void) | null;
}

export interface MindARThreeOptions {
  container: HTMLElement;
  imageTargetSrc: string;
  maxTrack?: number;
  uiLoading?: string;
  uiScanning?: string;
  uiError?: string;
  filterMinCF?: number | null;
  filterBeta?: number | null;
  warmupTolerance?: number | null;
  missTolerance?: number | null;
}

export class MindARThree {
  constructor(options: MindARThreeOptions);
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly renderer: WebGLRenderer;
  readonly cssRenderer: { domElement: HTMLElement };
  video: HTMLVideoElement | null;
  addAnchor(targetIndex: number): MindARAnchor;
  start(): Promise<void>;
  stop(): void;
}
