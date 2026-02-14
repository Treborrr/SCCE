---

# 📘 CICLO DEFINITIVO DEL LOTE

## Sistema de Trazabilidad de Producción de Cacao

---

# 🟫 1️⃣ INGRESO A PLANTA

## 🎯 Propósito

Representa el nacimiento formal del lote dentro del sistema.

Un lote puede representar:

* Una compra individual
* La consolidación física de dos compras en un solo lote

---

## 📌 Datos registrados

* Código secuencial único
* Fecha de compra
* Proveedor(es)
* Kg baba compra
* Kg segunda

---

## 📌 Estado inicial

```
INGRESADO
```

Aquí inicia la trazabilidad histórica.
No existe proceso productivo activo.

---

# 🟫 2️⃣ FERMENTACIÓN

## 🎯 Inicio del proceso técnico activo

Cuando el lote entra en fermentación:

Estado cambia a:

```
FERMENTACION
```

---

## 📌 Modelo por EVENTOS

La fermentación se modela como una secuencia de eventos independientes.

No es un único formulario.
Cada acción genera un registro.

---

## 🔹 Tipos de eventos

* Inicio
* Remoción (cantidad variable, no fija)
* Control
* Final

🔴 Regla crítica:
Una remoción **no puede** cerrar la fermentación.
El cierre solo ocurre con un evento tipo:

```
FINAL
```

---

## 🔹 Datos que puede registrar cada evento

* Fecha
* Hora
* Cajón
* °Brix
* pH pepa
* pH pulpa
* Temperatura interna
* Temperatura ambiente (manual en esta etapa)
* Remoción (sí/no)
* Prueba de corte (sí/no)

---

## 🔹 Prueba de corte (en fermentación)

Si se marca:

Debe permitir:

* 📷 Adjuntar foto (opcional, editable posteriormente)
* 📝 Descripción (opcional, editable posteriormente)

No es obligatoria al momento del registro.

---

## 🔹 Finalización de fermentación

Cuando se registra evento tipo:

```
FINAL
```

Ocurre automáticamente:

* Fin de fermentación
* Inicio inmediato de secado
* Eliminación del estado “LISTO_PARA_SECADO”

Transición directa:

```
FERMENTACION → SECADO
```

---

# 🟫 3️⃣ SECADO

## 🎯 Proceso pasivo dependiente del clima

Estado:

```
SECADO
```

No existe estado intermedio.

---

## 📌 Inicio de secado (automático)

* Fecha inicio = fecha del evento FINAL de fermentación
* Hora inicio = hora del evento FINAL

---

## 📌 Durante secado

No se registran:

* Eventos técnicos
* Remociones
* Parámetros internos

Es un proceso pasivo.

---

## 🌡 Temperatura ambiente

Se registra en sistema independiente.

Características:

* Registro manual
* Futuro soporte sensor
* No vinculación obligatoria con lote
* Consulta histórica por rango de fechas

---

## 📌 Finalización de secado

Se registra manualmente:

* Fecha fin
* Hora fin
* % de secado

Cuando termina:

```
SECADO → LISTO_PARA_ALMACEN
```

---

# 🟫 4️⃣ ALMACÉN

Cuando el lote entra físicamente a almacén:

```
LISTO_PARA_ALMACEN → ALMACEN
```

Aquí nace el inventario real.

---

## 📌 Datos registrados

* Fecha
* Hora
* Sacos
* Kg brutos

---

## 📌 Cálculos automáticos (backend)

```
kgNeto = kgBrutos - (sacos * 0.2)
rendimiento = (kgNeto / kgBabaCompra) * 100
stockActual = kgNeto
```

El usuario no ingresa estos valores.

---

## 📌 Resultado

El lote ahora tiene:

* kg_neto_final
* rendimiento
* stock_actual dinámico

---

# 🟫 5️⃣ MUESTRAS

## 🎯 Nueva entidad central de calidad

Una muestra representa una extracción física real del lote.

---

## 📌 Características

* Un lote puede tener múltiples muestras
* Cada muestra tiene peso específico
* La muestra descuenta stock
* La muestra es base para análisis físico y cata

---

## 📌 Registro de muestra

El usuario registra:

* Fecha
* Peso muestra (gramos)

Al guardarse:

```
stockActual -= pesoMuestra / 1000
```

