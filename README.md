# BaseDex Fan — prototipo web AR (Liga Americana)

Prototipo navegable en Angular de una app web de realidad aumentada con temática de beisbol de la Liga Americana.
Proyecto Integrador de **Procesamiento de Imágenes** (LMAD, FCFM-UANL), segunda entrega.

## Cómo correrlo

Requisitos: Node 22.12+ o 24 (probado con 24.14) y npm.

```bash
npm install
npm start
```

Abre http://localhost:4200. El servidor escucha en todas las interfaces (`0.0.0.0`), así que también puedes
entrar desde otro dispositivo de la misma red.

Build de producción (sale a `docs/`, listo para GitHub Pages):

```bash
npm run build
```

## Cómo probarlo desde el celular

### Opción A: GitHub Pages (recomendada)

Abre https://mrfrozone19.github.io/PROSIM-2026/ en Safari (iPhone) o Chrome (Android). Es HTTPS, así que la cámara
funciona. Cada `git push` a `main` republica el contenido de `docs/` en uno o dos minutos.

Para que se sienta como app, agrégala a la pantalla de inicio (Compartir → "Agregar a inicio" en iOS,
menú ⋮ → "Agregar a pantalla principal" en Android): se abre sin barra de navegador.

### Opción B: servidor local en la misma red

1. Corre `npm start` en la computadora.
2. En la consola aparece la dirección de red, por ejemplo `http://192.168.1.145:4200/`.
3. Ábrela desde el celular conectado al mismo Wi-Fi.

**Limitación:** por HTTP la cámara no funciona (ver siguiente sección). Todo lo demás sí.

### Opción C: túnel HTTPS desde la laptop

Si necesitas cámara sin subir a Pages, expón el servidor local con un túnel. Con Cloudflare Tunnel no hace
falta cuenta ni aparece página intermedia:

```bash
npx cloudflared tunnel --url http://localhost:4200
```

Te imprime una URL `https://….trycloudflare.com` que puedes abrir desde el celular.

## Cómo probar el escaneo

1. Abre en otra pantalla (o imprime) una de las imágenes de `design/targets/`:
   - **`nyy-card.png` (recomendada)**: tarjeta detonadora con el logo NY, marco, rayas y texto. Tiene unos 250 puntos
     de referencia en las escalas que ve la cámara y se reconoce rápido, de lejos y en ángulo.
   - `nyy-navy.png` / `nyy-white.png`: el logo NY solo. Un logo plano de dos colores da ~40 puntos, así que
     hay que ponerlo de frente, centrado en la retícula y con buena luz.
2. Entra a la pestaña **Scan** y concede el permiso de cámara. Espera a que el indicador diga `SCANNER ACTIVE`
   (la primera vez tarda unos segundos: descarga el motor de seguimiento, ~400 kB comprimido).
3. Apunta al marcador de frente y centrado en la retícula, sin reflejos. Al reconocerlo aparece la gorra anclada y
   el indicador cambia a `TARGET LOCKED`.
4. Desliza un dedo para girar el modelo, pellizca para escalarlo, y usa **Stop / Animate** para detener o
   reanudar su animación.

Bordado en una gorra real es poco probable que reconozca el logo: el tejido deforma los bordes que usa el
algoritmo.

### Cómo detecta MindAR y qué se ajustó

MindAR no busca el marcador en todo el cuadro: recorta un cuadrado de la mitad del alto del video (256 px con
640×480 **y también con 1280×720**, porque redondea a potencia de 2) y lo mueve por 9 posiciones, una por cuadro.
La app parcha el motor (ver `src/vendor/mind-ar/README.md`) para pedir 1280×720 a la cámara, detectar en un
recorte de 512 px que abarca todo lo visible en vertical, y alternar el recorte central (la retícula) con los
móviles. Además el marcador se da por encontrado tras 2 cuadros seguidos y por perdido tras 12.

Para comparar en el celular, `/#/scan?crop=256` usa el recorte chico (menos trabajo por cuadro, menos alcance).
`scripts/` no incluye el banco de pruebas, pero `window.__bdStats` acumula intentos y milisegundos de detección
si se define antes de abrir Scan.

### Agregar o cambiar marcadores

1. Pon la imagen en `design/targets/` y agrégala a `design/targets/targets.json` (el orden define el índice).
   Una entrada puede ser una imagen tal cual, `swapFrom` (la misma imagen con fondo y figura invertidos) o
   `card` (tarjeta generada con el logo, título y subtítulo; es la opción que mejor se reconoce).
2. `npm run targets` recompila `src/assets/targets/targets.mind` (abre Chrome o Edge sin ventana, porque el
   compilador de MindAR solo corre en navegador), reduce cada imagen a 640 px por lado e imprime los puntos de
   referencia por escala. Menos de ~30 en las escalas de 150–300 px es señal de un marcador difícil.
3. Refleja el mismo orden en `src/app/data/targets.ts`, con el equipo y el modelo `.glb` de cada índice.

