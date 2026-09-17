# Pendiente para la tercera entrega

## Reconocimiento de marcadores (prioridad 1)
- [x] Integrar MindAR (image tracking) con three.js en `/scan`.
- [x] Primer marcador: logo NY de los Yankees (dos variantes) compilado en `src/assets/targets/targets.mind`.
- [x] Sustituir la detección simulada por `targetFound` / `targetLost` (al perderse pasa a modo libre, sin cerrar la sesión).
- [x] Dejar la simulación solo como respaldo (`?sim=1` o cámara no disponible).
- [ ] Llegar a mínimo 3 equipos escaneables, cada uno con contenido propio (la segunda entrega pide 2; la final, 3).
- [ ] Probar el logo NY con marcador físico impreso; si el seguimiento es inestable, usar como detonador una imagen con más textura (tarjeta del equipo con el logo).

## Modelos 3D
- [x] Modelo glTF anclado al marcador, con rotación y escala táctil, botón para detener/reanudar la animación y giro 360° en Info.
- [ ] Reemplazar la gorra de prueba por los modelos glTF/GLB de Diseño de ventanas, optimizados (< 2 MB, texturas comprimidas). El motor ya reproduce los clips que traiga el archivo.
- [ ] Elegir qué clip dispara cada botón cuando el modelo traiga varios (celebración, bateo, saludo); hoy se reproducen todos a la vez.
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
