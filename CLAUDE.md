# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🔐 Protocolo de Seguridad (LEER AL INICIO DE CADA SESIÓN)

**Al iniciar cada nueva conversación, Antigravity DEBE preguntar:**
> "¿Me das permiso para acceder a tu archivo `.env` y conectarme a la base de datos Railway esta sesión?"

- Si el usuario dice **sí**: puede leer `backend/.env`, ejecutar queries a la DB y actualizar la sección de esquema en este archivo.
- Si el usuario dice **no**: trabajar únicamente con el código fuente, sin acceder a credenciales ni a la DB.
- **Nunca asumir acceso automático.** Preguntar siempre, sin excepciones.

---

## Project Overview

**SCCE** is a cacao production traceability system (Sistema de Trazabilidad de Producción de Cacao). It tracks production batches through the full lifecycle: intake → fermentation → drying → warehouse → sample extraction → physical/sensory analysis.

- **Backend**: NestJS 11 (TypeScript) — `backend/` — port 3000
- **Frontend**: Angular 21 (standalone components) — `frontend/` — port 4200
- **Database**: PostgreSQL on Railway (raw `pg` pool, no ORM)
- **Deployment**: Railway (see `railway` branch/commit)

---

## Development Commands

### Backend (`/backend`)
```bash
npm run start:dev   # Dev server with watch mode
npm run build       # Compile TypeScript to dist/
npm run start:prod  # Run compiled output (node dist/main)
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

The core domain is the **lot** (`lotes` table). Every lot moves through this state machine:

```
INGRESADO
  ↓ (PATCH /lotes/:id/listo-fermentacion — manual)
LISTO_PARA_FERMENTACION
  ↓ (POST /fermentacion/:id/evento tipo=INICIO)
FERMENTACION
  ↓ (POST /fermentacion/:id/evento tipo=FINAL)
SECADO                          ← secados record auto-created here
  ↓ (POST /secado/:id/finalizar)
LISTO_PARA_ALMACEN
  ↓ (POST /almacen/:id/ingresar)
ALMACEN
  ↓ (stock_actual reaches 0 via muestra extraction or derivado)