🔴 Importante:

* El kgNeto original no cambia
* Solo se modifica stockActual
* El descuento ocurre solo una vez (al crear la muestra)

---

# 🟫 6️⃣ ANÁLISIS FÍSICO

## 🎯 Dependencia estructural

```
Lote
  → Muestras
      → Análisis físicos
```

Puede haber múltiples análisis físicos por muestra.

---

## 📌 Datos del análisis físico

* Fecha
* Humedad (%)
* Defectos físicos (detalle flexible con gramos y %)
* Prueba de corte (detalle por granos)
* % de fermentación
* Foto
* Descripción

---

## 🔹 Defectos físicos

Ejemplo:

| Tipo            | Gramos | %  |
| --------------- | ------ | -- |
| Planos          | X      | X% |
| Materia extraña | X      | X% |
| Granos <1g      | X      | X% |
| Pasillas        | X      | X% |
| Múltiples       | X      | X% |
| Germinados      | X      | X% |

---

## 🔹 Prueba de corte (análisis físico)

Incluye:

* Cantidad de granos evaluados
* Clasificación por tipo
* % fermentación calculado

---

## 📌 Regla importante

El análisis físico:

* NO descuenta stock
* El descuento ya ocurrió al crear la muestra

---

# 🟫 7️⃣ CATA

## 🎯 Dependencia

```
Lote
  → Muestras
      → Catas
```

Es independiente del análisis físico.

Puede existir:

* Con análisis físico
* Sin análisis físico

---

## 📌 Características generales

* Puede registrarse el mismo día
* Puede registrarse semanas después
* Puede haber múltiples catas por muestra
* No cambia estado
* No afecta stock

---

## 📌 Evaluación sensorial (escala 0–10)

Atributos evaluados:

* Tostado
* Defecto
* Cacao
* Amargor
* Astringencia
* Acidez
* Fruta fresca
* Fruta marrón
* Vegetal
* Floral
* Madera
* Especies
* Nueces
* Caramel / pan
* Global

---

## 📌 Leyenda de intensidad

Debe mostrarse siempre:

* 0: Ausente
* 1: Solo un rastro
* 2: Presente con baja intensidad
* 3–5: Presente
* 6: Caracteriza claramente la muestra
* 7–8: Dominante
* 9–10: Máximo, intensidad muy fuerte

---

## 🔴 Cata especial (ADMIN)

Solo el administrador podrá:

* Mezclar muestras
* Seleccionar múltiples muestras
* Incluso mezclar muestras de diferentes lotes
* Registrar una cata combinada

Esto crea una cata independiente del lote original.

---

# 🟤 ESTADOS DEFINITIVOS DEL LOTE

```
INGRESADO
LISTO_PARA_FERMENTACION
FERMENTACION
SECADO
LISTO_PARA_ALMACEN
ALMACEN
```

Una vez en:

```
ALMACEN
```

El lote:

* Permanece en ese estado
* Solo cambia su stock dinámicamente
* No vuelve a etapas productivas

---

# 🧠 Arquitectura Conceptual Final

```
Lote
 ├── FermentacionEventos
 ├── Secado
 ├── Almacen
 ├── Muestras
 │     ├── AnalisisFisico
 │     │      ├── Defectos
 │     │      └── Corte
 │     └── Catas
 └── TemperaturaAmbiente (externo)
```

---

# 🧩 Qué lograste con este modelo

Tu sistema ahora es:

✔ Sistema de trazabilidad productiva
✔ Sistema técnico de control de fermentación
✔ Sistema logístico de inventario
✔ Sistema de control de calidad estructurado
✔ Sistema sensorial profesional
✔ Base para análisis climático
✔ Soporte para catas experimentales (mezclas)

---

Para Quitar el stock de los Lotes, lo que yo quiero crear un nuevo loteA (no se como llamarlo) que seria la suma de los Lotes que ya registramos primero, las que pasaron por el proceso de fermentacion secado y tal, una vez que estan en almacen se podrian armar estos lotes mas grandes que(lote a) de ese lote A pasara por un proceso de seleecion y van creando lotes mas pequenos pero el sistema debe crear hasta esos lotes A

---
-- ==========================================
-- SISTEMA INDUSTRIAL DE TRAZABILIDAD CACAO
-- VERSION INDUSTRIAL BASICA (INMUTABLE)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================

