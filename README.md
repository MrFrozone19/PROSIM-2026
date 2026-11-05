# BaseDex Fan — prototipo web AR (Liga Americana)

App web de realidad aumentada con temática de beisbol de la Liga Americana, con cuentas de usuario y progreso
guardado en MySQL. Proyecto Integrador de **Procesamiento de Imágenes** (LMAD, FCFM-UANL).

**App publicada: https://basedex-fan.web.app** (pide iniciar sesión con Google o correo).

## Arquitectura

```
Navegador ── Firebase Hosting (Angular, carpeta docs/)
               └─ /api/** ──► Cloud Run: api/ (Node + Express)
                                 └─► Cloud SQL: MySQL 8.4 (instancia basedex-db)
Firebase Authentication: inicio de sesión (Google y correo/contraseña)
```

- Proyecto de Google Cloud / Firebase: `basedex-fan`, región `us-central1`.
- La API verifica el ID token de Firebase en cada petición y solo deja leer y modificar los datos del propio
  usuario. Los correos de `ADMIN_EMAILS` reciben el rol `admin` (rutas `/api/admin/*`: usuarios y trivia).
- Las reglas del juego (XP, cartas, trofeos, insignias, trivia) se calculan en el servidor: ver
  `api/src/progress.ts` y el catálogo en `api/src/catalog.ts`. Las tablas se crean solas al arrancar la API.
- La contraseña de MySQL vive en Secret Manager (`db-password`); Cloud Run se conecta por el conector de Cloud SQL,
  sin redes autorizadas.

## Cómo correrlo en local

Requisitos: Node 22.18+ o 24 (probado con 24.14), npm y Docker Desktop. Las herramientas de equipos leen TypeScript con el soporte nativo de Node.

```bash
docker compose up -d          # MySQL 8.4 local en el puerto 3307
cd api && cp .env.example .env && npm install && npm run dev   # API en :8080
cd .. && npm install && npm start                               # app en :4200 (proxy de /api a :8080)
```

Abre http://localhost:4200. El inicio de sesión usa el proyecto real de Firebase (localhost está autorizado).

## Publicar

```bash
npm run build                                   # Angular → docs/
firebase deploy --only hosting                  # sube docs/ a basedex-fan.web.app
gcloud run deploy basedex-api --source api --region us-central1   # solo si cambió la API (ver api/README.md)
```

## Cómo probarlo desde el celular

### Opción A: Firebase Hosting (recomendada)

Abre https://basedex-fan.web.app en Safari (iPhone) o Chrome (Android). Es HTTPS, así que la cámara funciona.

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
   - **`<equipo>-logo.png`**: los logos de los 15 equipos (por ejemplo, `bos-logo.png`, `sea-logo.png` o `kc-logo.png`).
     Son las variantes oficiales de gorra sobre fondo claro; son las imágenes que el escáner está entrenado para reconocer.
   - **`nyy-card.png` (recomendada)**: tarjeta detonadora con el logo NY, marco, rayas y texto. Tiene unos 250 puntos
     de referencia en las escalas que ve la cámara y se reconoce rápido, de lejos y en ángulo.
   - `nyy-navy.png` / `nyy-white.png`: el logo NY solo. Un logo plano de dos colores da ~40 puntos, así que
     hay que ponerlo de frente, centrado en la retícula y con buena luz.
2. Entra a la pestaña **Scan** y concede el permiso de cámara. Espera a que el indicador diga `SCANNER ACTIVE`
   (la primera vez tarda unos segundos: descarga el motor de seguimiento, ~400 kB comprimido).
3. Apunta al marcador de frente y centrado en la retícula, sin reflejos. Al reconocerlo aparece un cubo con el logo del equipo al frente y
   el indicador cambia a `TARGET LOCKED`.
4. Desliza un dedo para girar el modelo, pellizca para escalarlo, y usa **Stop / Animate** para detener o
   reanudar su animación.
5. **Foto** guarda una captura con la cámara y el modelo (sin la interfaz) en TCG Vault → Galería; desde ahí se comparte o descarga.

