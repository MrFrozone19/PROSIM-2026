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

Todas menos `/api/health` exigen `Authorization: Bearer <ID token de Firebase>`.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/me` · `PATCH /api/me` | Perfil, XP, nivel, posición semanal · cambiar nombre o equipo favorito |
| `GET /api/collection` | Cartas, trofeos e insignias con lo que el usuario ya tiene |
| `POST /api/scans` | Registra un escaneo; el primero de cada equipo desbloquea su carta |
| `GET /api/trivia?teamId=` · `POST /api/trivia/:id/answer` | Preguntas (sin respuesta) · contestar |
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
