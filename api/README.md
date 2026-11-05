# basedex-api

API de BaseDex Fan: Node 22 + Express 5 + MySQL (`mysql2`) + verificación de sesión con `firebase-admin`.
Corre en Cloud Run (servicio `basedex-api`, región `us-central1`) detrás de Firebase Hosting, que le reenvía `/api/**`.

## Local

```bash
docker compose up -d        # desde la raíz: MySQL 8.4 en el puerto 3307
cp .env.example .env
npm install
npm run dev                 # http://localhost:8080/api/health
```

Al arrancar crea las tablas que falten y sincroniza el catálogo (`src/catalog.ts`).

## Rutas

Todas menos `/api/health` y `/api/trivia/summary` exigen `Authorization: Bearer <ID token de Firebase>`.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/me` · `PATCH /api/me` | Perfil, XP, nivel, posición semanal · cambiar nombre o equipo favorito |
| `GET /api/collection` | Cartas, trofeos e insignias con lo que el usuario ya tiene |
| `POST /api/scans` | Registra un escaneo; el primero de cada equipo desbloquea su carta |
| `GET /api/trivia?teamId=` · `POST /api/trivia/:id/answer` | Preguntas (sin respuesta) · contestar |
| `GET /api/trivia/summary` | Conteo público del catálogo activo por equipo y de preguntas generales; no expone preguntas ni respuestas |
| `GET /api/game` | Récord, victorias, XP de partidas disponible y desglose semanal de la misma XP del leaderboard |
| `POST /api/game/start` | Crea una partida de Diamond Flight con ID, semilla y versión de reglas |
| `POST /api/game/:id/finish` | Recibe `{ flaps: number[] }`, valida la partida y guarda puntos, logros y resultado una sola vez |
| `POST /api/events` | `effect` o `filter` (cuentan para logros) |
| `GET /api/leaderboard` | Top 10 de XP de los últimos 7 días |
| `GET /api/gallery` · `POST /api/gallery` · `DELETE /api/gallery/:id` | Galería: listar, registrar un archivo ya subido a Storage (se verifica que exista), eliminar (también de Storage) |
| `DELETE /api/me` | Borra los datos y archivos del usuario |
| `GET /api/admin/users` · `POST/PUT/DELETE /api/admin/trivia` | Solo rol admin (`ADMIN_EMAILS`) |

## Publicar en Cloud Run

```bash
gcloud run deploy basedex-api --source api --region us-central1 \
  --service-account basedex-api@basedex-fan.iam.gserviceaccount.com \
  --add-cloudsql-instances basedex-fan:us-central1:basedex-db \
  --set-env-vars DB_SOCKET_PATH=/cloudsql/basedex-fan:us-central1:basedex-db,DB_USER=basedex_api,DB_NAME=basedex,FIREBASE_PROJECT_ID=basedex-fan,ADMIN_EMAILS=sinuhemartinez11@gmail.com \
  --set-secrets DB_PASSWORD=db-password:latest \
  --allow-unauthenticated --min-instances 0 --max-instances 2
```

`--allow-unauthenticated` es necesario para que Firebase Hosting pueda llamar al servicio; la autorización real la
hace la API con el token de Firebase.

## Partidas y pruebas

`game_runs` se crea automáticamente mediante la migración aditiva. El servidor calcula el resultado usando
`game-physics.ts`, módulo puro compartido con la interfaz. Se otorgan 10 XP por obstáculo y 50 por victoria,
con un máximo de 300 XP de partidas en las últimas 24 horas. Los trofeos First Flight y Arcade Champion
agregan 50 XP cada uno al desbloquearse; Aviator y Two-Way Star son insignias.

Las acciones que entregan puntos se serializan por usuario y se liquidan en una transacción. Repetir el envío
de una partida finalizada no repite puntos ni logros; la trivia solo da XP por la primera respuesta correcta
a cada pregunta, incluso con peticiones concurrentes. Los IDs y recompensas existentes se conservan.

`npm test` ejecuta las pruebas de física y del catálogo de 77 preguntas. Las pruebas de integración requieren
`RUN_DB_TESTS=1` y una base exclusiva `basedex_test` en `127.0.0.1:3308`; se niegan a usar Cloud SQL o la base habitual.
