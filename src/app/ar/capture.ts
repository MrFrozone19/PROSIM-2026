export interface CaptureViewport {
  width: number;
  height: number;
  videoLeft: number;
  videoTop: number;
  videoWidth: number;
  videoHeight: number;
}

/** Compone cámara + WebGL después de renderizar, sin controles ni filtros. Conserva el encuadre visible. */
export function drawArFrame(
  canvas: HTMLCanvasElement,
  video: CanvasImageSource | null,
  model: CanvasImageSource,
  viewport: CaptureViewport,
): void {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = viewport;
  if (!width || !height) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0c0c12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / width, canvas.height / height);
  ctx.translate((canvas.width - width * scale) / 2, (canvas.height - height * scale) / 2);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  if (video)
    ctx.drawImage(
      video,
      viewport.videoLeft,
      viewport.videoTop,
      viewport.videoWidth,
      viewport.videoHeight,
    );
  ctx.drawImage(model, 0, 0, width, height);
  ctx.restore();
}
