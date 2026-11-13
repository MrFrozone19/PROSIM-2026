// Convierte las entregas OBJ/MTL a GLB autocontenidos. Los archivos de newModels nunca se modifican.
// La asignación por equipo vive en design/models/catalog.json. Uso: npm run models:import.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { requestBody, runBrowserTask } from './browser-task.mjs';
import { TEAMS } from '../src/app/data/teams.ts';
import { writeTargetMap } from './write-target-map.mjs';

const root = resolve(import.meta.dirname, '..');
const sourceRoot = join(root, 'src/assets/models/newModels');
const output = join(root, 'src/assets/models/imported');
const preview = join(root, 'tmp/model-review');
const recipe = JSON.parse(await readFile(join(root, 'design/models/catalog.json'), 'utf8'));
const safePath = (base, path) => {
  const absolute = resolve(base, path),
    rel = relative(base, absolute);
  if (isAbsolute(rel) || rel.startsWith('..'))
    throw new Error('Ruta fuera del directorio permitido');
  return absolute;
};
const ids = new Set(),
  assignments = new Set();
const sources = new Map();
for (const model of recipe.models) {
  if (!/^[a-z0-9-]+$/.test(model.id) || ids.has(model.id))
    throw new Error('ID de modelo inválido o duplicado');
  ids.add(model.id);
  for (const team of model.teams) {
    if (!TEAMS.some((t) => t.id === team) || assignments.has(team))
      throw new Error('Asignación inválida o duplicada: ' + team);
    assignments.add(team);
  }
  for (const source of [model.source, model.source.replace(/\.obj$/i, '.mtl')]) {
    const path = safePath(sourceRoot, source);
    const bytes = await readFile(path);
    sources.set(path, createHash('sha256').update(bytes).digest('hex'));
  }
}
await Promise.all([output, preview].map((path) => mkdir(path, { recursive: true })));
const report = [];
const converted = new Map();
const page = `<!doctype html><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/":"/three/"}}</script>
<script type="module">
import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const recipe=${JSON.stringify(recipe.models)};
const teams=${JSON.stringify(TEAMS.map((t) => ({ id: t.id, abbr: t.abbr })))};
const base='/source/';
const save=async(path,data)=>{const r=await fetch(path,{method:'POST',body:data});if(!r.ok)throw Error(await r.text());};
const sheet=document.createElement('canvas');sheet.width=1400;sheet.height=720;
const context=sheet.getContext('2d');context.fillStyle='#0c0c12';context.fillRect(0,0,1400,720);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(330,270);
const camera=new THREE.PerspectiveCamera(35,330/270,0.1,100);camera.position.set(1.3,0.8,3.3);camera.lookAt(0,0,0);
const exportScene=new GLTFExporter();
const manager=new THREE.LoadingManager();let resourceError='';manager.onError=(url)=>{resourceError=url;};
try{
 for(const [index,model] of recipe.entries()){
  const objUrl=base+model.source.split('/').map(encodeURIComponent).join('/');
  const materials=await new MTLLoader(manager).loadAsync(objUrl.replace(/\\.obj$/i,'.mtl'));
  const texturesReady=new Promise(ok=>{manager.onLoad=ok;});
  materials.preload();
  const object=await new OBJLoader(manager).setMaterials(materials).loadAsync(objUrl);
  await texturesReady;
  if(resourceError)throw Error('No se pudo cargar una textura: '+resourceError);
  const textureImages=[];
  let triangles=0,materialCount=0;
  const replacements=new Map();
  object.traverse((node)=>{
   if(!node.isMesh)return;
   triangles+=(node.geometry.index?.count ?? node.geometry.attributes.position.count)/3;
   const original=node.geometry;node.geometry=mergeVertices(original);original.dispose();
   const convert=(source)=>{
    if(replacements.has(source))return replacements.get(source);
    const material=new THREE.MeshStandardMaterial({name:source.name,color:source.color.clone(),
      map:source.map,roughness:model.roughness,metalness:model.metalness,
      transparent:source.transparent,opacity:source.opacity,side:source.side});
    materialCount++;
    if(source.map?.image)textureImages.push(source.map.image);
    replacements.set(source,material);return material;
   };
   node.material=Array.isArray(node.material)?node.material.map(convert):convert(node.material);
  });
  for(const image of textureImages){if(!image.complete)await image.decode();}
  // Los OBJ vienen separados en posiciones de trabajo distintas; se centran y normalizan sin tocar el original.
  const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3());
  const max=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(max)||max<=0)throw Error('Geometría vacía: '+model.id);
  object.position.copy(box.getCenter(new THREE.Vector3())).negate();
  const normalized=new THREE.Group();normalized.scale.setScalar(1/max);normalized.add(object);
  const exhibit=new THREE.Group();exhibit.name='Model_'+model.id.replaceAll('-','_');exhibit.add(normalized);
  exhibit.userData={modelId:model.id,source:model.source,placeholder:false};
  // Movimiento de exhibición propio: el OBJ no contiene clips de animación.
  const times=model.kind==='bat'?[0,2,4,6]:[0,2,4,6,8];
  const angles=model.kind==='bat'?[-0.25,0.25,-0.25,-0.25]:[0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*2];
  const rotation=angles.flatMap((angle)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(0,angle,0)).toArray());
  const clip=new THREE.AnimationClip('Exhibition',times.at(-1),[
   new THREE.QuaternionKeyframeTrack(exhibit.name+'.quaternion',times,rotation),
   new THREE.VectorKeyframeTrack(exhibit.name+'.position',times,times.flatMap((_,i)=>[0,i%2===0?0:0.035,0])),
  ]);
  const scene=new THREE.Scene();scene.add(exhibit);
  const glb=await exportScene.parseAsync(scene,{binary:true,animations:[clip],maxTextureSize:1024});
  if(resourceError)throw Error('No se pudo cargar una textura: '+resourceError);
  const reloaded=await new GLTFLoader().parseAsync(glb,'');
  const normalizedBox=new THREE.Box3().setFromObject(reloaded.scene);
  const dimensions=normalizedBox.getSize(new THREE.Vector3()).toArray();
  if(Math.abs(Math.max(...dimensions)-1)>0.001)throw Error('Escala incorrecta: '+model.id);
  if(!reloaded.animations.length)throw Error('No se exportó el clip de exhibición: '+model.id);
  await save('/save-model?id='+model.id,glb);
  await save('/report',JSON.stringify({id:model.id,label:model.label,kind:model.kind,teams:model.teams,
   source:model.source,bytes:glb.byteLength,triangles,materials:materialCount,textures:textureImages.length,
   animations:reloaded.animations.map(a=>a.name),dimensions}));
  const shown=new THREE.Scene();shown.background=new THREE.Color('#141420');shown.add(reloaded.scene);
  shown.add(new THREE.HemisphereLight(0xffffff,0x30304a,2.2));
  const light=new THREE.DirectionalLight(0xffffff,2.6);light.position.set(1.5,2.5,3);shown.add(light);
  if(model.kind==='bat')reloaded.scene.rotation.z=-0.25;
  renderer.render(shown,camera);
  const x=(index%4)*350+10,y=Math.floor(index/4)*360+10;
  context.drawImage(renderer.domElement,x,y);context.fillStyle='white';context.textAlign='center';context.font='bold 17px sans-serif';
  context.fillText(model.label,x+165,y+295);
  context.fillStyle='#9090a8';context.font='13px sans-serif';
  context.fillText(model.teams.map(id=>teams.find(t=>t.id===id).abbr).join(' · '),x+165,y+320);
  await fetch('/log',{method:'POST',body:model.label+': '+Math.round(glb.byteLength/1024)+' kB · '+triangles+' triángulos'});
 }
 await save('/preview',await new Promise(ok=>sheet.toBlob(ok,'image/png')));
 await fetch('/done',{method:'POST',body:'ok'});
}catch(error){await fetch('/done',{method:'POST',body:'ERROR: '+(error.stack||error)});}
</script>`;