CONSUMIDO
```

> ⚠️ **IMPORTANTE**: `LISTO_PARA_SECADO` aparece en la documentación original pero **NO es un estado real** en el código. El evento `FINAL` de fermentación transiciona directamente a `SECADO`. `CONSUMIDO` sí existe en el código pero no está en el enum documentado.

---

## Backend Modules (`backend/src/`)

Each module maps to a production stage. All use `@Inject('PG_POOL')` for DB access.

### Module Map

| Módulo | Controlador | Prefijo ruta | Roles permitidos |
|---|---|---|---|
| `lotes` | LotesController | `/lotes` | ADMIN (GET), any authenticated (POST) |
| `fermentacion` | FermentacionController | `/fermentacion` | ADMIN, OPERADOR_FERMENTACION |
| `secado` | SecadoController | `/secado` | ADMIN, OPERADOR_SECADO |
| `almacen` | AlmacenController | `/almacen` | ADMIN, OPERADOR_ALMACEN |
| `muestras` | MuestrasController | `/muestras` | ADMIN, OPERADOR_ALMACEN |
| `analisis` | AnalisisController | `/analisis` | (ver controlador) |
| `cata` | CataController | `/cata` | ADMIN, CALIDAD, OPERADOR_ALMACEN (+ rutas públicas) |
| `lotes-derivados` | LotesDerivadosController | `/lotes-derivados` | ADMIN, OPERADOR_ALMACEN |
| `dashboard` | DashboardController | `/dashboard` | any authenticated (JwtAuthGuard only) |
| `usuarios` | UsuariosController | `/usuarios` | ADMIN |
| `auth` | AuthController | `/auth` | público |

### API Endpoints Completos

#### `/lotes`
- `GET /lotes` — listar todos (ADMIN)
- `POST /lotes` — crear lote (body: `CreateLoteDto`)
- `PATCH /lotes/:id/listo-fermentacion` — transición manual a LISTO_PARA_FERMENTACION

#### `/fermentacion`
- `GET /fermentacion/lotes` — lotes en estado LISTO_PARA_FERMENTACION o FERMENTACION
- `GET /fermentacion/:loteId/eventos` — historial de eventos del lote
- `POST /fermentacion/:loteId/evento` — crear evento (INICIO|REMOCION|CONTROL|FINAL)
- `POST /fermentacion/upload` — subir foto (multipart/form-data, campo `foto`)
- `PATCH /fermentacion/evento/:eventoId/foto` — agregar foto a evento existente

#### `/secado`
- `GET /secado/lotes` — lotes en estado SECADO
- `GET /secado/:loteId/eventos` — eventos de secado (tabla `secado_eventos` — ⚠️ puede no existir en DB)
- `POST /secado/:loteId/finalizar` — finalizar secado (body: `fecha_fin, hora_fin, porcentaje_secado`)

#### `/almacen`
- `GET /almacen/lotes` — lotes LISTO_PARA_ALMACEN y ALMACEN
- `GET /almacen/en-almacen` — lotes en ALMACEN con stock > 0
- `POST /almacen/:loteId/ingresar` — ingresar a almacén (body: `fecha, hora, sacos, kg_brutos`)

#### `/muestras`
- `GET /muestras/lotes` — lotes en ALMACEN (para crear muestras)
- `GET /muestras/todas` — todas las muestras con info de lote
- `POST /muestras/:loteId/crear` — crear muestra (descuenta stock)
- `GET /muestras/:muestraId/analisis` — análisis de una muestra
- `POST /muestras/:muestraId/analisis` — registrar análisis físico
- `POST /muestras/upload-foto` — subir foto de análisis

#### `/cata`
- `GET /cata/muestra/:muestraId` — listar catas de una muestra (auth requerido)
- `POST /cata/:muestraId/crear` — crear sesión de cata + generar invitaciones (auth)
- `GET /cata/invitacion/:token` — info de invitación (PÚBLICO)
- `POST /cata/responder/:token` — enviar respuesta de cata (PÚBLICO)
- `GET /cata/:cataId/resultados` — resultados de una cata (auth)

#### `/lotes-derivados`
- `GET /lotes-derivados/disponibles` — lotes y derivados con stock > 0
- `GET /lotes-derivados` — listar todos los derivados
- `POST /lotes-derivados/crear` — crear derivado (fusionar stocks)
- `POST /lotes-derivados/:derivadoId/muestra` — crear muestra de un derivado

#### `/dashboard`
- `GET /dashboard/stats` — KPIs, gráficos, actividad reciente

#### `/auth`
- `POST /auth/login` — login (body: `email, password`) → `{ access_token }`

---

## Database Access Pattern

**No ORM.** Raw SQL via `pg` Pool inyectado como `'PG_POOL'`.

```typescript
constructor(@Inject('PG_POOL') private pool: Pool) {}
```

Para operaciones multi-paso, usar transacciones explícitas:
```typescript
const client = await this.pool.connect();
try {
  await client.query('BEGIN');
  // ... queries usando client.query() ...
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

Usar `FOR UPDATE` cuando se lee y luego escribe el mismo row (ej: decrementar stock).

---

## Authentication

- JWT Bearer tokens → `POST /auth/login` → `{ access_token }`
- Token firmado con payload: `{ sub: user.id, email, rol }`
- JwtStrategy.validate() retorna el objeto user completo desde DB
- **`req.user.id`** es el campo correcto para obtener el userId del usuario autenticado
- Role enum: `ADMIN`, `OPERADOR_FERMENTACION`, `OPERADOR_SECADO`, `OPERADOR_ALMACEN`, `CALIDAD`, `CATADOR`
- Guards: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ROL1', 'ROL2')`

---

## File Upload Pattern

Los archivos se suben via `multipart/form-data` con `multer`:
- Destino: `backend/uploads/` (carpeta local)
- Servidos estáticamente en: `http://localhost:3000/uploads/<filename>`
- Endpoints de upload: `POST /fermentacion/upload`, `POST /muestras/upload-foto`
- Límite: 10MB, solo imágenes (jpg, jpeg, png, gif, webp)
- La URL resultante se almacena en el campo `foto_url` de la tabla correspondiente

---

## Frontend Structure

### Configuración (`frontend/src/app/app.config.ts`)
- `provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' }))`
- `provideHttpClient(withInterceptors([authInterceptor]))` — interceptor global de auth

### Routing (`frontend/src/app/app.routes.ts`)
```
/ o /login              → LoginComponent (público)
/cata/:token            → CataForm (PÚBLICO, sin layout ni auth)
  [LayoutComponent shell]
    /dashboard          → Dashboard
    /lotes              → Lotes
    /fermentacion       → Fermentacion
    /secado             → Secado
    /almacen            → Almacen
    /muestras           → Muestras
    /derivados          → Derivados
```

### Páginas y sus endpoints HTTP

| Componente | Archivo | Endpoints que consume |
|---|---|---|
| `Lotes` | `pages/lotes/lotes.ts` | GET /lotes, POST /lotes |
| `Fermentacion` | `pages/fermentacion/fermentacion.ts` | GET /fermentacion/lotes, GET /fermentacion/:id/eventos, POST /fermentacion/:id/evento, POST /fermentacion/upload, PATCH /fermentacion/evento/:id/foto |
| `Secado` | `pages/secado/secado.ts` | GET /secado/lotes, POST /secado/:id/finalizar |
| `Almacen` | `pages/almacen/almacen.ts` | GET /almacen/lotes, GET /almacen/en-almacen, POST /almacen/:id/ingresar, POST /muestras/:id/crear |
| `Muestras` | `pages/muestras/muestras.ts` | GET /muestras/todas, GET /muestras/:id/analisis, POST /muestras/:id/analisis, POST /muestras/upload-foto, GET /cata/muestra/:id, POST /cata/:id/crear, GET /cata/:id/resultados |
| `Derivados` | `pages/derivados/derivados.ts` | GET /lotes-derivados/disponibles, GET /lotes-derivados, POST /lotes-derivados/crear, POST /lotes-derivados/:id/muestra |
| `Dashboard` | `pages/dashboard/dashboard.ts` | GET /dashboard/stats |
| `CataForm` | `pages/cata-form/cata-form.ts` | GET /cata/invitacion/:token, POST /cata/responder/:token |

### Patrón de componentes standalone
```typescript
@Component({
  selector: 'app-nombre',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nombre.html',
  styleUrls: ['./nombre.scss']
})
```
No hay `NgModule` compartido. Todos los imports son locales al componente.

### Auth en el frontend
- Token JWT guardado en `localStorage` con key `'token'`
- Interceptor: `core/interceptors/auth-interceptor.ts` agrega `Authorization: Bearer <token>` a todas las peticiones automáticamente
- `AuthService` en `core/services/auth.ts`: `login()` guarda el token, `logout()` lo elimina
- **No hay route guards** — cualquier usuario puede navegar a `/lotes` sin estar logueado

### URLs hardcodeadas
`http://localhost:3000` está hardcodeado en **cada componente**. No hay servicio centralizado de HTTP. Archivos afectados: todos los pages + `core/services/auth.ts`.

> **Nota**: Existen archivos de entorno en `frontend/src/environments/` (actualmente sin trackear en git):
> - `environment.ts`: `apiUrl: 'http://localhost:3000'`, `frontendUrl: 'http://localhost:4200'`
> - `environment.prod.ts`: `apiUrl: ''` (vacío, para configurar en build)
>
> Los componentes NO importan estos archivos — usan URLs hardcodeadas directamente. Si se decide centralizar, este sería el punto de partida.

### Librería externa
- `qrcode` (v1.5.4) — usada en `Muestras` para generar QR codes de links de invitación a cata

---

## Key Business Logic

### Cálculos automáticos (Almacén)
```
kg_neto = kg_brutos - (sacos × 0.2)
rendimiento = (kg_neto / kg_baba_compra) × 100
stock_actual = kg_neto  ← se inicializa aquí, luego se decrementa con muestras
```

### Fermentación (event-sourced)
- Solo `APPEND` de eventos, nunca `UPDATE` (excepto `foto_url` via `actualizarFotoEvento`)
- Orden obligatorio: INICIO → N×(REMOCION|CONTROL) → FINAL
- La numeración de remociones se calcula automáticamente
- El evento FINAL crea automáticamente el registro en `secados`

### Muestras (stock management)
- `descuento_kg = peso_muestra_gramos / 1000`
- Stock se descuenta de `lotes.stock_actual` (no de `kg_neto_final`, que es inmutable)
- Si `stock_actual <= 0` → estado del lote pasa a `CONSUMIDO`
- Igual para derivados: si stock llega a 0 el lote origen pasa a `CONSUMIDO`

### Cata (sistema de invitaciones)
- Se generan N tokens UUID (uno por catador)
- Links públicos: `http://localhost:4200/cata/<token>`
- El form de cata (`/cata/:token`) es público, sin auth
- Cuando todos responden → cata pasa a estado `CERRADA`

### Derivados (fusión de stocks)
- Se pueden combinar lotes tipo `LOTE` o `DERIVADO` como orígenes
- Se valida stock suficiente con `FOR UPDATE` locking
- Se registran movimientos en `movimientos_inventario`

---

## Dependencies

### Backend (key)
| Package | Versión | Uso |
|---|---|---|
| `@nestjs/common` | ^11.0.1 | Framework principal |
| `@nestjs/jwt` | ^11.0.2 | JWT tokens |
| `@nestjs/passport` | ^11.0.5 | Estrategia JWT |
| `passport-jwt` | ^4.0.1 | Estrategia JWT |
| `pg` | ^8.18.0 | PostgreSQL driver |
| `bcrypt` | ^6.0.0 | Hash de contraseñas |
| `multer` | ^2.0.2 | Upload de archivos |
| `uuid` | ^8.3.2 | Generación de UUIDs |
| `class-validator` | ^0.14.3 | Validación de DTOs |
| `class-transformer` | ^0.5.1 | Transformación de clases |

### Frontend (key)
| Package | Versión | Uso |
|---|---|---|
| `@angular/common` | ^21.1.0 | Framework |
| `@angular/forms` | ^21.1.0 | FormsModule (ngModel) |
| `@angular/router` | ^21.1.0 | Routing |
| `qrcode` | ^1.5.4 | QR codes para invitaciones de cata |
| `rxjs` | ~7.8.0 | Observables HTTP |

---

## ⚠️ Errores Comunes y Trampas (LEER SIEMPRE)

### 1. Naming mismatch frontend ↔ backend
**Causa #1 de bugs.** Los nombres de campos en el frontend DEBEN coincidir exactamente con los del backend y la DB.

**Antes de crear/modificar un formulario, verificar:**
1. DTO en `backend/src/<módulo>/dto/*.dto.ts`
2. Las columnas de la DB (sección de esquema abajo)
3. El objeto del formulario en el componente Angular (`nuevoLote`, `formIngreso`, etc.)

### 2. `req.user.id` vs `req.user.userId` — BUG CONOCIDO
En `lotes.controller.ts`, el `create` usa `req.user.userId` pero el campo real del usuario (devuelto por `JwtStrategy.validate`) es `id`. **`req.user.userId` es `undefined`**. Los demás controladores usan `req.user.id` correctamente.

### 3. Provider token de la DB
```typescript
constructor(@Inject('PG_POOL') private pool: Pool) {}
```
El token es `'PG_POOL'` (NO `'DATABASE_CONNECTION'`).

### 4. Tablas con nombre inconsistente en el código
Algunas referencias en el código no coinciden con el esquema documentado:
- `analisis_fisico` (singular) — tabla real en DB, usada en `analisis.service.ts`
- `analisis_fisicos` (plural) — referenciada en `muestras.service.ts` y `dashboard.service.ts` — puede ser un bug
- `analisis_fisico_grupos` — referenciada en `muestras.service.ts` — verificar si existe en DB
- `secado_eventos` — referenciada en `secado.service.ts` pero no está en el esquema conocido
- `catas.estado`, `catas.fecha`, `catas.tipo_tueste`, `catas.temperatura`, `catas.tiempo`, `catas.tostadora` — usados en `cata.service.ts` pero no listados en el esquema original de `catas`
- `muestras.humedad` — usado en `muestras.service.ts` pero no en el esquema documentado

**Siempre verificar contra la DB real antes de escribir queries.**

### 5. Estado CONSUMIDO (no documentado originalmente)
`lotes.estado = 'CONSUMIDO'` se asigna cuando `stock_actual <= 0`. Este estado existe en la DB pero no aparecía en la documentación del state machine. Tenerlo en cuenta en filtros.

### 6. console.log de credenciales
`backend/src/database/database.module.ts` línea 24 tiene:
```typescript
console.log(process.env.DATABASE_URL);
```
Esto imprime la URL de la base de datos en consola. Debe eliminarse.

### 7. No hay ValidationPipe global
Los decoradores de validación en DTOs (`@IsString()`, `@IsNotEmpty()`, etc.) no ejecutarán a menos que se configure el `ValidationPipe` global en `main.ts`. Actualmente no está configurado.

### 8. URLs hardcodeadas apuntan a localhost
En producción (Railway), las URLs `http://localhost:3000` y `http://localhost:4200` no funcionan. Ver sección de deuda técnica.

### 9. Frontend: `lotes.ts` solo muestra LISTO_PARA_FERMENTACION
```typescript
this.lotes = data.filter(l => l.estado === 'LISTO_PARA_FERMENTACION');
```
La página de Lotes filtra en el cliente, no en el servidor. El backend retorna todos los lotes al ADMIN.

---

## 🔧 Deuda técnica conocida

- [ ] `database.module.ts` línea 24: `console.log(process.env.DATABASE_URL)` imprime credenciales en consola → **eliminar**
- [ ] `lotes.controller.ts`: usa `req.user.userId` (debería ser `req.user.id`) → `created_by` de lotes es siempre `undefined`
- [ ] No hay `ValidationPipe` global configurado → los decoradores de validación en DTOs no ejecutan
- [ ] No hay servicios Angular dedicados por módulo (cada componente hace HTTP directo)
- [ ] URLs `http://localhost:3000` y `http://localhost:4200` hardcodeadas en todo el frontend (incluido `cata.service.ts` al generar links de invitación)
- [ ] El archivo `database.txt` no refleja el estado actual de la DB Railway
- [ ] No hay manejo de errores unificado en el frontend (algunos usan `alert()`, otros ignoran)
- [ ] No hay guards de rutas en el frontend (cualquier usuario puede navegar sin estar logueado)
- [ ] `secado.service.ts` referencia tabla `secado_eventos` que no está en el esquema conocido
- [ ] `muestras.service.ts` y `dashboard.service.ts` referencian `analisis_fisicos` (plural), posible error
- [ ] `muestras.service.ts` tiene su propio `crearAnalisis` que duplica funcionalidad del módulo `analisis`

---

## Environment

Backend requires `backend/.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=1h
```

Default admin credentials (from README): `admin@cacao.com` / `123456`

**main.ts settings:**
- Body size limit: 10MB (para fotos en base64)
- Static files: `backend/uploads/` servido en `/uploads`
- CORS: `origin: true, credentials: true`
- Puerto: 3000

---

## 🗄️ Esquema de Base de Datos Railway (actualizado: 2026-02-20)

> Consultado en vivo desde Railway. 16 tablas documentadas + tablas adicionales probables (`secado_eventos`, `analisis_fisicos`, `analisis_fisico_grupos`). Siempre verificar contra DB real.

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
- estado: enum DEFAULT 'PENDIENTE'  ← PENDIENTE | RESPONDIDA
- responded_at: timestamp
- created_at: timestamp DEFAULT now()

### cata_respuestas (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- invitacion_id: uuid
- nombre_catador: varchar NOT NULL
- fecha: date
- tipo_tueste: varchar
- tostado, defecto, cacao, amargor, astringencia, acidez: integer (escala 0–10)
- fruta_fresca, fruta_marron, vegetal, floral, madera, especies, nueces, caramel_pan: integer
- global: integer
- created_at: timestamp DEFAULT now()

### catas (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- muestra_id: uuid
- tipo: varchar (ej: 'NORMAL')
- fecha: date
- tipo_tueste: varchar
- temperatura: numeric
- tiempo: numeric
- tostadora: varchar
- total_catadores: integer NOT NULL
- estado: enum  ← ABIERTA | CERRADA
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

### lote_proveedores (1 fila) — tabla pivote (posiblemente sin uso activo)
- lote_id: uuid NOT NULL
- proveedor_id: uuid NOT NULL

### lotes (6 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- codigo: varchar NOT NULL
- fecha_compra: date NOT NULL
- kg_baba_compra: numeric NOT NULL
- kg_segunda: numeric DEFAULT 0
- estado: enum NOT NULL  ← INGRESADO | LISTO_PARA_FERMENTACION | FERMENTACION | SECADO | LISTO_PARA_ALMACEN | ALMACEN | CONSUMIDO
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
- origen_tipo: enum NOT NULL  ← LOTE | DERIVADO
- origen_id: uuid NOT NULL
- destino_derivado_id: uuid
- cantidad_kg: numeric NOT NULL
- created_by: uuid
- created_at: timestamp DEFAULT now()

### muestras (0 filas)
- id: uuid NOT NULL DEFAULT uuid_generate_v4()
- lote_id: uuid  ← puede referenciar lotes o lotes_derivados
- fecha: date NOT NULL
- peso_muestra_gramos: numeric NOT NULL
- humedad: numeric  ← posible campo adicional no en esquema original
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