Hay 18 marcadores para 15 equipos: se conservan los tres originales de los Yankees y se añade un logo oficial por equipo.
El archivo `.mind` ocupa aproximadamente 3 MB y los 15 cubos GLB juntos, menos de 500 kB. La detección se probó
con todos los candidatos simultáneamente, a 280 y 400 px, de frente y con una ligera rotación (72 casos), usando
el detector real de MindAR. El matcher elige el candidato con más correspondencias geométricas para reducir confusiones entre logos.
La fiabilidad en cámaras físicas, iluminación variable, bordados y otros diseños de logo debe comprobarse en el dispositivo.

Bordado en una gorra real es poco probable que reconozca el logo: el tejido deforma los bordes que usa el
algoritmo.

### Cómo detecta MindAR y qué se ajustó

MindAR no busca el marcador en todo el cuadro: recorta un cuadrado de la mitad del alto del video (256 px con
640×480 **y también con 1280×720**, porque redondea a potencia de 2) y lo mueve por 9 posiciones, una por cuadro.
La app parcha el motor (ver `src/vendor/mind-ar/README.md`) para pedir 1280×720 a la cámara, detectar en un
recorte de 512 px que abarca todo lo visible en vertical, y alternar el recorte central (la retícula) con los
móviles. Además el marcador se da por encontrado tras 2 cuadros seguidos y por perdido tras 12.

Para comparar en el celular, `/#/scan?crop=256` usa el recorte chico (menos trabajo por cuadro, menos alcance).
`npm run teams:recognition` prueba el reconocimiento con imágenes locales y renderiza los cubos en `tmp/team-check/cubes.png`.
`window.__bdStats` acumula intentos y milisegundos de detección si se define antes de abrir Scan.

### Agregar o cambiar marcadores

1. Pon la imagen en `design/targets/` y agrégala a `design/targets/targets.json` (el orden define el índice).
   Una entrada puede ser una imagen tal cual, `swapFrom` (la misma imagen con fondo y figura invertidos) o
   `card` (tarjeta generada con el logo, título y subtítulo; es la opción que mejor se reconoce).
2. `npm run targets` recompila `src/assets/targets/targets.mind` (abre Chrome o Edge sin ventana, porque el
   compilador de MindAR solo corre en navegador), reduce cada imagen a 640 px por lado e imprime los puntos de
   referencia por escala. Menos de ~30 en las escalas de 150–300 px es señal de un marcador difícil.
3. El comando genera también `src/app/data/targets.ts`, con los mismos índices y `assets/models/cube-<equipo>.glb`.
   El URL del `.mind` incluye una versión para evitar reutilizar marcadores anteriores desde la caché.

Para regenerar los logos y los cubos: `npm run teams:assets` y después `npm run targets`. Los SVGs locales se
reutilizan; `npm run teams:assets -- --refresh` vuelve a descargarlos desde MLB. `npm run teams:check` comprueba
que frontend, API, marcadores, modelos, cartas y trivia cubran los mismos 15 equipos. `ng test --watch=false`
comprueba el cambio de equipo con peticiones de trivia pendientes.

