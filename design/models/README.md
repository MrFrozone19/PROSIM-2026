# Modelos recibidos

El objetivo final es que cada uno de los 15 equipos tenga un modelo único, sin compartirlo con otros equipos. Hay diez modelos distintos reservados para diez equipos; faltan cinco modelos nuevos. La distribución compartida es temporal; cuando lleguen nuevos modelos se asignarán a los equipos pendientes.

La asignación se decidió por afinidad visual, con autorización del usuario. No representa una mascota oficial del equipo.

| Modelo | Fuente dentro de `src/assets/models/newModels/` | Equipo que lo conservará | Uso temporal por otros equipos |
|---|---|---|---|
| Bate metálico | `baseball bat/Baseball-Bat-01.obj` | Tigers | White Sox |
| Bate de madera clara | `baseball bat/Baseball-Bat-02.obj` | Rangers | Athletics |
| Bate de madera oscura | `baseball bat/Baseball-Bat-03.obj` | Red Sox | — |
| Pelota clásica | `baseball cap/Baseball-Ball-01.obj` | Blue Jays | Guardians, Twins, Angels |
| Pelota oscura | `baseball cap/Baseball-Ball-02.obj` | Mariners | — |
| Pelota dorada | `baseball cap/Baseball-Ball-03.obj` | Rays | — |
| Dado dorado | `dados/dado_v2.obj` | Royals | — |
| Gorra azul marino | `cap.glb` | Yankees | — |
| Gorra clásica | `baseball hat/Baseball-Hat.obj` | Astros | — |
| Guante de béisbol | `guante/Baseball-Glove.obj` | Orioles | — |

Pendientes de recibir su propio modelo: **Guardians, White Sox, Twins, Athletics y Angels**. Siguen funcionando con las asignaciones temporales indicadas.

`ownerTeam` en el catálogo identifica al equipo que conservará cada modelo. `teams` indica todos los equipos que lo cargan actualmente, incluidos los usos temporales. El importador y `npm run teams:check` validan que no se dupliquen propietarios ni asignaciones.

`baseball cap` contiene pelotas. Se conserva el nombre de la carpeta entregada. El dado utiliza `dados/dados.png` mediante su MTL.

## Actualizar una entrega

1. Conservar el OBJ, su MTL y las texturas juntos dentro de `newModels/`, o agregar un GLB. Los `.blend` se conservan como fuentes de edición.
2. Editar `design/models/catalog.json`: fuente, nombre, equipo propietario y equipos que lo usan. Cada equipo puede aparecer una sola vez en `teams`; el comando rechaza duplicados y equipos desconocidos.
3. Ejecutar `npm run models:import`. Requiere Chrome o Edge instalado. Importa OBJ/MTL y GLB, incrusta las texturas, centra y normaliza la geometría y genera GLB con nombre versionado en `src/assets/models/imported/`.
4. Revisar `tmp/model-review/models.png`. Ejecutar `npm run teams:check`, `npm run teams:recognition` y `npm run build` antes de publicar Hosting.

Los OBJ no contienen clips. El importador agrega un movimiento de exhibición `Exhibition`: balanceo para bates y giro para pelotas/dado/gorra OBJ/guante. Para GLB con animaciones, conserva los clips originales: `cap.glb` utiliza `Celebrate`. Los controles existentes permiten pausarlos, girar y escalar el objeto.

`baseball hat/Baseball-Hat.mtl` solo contiene comentarios, sin materiales ni texturas definidos; su geometría utiliza el material blanco por defecto. `cap.glb` incluye sus materiales azul marino. Las dos gorras son geometrías distintas.

`guante/Baseball-Glove.mtl` también contiene solo comentarios. Se usa `fallbackColor: #985828` para darle tono de cuero al material sin nombre; los materiales definidos de otros modelos se conservan. Su GLB ocupa aproximadamente 535 KiB, con 7,792 triángulos y movimiento de exhibición.

El catálogo generado conecta los modelos con los mismos índices del detector. Cambiar solo un modelo no requiere volver a entrenar `targets.mind`. `npm run targets` conserva estas asignaciones al recompilar los marcadores. Un equipo sin asignación usa su cubo con logo como respaldo.

El importador no modifica los archivos entregados. La compilación excluye `models/newModels/**`, por lo que Firebase recibe los GLB convertidos y no los archivos de trabajo.