## Por qué la cámara necesita HTTPS

`navigator.mediaDevices.getUserMedia` solo existe en **contextos seguros**: `https://` o `http://localhost`.
En cualquier otro origen (por ejemplo `http://192.168.x.x:4200`) el navegador ni siquiera expone la API, y la
pantalla de escaneo muestra el estado "sin soporte de cámara". Es una política de los navegadores, no un bug
de la app. MindAR usa esa misma API, así que el reconocimiento de marcadores tiene la misma restricción.

## Qué es real y qué es simulado

| Función | Estado |
|---|---|
| Navegación entre las 7 pantallas, tab bar, transiciones | Real |
| Cámara trasera en `/scan` (permiso concedido / rechazado / sin soporte / error de carga) | Real |
| Reconocimiento de marcadores en `/scan` | **Real** con MindAR (image tracking). Por ahora un equipo: el logo "NY" de los Yankees, en sus dos versiones (blanco sobre azul y azul sobre blanco) |
| Modelo 3D anclado al marcador | **Real** con three.js. El modelo es de prueba (gorra generada por `npm run model`) mientras llegan los de Diseño de ventanas |
| Interacción con el modelo | Real: un dedo lo gira, dos dedos lo escalan; el botón Animate/Stop reanuda o detiene su animación; Info lo hace girar 360° |
| Modo libre | Real: si el logo sale de cuadro, el modelo queda flotando frente a la cámara para seguir interactuando; la flecha vuelve a escanear |
| Dock de la ventana AR: Animate/Stop, Effects, Info, Video, Stats, Trivia | Real (estado activo, animaciones, paneles, sonidos); los datos son de relleno |
| `/ar` y el botón "Simular detección" | Respaldo sin cámara: el botón solo aparece si la cámara no está disponible o con `/#/scan?sim=1`, y abre la ventana AR con un logo holográfico en lugar del modelo |
| Narración por voz en el panel Info | Real, con la síntesis de voz del navegador (`speechSynthesis`) |
| Reproductor de `/videos` y sus 5 filtros | Real. Pixelate y Thermal se procesan en `<canvas>`; Pastel, Blur y Color Adjust con filtros CSS y capas de mezcla |
| Clips de video | Generados en el proyecto con ffmpeg a partir del arte del diseño (sin derechos de terceros) |
| Colección de cartas, trofeos, insignias, perfil, leaderboard | Datos de relleno tipados en `src/app/data/` |
| Minijuego en `/game` | **Placeholder** explícito; "Jugar ahora" muestra "próximamente" |
| Login, backend, base de datos | No existen |

Filtros de video permitidos por la rúbrica e implementados: desenfoque, pixelado, cámara térmica, ajuste de
color y pastel (personalizado). **No** se implementan blanco y negro, escala de grises, sepia, exposición ni
colores invertidos.

## Estructura

```
src/app/
  screens/   home, scan, ar, videos, vault, game, profile (un componente standalone por pantalla)
             ar/ar-hud es la capa de controles de la ventana AR, compartida por /scan y /ar
  ar/        ar-engine: MindAR + escena three.js (anclas, modelos, gestos, animación, modo libre)
  shared/    screen-shell, tab-bar, icon (Lucide inline), section-title, stat-card, pill, toast, feedback
  data/      teams, targets, videos, cards, trophies, standings (+trivia), game, profile
src/assets/  figma/ (imágenes optimizadas a WebP), video/ (clips MP4), targets/ (.mind), models/ (.glb)
src/vendor/  mind-ar/: MindAR 1.2.5 ya empaquetado (ver su README)
scripts/     compile-targets (npm run targets), make-cap (npm run model), download-assets (npm run assets)
design/raw/  respuestas crudas del MCP de Figma, una por pantalla, más el listado de assets
design/targets/  imágenes detonadoras y su manifiesto
docs/        build de producción (GitHub Pages)
```

Rutas con hash (`/#/home`, `/#/scan`, …) para que cualquier recarga o enlace directo funcione en GitHub Pages.

## Sistema de diseño

Tokens en `tailwind.config.js`: `ink` #0c0c12, `surface` #141420, `muted` #9090a8, `pink` #f72585,
`purple` #9d4edd, `line` rgba(255,255,255,.08), gradiente `cta`. Tipografías Unbounded (títulos) e Inter (UI)
desde Google Fonts. Iconos Lucide de trazo 2px generados inline desde el paquete `lucide`.

## Créditos de terceros

- [MindAR](https://github.com/hiukim/mind-ar-js) 1.2.5 (MIT) para el seguimiento de imágenes, copiado en `src/vendor/mind-ar/`.
- [three.js](https://threejs.org) (MIT) para la escena 3D y la carga de glTF.
- Logo "NY" de los New York Yankees: marca registrada de su titular, usada solo como imagen detonadora con fines
  académicos. Archivo tomado de [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:NewYorkYankees_caplogo.svg).
- La gorra de prueba (`cap.glb`) es un modelo propio generado con `scripts/make-cap.mjs`.
