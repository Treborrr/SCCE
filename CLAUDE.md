# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🔐 Protocolo de Seguridad (LEER AL INICIO DE CADA SESIÓN)

**Al iniciar cada nueva conversación, Antigravity DEBE preguntar:**
> "¿Me das permiso para acceder a tu archivo `.env` y conectarme a la base de datos Railway esta sesión?"

- Si el usuario dice **sí**: puede leer `backend/.env`, ejecutar queries a la DB y actualizar la sección de esquema en este archivo.
- Si el usuario dice **no**: trabajar únicamente con el código fuente, sin acceder a credenciales ni a la DB.
- **Nunca asumir acceso automático.** Preguntar siempre, sin excepciones.

## Project Overview

**SCCE** is a cacao production traceability system (Sistema de Trazabilidad de Producción de Cacao). It tracks production batches through the full lifecycle: intake → fermentation → drying → warehouse → sample extraction → physical/sensory analysis.

- **Backend**: NestJS 11 (TypeScript) on port 3000
- **Frontend**: Angular 21 (standalone components) on port 4200
- **Database**: PostgreSQL on Railway (raw `pg` pool, no ORM)

---

## Development Commands

### Backend (`/backend`)
```bash
npm run start:dev   # Dev server with watch mode
npm run build       # Compile TypeScript to dist/
npm run start:prod  # Run compiled output
npm run lint        # ESLint with auto-fix
npm run test        # Jest unit tests
npm run test:e2e    # End-to-end tests
```

### Frontend (`/frontend`)
```bash
npm start           # ng serve (dev server)
npm run build       # Production build
npm run watch       # Dev build with watch
npm test            # Karma tests
```

---

## Architecture

### Lot State Machine
The core domain is the **lot** (`lotes` table). Every lot moves through a strict state machine enforced at the service layer:

```
INGRESADO → LISTO_PARA_FERMENTACION → FERMENTACION → LISTO_PARA_SECADO → SECADO → LISTO_PARA_ALMACEN → ALMACEN
```

State transitions are triggered by business events (e.g., registering a `FINAL` fermentation event automatically creates a `secados` record and transitions the lot).

### Backend Modules (`backend/src/`)
Each module maps to a production stage:
- **lotes** – Batch creation and lifecycle management
- **fermentacion** – Event-sourced fermentation log (INICIO, REMOCION, CONTROL, FINAL)
- **secado** – Drying record per lot (finalization triggers ALMACEN readiness)
- **almacen** – Warehouse entry; auto-calculates `kg_neto = kg_brutos - (sacos * 0.2)` and `rendimiento = (kg_neto / kg_baba_compra) * 100`
- **muestras** – Sample extraction with automatic stock deduction from warehouse
- **analisis** – Physical/defect/cut analysis on samples
- **cata** – Sensory tasting evaluation (0–10 scale)
- **lotes-derivados** – Secondary lots created by splitting warehouse stock
- **usuarios** – User management
- **auth** – JWT authentication and role-based guards
- **database** – Global `pg` Pool provider (injected as `'DATABASE_CONNECTION'`)

### Database Access Pattern
**No ORM is used.** All queries are raw SQL via the `pg` Pool injected as a provider. For multi-step operations, use explicit transactions:
```typescript
const client = await this.pool.connect();
try {
  await client.query('BEGIN');
  // ... queries ...
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```
Use `FOR UPDATE` row-level locking when reading then writing the same row (e.g., decrementing stock).

### Authentication
- JWT Bearer tokens issued by `POST /auth/login`
- Role enum: `ADMIN`, `OPERADOR_FERMENTACION`, `OPERADOR_SECADO`, `OPERADOR_ALMACEN`, `CALIDAD`, `CATADOR`
- Guards applied per controller with `@UseGuards(JwtAuthGuard)` and `@Roles(...)`

### Frontend Routing (`frontend/src/app/app.routes.ts`)
All feature routes are **lazy-loaded** under a `LayoutComponent` shell:
- `/lotes`, `/fermentacion`, `/secado`, `/almacen`, `/muestras`, `/derivados`
- Login at root `/` or `/login`

Frontend communicates with the backend via Angular `HttpClient` to `http://localhost:3000`.

---

## Key Constraints

