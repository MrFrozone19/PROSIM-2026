# BaseDex Fan — prototipo web AR (Liga Americana)

Prototipo navegable en Angular de una app web de realidad aumentada con temática de beisbol de la Liga Americana.
Proyecto Integrador de **Procesamiento de Imágenes** (LMAD, FCFM-UANL), segunda entrega.

- Programación: Sinuhé Martínez Hernández (1955659)
- Diseño de ventanas: Ka Hernández Álvarez (1908595)
- Demo publicada: **https://mrfrozone19.github.io/PROSIM/**

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

Abre https://mrfrozone19.github.io/PROSIM/ en Safari (iPhone) o Chrome (Android). Es HTTPS, así que la cámara
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

## Por qué la cámara necesita HTTPS

`navigator.mediaDevices.getUserMedia` solo existe en **contextos seguros**: `https://` o `http://localhost`.
En cualquier otro origen (por ejemplo `http://192.168.x.x:4200`) el navegador ni siquiera expone la API, y la
pantalla de escaneo muestra el estado "sin soporte de cámara". Es una política de los navegadores, no un bug
de la app. El reconocimiento de marcadores con MindAR (siguiente entrega) tiene la misma restricción.

## Qué es real y qué es simulado

| Función | Estado |
|---|---|
| Navegación entre las 7 pantallas, tab bar, transiciones | Real |
| Cámara trasera en `/scan` (permiso concedido / rechazado / sin soporte) | Real |
| Reconocimiento de logos o marcadores | **Simulado**: el botón "Simular detección" elige un equipo al azar y pasa a `/ar` |
| Modelo 3D anclado en `/ar` | **Placeholder**: logo holográfico animado, marcado en pantalla |
| Dock de `/ar`: Animation, Effects, Info, Video, Stats, Trivia | Real (estado activo, animaciones, paneles, sonidos); los datos son de relleno |
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
  shared/    screen-shell, tab-bar, icon (Lucide inline), section-title, stat-card, pill, toast, feedback
  data/      teams, videos, cards, trophies, standings (+trivia), game, profile
src/assets/  figma/ (imágenes optimizadas a WebP), video/ (clips MP4)
design/raw/  respuestas crudas del MCP de Figma, una por pantalla, más el listado de assets
docs/        build de producción (GitHub Pages)
```

Rutas con hash (`/#/home`, `/#/scan`, …) para que cualquier recarga o enlace directo funcione en GitHub Pages.

## Sistema de diseño

Tokens en `tailwind.config.js`: `ink` #0c0c12, `surface` #141420, `muted` #9090a8, `pink` #f72585,
`purple` #9d4edd, `line` rgba(255,255,255,.08), gradiente `cta`. Tipografías Unbounded (títulos) e Inter (UI)
desde Google Fonts. Iconos Lucide de trazo 2px generados inline desde el paquete `lucide`.
