// Prueba en navegador real con cámara/micrófono virtuales: cambio de cámara, composición y video reproducible.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join, extname } from 'node:path';
import { runBrowserTask, requestBody } from './browser-task.mjs';
import { AR_TARGETS, TARGETS_SRC } from '../src/app/data/targets.ts';
const root = resolve(import.meta.dirname, '..'),
  output = join(root, 'tmp/scan-check');
await mkdir(output, { recursive: true });
const entry = `
import { ArEngine } from '../../src/app/ar/ar-engine';
import { ArRecorder } from '../../src/app/ar/ar-recorder';
import { drawArFrame } from '../../src/app/ar/capture';
import { Group } from 'three';
const log = (body) => fetch('/log',{method:'POST',body});
const assert = (value, message) => { if (!value) throw Error(message); };
try {
 // Verifica el orden cámara/modelo y la transparencia con píxeles conocidos.
 const cam=document.createElement('canvas');cam.width=100;cam.height=100;
 const c=cam.getContext('2d');c.fillStyle='rgb(0,255,0)';c.fillRect(0,0,100,100);
 const model=document.createElement('canvas');model.width=100;model.height=100;
 const m=model.getContext('2d');m.fillStyle='rgb(255,0,0)';m.fillRect(40,40,20,20);
 const composite=document.createElement('canvas');composite.width=100;composite.height=100;
 drawArFrame(composite,cam,model,{width:100,height:100,videoLeft:0,videoTop:0,videoWidth:100,videoHeight:100});
 const pixels=composite.getContext('2d');
 assert(pixels.getImageData(5,5,1,1).data[1]===255,'Falta la cámara en la composición');
 assert(pixels.getImageData(50,50,1,1).data[0]===255,'Falta el modelo en la composición');
 await log('OK composición: cámara verde y modelo rojo, sin controles');
 const container=document.querySelector('#stage');
 const engine=new ArEngine({container,targetsSrc:${JSON.stringify(TARGETS_SRC)},targets:${JSON.stringify(AR_TARGETS.map((t) => ({ index: t.index, key: t.teamId, model: t.model })))},onFound:()=>{},onLost:()=>{}});
 await engine.start();
 const anchor=new Group();engine.mindar.scene.add(anchor);engine.attachToAnchor('bal',anchor);
 engine.setVideoMode(true);
 assert(engine.active?.key==='bal','No se conserva el equipo');
 assert(engine.active.holder.parent===engine.freeGroup,'El modelo no pasó a modo libre');
 assert(await engine.switchCamera()===true,'No cambió a frontal');
 assert(engine.active?.key==='bal','Se perdió el modelo al cambiar cámara');
 assert(await engine.switchCamera()===false,'No regresó a trasera');
 await log('OK cambio frontal/trasera con modelo de Orioles conservado');
 let finish,fail;const done=new Promise((ok,no)=>{finish=ok;fail=no;});
 const recorder=new ArRecorder(()=>engine.createRecordingStream(),()=>engine.endRecordingStream(),{elapsed:()=>{},audio:()=>{},finished:finish,failed:()=>fail(Error('MediaRecorder falló'))});
 await recorder.start();
 await new Promise(ok=>setTimeout(ok,1400));recorder.stop();
 const take=await done;
 assert(take.blob.size>1000,'Video vacío');assert(take.durationMs>500,'Duración incorrecta');
 const video=document.createElement('video');video.muted=true;video.playsInline=true;video.src=URL.createObjectURL(take.blob);
 await new Promise((ok,no)=>{video.onloadeddata=ok;video.onerror=no;});
 assert(video.videoWidth>0&&video.videoHeight>0,'El video no se puede reproducir');
 await fetch('/clip',{method:'POST',headers:{'x-mime':take.blob.type},body:take.blob});
 await log('OK video AR real: '+take.blob.type+', '+take.blob.size+' bytes, '+video.videoWidth+'x'+video.videoHeight);
 const stream=engine.mindar.video.srcObject;
 recorder.dispose();URL.revokeObjectURL(video.src);engine.stop();
 assert(stream.getTracks().every(t=>t.readyState==='ended'),'No se liberó la cámara');
 await fetch('/done',{method:'POST',body:'ok'});
}catch(error){await fetch('/done',{method:'POST',body:'ERROR: '+(error.stack||error)});}
`;
await writeFile(join(output, 'entry.js'), entry);
await build({
  entryPoints: [join(output, 'entry.js')],
  bundle: true,
  format: 'esm',
  outfile: join(output, 'test.js'),
  platform: 'browser',
  external: [
    'node-fetch',
    'util',
    'string_decoder',
    'fs',
    'path',
    'crypto',
    'worker_threads',
    'perf_hooks',
    'os',
  ],
});
const page =
  '<!doctype html><meta charset="utf-8"><style>body{margin:0}#stage{position:relative;width:360px;height:640px;overflow:hidden}</style><div id="stage"></div><script type="module" src="/test.js"></script>';
await runBrowserTask(
  page,
  async (req, res, url) => {
    if (req.method === 'POST' && url.pathname === '/clip') {
      const extension = req.headers['x-mime'] === 'video/mp4' ? 'mp4' : 'webm';
      await writeFile(join(output, 'recording.' + extension), await requestBody(req));
      res.end('ok');
      return;
    }
    const base = url.pathname === '/test.js' ? output : join(root, 'src');
    const file = resolve(
      base,
      decodeURIComponent(url.pathname === '/test.js' ? 'test.js' : url.pathname.slice(1)),
    );
    const rel = relative(base, file);
    if (isAbsolute(rel) || rel.startsWith('..')) throw Error('Ruta no permitida');
    res.setHeader(
      'content-type',
      { '.js': 'text/javascript', '.glb': 'model/gltf-binary' }[extname(file)] ||
        'application/octet-stream',
    );
    res.end(await readFile(file));
  },
  180_000,
  ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
);
console.log('OK: grabación AR y cambio de cámara. Video de prueba en tmp/scan-check/.');
