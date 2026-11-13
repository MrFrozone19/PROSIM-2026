# Modelos recibidos

El objetivo final es que cada uno de los 15 equipos tenga un modelo único, sin compartirlo con otros equipos. La distribución compartida de esta primera entrega es temporal; cuando lleguen nuevos modelos se asignarán a los equipos correspondientes.

La asignación se decidió por afinidad visual, con autorización del usuario. No representa una mascota oficial del equipo.

| Modelo | Fuente dentro de `src/assets/models/newModels/` | Equipos |
|---|---|---|
| Bate metálico | `baseball bat/Baseball-Bat-01.obj` | Yankees, Tigers, White Sox |
| Bate de madera clara | `baseball bat/Baseball-Bat-02.obj` | Rangers, Athletics |
| Bate de madera oscura | `baseball bat/Baseball-Bat-03.obj` | Red Sox, Orioles |
| Pelota clásica | `baseball cap/Baseball-Ball-01.obj` | Blue Jays, Guardians, Twins, Angels |
| Pelota oscura | `baseball cap/Baseball-Ball-02.obj` | Mariners |
| Pelota dorada | `baseball cap/Baseball-Ball-03.obj` | Astros, Rays |
| Dado dorado | `dados/dado_v2.obj` | Royals |

`baseball cap` contiene pelotas. Se conserva el nombre de la carpeta entregada. El dado utiliza `dados/dados.png` mediante su MTL.

## Actualizar una entrega

1. Conservar el OBJ, su MTL y las texturas juntos dentro de `newModels/`. Los `.blend` se conservan como fuentes de edición.
2. Editar `design/models/catalog.json`: fuente, nombre y equipos. Cada equipo puede aparecer una sola vez; el comando rechaza duplicados y equipos desconocidos.
3. Ejecutar `npm run models:import`. Requiere Chrome o Edge instalado. Convierte los OBJ/MTL, incrusta las texturas, centra y normaliza la geometría y genera GLB con nombre versionado en `src/assets/models/imported/`.
4. Revisar `tmp/model-review/models.png`. Ejecutar `npm run teams:check`, `npm run teams:recognition` y `npm run build` antes de publicar Hosting.

Los OBJ no contienen clips. El importador agrega un movimiento de exhibición `Exhibition`: balanceo para bates y giro para pelotas/dado. Los controles existentes permiten pausarlo, girar y escalar el objeto.

El catálogo generado conecta los modelos con los mismos índices del detector. Cambiar solo un modelo no requiere volver a entrenar `targets.mind`. `npm run targets` conserva estas asignaciones al recompilar los marcadores. Un equipo sin asignación usa su cubo con logo como respaldo.

El importador no modifica los archivos entregados. La compilación excluye `models/newModels/**`, por lo que Firebase recibe los GLB convertidos y no los archivos de trabajo.
