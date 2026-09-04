# Pendiente para la tercera entrega

## Reconocimiento de marcadores (prioridad 1)
- [ ] Integrar MindAR (image tracking) con A-Frame o three.js en `/scan`, reutilizando el `<video>` de la cámara ya implementado.
- [ ] Compilar los logos de al menos 3 equipos como targets (`.mind`) y guardarlos en `src/assets/targets/`.
- [ ] Sustituir el botón "Simular detección" por el evento `targetFound` → navegar a `/ar?team=…`; `targetLost` → regresar al estado de escaneo sin cerrar la sesión.
- [ ] Mantener el botón de simulación solo en desarrollo (query `?sim=1`) para demos sin marcador físico.

## Modelos 3D
- [ ] Reemplazar el logo holográfico de `/ar` por el modelo glTF/GLB de la mascota (Diseño de ventanas), optimizado (< 2 MB, texturas comprimidas).
- [ ] Conectar los botones del dock a animaciones reales del modelo (celebración, bateo, saludo) y a la rotación 360° del panel Info.
- [ ] Efectos: partículas y banner sobre la escena 3D en lugar de la capa 2D actual.

## Contenido
- [ ] Narraciones grabadas (audio) en lugar de `speechSynthesis`, o mantener la síntesis como respaldo.
- [ ] Videos definitivos por equipo para la galería (hoy son clips Ken Burns generados del arte del diseño).
- [ ] Datos de estadísticas simuladas más completos (las 3 divisiones).

## Modo bonus y juego
- [ ] Definir la mecánica del minijuego de `/game` (hoy es placeholder) o consolidar el TCG Vault como modo bonus.
- [ ] Persistir cartas desbloqueadas y progreso en `localStorage`.

## Calidad y entrega
- [ ] Probar en al menos un iPhone (Safari) y un Android (Chrome) reales: permisos de cámara, rendimiento de los filtros por canvas, fullscreen del reproductor.
- [ ] Empaquetado como PWA (manifest + service worker) para "instalar" desde el navegador; evaluar si la rúbrica exige APK (Capacitor/TWA).
- [ ] Manual de usuario con capturas de las 7 pantallas.
- [ ] Video demostrativo de 1 a 2 minutos con el escaneo de un logo físico.
