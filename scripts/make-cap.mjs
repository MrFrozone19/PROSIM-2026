// Genera el modelo de prueba src/assets/models/cap.glb: una gorra azul marino con un clip de animación ("Celebrate").
// Es un modelo propio hecho con geometría de three.js, mientras llegan los modelos definitivos de Diseño de ventanas.
// Uso: npm run model
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// GLTFExporter arma el .glb con FileReader, que no existe en Node.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onloadend?.();
    });
  }
};

const navy = new THREE.MeshStandardMaterial({ color: 0x0c2340, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
const navyDark = new THREE.MeshStandardMaterial({ color: 0x081a30, roughness: 0.9, metalness: 0 });
const seam = new THREE.MeshStandardMaterial({ color: 0x24406e, roughness: 0.8, metalness: 0 });
const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.7, metalness: 0 });

// Origen en el centro de la base, Y hacia arriba, frente (visera) hacia +Z. Ancho aproximado: 1 unidad.
const cap = new THREE.Group();
cap.name = 'Cap';

const crown = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), navy);
crown.name = 'Crown';
crown.scale.y = 0.85;
cap.add(crown);

// Tres arcos de costura = seis paneles.
for (let i = 0; i < 3; i++) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.502, 0.006, 6, 40, Math.PI), seam);
  arc.name = `Seam${i + 1}`;
  arc.scale.y = 0.85;
  arc.rotation.y = (i * Math.PI) / 3 + Math.PI / 6;
  cap.add(arc);
}

const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.014, 8, 48), navyDark);
band.name = 'Band';
band.rotation.x = Math.PI / 2;
band.position.y = 0.012;
cap.add(band);

const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.026, 40, 1, false, -Math.PI / 2, Math.PI), navyDark);
brim.name = 'Brim';
brim.scale.z = 1.75; // visera más larga que ancha
brim.position.set(0, 0.035, 0.27);
brim.rotation.x = 0.14;
cap.add(brim);

const button = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), white);
button.name = 'Button';
button.scale.y = 0.6;
button.position.y = 0.43;
cap.add(button);

// Clip de animación: dos brincos con un giro completo y un ladeo.
const times = [0, 0.35, 0.7, 1.0, 1.3, 1.6, 2.0];
const hop = [0, 0.38, 0, 0.2, 0, 0.08, 0];
const q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
const turn = [q(0, 0, 0), q(-0.25, Math.PI * 0.5, 0), q(0.1, Math.PI, 0), q(-0.15, Math.PI * 1.5, 0), q(0, Math.PI * 2, 0), q(0, 0, 0.12), q(0, 0, 0)];
const clip = new THREE.AnimationClip('Celebrate', 2, [
  new THREE.VectorKeyframeTrack('Cap.position', times, hop.flatMap((y) => [0, y, 0])),
  new THREE.QuaternionKeyframeTrack('Cap.quaternion', times, turn.flat()),
]);

const scene = new THREE.Scene();
scene.add(cap);

const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: [clip] });
const out = resolve(import.meta.dirname, '../src/assets/models/cap.glb');
await mkdir(resolve(out, '..'), { recursive: true });
await writeFile(out, Buffer.from(glb));
console.log(`escrito ${out} (${(glb.byteLength / 1024).toFixed(1)} kB)`);