await runBrowserTask(page, async (req, res, url) => {
  if (req.method === 'POST') {
    const bytes = await requestBody(req);
    if (url.pathname === '/save-model') {
      const id = url.searchParams.get('id');
      if (!ids.has(id)) throw Error('Modelo desconocido');
      if (bytes.length > 2 * 1024 * 1024) throw Error('El modelo supera 2 MB: ' + id);
      const version = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
      const filename = id + '-' + version + '.glb';
      await writeFile(join(output, filename), bytes);
      converted.set(id, filename);
    } else if (url.pathname === '/report') report.push(JSON.parse(bytes.toString()));
    else if (url.pathname === '/preview') await writeFile(join(preview, 'models.png'), bytes);
    else throw Error('Ruta desconocida');
    res.end('ok');
    return;
  }
  const isThree = url.pathname.startsWith('/three/');
  if (!isThree && !url.pathname.startsWith('/source/')) throw Error('Ruta desconocida');
  const base = isThree ? join(root, 'node_modules/three') : sourceRoot;
  const file = safePath(base, decodeURIComponent(url.pathname.slice(isThree ? 7 : 8)));
  res.setHeader(
    'content-type',
    {
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.obj': 'text/plain',
      '.mtl': 'text/plain',
    }[extname(file)] || 'application/octet-stream',
  );
  res.end(await readFile(file));
});

for (const [path, hash] of sources) {
  if (
    createHash('sha256')
      .update(await readFile(path))
      .digest('hex') !== hash
  )
    throw Error('Un archivo fuente cambió durante la importación; repite el comando.');
}
if (report.length !== recipe.models.length) throw Error('Faltan modelos convertidos');
for (const model of report) {
  if (!converted.has(model.id)) throw Error('Falta el GLB de ' + model.id);
  model.src = 'assets/models/imported/' + converted.get(model.id);
}
await writeFile(join(output, 'catalog.json'), JSON.stringify({ models: report }, null, 2) + '\n');
await writeTargetMap(root);
await writeFile(join(preview, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  'Listos ' +
    report.length +
    ' modelos para ' +
    assignments.size +
    ' equipos. Vista previa: tmp/model-review/models.png',
);