CREATE TYPE estado_lote AS ENUM (
    'INGRESADO',
    'LISTO_PARA_FERMENTACION',
    'FERMENTACION',
    'SECADO',
    'LISTO_PARA_ALMACEN',
    'ALMACEN'
);

CREATE TYPE tipo_evento_fermentacion AS ENUM (
    'INICIO',
    'REMOCION',
    'CONTROL',
    'FINAL'
);

CREATE TYPE tipo_cata AS ENUM (
    'NORMAL',
    'MEZCLA'
);

CREATE TYPE fuente_temperatura AS ENUM (
    'MANUAL',
    'SENSOR'
);

CREATE TYPE rol_usuario AS ENUM (
    'ADMIN',
    'OPERADOR_FERMENTACION',
    'OPERADOR_SECADO',
    'OPERADOR_ALMACEN',
    'CALIDAD',
    'CATADOR'
);

-- ==========================================
-- USUARIOS
-- ==========================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol rol_usuario NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- LOTES PRODUCTIVOS
-- ==========================================

CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    fecha_compra DATE NOT NULL,
    kg_baba_compra NUMERIC(12,2) NOT NULL,
    kg_segunda NUMERIC(12,2) DEFAULT 0,
    estado estado_lote NOT NULL,
    kg_neto_final NUMERIC(12,2),
    rendimiento NUMERIC(6,2),
    stock_actual NUMERIC(12,2) DEFAULT 0,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- PROVEEDORES
-- ==========================================

CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL
);

CREATE TABLE lote_proveedores (
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id),
    PRIMARY KEY (lote_id, proveedor_id)
);

-- ==========================================
-- FERMENTACION
-- ==========================================

CREATE TABLE fermentacion_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    tipo tipo_evento_fermentacion NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    cajon VARCHAR(100),
    brix NUMERIC(6,2),
    ph_pepa NUMERIC(4,2),
    ph_pulpa NUMERIC(4,2),
    temperatura_interna NUMERIC(6,2),
    temperatura_ambiente NUMERIC(6,2),
    es_remocion BOOLEAN DEFAULT FALSE,
    prueba_corte BOOLEAN DEFAULT FALSE,
    foto_url TEXT,
    descripcion TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- SECADO
-- ==========================================

CREATE TABLE secados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID UNIQUE REFERENCES lotes(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_fin DATE,
    hora_fin TIME,
    porcentaje_secado NUMERIC(5,2),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ALMACEN
-- ==========================================

CREATE TABLE almacenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID UNIQUE REFERENCES lotes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    sacos INTEGER NOT NULL,
    kg_brutos NUMERIC(12,2) NOT NULL,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- MUESTRAS
-- ==========================================

CREATE TABLE muestras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    peso_muestra_gramos NUMERIC(10,2) NOT NULL,
    stock_descontado_kg NUMERIC(10,3) NOT NULL,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ANALISIS FISICO
-- ==========================================

CREATE TABLE analisis_fisico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    muestra_id UUID REFERENCES muestras(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    humedad NUMERIC(5,2),
    total_granos_corte INTEGER,
    porcentaje_fermentacion NUMERIC(5,2),
    foto_url TEXT,
    observaciones TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analisis_defectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analisis_id UUID REFERENCES analisis_fisico(id) ON DELETE CASCADE,
    tipo_defecto VARCHAR(150) NOT NULL,
    gramos NUMERIC(10,2),
    porcentaje NUMERIC(6,2)
);

CREATE TABLE analisis_corte_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analisis_id UUID REFERENCES analisis_fisico(id) ON DELETE CASCADE,
    tipo_corte VARCHAR(150) NOT NULL,
    cantidad_granos INTEGER,
    porcentaje NUMERIC(6,2)
);

-- ==========================================
-- CATA
-- ==========================================

