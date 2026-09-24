// Compila las imágenes detonadoras de design/targets/ a src/assets/targets/targets.mind (formato de MindAR).
// El compilador de MindAR solo corre en navegador, así que se abre Chrome/Edge sin ventana contra un servidor local.
// Uso: npm run targets
//
// design/targets/targets.json define el orden; el índice de cada entrada es el targetIndex de MindAR
// y debe coincidir con src/app/data/targets.ts. Tipos de entrada:
// - { file }: imagen tal cual.
// - { file, swapFrom }: se genera intercambiando fondo y figura de otra imagen (logo claro sobre oscuro ↔ oscuro sobre claro).
// - { file, card: { logo, title, subtitle } }: se genera una tarjeta detonadora con el logo al centro y un marco
//   con texto y rayas, que aporta muchos más puntos de referencia que un logo plano de dos colores.
// Antes de compilar, cada imagen se reduce a MAX_SIZE px por lado: la cámara nunca ve el marcador más grande que
// el recorte de detección (512 px), así que las escalas mayores solo harían más lento el emparejamiento.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const targetsDir = join(root, 'design/targets');
const vendorDir = join(root, 'src/vendor/mind-ar');
const outFile = join(root, 'src/assets/targets/targets.mind');
const manifest = JSON.parse(await readFile(join(targetsDir, 'targets.json'), 'utf8'));
const MAX_SIZE = 640;

const browser = [
  process.env.BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p));
if (!browser) {
  console.error('No encontré Chrome ni Edge. Define BROWSER_PATH con la ruta del ejecutable.');
  process.exit(1);
}

const page = `<!doctype html><meta charset="utf-8"><script type="module">
import { Compiler } from '/mind/mindar-image.prod.js';
const manifest = ${JSON.stringify(manifest)};
const MAX_SIZE = ${MAX_SIZE};
const log = (m) => fetch('/log', { method: 'POST', body: m });
const load = (src) => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => err(new Error('no cargó ' + src)); i.src = src; });

// Intercambia fondo y figura: el color de la esquina pasa a ser la figura sobre fondo blanco.
async function swapped(src) {
  const img = await load(src);
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  const p = d.data, bg = [p[0], p[1], p[2]];
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const l0 = lum(...bg);
  for (let i = 0; i < p.length; i += 4) {
    const t = Math.min(1, Math.max(0, (lum(p[i], p[i + 1], p[i + 2]) - l0) / (255 - l0)));
    for (let k = 0; k < 3; k++) p[i + k] = 255 + (bg[k] - 255) * t;
  }
  ctx.putImageData(d, 0, 0);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  return blob;
}

// Tarjeta detonadora: logo centrado sobre fondo claro, con marco, rayas y texto (los textos dan muchas esquinas).
async function card(src, { title, subtitle, color = '#0c2340' }) {
  const img = await load(src);
  const W = 1000, H = 1400;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, W, H);
  // rayas finas (pinstripes) de fondo
  g.fillStyle = 'rgba(12,35,64,0.16)';
  for (let x = 0; x < W; x += 28) g.fillRect(x, 0, 6, H);
  // marco grueso + marco fino
  g.lineWidth = 26; g.strokeStyle = color; g.strokeRect(40, 40, W - 80, H - 80);
  g.lineWidth = 5; g.strokeRect(90, 90, W - 180, H - 180);
  // cuadro central liso para el logo
  g.fillStyle = '#ffffff'; g.fillRect(150, 330, W - 300, 740);
  g.lineWidth = 8; g.strokeStyle = color; g.strokeRect(150, 330, W - 300, 740);
  const s = 600; g.drawImage(img, W / 2 - s / 2, 700 - s / 2, s, s);
  // textos
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  // el texto se encoge para no salirse del marco interior
  const text = (t, weight, size, y) => {
    g.font = weight + ' ' + size + 'px Arial, Helvetica, sans-serif';
    const k = Math.min(1, (W - 240) / g.measureText(t).width);
    if (k < 1) g.font = weight + ' ' + Math.floor(size * k) + 'px Arial, Helvetica, sans-serif';
    g.fillText(t, W / 2, y);
  };
  text(title, '900', 96, 210);
  text(subtitle, '700', 48, 1160);
  text('BASEDEX FAN · AR MARKER · SCAN ME', '700', 34, 1250);
  // esquinas con marcas distintas para desambiguar la orientación
  g.font = '900 60px Arial, Helvetica, sans-serif';
  [['★', 118, 118], ['◆', W - 118, 118], ['●', 118, H - 118], ['▲', W - 118, H - 118]].forEach(([t, x, y]) => g.fillText(t, x, y));
  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}

// Reduce la imagen a MAX_SIZE por lado (las escalas mayores no aportan a la detección y sí cuestan tiempo).
function shrink(img) {
  const k = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
  if (k === 1) return img;
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

try {
  const images = [];
  for (const t of manifest) {
    let img;
    if (t.swapFrom || t.card) {
      const blob = t.card ? await card('/img/' + t.card.logo, t.card) : await swapped('/img/' + t.swapFrom);
      await fetch('/save-image?name=' + encodeURIComponent(t.file), { method: 'POST', body: blob });
      img = await load(URL.createObjectURL(blob));
    } else img = await load('/img/' + t.file);
    images.push(shrink(img));
  }
  const compiler = new Compiler();
  let last = -10;
  const data = await compiler.compileImageTargets(images, (p) => { if (p - last >= 10) { last = p; log('compilando ' + p.toFixed(0) + '%'); } });
  for (let i = 0; i < data.length; i++) {
    const scales = data[i].matchingData.map((k) => Math.round(k.width) + 'px:' + (k.maximaPoints.length + k.minimaPoints.length));
    await log('target ' + i + ' (' + manifest[i].team + ', ' + manifest[i].file + '): ' + data[i].matchingData.reduce((a, k) => a + k.maximaPoints.length + k.minimaPoints.length, 0) + ' puntos de referencia; por escala ' + scales.join(' '));
  }
  await fetch('/save-mind', { method: 'POST', body: await compiler.exportData() });
  await fetch('/done', { method: 'POST', body: 'ok' });
} catch (e) {
  await fetch('/done', { method: 'POST', body: 'ERROR: ' + (e?.stack || e) });
}
</script>`;

