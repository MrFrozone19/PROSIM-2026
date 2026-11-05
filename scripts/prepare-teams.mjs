// Descarga los logos oficiales de MLB y genera PNGs, marcadores y un cubo GLB por equipo.
// Node 22.18+ o 24. Uso: npm run teams:assets (reutiliza SVGs locales; --refresh los vuelve a descargar).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative, isAbsolute, extname } from 'node:path';
import { TEAMS } from '../src/app/data/teams.ts';
import { requestBody, runBrowserTask } from './browser-task.mjs';

const root = resolve(import.meta.dirname, '..');
const logoDir = join(root, 'src/assets/logos');
const targetsDir = join(root, 'design/targets');
const modelsDir = join(root, 'src/assets/models');
await Promise.all([logoDir, targetsDir, modelsDir].map((dir) => mkdir(dir, { recursive: true })));

for (const team of TEAMS) {
  const file = join(logoDir, `${team.id}.svg`);
  if (existsSync(file) && !process.argv.includes('--refresh')) continue;
  const url = `https://www.mlbstatic.com/team-logos/team-cap-on-light/${team.mlbId}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Logo ${team.id}: HTTP ${res.status}`);
  const svg = await res.text();
  if (!svg.includes('<svg')) throw new Error(`Logo ${team.id}: no es SVG`);
  await writeFile(file, svg);
  console.log(`descargado ${team.abbr}: ${url}`);
}

const page = `<!doctype html><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/":"/three/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
const teams = ${JSON.stringify(TEAMS)};
const save = async (name, data) => {
  const r = await fetch('/save?name=' + encodeURIComponent(name), {method:'POST', body:data});
  if (!r.ok) throw new Error(await r.text());
};
const png = (canvas) => new Promise((ok) => canvas.toBlob(ok, 'image/png'));
try {
  for (const team of teams) {
    const image = new Image();
    image.src = '/logos/' + team.id + '.svg';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const g = canvas.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 512);
    // Mismo arte para el marcador y la cara frontal del cubo, sin deformar el aspect ratio.
    const scale = 448 / Math.max(image.naturalWidth, image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    g.drawImage(image, (512-w)/2, (512-h)/2, w, h);
    const data = await png(canvas);
    await save('logo:' + team.id, data);
    await save('target:' + team.id, data);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const side = new THREE.MeshStandardMaterial({color:team.color, roughness:0.75});
    const face = new THREE.MeshStandardMaterial({map:texture, roughness:0.75});
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [side, side, side, side, face, side]);
    cube.name = 'Placeholder_' + team.abbr;
    cube.userData = { teamId:team.id, placeholder:true };
    // Balanceo suave: al detectarlo, el logo permanece visible en el frente (+Z).
    const rotations = [0,0.22,0,-0.22,0].flatMap((y) => new THREE.Quaternion().setFromEuler(new THREE.Euler(0,y,0)).toArray());
    const clip = new THREE.AnimationClip('Idle', 4, [
      new THREE.QuaternionKeyframeTrack(cube.name + '.quaternion', [0,1,2,3,4], rotations),
      new THREE.VectorKeyframeTrack(cube.name + '.position', [0,1,2,3,4], [0,0,0, 0,0.06,0, 0,0,0, 0,0.06,0, 0,0,0]),
    ]);
    const scene = new THREE.Scene(); scene.add(cube);
    const glb = await new GLTFExporter().parseAsync(scene, {binary:true, animations:[clip]});
    await save('model:' + team.id, glb);
    texture.dispose(); side.dispose(); face.dispose(); cube.geometry.dispose();
    await fetch('/log', {method:'POST',body:team.abbr + ': logo, marcador y cubo GLB generados'});
  }
  await fetch('/done', {method:'POST',body:'ok'});
} catch(e) { await fetch('/done', {method:'POST',body:'ERROR: ' + (e.stack || e)}); }
</script>`;

await runBrowserTask(page, async (req, res, url) => {
  if (req.method === 'POST' && url.pathname === '/save') {
    const [kind, id] = (url.searchParams.get('name') || '').split(':');
    if (!TEAMS.some((t) => t.id === id)) throw new Error('Equipo desconocido');
    const out =
      kind === 'logo'
        ? join(logoDir, `${id}.png`)
        : kind === 'target'
          ? join(targetsDir, `${id}-logo.png`)
          : kind === 'model'
            ? join(modelsDir, `cube-${id}.glb`)
            : null;
    if (!out) throw new Error('Tipo desconocido');
    await writeFile(out, await requestBody(req));
    res.end('ok');
    return;
  }
  const base = url.pathname.startsWith('/three/') ? join(root, 'node_modules/three') : logoDir;
  if (!url.pathname.startsWith('/three/') && !url.pathname.startsWith('/logos/'))
    throw new Error('Ruta desconocida');
  const suffix = url.pathname.slice(7);
  const file = resolve(base, decodeURIComponent(suffix));
  const rel = relative(base, file);
  if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Ruta no permitida');
  res.setHeader('content-type', extname(file) === '.svg' ? 'image/svg+xml' : 'text/javascript');
  res.end(await readFile(file));
});

// Mantiene los tres índices originales de NYY; el resto se añade sin invalidarlos.
const manifest = [
  { team: 'nyy', file: 'nyy-navy.png' },
  { team: 'nyy', file: 'nyy-white.png', swapFrom: 'nyy-navy.png' },
  {
    team: 'nyy',
    file: 'nyy-card.png',
    card: {
      logo: 'nyy-white.png',
      title: 'NEW YORK YANKEES',
      subtitle: 'OFFICIAL FAN CARD · AL EAST',
    },
  },
  ...TEAMS.map((t) => ({ team: t.id, file: t.id + '-logo.png' })),
];
await writeFile(join(targetsDir, 'targets.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Assets listos. Ejecuta npm run targets para recompilar los marcadores.');
