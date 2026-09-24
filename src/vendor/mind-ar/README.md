# MindAR 1.2.5 (vendorizado)

Archivos de `dist/` del paquete npm [`mind-ar`](https://github.com/hiukim/mind-ar-js) 1.2.5, licencia MIT (ver `LICENSE`).
Se copian aquí en lugar de instalarse por npm porque el paquete arrastra `canvas` (compilación nativa) y el
código fuente completo de TensorFlow.js, que no hacen falta para usar la versión ya empaquetada.

- `mindar-image-three.prod.js`: seguimiento de imágenes con three.js (lo importa la app).
- `mindar-image.prod.js`: compilador de targets (lo usa `scripts/compile-targets.mjs`).
- `controller-*.js`, `ui-*.js`: dependencias internas de los dos anteriores.

Cambios respecto al original, en `mindar-image-three.prod.js` (líneas marcadas "parche BaseDex"):

- Se quitó el import de `sRGBEncoding`, que three.js eliminó en r162, y se sustituyó por la constante equivalente.
- Nueva opción `videoConstraints` en el constructor de `MindARThree`, que se mezcla en las constraints de
  `getUserMedia`. Sin ella el navegador suele entregar 640×480.
- Nueva opción `detectionCropSize` (se pasa al controlador y al `CropDetector` en `controller-*.js`). MindAR
  solo busca marcadores dentro de un recorte cuadrado de `2^round(log2(alto/2))` px, que es 256 tanto para
  640×480 como para 1280×720; con 512 el recorte abarca todo lo que se ve en pantalla en vertical y el logo se
  reconoce con el doble de detalle, a cambio de más trabajo por cuadro mientras se escanea.
- En `controller-*.js`, la poda de puntos del detector (`_applyPrune`, 5 puntos por celda de una cuadrícula
  fija de 10×10) usa una cuadrícula proporcional al recorte cuando lo crea el `CropDetector` (celdas de ~32 px):
  con 512 px, un marcador que ocupa un cuarto del recorte conservaba como mucho 80 puntos y ahora hasta 320.
- En `controller-*.js`, `_detectAndMatch` alterna el recorte central con los recortes móviles (el original solo
  usa los móviles: 9 posiciones, una por cuadro) y, si existe `window.__bdStats`, acumula intentos y tiempo de
  detección para medir rendimiento.