Los datos de equipos y las nuevas preguntas se sincronizan con MySQL al iniciar la API, mediante la migración
idempotente existente. Se conservan los IDs de las cartas y preguntas originales y las ediciones de trivia del administrador.
Para actualizar la versión publicada se deben desplegar **la API y Hosting**; compilar localmente no modifica Firebase.

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
| Reconocimiento de marcadores en `/scan` | **Real** con MindAR: los 15 equipos de la Liga Americana, con sus logos oficiales sobre fondo claro; se conservan los marcadores anteriores de NYY |
| Modelo 3D anclado al marcador | **Real** con three.js. Un cubo GLB provisional por equipo, con su logo al frente y animación suave, generado por `npm run teams:assets` |
| Interacción con el modelo | Real: un dedo lo gira, dos dedos lo escalan; el botón Animate/Stop reanuda o detiene su animación; Info lo hace girar 360° |
| Modo libre | Real: si el logo sale de cuadro, el modelo queda flotando frente a la cámara para seguir interactuando; la flecha vuelve a escanear |
| Dock de la ventana AR: Animate/Stop, Foto, Effects, Info, Video, Stats, Trivia | Real (estado activo, animaciones, paneles, sonidos). La trivia viene de la API y se califica en el servidor; Stats sigue siendo una tabla simulada |
| Cuentas e inicio de sesión | **Real** con Firebase Auth (Google y correo/contraseña, recuperación de contraseña). Todas las pantallas piden sesión |
| Colección (cartas, trofeos, insignias), nivel y XP | **Real**, guardado en MySQL. Escanear un logo por primera vez desbloquea la carta de ese equipo |
| Perfil y leaderboard semanal | **Real**: nombre y equipo favorito editables; el leaderboard suma la XP de los últimos 7 días |
| Botón Foto | Real: compone el cuadro de la cámara con el modelo 3D encima (sin interfaz) y lo guarda en la **Galería** de la app (TCG Vault → Galería) |
| Galería (TCG Vault) | **Real**: fotos del escáner y clips grabados en Videos, guardados por cuenta en Firebase Storage (`gallery/{uid}/`, ver `storage.rules`) y registrados en MySQL. Desde el visor se comparten o descargan al teléfono, o se eliminan |
| `/ar` y el botón "Simular detección" | Respaldo sin cámara: el botón solo aparece si la cámara no está disponible o con `/#/scan?sim=1`, y abre la ventana AR con un logo holográfico en lugar del modelo |
| Narración por voz en el panel Info | Real, con la síntesis de voz del navegador (`speechSynthesis`) |
| `/videos` (AR Studio): grabadora con 5 filtros | **Real**: la cámara pasa por un shader WebGL (`shared/fx-renderer.ts`) con el filtro elegido y ese lienzo se graba con `MediaRecorder` (MP4, o WebM si el navegador no graba MP4), así que el filtro queda en el video. Máximo 30 s; se revisa y se guarda en la Galería |
| Clips del botón Video de la ventana AR | Generados en el proyecto con ffmpeg a partir del arte del diseño (sin derechos de terceros) |
| Minijuego en `/game` | **Real**: Diamond Flight, juego de pelota estilo Flappy Bird. Meta de 10 obstáculos, controles táctiles/teclado, pausa, partidas guardadas y recompensas conectadas a la misma clasificación de XP |

Filtros de video permitidos por la rúbrica e implementados: desenfoque, pixelado, cámara térmica, ajuste de
color y pastel (personalizado). **No** se implementan blanco y negro, escala de grises, sepia, exposición ni
colores invertidos.

## Trivia, Diamond Flight y clasificación

El catálogo base contiene **77 preguntas**: **5 para cada uno de los 15 equipos (75)** y **2 generales**.
`GET /api/trivia/summary` permite consultar el conteo activo real en MySQL, incluyendo cambios del administrador;
solo publica cantidades, sin respuestas ni información de usuarios. En Fan Arcade también se puede desplegar el conteo por equipo.

Todo suma al mismo libro `xp_events`: los escaneos, la primera respuesta correcta de cada pregunta, las partidas
y los trofeos. El perfil usa la XP acumulada para el nivel y la clasificación muestra la de los últimos siete días.
Fan Arcade incluye un desglose semanal de Trivia, Arcade, Explorar y Logros. Los empates comparten posición.

Diamond Flight se juega tocando el escenario, con Espacio o flecha arriba. Cada toque eleva la pelota; hay que
cruzar diez obstáculos sin tocar las torres ni el suelo. El botón de pausa, P o Escape pausa la partida;
al cambiar de aplicación se pausa automáticamente. Al terminar se guarda el resultado y aparece la opción de volver a jugar.

| Acción | Recompensa |
|---|---|
| Acertar por primera vez una pregunta | 50 XP; los reintentos no repiten los puntos |
| Superar un obstáculo | 10 XP al finalizar la partida |
| Completar los diez obstáculos | 50 XP extra (150 XP de partida en total) |
| Primera victoria | Trofeo First Flight y 50 XP adicionales |
| Cinco victorias | Trofeo Arcade Champion y 50 XP adicionales |
| 50 obstáculos acumulados | Insignia Aviator |
| Una victoria y cinco preguntas diferentes dominadas | Insignia Two-Way Star |

Las partidas entregan hasta 300 XP en una ventana móvil de 24 horas; se puede seguir jugando y obteniendo
logros después del límite. Las recompensas de trivia, escaneos y trofeos conservan sus propias reglas.
Trivia Rookie exige diez preguntas distintas; Historian exige dominar todas las preguntas activas.

