import { FilterId } from '../data/videos';

export interface FxParams {
  filter: FilterId | null;
  /** 0 a 1. */
  intensity: number;
  /** Ajuste de color (1 = sin cambio), solo para el filtro 'color'. */
  color: { brightness: number; contrast: number; saturation: number };
  /** Espejo horizontal (cámara frontal). */
  mirror: boolean;
}

/** Lado mayor del lienzo: 720p basta para el celular y mantiene ligera la grabación. */
const MAX_SIDE = 1280;

const FILTER_INDEX: Record<FilterId, number> = { pixelate: 1, thermal: 2, pastel: 3, blur: 4, color: 5 };

const VERTEX = `
attribute vec2 a_pos;
uniform float u_mirror;
varying vec2 v_uv;
void main() {
  v_uv = vec2((a_pos.x + 1.0) * 0.5, 1.0 - (a_pos.y + 1.0) * 0.5);
  if (u_mirror > 0.5) v_uv.x = 1.0 - v_uv.x;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

/**
 * Los mismos 5 filtros que antes se hacían con CSS y canvas 2D, ahora en un shader para poder grabarlos:
 * 1 pixelado, 2 cámara térmica, 3 pastel (suavizado + saturación + luz suave), 4 desenfoque, 5 ajuste de color.
 */
const FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform int u_filter;
uniform float u_k;
uniform vec3 u_bcs;

vec3 heat(float l) {
  float p = clamp(l, 0.0, 1.0) * 6.0;
  vec3 c0 = vec3(8.0, 8.0, 40.0) / 255.0;
  vec3 c1 = vec3(20.0, 30.0, 200.0) / 255.0;
  vec3 c2 = vec3(157.0, 78.0, 221.0) / 255.0;
  vec3 c3 = vec3(247.0, 37.0, 133.0) / 255.0;
  vec3 c4 = vec3(255.0, 110.0, 40.0) / 255.0;
  vec3 c5 = vec3(255.0, 220.0, 60.0) / 255.0;
  if (p < 1.0) return mix(c0, c1, p);
  if (p < 2.0) return mix(c1, c2, p - 1.0);
  if (p < 3.0) return mix(c2, c3, p - 2.0);
  if (p < 4.0) return mix(c3, c4, p - 3.0);
  if (p < 5.0) return mix(c4, c5, p - 4.0);
  return mix(c5, vec3(1.0), p - 5.0);
}

// Desenfoque en espiral de 24 muestras: barato y sin bandas visibles.
vec3 blurAt(vec2 uv, float radius) {
  vec3 acc = texture2D(u_tex, uv).rgb;
  for (int i = 1; i <= 24; i++) {
    float fi = float(i);
    float r = sqrt(fi / 24.0) * radius;
    float a = fi * 2.39996;
    acc += texture2D(u_tex, uv + vec2(cos(a), sin(a)) * r / u_res).rgb;
  }
  return acc / 25.0;
}

vec3 adjust(vec3 c, float b, float ct, float s) {
  c *= b;
  c = (c - 0.5) * ct + 0.5;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return clamp(mix(vec3(l), c, s), 0.0, 1.0);
}

vec3 softLight(vec3 base, vec3 blend) {
  vec3 dark = 2.0 * base * blend + base * base * (1.0 - 2.0 * blend);
  vec3 light = sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend);
  return mix(dark, light, step(0.5, blend));
}

void main() {
  vec2 uv = v_uv;
  vec3 c;
  if (u_filter == 1) {
    vec2 cell = (2.0 + u_k * 26.0) / u_res;
    c = texture2D(u_tex, (floor(uv / cell) + 0.5) * cell).rgb;
  } else if (u_filter == 2) {
    c = texture2D(u_tex, uv).rgb;
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(c, heat(l * (0.8 + 0.6 * u_k)), 0.35 + 0.65 * u_k);
  } else if (u_filter == 3) {
    c = adjust(blurAt(uv, u_k * 3.0), 1.0 + 0.15 * u_k, 1.0 - 0.3 * u_k, 1.0 + 0.4 * u_k);
    float d = (uv.x + uv.y) * 0.5;
    vec3 g = d < 0.5
      ? mix(vec3(1.0, 0.839, 0.910), vec3(0.847, 0.780, 1.0), d * 2.0)
      : mix(vec3(0.847, 0.780, 1.0), vec3(0.780, 0.941, 1.0), d * 2.0 - 1.0);
    c = mix(c, softLight(c, g), 0.35 + 0.6 * u_k);
  } else if (u_filter == 4) {
    c = blurAt(uv, u_k * 16.0);
  } else if (u_filter == 5) {
    c = adjust(texture2D(u_tex, uv).rgb, u_bcs.x, u_bcs.y, u_bcs.z);
  } else {
    c = texture2D(u_tex, uv).rgb;
  }
  gl_FragColor = vec4(c, 1.0);
}`;

/** Dibuja un <video> en un canvas con WebGL aplicando el filtro elegido; el canvas se puede grabar con captureStream. */
export class FxRenderer {
  private readonly gl: WebGLRenderingContext;
  private readonly tex: WebGLTexture;
  private readonly loc: Record<'res' | 'filter' | 'k' | 'bcs' | 'mirror', WebGLUniformLocation | null>;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL no disponible');
    this.gl = gl;

    const program = gl.createProgram()!;
    gl.attachShader(program, this.compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link');
    gl.useProgram(program);

    // Un rectángulo que cubre todo el lienzo (dos triángulos).
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // El video no es potencia de 2: sin mipmaps y con bordes fijos (requisito de WebGL 1).
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.loc = {
      res: gl.getUniformLocation(program, 'u_res'),
      filter: gl.getUniformLocation(program, 'u_filter'),
      k: gl.getUniformLocation(program, 'u_k'),
      bcs: gl.getUniformLocation(program, 'u_bcs'),
      mirror: gl.getUniformLocation(program, 'u_mirror'),
    };
  }

  /** Dibuja el cuadro actual del video. Ajusta el tamaño del lienzo a la resolución del video (máx. 720p). */
  render(video: HTMLVideoElement, p: FxParams): void {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(vw, vh));
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    const gl = this.gl;
    gl.viewport(0, 0, w, h);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    gl.uniform2f(this.loc.res, w, h);
    gl.uniform1i(this.loc.filter, p.filter ? FILTER_INDEX[p.filter] : 0);
    gl.uniform1f(this.loc.k, p.intensity);
    gl.uniform3f(this.loc.bcs, p.color.brightness, p.color.contrast, p.color.saturation);
    gl.uniform1f(this.loc.mirror, p.mirror ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose(): void {
    this.gl.deleteTexture(this.tex);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  }
}