- **Fermentation is event-sourced**: each action (remocion, control, etc.) appends a new row — records are never updated. Only a `FINAL` event closes fermentation.
- **Muestras deduct stock**: extracting a sample decrements `almacenes.stock_actual` (not `kg_neto_final`, which is immutable).
- **Derived lots** come from warehouse stock; subdividing a lot creates new `lotes_derivados` rows.
- **No migration tool**: schema changes must be applied manually to the Railway PostgreSQL database.

---

## ⚠️ Errores Comunes y Trampas (LEER SIEMPRE)

### 1. Naming mismatch frontend ↔ backend
**Causa #1 de bugs.** Los nombres de campos en el frontend (`nuevoLote`, formularios, ngModel) DEBEN coincidir exactamente con los del DTO del backend y las columnas de la DB.

**Antes de crear/modificar un formulario, verificar:**
- DTO en `backend/src/<módulo>/dto/*.dto.ts` → nombres de propiedades
- Columnas en la DB (ver sección de esquema abajo)
- Objeto del formulario en el componente Angular

**Ejemplo del bug real:** Frontend enviaba `{ proveedor: "..." }` pero el backend esperaba `{ proveedor_nombre: "..." }`.

### 2. URLs hardcodeadas en el frontend
Actualmente cada componente Angular tiene `http://localhost:3000` hardcodeado directamente en las llamadas HTTP. **No hay servicios centralizados por módulo.** Al modificar algún componente, mantener esta convención existente (o refactorizar todo junto si se decide cambiar).

Archivos afectados:
- `frontend/src/app/pages/lotes/lotes.ts`
- `frontend/src/app/pages/fermentacion/fermentacion.ts`
- `frontend/src/app/pages/secado/secado.ts`
- `frontend/src/app/pages/almacen/almacen.ts`
- `frontend/src/app/pages/muestras/muestras.ts`
- `frontend/src/app/core/services/auth.ts`

### 3. Schema SQL vs DB real
El archivo `backend/src/database/database.txt` contiene el DDL original, pero la DB en Railway puede haber sido modificada manualmente (ej: se añadió `proveedor_nombre` a la tabla `lotes`). **Siempre verificar contra la DB real**, no contra el archivo `.txt`.

### 4. Provider token de la DB
La conexión a PostgreSQL se inyecta con el token `'PG_POOL'` (NO `'DATABASE_CONNECTION'` como se menciona arriba). Al crear nuevos módulos:
```typescript
constructor(@Inject('PG_POOL') private pool: Pool) {}
```

### 5. Frontend: patrón de componentes standalone
Todos los componentes Angular usan `standalone: true` con imports locales (`CommonModule`, `FormsModule`). No hay `NgModule` compartido. Al crear un nuevo componente:
```typescript
@Component({
  selector: 'app-nombre',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nombre.html',
  styleUrl: './nombre.scss'
})
```

### 6. Auth en el frontend
- Token JWT guardado en `localStorage` bajo la key `'token'`
- Interceptor automático en `core/interceptors/auth-interceptor.ts` agrega `Authorization: Bearer <token>` a todas las peticiones
- Roles se validan solo en el backend con `@Roles('ADMIN')` + `RolesGuard`

---

## 🔧 Deuda técnica conocida

- [ ] `database.module.ts` línea 24: `console.log(process.env.DATABASE_URL)` imprime credenciales en consola → **eliminar**
- [ ] No hay `ValidationPipe` global configurado → los decoradores de validación en DTOs podrían no ejecutarse
- [ ] No hay servicios Angular dedicados por módulo (cada componente hace HTTP directo)
- [ ] El archivo `database.txt` no refleja el estado actual de la DB Railway
- [ ] No hay manejo de errores unificado en el frontend (algunos usan `alert()`, otros ignoran)
- [ ] No hay guards de rutas en el frontend (cualquiera puede navegar a `/lotes` sin estar logueado)

---

## Environment

Backend requires `backend/.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=1h
```

Default admin credentials (from README): `admin@cacao.com` / `123456`

---

## 🗄️ Esquema de Base de Datos Railway (actualizado: 2026-02-20)

> Consultado en vivo desde Railway. 16 tablas en total.

### almacenes (2 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- lote_id: uuid
- fecha: date NOT NULL
- hora: time NOT NULL
- sacos: integer NOT NULL
- kg_brutos: numeric NOT NULL
- created_by: uuid
- created_at: timestamp DEFAULT now()

### analisis_corte_detalle (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- analisis_id: uuid
- tipo_corte: varchar NOT NULL
- cantidad_granos: integer
- porcentaje: numeric