const mime = { '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const body = (req) =>
  new Promise((ok) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c)).on('end', () => ok(Buffer.concat(chunks)));
  });

let finish;
const finished = new Promise((ok) => (finish = ok));

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST') {
      const data = await body(req);
      if (url.pathname === '/log') console.log(data.toString());
      else if (url.pathname === '/save-image') {
        const name = url.searchParams.get('name').replace(/[\\/]/g, '');
        await writeFile(join(targetsDir, name), data);
        console.log(`generada design/targets/${name}`);
      } else if (url.pathname === '/save-mind') {
        await mkdir(resolve(outFile, '..'), { recursive: true });
        await writeFile(outFile, data);
        console.log(`escrito ${outFile} (${(data.length / 1024).toFixed(0)} kB)`);
      } else if (url.pathname === '/done') finish(data.toString());
      res.end('ok');
      return;
    }
    if (url.pathname === '/') {
      res.setHeader('content-type', 'text/html');
      res.end(page);
      return;
    }
    const [, kind, name] = url.pathname.split('/');
    const dir = kind === 'mind' ? vendorDir : kind === 'img' ? targetsDir : null;
    if (!dir || !name) throw new Error('ruta desconocida');
    res.setHeader('content-type', mime[extname(name)] ?? 'application/octet-stream');
    res.end(await readFile(join(dir, decodeURIComponent(name).replace(/[\\/]/g, ''))));
  } catch (e) {
    res.statusCode = 404;
    res.end(String(e.message));
  }
});

await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { port } = server.address();
const profile = await mkdtemp(join(tmpdir(), 'basedex-targets-'));
const child = spawn(
  browser,
  ['--headless=new', '--no-first-run', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/`],
  { stdio: 'ignore' },
);

const timeout = setTimeout(() => finish('ERROR: tiempo agotado (10 min)'), 10 * 60 * 1000);
const result = await finished;
clearTimeout(timeout);
child.kill();
server.close();
await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => undefined);
if (result !== 'ok') {
  console.error(result);
  process.exit(1);
}
console.log('listo');