CREATE TABLE catas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    muestra_id UUID REFERENCES muestras(id),
    tipo tipo_cata NOT NULL,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cata_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cata_id UUID REFERENCES catas(id) ON DELETE CASCADE,
    tostado INTEGER CHECK (tostado BETWEEN 0 AND 10),
    defecto INTEGER CHECK (defecto BETWEEN 0 AND 10),
    cacao INTEGER CHECK (cacao BETWEEN 0 AND 10),
    amargor INTEGER CHECK (amargor BETWEEN 0 AND 10),
    astringencia INTEGER CHECK (astringencia BETWEEN 0 AND 10),
    acidez INTEGER CHECK (acidez BETWEEN 0 AND 10),
    fruta_fresca INTEGER CHECK (fruta_fresca BETWEEN 0 AND 10),
    fruta_marron INTEGER CHECK (fruta_marron BETWEEN 0 AND 10),
    vegetal INTEGER CHECK (vegetal BETWEEN 0 AND 10),
    floral INTEGER CHECK (floral BETWEEN 0 AND 10),
    madera INTEGER CHECK (madera BETWEEN 0 AND 10),
    especies INTEGER CHECK (especies BETWEEN 0 AND 10),
    nueces INTEGER CHECK (nueces BETWEEN 0 AND 10),
    caramel_pan INTEGER CHECK (caramel_pan BETWEEN 0 AND 10),
    global INTEGER CHECK (global BETWEEN 0 AND 10)
);

CREATE TABLE cata_mezcla_muestras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cata_id UUID REFERENCES catas(id) ON DELETE CASCADE,
    muestra_id UUID REFERENCES muestras(id)
);

-- ==========================================
-- LOTES DERIVADOS
-- ==========================================

CREATE TABLE lotes_derivados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    fecha_creacion DATE NOT NULL,
    stock_actual NUMERIC(12,2) NOT NULL,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lote_derivado_origen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_derivado_id UUID REFERENCES lotes_derivados(id) ON DELETE CASCADE,
    lote_origen_id UUID REFERENCES lotes(id),
    cantidad_kg NUMERIC(12,2) NOT NULL
);

CREATE TABLE lote_derivado_padre (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_padre_id UUID REFERENCES lotes_derivados(id),
    lote_hijo_id UUID REFERENCES lotes_derivados(id),
    cantidad_transferida NUMERIC(12,2) NOT NULL
);

-- ==========================================
-- TEMPERATURA AMBIENTE
-- ==========================================

CREATE TABLE temperatura_ambiente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    temperatura NUMERIC(6,2) NOT NULL,
    fuente fuente_temperatura DEFAULT 'MANUAL',
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- INDICES
-- ==========================================

CREATE INDEX idx_lotes_estado ON lotes(estado);
CREATE INDEX idx_muestras_lote ON muestras(lote_id);
CREATE INDEX idx_analisis_muestra ON analisis_fisico(muestra_id);
CREATE INDEX idx_cata_muestra ON catas(muestra_id);
CREATE INDEX idx_lote_derivado_origen ON lote_derivado_origen(lote_derivado_id);
CREATE INDEX idx_temp_fecha ON temperatura_ambiente(fecha);

---

# 📘 DOCUMENTACIÓN TÉCNICA

## Sistema Industrial de Trazabilidad de Cacao (Modelo Inmutable)

---

# 1️⃣ FILOSOFÍA DEL DISEÑO

Este sistema fue diseñado bajo los siguientes principios:

* Modelo orientado a eventos
* Inmutabilidad (no edición de registros)
* Trazabilidad humana mediante `created_by`
* Separación clara entre proceso productivo y logística
* Inventario dinámico controlado
* Escalabilidad industrial sin sobreingeniería

La base permite reconstruir:

* El proceso técnico del lote
* Las transformaciones físicas
* Las extracciones
* Las mezclas
* La responsabilidad humana

---

# 2️⃣ EXTENSIÓN UUID

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Permite generación de UUID automáticos.

Razón:

* Evita dependencia de secuencias
* Facilita distribución futura
* Es estándar en sistemas industriales

---

# 3️⃣ ENUMS

Los ENUMS evitan errores de escritura y garantizan consistencia.

---

## estado_lote

Controla la fase productiva del lote.

Estados posibles:

* INGRESADO
* LISTO_PARA_FERMENTACION
* FERMENTACION
* SECADO
* LISTO_PARA_ALMACEN
* ALMACEN

Problema que resuelve:

Evita estados inválidos y mantiene coherencia del flujo productivo.

---

## tipo_evento_fermentacion

Define la naturaleza del evento técnico:

* INICIO
* REMOCION
* CONTROL
* FINAL

Diseño:

La fermentación no es editable.
Cada acción es un evento.

