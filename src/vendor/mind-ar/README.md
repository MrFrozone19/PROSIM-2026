# MindAR 1.2.5 (vendorizado)

Archivos de `dist/` del paquete npm [`mind-ar`](https://github.com/hiukim/mind-ar-js) 1.2.5, licencia MIT (ver `LICENSE`).
Se copian aquí en lugar de instalarse por npm porque el paquete arrastra `canvas` (compilación nativa) y el
código fuente completo de TensorFlow.js, que no hacen falta para usar la versión ya empaquetada.

- `mindar-image-three.prod.js`: seguimiento de imágenes con three.js (lo importa la app).
- `mindar-image.prod.js`: compilador de targets (lo usa `scripts/compile-targets.mjs`).
- `controller-*.js`, `ui-*.js`: dependencias internas de los dos anteriores.

Único cambio respecto al original: en `mindar-image-three.prod.js` se quitó el import de `sRGBEncoding`,
que three.js eliminó en r162, y se sustituyó por la constante equivalente (línea marcada "parche BaseDex").