### analisis_defectos (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- analisis_id: uuid
- tipo_defecto: varchar NOT NULL
- gramos: numeric
- porcentaje: numeric

### analisis_fisico (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- muestra_id: uuid
- fecha: date NOT NULL
- humedad: numeric
- total_granos_corte: integer
- porcentaje_fermentacion: numeric
- foto_url: text
- observaciones: text
- created_by: uuid
- created_at: timestamp DEFAULT now()

### cata_invitaciones (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- cata_id: uuid
- token: uuid NOT NULL DEFAULT uuid_generate_v4()
- nombre_catador: varchar
- estado: enum DEFAULT 'PENDIENTE'
- responded_at: timestamp
- created_at: timestamp DEFAULT now()

### cata_respuestas (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- invitacion_id: uuid
- nombre_catador: varchar NOT NULL
- tostado, defecto, cacao, amargor, astringencia, acidez: integer (escala 0–10)
- fruta_fresca, fruta_marron, vegetal, floral, madera, especies, nueces, caramel_pan: integer
- global: integer
- created_at: timestamp DEFAULT now()

### catas (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- muestra_id: uuid
- tipo: enum NOT NULL
- total_catadores: integer NOT NULL
- created_by: uuid
- created_at: timestamp DEFAULT now()

### fermentacion_eventos (13 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- lote_id: uuid
- tipo: enum NOT NULL  ← INICIO | REMOCION | CONTROL | FINAL
- fecha: date NOT NULL
- hora: time NOT NULL
- cajon: varchar
- brix, ph_pepa, ph_pulpa: numeric
- temperatura_interna, temperatura_ambiente: numeric
- es_remocion: boolean DEFAULT false
- prueba_corte: boolean DEFAULT false
- foto_url: text
- descripcion: text
- created_by: uuid
- created_at: timestamp DEFAULT now()

### lote_proveedores (1 fila) — tabla pivote
- lote_id: uuid NOT NULL
- proveedor_id: uuid NOT NULL

### lotes (6 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- codigo: varchar NOT NULL
- fecha_compra: date NOT NULL
- kg_baba_compra: numeric NOT NULL
- kg_segunda: numeric DEFAULT 0
- estado: enum NOT NULL  ← INGRESADO | LISTO_PARA_FERMENTACION | FERMENTACION | LISTO_PARA_SECADO | SECADO | LISTO_PARA_ALMACEN | ALMACEN
- kg_neto_final: numeric
- rendimiento: numeric
- stock_actual: numeric DEFAULT 0
- created_by: uuid
- created_at: timestamp DEFAULT now()
- proveedor_nombre: varchar NOT NULL DEFAULT ''

### lotes_derivados (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- codigo: varchar NOT NULL
- fecha_creacion: date NOT NULL
- stock_actual: numeric NOT NULL
- created_by: uuid
- created_at: timestamp DEFAULT now()

### movimientos_inventario (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- origen_tipo: enum NOT NULL
- origen_id: uuid NOT NULL
- destino_derivado_id: uuid
- cantidad_kg: numeric NOT NULL
- created_by: uuid
- created_at: timestamp DEFAULT now()

### muestras (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- lote_id: uuid
- fecha: date NOT NULL
- peso_muestra_gramos: numeric NOT NULL
- stock_descontado_kg: numeric NOT NULL
- created_by: uuid
- created_at: timestamp DEFAULT now()

### proveedores (1 fila)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- nombre: varchar NOT NULL

### secados (2 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- lote_id: uuid
- fecha_inicio: date NOT NULL
- hora_inicio: time NOT NULL
- fecha_fin: date
- hora_fin: time
- porcentaje_secado: numeric
- created_by: uuid
- created_at: timestamp DEFAULT now()

### temperatura_ambiente (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- fecha: date NOT NULL
- hora: time NOT NULL
- temperatura: numeric NOT NULL
- fuente: enum DEFAULT 'MANUAL'
- created_by: uuid
- created_at: timestamp DEFAULT now()

### usuarios (2 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- nombre: varchar NOT NULL
- email: varchar NOT NULL
- password_hash: text NOT NULL
- rol: enum NOT NULL  ← ADMIN | OPERADOR_FERMENTACION | OPERADOR_SECADO | OPERADOR_ALMACEN | CALIDAD | CATADOR
- activo: boolean DEFAULT true
- created_at: timestamp DEFAULT now()