Esto permite reconstrucción histórica completa.

---

## tipo_cata

* NORMAL
* MEZCLA

Permite diferenciar:

* Cata de muestra individual
* Cata combinada de varias muestras

---

## fuente_temperatura

Permite saber si la temperatura fue:

* MANUAL
* SENSOR

Pensado para futura integración IoT.

---

## rol_usuario

Define control de acceso.

Roles separados por etapa operativa.

---

# 4️⃣ USUARIOS

Tabla `usuarios`

Resuelve:

* Autenticación
* Control de acceso
* Responsabilidad
* Trazabilidad humana

Cada registro productivo apunta a:

```
created_by → usuarios.id
```

No existe `updated_by` porque el modelo es inmutable.

---

# 5️⃣ LOTES PRODUCTIVOS

Tabla central del sistema.

Representa:

El lote físico que pasa por el proceso completo.

Campos clave:

* kg_baba_compra → entrada inicial
* estado → controla etapa
* stock_actual → inventario dinámico
* kg_neto_final → valor final tras secado
* rendimiento → eficiencia del proceso

Diseño:

* El estado controla transición productiva
* El stock se actualiza por eventos derivados

---

# 6️⃣ PROVEEDORES

Permite:

* Un lote con múltiples proveedores
* Unión de compras en un solo lote físico

Tabla intermedia:

`lote_proveedores`

Diseño correcto para relación N:M.

---

# 7️⃣ FERMENTACIÓN

Tabla: `fermentacion_eventos`

Diseño clave:

* Modelo orientado a eventos
* No edición
* Cada acción es un registro

Permite reconstruir:

* Secuencia exacta
* Parámetros técnicos por día
* Prueba de corte
* Responsabilidad humana

No existe "editar fermentación".
Si hay error → eliminar evento → registrar nuevo.

---

# 8️⃣ SECADO

Tabla: `secados`

Una sola fila por lote.

Controla:

* Inicio automático
* Fin manual
* % secado

Diseño:

Secado es proceso pasivo.
No requiere eventos múltiples.

---

# 9️⃣ ALMACÉN

Tabla: `almacenes`

Marca el momento en que:

El lote se convierte en inventario real.

Aquí se calcula:

* kg_neto_final
* rendimiento
* stock_actual inicial

---

# 🔟 MUESTRAS

Tabla: `muestras`

Entidad clave del modelo industrial.

Resuelve:

* Extracción física
* Descuento de stock
* Base para análisis

El descuento se registra explícitamente en:

```
stock_descontado_kg
```

Diseño correcto:
El análisis no descuenta stock.
La muestra sí.

---

# 11️⃣ ANÁLISIS FÍSICO

Tabla: `analisis_fisico`

Pertenece a una muestra.

Permite:

* Humedad
* Corte
* % fermentación
* Foto
* Observaciones

Tablas relacionadas:

* analisis_defectos
* analisis_corte_detalle

Diseño normalizado.
Flexible.
Escalable.

---

# 12️⃣ CATA

Tabla: `catas`

Independiente del análisis físico.

Puede existir:

* Con análisis
* Sin análisis
* Como mezcla

`cata_detalle` contiene atributos sensoriales (0-10).

Diseño correcto:
Separación clara entre evaluación técnica y sensorial.

---

# 13️⃣ LOTES DERIVADOS

Permite:

* Consolidar lotes almacenados
* Crear lotes logísticos
* Subdividirlos

Tablas:

* lotes_derivados
* lote_derivado_origen
* lote_derivado_padre

Diseño:

Permite árbol de transformación logística.

Esto es diseño industrial real.

---

# 14️⃣ TEMPERATURA AMBIENTE

Tabla independiente.

No depende del lote.

Permite:

* Correlacionar secado vs clima
* Integración futura con sensores

Diseño desacoplado.
Correcto.

---

# 🟢 CICLO COMPLETO DEL LOTE (VALIDADO CONTRA LA BASE)

Ahora verificamos si el modelo cumple el flujo real.

---

## 1️⃣ INGRESO

Se crea en:

`lotes`

Estado:

INGRESADO

Tiene proveedor(es).

Tiene created_by.

---

## 2️⃣ FERMENTACIÓN

Estado cambia a:

FERMENTACION

Se crean múltiples registros en:

`fermentacion_eventos`