El servidor crea cada partida con una semilla y vuelve a simular los saltos recibidos con la física compartida
en `api/src/game-physics.ts`; no acepta un score declarado por el navegador. La liquidación y las recompensas
usan una transacción por usuario. Un reintento del mismo resultado devuelve el guardado sin volver a otorgar XP.
Las partidas pendientes expiran a los diez minutos y una partida nueva reemplaza a la pendiente anterior.
Si se cambia la física, hay que incrementar `FLIGHT.version` y publicar API y frontend juntos.

Pruebas: `npm test` dentro de `api/` comprueba el catálogo, colisiones y repeticiones en cien niveles.
`ng test --watch=false` comprueba la interfaz, pausa y reintentos. Para las pruebas de integración, usar una
base **local y exclusiva** `basedex_test` en `127.0.0.1:3308`, establecer `RUN_DB_TESTS=1` y las variables `DB_*`,
y ejecutar `npm test` en `api/`. El archivo `api/test/rewards-db.test.ts` impide ejecutarlas contra otra base.
Estas pruebas verifican migraciones, concurrencia, puntuación, clasificación, límites, recompensas y rollback.

## Estructura

```
api/         backend en Node + Express (Cloud Run): auth, db (esquema), catalog, progress (reglas), index (rutas)
src/app/
  screens/   login, home, scan, ar, videos, vault, game, profile (un componente standalone por pantalla)
             ar/ar-hud es la capa de controles de la ventana AR, compartida por /scan y /ar
  core/      firebase (config web), auth (sesión), guards, api (cliente HTTP + tipos), progress (perfil y toasts)
  ar/        ar-engine: MindAR + escena three.js (anclas, modelos, gestos, animación, modo libre)
  shared/    screen-shell, tab-bar, icon (Lucide inline), avatar, section-title, stat-card, pill, toast, feedback, prefs
  data/      teams, targets, videos, cards (rarezas), standings (tabla simulada)
src/assets/  figma/ (imágenes optimizadas a WebP), video/ (clips MP4), targets/ (.mind), models/ (.glb)
src/vendor/  mind-ar/: MindAR 1.2.5 ya empaquetado (ver su README)
scripts/     prepare-teams, compile-targets, verify-teams, verify-recognition; make-cap y download-assets
design/raw/  respuestas crudas del MCP de Figma, una por pantalla, más el listado de assets
design/targets/  imágenes detonadoras y su manifiesto
docs/        build de producción (lo publica Firebase Hosting)
firebase.json  hosting: carpeta docs/, /api/** → Cloud Run, caché
compose.yaml   MySQL local para desarrollo
```

Rutas con hash (`/#/home`, `/#/scan`, …) para que cualquier recarga o enlace directo funcione en cualquier hosting
estático.

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
- Los logos en `src/assets/logos/` provienen de `https://www.mlbstatic.com/team-logos/team-cap-on-light/<MLB_ID>.svg`.
  Son marcas de sus titulares y se usan como detonadores y texturas con fines académicos. Los cubos son geometría propia.
- Equipos, divisiones y estadios: [catálogo público de MLB para 2026](https://statsapi.mlb.com/api/v1/teams?sportId=1&season=2026)
  y [directorio oficial](https://www.mlb.com/team), consultados el 5 de noviembre de 2026. Los Athletics se muestran
  con su nombre actual, sin "Oakland". Los títulos tienen corte de referencia hasta 2025; las posiciones siguen siendo simuladas.
- Referencias de trivia nueva: historias oficiales de [Rays](https://www.mlb.com/rays/history/timeline),
  [White Sox](https://www.mlb.com/whitesox/history/timeline), [Royals](https://www.mlb.com/royals/history/timeline-1960s),
  [Athletics](https://www.mlb.com/athletics/history/timeline-1900s), [Angels](https://www.mlb.com/angels/history/timeline),
  [Mariners](https://www.mlb.com/mariners/history/ballparks),
  [Guardians](https://www.mlb.com/guardians/news/cleveland-indians-change-name-to-guardians) y
  [Tigers](https://www.mlb.com/press-release/detroit-tigers-honor-club-heritage-with-unified-olde-english-d-on-caps-265320510).
