# Gestión Restaurante

Sistema de gestión de inventario y escandallos para restaurantes.

- **Backend**: NestJS + Prisma + PostgreSQL/Supabase + JWT Auth
- **Frontend**: Next.js (App Router) + Tailwind CSS

```
gestion-restaurante/
├─ apps/
│  ├─ api/   (NestJS + Prisma, puerto 3001)
│  └─ web/   (Next.js, puerto 3000)
├─ docker-compose.yml  (PostgreSQL local para desarrollo)
└─ turbo.json
```

## Inicio rápido (desarrollo local)

### 1. Requisitos
- Node.js >= 20
- Docker (para PostgreSQL local) **o** una instancia de Supabase

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
Edita `apps/api/.env` con tu `DATABASE_URL` y `JWT_SECRET`.

### 4. Base de datos local con Docker
```bash
docker compose up -d db
```
Esto levanta PostgreSQL en `localhost:5432` (usuario `postgres`, password `postgres`, DB `gestion_restaurante`).

### 5. Aplicar esquema + datos de ejemplo
```bash
npm run db:push     # crea las tablas en la DB
npm run db:seed     # inserta productos, proveedores, escandallo y 2 usuarios
```

### 6. Arrancar
```bash
npm run dev         # frontend + backend a la vez
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

### 7. Login
Datos de ejemplo creados por el seed:
| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Administrador | admin@restaurante.es | admin123 | ADMIN |
| Jefe de Cocina | cocina@restaurante.es | cocina123 | COCINERO |

---

## Configurar Supabase (base de datos gratis en la nube)

1. Regístrate en https://supabase.com y crea un proyecto (plan Free).
2. Ve a **Project Settings → Database → Connection string → URI** y copia la cadena.
3. Pégala en `apps/api/.env` como `DATABASE_URL`:
   ```
   postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:6543/postgres?schema=public
   ```
4. Aplica el esquema:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Dev frontend + backend |
| `npm run dev:web` | Solo frontend (puerto 3000) |
| `npm run dev:api` | Solo backend (puerto 3001) |
| `npm run build` | Build de producción |
| `npm run lint` | Lint |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:push` | Sincroniza esquema con la DB |
| `npm run db:seed` | Carga datos de ejemplo + usuarios |
| `npm run db:studio` | Abre Prisma Studio (GUI de la DB) |

---

## Sistema de roles

| Rol | Permisos |
|---|---|
| **ADMIN** | Todo: CRUD, eliminar, gestionar usuarios, informes |
| **GERENTE** | CRUD productos/entradas/salidas/escandallos + informes (no eliminar) |
| **COCINERO** | CRUD productos/entradas/salidas/escandallos (no informes, no eliminar) |

Endpoints de lectura: todos los autenticados.
Endpoints de escritura: COCINERO+.
Eliminar: solo ADMIN.
Informes: GERENTE+.

---

## Funcionalidades implementadas (RF-01 a RF-21)

- [x] **RF-01/02/03** — Productos: CRUD + filtros (categoría, proveedor, unidad, caducidad)
- [x] **RF-04/05/06** — Entradas: multi-línea, actualiza stock, registra movimientos
- [x] **RF-07/08/09** — Salidas: multi-línea, control stock insuficiente, motivos, plato asociado
- [x] **RF-10 a RF-15** — Escandallos: coste/merma/margen en tiempo real, duplicar
- [x] **RF-16/17/18** — Alertas: stock bajo mínimo, caducidad, dashboard en vivo
- [x] **RF-19/20/21** — Informes: movimientos, costes escandallos, caducidades + CSV
- [x] **Auth JWT** — Login, registro (admin), roles, rutas protegidas
- [x] **UI responsive** — Sidebar desktop, bottom nav móvil

---

## Despliegue en producción

### Frontend → Vercel (gratis)

1. Sube el repositorio a GitHub.
2. En https://vercel.com, importa el repo.
3. Configuración:
   - **Root directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
   - **Environment variables**:
     ```
     NEXT_PUBLIC_API_URL=https://tu-api.onrender.com/api
     ```
4. Deploy.

### Backend → Render (gratis)

1. En https://render.com, crea un nuevo **Web Service** desde tu repo.
2. Configuración:
   - **Root directory**: `apps/api`
   - **Build command**: `npm install && npm run build`
   - **Start command**: `node dist/main.js`
   - **Environment variables**:
     ```
     DATABASE_URL=postgresql://...@db.xxx.supabase.co:6543/postgres?schema=public
     JWT_SECRET=tu-secreto-muy-largo-y-aleatorio
     JWT_EXPIRES_IN=7d
     PORT=3001
     CORS_ORIGIN=https://tu-frontend.vercel.app
     ```
3. Deploy.

### Base de datos → Supabase (gratis)

1. Crea proyecto en https://supabase.com (plan Free).
2. Copia la connection string a `DATABASE_URL` en Render.
3. Ejecuta una vez (desde local con la URL de Supabase):
   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   DATABASE_URL="postgresql://..." npm run db:seed
   ```

### Verificación post-despliegue
- `https://tu-api.onrender.com/api/health` → `{"status":"ok"}`
- `https://tu-frontend.vercel.app` → redirige a `/login`

---

## Estructura del proyecto

```
apps/api/
├─ src/
│  ├─ auth/           (JWT, guards, roles, login, register)
│  ├─ productos/      (RF-01/02/03)
│  ├─ proveedores/    (CRUD)
│  ├─ entradas/       (RF-04/05/06)
│  ├─ salidas/        (RF-07/08/09)
│  ├─ escandallos/    (RF-10 a RF-15 + cálculo)
│  ├─ alertas/        (RF-16/17/18 + métricas dashboard)
│  ├─ informes/       (RF-19/20/21)
│  ├─ prisma/         (PrismaService global)
│  ├─ health/         (health check)
│  └─ main.ts         (bootstrap, CORS, validation)
├─ prisma/
│  ├─ schema.prisma   (modelo E/R completo + Usuario)
│  └─ seed.js          (datos de ejemplo)

apps/web/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx       (ShellProvider + AuthProvider)
│  │  ├─ page.tsx         (Dashboard en vivo)
│  │  ├─ login/           (página de login)
│  │  ├─ productos/       (RF-03)
│  │  ├─ entradas/        (RF-06)
│  │  ├─ salidas/         (RF-09)
│  │  ├─ escandallos/     (RF-10 a RF-15)
│  │  └─ informes/        (RF-19/20/21)
│  ├─ components/         (Sidebar, Modal, forms, UserMenu)
│  └─ lib/                (api, types, auth, escandallo calc)
```