// Compila las imágenes detonadoras de design/targets/ a src/assets/targets/targets.mind (formato de MindAR).
// El compilador de MindAR solo corre en navegador, así que se abre Chrome/Edge sin ventana contra un servidor local.
// Uso: npm run targets
//
// design/targets/targets.json define el orden; el índice de cada entrada es el targetIndex de MindAR
// y debe coincidir con src/app/data/targets.ts. Una entrada con "swapFrom" se genera intercambiando
// fondo y figura de otra imagen (el mismo logo en claro sobre oscuro y oscuro sobre claro).
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

try {
  const images = [];
  for (const t of manifest) {
    if (t.swapFrom) {
      const blob = await swapped('/img/' + t.swapFrom);
      await fetch('/save-image?name=' + encodeURIComponent(t.file), { method: 'POST', body: blob });
      images.push(await load(URL.createObjectURL(blob)));
    } else images.push(await load('/img/' + t.file));
  }
  const compiler = new Compiler();
  let last = -10;
  const data = await compiler.compileImageTargets(images, (p) => { if (p - last >= 10) { last = p; log('compilando ' + p.toFixed(0) + '%'); } });
  for (let i = 0; i < data.length; i++) {
    const pts = data[i].matchingData.map((k) => k.maximaPoints.length + k.minimaPoints.length);
    await log('target ' + i + ' (' + manifest[i].team + ', ' + manifest[i].file + '): ' + pts[0] + ' puntos en la escala mayor, ' + pts.reduce((a, b) => a + b, 0) + ' en total');
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
