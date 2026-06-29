# INF781 - Examen 3er Parcial - SecureNotes

Resolución del parcial práctico **SecureNotes** de Seguridad de Software, construida tomando como base la GL7 y GL8:

- GL7: autenticación JWT con `accessToken` y `refreshToken`, Argon2, DTOs, estrategias y guards.
- GL8: sesiones persistentes, rotación de refresh token, detección de reúso, revocación, logout y cookie `httpOnly`.

## Tecnologías

- NestJS 11
- Node.js 20+
- PostgreSQL 14+
- TypeORM
- JWT + Passport
- Argon2
- class-validator / class-transformer
- cookie-parser

## Estructura principal

```txt
src/
├── app.module.ts
├── main.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── dto/
│   ├── guards/
│   └── strategies/
├── users/
├── notes/
└── sessions/
```

## Instalación

```bash
npm install
```

## Base de datos

Crear la base de datos en PostgreSQL:

```sql
CREATE DATABASE securenotes;
```

Opcionalmente crear usuario propio:

```sql
CREATE USER securenotes_user WITH PASSWORD 'securenotes_password';
GRANT ALL PRIVILEGES ON DATABASE securenotes TO securenotes_user;
```

## Variables de entorno

Copiar el ejemplo:

```bash
cp .env.example .env
```

Editar `.env` con tus datos reales:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=securenotes
TYPEORM_SYNC=true
JWT_ACCESS_SECRET=secreto-largo-access
JWT_REFRESH_SECRET=secreto-largo-refresh-distinto
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

> Importante: `.env` no debe subirse al repositorio. Solo se entrega `.env.example`.

## Ejecutar

```bash
npm run start:dev
```

Servidor:

```txt
http://localhost:3000
```

## Endpoints implementados

### Autenticación

| Método | Ruta | Protección | Descripción |
|---|---|---|---|
| POST | `/auth/register` | No | Registra usuario, hashea password con Argon2 y crea sesión |
| POST | `/auth/login` | No | Verifica credenciales y crea sesión |
| POST | `/auth/refresh` | Refresh cookie | Rota refresh y entrega nuevo access token |
| GET | `/auth/me` | Access token | Devuelve usuario autenticado |
| POST | `/auth/logout` | Refresh cookie | Revoca la sesión actual |
| GET | `/auth/sessions` | Access token | Lista sesiones activas |

### Notas

| Método | Ruta | Protección | Descripción |
|---|---|---|---|
| POST | `/notes` | Access token | Crea una nota propia |
| GET | `/notes` | Access token | Lista solo notas propias |
| GET | `/notes/:id` | Access token | Obtiene una nota propia |
| PATCH | `/notes/:id` | Access token | Actualiza una nota propia |
| DELETE | `/notes/:id` | Access token | Elimina una nota propia |

## Seguridad aplicada

- Password almacenado únicamente como hash Argon2.
- No se devuelve `password` ni hash en respuestas.
- DTOs con `class-validator`.
- `ValidationPipe` global con:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- Access token de vida corta.
- Refresh token de vida larga.
- Secretos diferentes para access y refresh desde variables de entorno.
- Rutas protegidas con Passport Strategy + Guard.
- Control anti-IDOR: las consultas de notas siempre filtran por `id` y `ownerId`; si la nota pertenece a otro usuario devuelve 404.
- Refresh token guardado como hash por sesión/dispositivo.
- Rotación: cada `/auth/refresh` genera un refresh nuevo y reemplaza el hash anterior.
- Detección de reúso: si llega un refresh token antiguo o robado, se revocan todas las sesiones del usuario.
- Cookie `httpOnly`, `SameSite=strict`, `Secure` en producción y `path=/auth`.
- Logout revoca la sesión actual y limpia la cookie.

## Pruebas

Se incluye el archivo:

```txt
securenotes.http
```

Puedes abrirlo en VS Code con la extensión **REST Client** y ejecutar las peticiones en orden.
También puedes replicarlas en Postman o Bruno.

Escenarios cubiertos:

1. Registro e inicio de sesión.
2. Acceso a `/notes` sin token: 401.
3. Crear notas propias.
4. Listar solo notas del usuario autenticado.
5. Usuario B intentando leer/modificar/eliminar nota de usuario A: 404.
6. Refresh con cookie `httpOnly`.
7. Logout y fallo posterior de refresh.
8. Rotación y detección de reúso.

## Entrega

Este proyecto se entrega sin `node_modules`, con `.gitignore`, `.env.example`, README y colección `.http`.
