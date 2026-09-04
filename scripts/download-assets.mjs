// Descarga assets desde un JSON { "archivo.png": "https://..." } a src/assets/figma/.
// Uso: node scripts/download-assets.mjs design/raw/home-screen.assets.json
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [, , listPath, outDirArg = 'src/assets/figma'] = process.argv;
if (!listPath) {
  console.error('Uso: node scripts/download-assets.mjs <lista.json> [carpeta-destino]');
  process.exit(1);
}
const outDir = resolve(outDirArg);
await mkdir(outDir, { recursive: true });
const list = JSON.parse(await readFile(listPath, 'utf8'));
let ok = 0;
for (const [name, url] of Object.entries(list)) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(resolve(outDir, name), buf);
    console.log(`ok  ${name} (${(buf.length / 1024).toFixed(1)} kB)`);
    ok++;
  } catch (e) {
    console.error(`ERR ${name}: ${e.message}`);
  }
}
console.log(`${ok}/${Object.keys(list).length} descargados en ${outDir}`);
