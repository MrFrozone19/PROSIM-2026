# Pendiente para la tercera entrega

## Reconocimiento de marcadores (prioridad 1)
- [x] Integrar MindAR (image tracking) con three.js en `/scan`.
- [x] Primer marcador: logo NY de los Yankees (dos variantes) compilado en `src/assets/targets/targets.mind`.
- [x] Sustituir la detección simulada por `targetFound` / `targetLost` (al perderse pasa a modo libre, sin cerrar la sesión).
- [x] Dejar la simulación solo como respaldo (`?sim=1` o cámara no disponible).
- [x] Ampliar a los 15 equipos de la Liga Americana, con logos escaneables, cubos provisionales, información y trivia propias.
- [x] Mejorar la confiabilidad del escaneo: cámara a 720p, recorte de detección de 512 px con cuadrícula proporcional, recorte central alternado, tolerancias 2/12 y tarjeta detonadora `nyy-card.png` (ver README).
- [ ] Probar en el celular `/#/scan` contra `/#/scan?crop=256`: si el de 512 se siente lento al escanear en un teléfono modesto, bajar el valor por defecto en `ar-engine.ts`.
- [ ] Imprimir `nyy-card.png` (tamaño carta o media carta) para la demo; el logo plano queda como marcador secundario.

## Modelos 3D
- [x] Modelo glTF anclado al marcador, con rotación y escala táctil, botón para detener/reanudar la animación y giro 360° en Info.
- [x] Cubo GLB por equipo con el logo al frente, color del equipo y animación suave.
- [ ] Reemplazar los cubos provisionales por los modelos glTF/GLB de Diseño de ventanas, optimizados (< 2 MB, texturas comprimidas). El motor ya reproduce los clips que traiga el archivo.
- [ ] Elegir qué clip dispara cada botón cuando el modelo traiga varios (celebración, bateo, saludo); hoy se reproducen todos a la vez.
- [ ] Efectos: partículas y banner sobre la escena 3D en lugar de la capa 2D actual.

## Contenido
- [ ] Narraciones grabadas (audio) en lugar de `speechSynthesis`, o mantener la síntesis como respaldo.
- [ ] Videos definitivos por equipo para la galería (hoy son clips Ken Burns generados del arte del diseño).
- [x] Estadísticas simuladas de los 15 equipos, con cinco equipos por división.
- [x] 75 preguntas repartidas entre equipos (5 por cada uno), más 2 generales: 77 en total, calificadas en la API.

## Modo bonus y juego
- [x] Diamond Flight: juego estilo Flappy Bird con pelota, controles táctiles/teclado, pausa y meta de 10 obstáculos.
- [x] Unificar trivia, arcade, escaneos y logros en la misma XP y clasificación semanal.
- [x] Guardar partidas y validar su resultado en el servidor, sin duplicar recompensas al reintentar.
- [x] Trofeos First Flight / Arcade Champion e insignias Aviator / Two-Way Star.
- [x] Persistir cartas desbloqueadas y progreso por cuenta en MySQL mediante la API.

## Calidad y entrega
- [ ] Probar en al menos un iPhone (Safari) y un Android (Chrome) reales: permisos de cámara, rendimiento de los filtros por canvas, fullscreen del reproductor.
- [ ] Empaquetado como PWA (manifest + service worker) para "instalar" desde el navegador; evaluar si la rúbrica exige APK (Capacitor/TWA).
- [ ] Manual de usuario con capturas de las 7 pantallas.
- [ ] Video demostrativo de 1 a 2 minutos con el escaneo de un logo físico.