Hasta que se crea evento tipo FINAL.

---

## 3️⃣ SECADO

Se crea registro en:

`secados`

Con fecha_inicio automática.

Cuando termina:

Estado pasa a:

LISTO_PARA_ALMACEN

---

## 4️⃣ ALMACÉN

Se crea registro en:

`almacenes`

Se calculan:

* kg_neto_final
* rendimiento
* stock_actual

Estado pasa a:

ALMACEN

---

## 5️⃣ MUESTRA

Se crea en:

`muestras`

Se descuenta stock_actual.

---

## 6️⃣ ANÁLISIS FÍSICO

Se crea en:

`analisis_fisico`

Relacionado a muestra.

No afecta stock.

---

## 7️⃣ CATA

Se crea en:

`catas`

Puede ser:

* Normal
* Mezcla

No afecta stock.

---

## 8️⃣ LOTES DERIVADOS

Se crea en:

`lotes_derivados`

Se transfieren cantidades desde lotes almacenados.

Se crea árbol logístico.

---

# ✅ CONCLUSIÓN

Tu modelo ahora es:

✔ Industrial
✔ Inmutable
✔ Trazable
✔ Responsable
✔ Escalable
✔ Coherente con el flujo real
✔ Sin sobreingeniería

---
endpoints: 

curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@cacao.com","password":"123456"}'

consulta de lote
curl http://localhost:3000/lotes \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZDFjNjlkMi1kNjhhLTQwOGEtOTZlNS1jOGI4YTY3ZTMzOTAiLCJlbWFpbCI6ImFkbWluQGNhY2FvLmNvbSIsInJvbCI6IkFETUlOIiwiaWF0IjoxNzcxMDQ0NTgxLCJleHAiOjE3NzEwNDgxODF9.JzUNgGsc3A_l8KDl5WL1nmuy2rIRkaYwdknr8pdcwO0"

crear lote

@Treborrr ➜ /workspaces/SCCE/backend (master) $ curl -X POST http://localhost:3000/lotes \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZDFjNjlkMi1kNjhhLTQwOGEtOTZlNS1jOGI4YTY3ZTMzOTAiLCJlbWFpbCI6ImFkbWluQGNhY2FvLmNvbSIsInJvbCI6IkFETUlOIiwiaWF0IjoxNzcwOTY5MjQ2LCJleHAiOjE3NzA5NzI4NDZ9.BaQdVlPVRUr6pzOG7_CncDiaRUTX6TsLb3cCvqMZ6IQ" \
-H "Content-Type: application/json" \
-d '{
  "codigo":"L001",
  "fecha_compra":"2026-02-13",
  "kg_baba_compra":100,
  "kg_segunda":5
}'
{"id":"b3f6836d-d844-457e-89aa-f7334e3e8fa6","codigo":"L001","fecha_compra":"2026-02-13T00:00:00.000Z","kg_baba_compra":"100.00","kg_segunda":"5.00","estado":"INGRESADO","kg_neto_final":null,"rendimiento":null,"stock_actual":"0.00","created_by":null,"created_at":"2026-02-13T07:55:03.320Z"}

creacion de cata, devuelve lostokens 
curl -X POST http://localhost:3000/cata/35d5aa9b-33c7-419b-aec7-19e6442cece6/crear \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZDFjNjlkMi1kNjhhLTQwOGEtOTZlNS1jOGI4YTY3ZTMzOTAiLCJlbWFpbCI6ImFkbWluQGNhY2FvLmNvbSIsInJvbCI6IkFETUlOIiwiaWF0IjoxNzcxMDQ0NTgxLCJleHAiOjE3NzEwNDgxODF9.JzUNgGsc3A_l8KDl5WL1nmuy2rIRkaYwdknr8pdcwO0" \
-H "Content-Type: application/json" \
-d '{
  "tipo":"NORMAL",
  "total_catadores":2
}'



1️⃣ ¿Qué es realmente un Lote Derivado?

existen:

Lotes Productivos → pasan por proceso completo → ALMACEN

Luego en almacén tienes stock.

Y además:

Tomar stock de uno o varios lotes base
Crear un nuevo lote consolidado (derivado)
Ese nuevo lote tendrá su propio stock
Un lote derivado puede subdividirse en otros derivados![![alt text](imagen-1.png)](imagen.png)
