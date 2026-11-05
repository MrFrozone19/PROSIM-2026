// Parche reproducible del worker de matching de MindAR 1.2.5 vendorizado.
// El original se detiene en la primera coincidencia; con 15 logos similares puede elegir otro equipo.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const path = resolve(import.meta.dirname, '../src/vendor/mind-ar/controller-mGt1s8dJ.js');
const source = await readFile(path, 'utf8');
const encoded = /const IC = "([^"]+)"/.exec(source)?.[1];
if (!encoded) throw new Error('No se encontró el worker de matching de MindAR 1.2.5');
const original = Buffer.from(encoded, 'base64').toString('utf8');
if (original.includes('bdBestMatches')) {
  console.log('MindAR: selección por mayor número de inliers ya aplicada.');
  process.exit(0);
}
const before = 'const e=n.targetIndexes;let t=-1,s=null,r=null;for(let f=0;f<e.length;f++){const g=e[f],{keyframeIndex:a,screenCoords:j,worldCoords:w,debugExtra:y}=Gt.matchDetection(Kt[g],n.featurePoints);if(r=y,a!==-1){const m=St.estimate({screenCoords:j,worldCoords:w});m&&(t=g,s=m);break}}postMessage({type:"matchDone",targetIndex:t,modelViewTransform:s,debugExtra:r});';
const after = `const e=n.targetIndexes;let t=-1,s=null,r=null,bdBestMatches=0;
// parche BaseDex: compara todos los candidatos y elige el que tiene más correspondencias geométricas.
for(let f=0;f<e.length;f++){
  const g=e[f],{keyframeIndex:a,screenCoords:j,worldCoords:w,debugExtra:y}=Gt.matchDetection(Kt[g],n.featurePoints);
  if(a!==-1 && j.length>bdBestMatches){
    const m=St.estimate({screenCoords:j,worldCoords:w});
    if(m){t=g;s=m;r=y;bdBestMatches=j.length;}
  }
}
postMessage({type:"matchDone",targetIndex:t,modelViewTransform:s,debugExtra:r,matchCount:bdBestMatches});`;
if (!original.includes(before)) throw new Error('El worker cambió: revisar el parche antes de modificarlo.');
const patched = original.replace(before, after);
await writeFile(path, source.replace(encoded, Buffer.from(patched).toString('base64')));
console.log('MindAR: se comparan todos los candidatos antes de elegir el equipo.');
