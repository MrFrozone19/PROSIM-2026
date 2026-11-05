// Prueba el detector real con imágenes sintéticas y todos los candidatos a la vez (sin cámara ni producción).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname, join } from 'node:path';
import { TEAMS } from '../src/app/data/teams.ts';
import { requestBody, runBrowserTask } from './browser-task.mjs';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(join(root, 'design/targets/targets.json'), 'utf8'));
const output = join(root, 'tmp/team-check');
await mkdir(output, { recursive: true });
const page = `<!doctype html><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/":"/three/"}}</script>
<script type="module">
import {Controller} from '/mind/mindar-image.prod.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const manifest = ${JSON.stringify(manifest)}, teams = ${JSON.stringify(TEAMS)};
const log = (s) => fetch('/log',{method:'POST',body:s});
const load = async (url) => { const i = new Image(); i.src=url; await i.decode(); return i; };
try {
  const controller = new Controller({inputWidth:1280,inputHeight:720,detectionCropSize:512});
  const {dimensions} = controller.addImageTargetsFromBuffer(await (await fetch('/targets.mind')).arrayBuffer());
  if (dimensions.length !== manifest.length) throw new Error('El .mind no coincide con el manifiesto');
  const canvas = document.createElement('canvas'); canvas.width=1280; canvas.height=720;
  const g = canvas.getContext('2d');
  const all = manifest.map((_,i)=>i), results=[];
  for (const [index,target] of manifest.entries()) {
    const img = await load('/targets/' + target.file);
    for (const size of [280, 400]) for (const angle of [0, 0.12]) {
      g.fillStyle='#777777';g.fillRect(0,0,1280,720);
      const k=size/Math.max(img.width,img.height), w=img.width*k, h=img.height*k;
      g.save();g.translate(640,360);g.rotate(angle);g.drawImage(img,-w/2,-h/2,w,h);g.restore();
      const {featurePoints} = await controller.detect(canvas);
      const match = await controller._workerMatch(featurePoints,all);
      const detected = manifest[match.targetIndex]?.team;
      results.push({file:target.file,size,angle,expected:target.team,detected:detected??null,index:match.targetIndex});
      if(detected!==target.team) throw new Error(target.file + ' (' + size + ' px, ' + angle + ' rad): esperaba ' + target.team + ', detectó ' + detected);
    }
    await log('OK detección: ' + target.file + ' (280/400 px, frontal y rotado; ' + manifest.length + ' candidatos)');
  }
  g.fillStyle='#777777';g.fillRect(0,0,1280,720);
  const empty = await controller.detect(canvas);
  const noMatch = await controller._workerMatch(empty.featurePoints,all);
  if(noMatch.targetIndex !== -1) throw new Error('Un cuadro sin logo produjo una detección');
  await log('OK: sin detección en cuadro vacío');
  controller.dispose(); controller.worker.terminate();

  // Carga cada GLB con el loader de producción y renderiza una hoja de revisión de las 15 texturas.
  const sheet=document.createElement('canvas');sheet.width=1500;sheet.height=900;
  const ctx=sheet.getContext('2d');ctx.fillStyle='#0c0c12';ctx.fillRect(0,0,1500,900);
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(280,230);
  const camera=new THREE.PerspectiveCamera(35,280/230,0.1,100);camera.position.set(1.4,1.0,3.3);camera.lookAt(0,0,0);
  const loader=new GLTFLoader();
  for (const [i,team] of teams.entries()) {
    const gltf=await loader.loadAsync('/models/cube-'+team.id+'.glb');
    const scene=new THREE.Scene();scene.background=new THREE.Color('#141420');
    scene.add(new THREE.HemisphereLight(0xffffff,0x30304a,2.2));
    const light=new THREE.DirectionalLight(0xffffff,2.6);light.position.set(1.5,2.5,3);scene.add(light,gltf.scene);
    renderer.render(scene,camera);
    const x=(i%5)*300+10,y=Math.floor(i/5)*300+10;
    ctx.drawImage(renderer.domElement,x,y);ctx.fillStyle='white';ctx.font='bold 17px sans-serif';ctx.textAlign='center';
    ctx.fillText(team.abbr+' · '+team.name,x+140,y+260);
    gltf.scene.traverse((obj)=>{if(obj.isMesh){obj.geometry.dispose();for(const mat of [].concat(obj.material)){mat.map?.dispose();mat.dispose();}}});
  }
  renderer.dispose();
  await fetch('/report',{method:'POST',body:JSON.stringify(results,null,2)});
  await fetch('/sheet',{method:'POST',body:await new Promise((ok)=>sheet.toBlob(ok,'image/png'))});
  await fetch('/done',{method:'POST',body:'ok'});
}catch(e){await fetch('/done',{method:'POST',body:'ERROR: '+(e.stack||e)});}
</script>`;

await runBrowserTask(page, async (req, res, url) => {
  if (req.method === 'POST' && (url.pathname === '/sheet' || url.pathname === '/report')) {
    await writeFile(
      join(output, url.pathname === '/sheet' ? 'cubes.png' : 'recognition.json'),
      await requestBody(req),
    );
    res.end('ok');
    return;
  }
  let base, suffix;
  if (url.pathname === '/targets.mind') {
    base = join(root, 'src/assets/targets');
    suffix = 'targets.mind';
  } else if (url.pathname.startsWith('/targets/')) {
    base = join(root, 'design/targets');
    suffix = url.pathname.slice(9);
  } else if (url.pathname.startsWith('/models/')) {
    base = join(root, 'src/assets/models');
    suffix = url.pathname.slice(8);
  } else if (url.pathname.startsWith('/mind/')) {
    base = join(root, 'src/vendor/mind-ar');
    suffix = url.pathname.slice(6);
  } else if (url.pathname.startsWith('/three/')) {
    base = join(root, 'node_modules/three');
    suffix = url.pathname.slice(7);
  } else throw new Error('Ruta no permitida');
  const file = resolve(base, decodeURIComponent(suffix)),
    rel = relative(base, file);
  if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Ruta no permitida');
  res.setHeader(
    'content-type',
    { '.js': 'text/javascript', '.png': 'image/png', '.glb': 'model/gltf-binary' }[extname(file)] ||
      'application/octet-stream',
  );
  res.end(await readFile(file));
});
console.log(
  'OK: reconocimiento frontal/rotado de todos los marcadores y render de 15 cubos. Reporte en tmp/team-check/.',
);
