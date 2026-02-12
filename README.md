---

# 🟫 CICLO COMPLETO DEL LOTE

---

# 1️⃣ INGRESO A PLANTA

## 🎯 Qué representa

El nacimiento del lote dentro del sistema.

Un lote puede representar:

* Una compra
* O la unión de dos compras en un solo lote físico

---

## 📌 Se registra:

* Código secuencial único
* Fecha de compra
* Proveedor(es)
* Kg baba compra
* Kg segunda

---

## 📌 Estado:

```
INGRESADO
```

Aquí empieza la trazabilidad histórica.

El lote aún no tiene proceso activo.

---

# 2️⃣ FERMENTACIÓN

## 🎯 Inicio del proceso productivo técnico

Cuando el lote entra en fermentación:

Estado cambia a:

```
FERMENTACION
```

El lote:

* Se coloca en cajones
* Permanece varios días
* Se registran eventos

---

## 📌 Registro por EVENTOS

Cada acción en fermentación es un evento independiente.

No es un formulario único.
Es una secuencia de registros.

---

## 🔹 Tipos de eventos posibles

* Inicio
* Remoción (cantidad variable, no fija)
* Control
* Final (opcional)
* O marcar una remoción como última

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

## 🔹 Si hay prueba de corte:

Debe permitir:

* 📷 Adjuntar foto (obligatoria)
* 📝 Descripción (opcional)

Validación obligatoria:

Si pruebaCorte = true → foto requerida.

---

## 🔹 Finalización de fermentación

Hay dos formas:

1. Registrar un evento tipo FINAL
2. Marcar una remoción como última

Cuando eso ocurre:

Estado cambia a:

```
LISTO_PARA_SECADO
```

---

# 3️⃣ SECADO

## 🎯 Proceso pasivo dependiente del clima

Cuando el lote entra a secado:

Estado cambia a:

```
SECADO
```

---

## 📌 Se registra:

* Fecha inicio
* Hora inicio

Durante el secado:

* No hay eventos técnicos del lote.
* No se registran remociones.
* No se registran parámetros internos.

---

## 🌡 Temperatura ambiente

Se registra en sistema independiente.

Puede:

* Registrarse manualmente
* En el futuro, conectarse a sensor

No está obligatoriamente ligada al lote.
Solo se consulta cuando se necesite analizar.

---

## 📌 Finalización de secado

Se registra:

* Fecha fin
* Hora fin

Cuando termina:

Estado cambia a:

```
LISTO_PARA_ALMACEN
```

No entra automáticamente a almacén.
Es una transición logística.

---

# 4️⃣ ALMACÉN

Cuando el lote físicamente entra a almacén:

Estado cambia a:

```
ALMACEN
```

Aquí nace el inventario real.

---

## 📌 Se registra:

* Fecha
* Hora
* Sacos
* Kg Brutos

---

## 📌 El sistema calcula automáticamente:

```
kgNeto = kgBrutos - (sacos * 0.2)
rendimiento = (kgNeto / kgBabaCompra) * 100
```

El usuario no ingresa esos valores.
Son cálculo backend.

---

## 📌 Se genera:

```
stockActual = kgNeto
```

A partir de aquí el lote es inventario dinámico.

---

# 5️⃣ ANÁLISIS FÍSICO DE MUESTRA

Solo disponible cuando:

Estado = ALMACEN

---

## 📌 Puede haber múltiples análisis por lote.

Cada análisis registra:

* Fecha
* Peso muestra (gramos)
* Humedad
* Defectos físicos (detalle flexible)
* Prueba de corte (si aplica)
* Foto
* Descripción

---

## 📌 Cada análisis descuenta stock:

```
stockActual -= pesoMuestra / 1000
```

El kgNeto original NO cambia.
Solo stockActual.

---

# 6️⃣ CATA

Puede:

* Estar vinculada a un análisis
* O ser independiente
* Registrarse el mismo día
* O semanas después

Puede haber múltiples catas por lote.

No cambia estado.
No afecta stock.

Sirve para evaluación sensorial.

---

# 🟤 ESTADOS COMPLETOS DEL LOTE

```
INGRESADO
LISTO_PARA_FERMENTACION
FERMENTACION
LISTO_PARA_SECADO
SECADO
LISTO_PARA_ALMACEN
ALMACEN
```

Una vez en ALMACEN:

El lote permanece ahí hasta agotar stock.

No cambia más de estado productivo.

---

# 🧠 Conceptualmente tu sistema es:

Un sistema de:

* Trazabilidad por lote
* Control técnico de proceso
* Control logístico
* Control de inventario
* Control de calidad
* Base para análisis climático futuro

---

# 🔥 Lo más importante

Cada etapa:

* Tiene reglas claras
* Tiene transición controlada
* No hay saltos automáticos incorrectos
* No hay cálculos manuales peligrosos
* El stock es dinámico
* La trazabilidad es histórica

---

# 🟫 SCRIPT COMPLETO — SISTEMA CACAO (PostgreSQL)

-- ==========================================
-- SISTEMA DE TRAZABILIDAD CACAO
-- VERSION ACTUALIZADA CON CATA DISTRIBUIDA
-- PostgreSQL
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 1. ENUM ESTADO LOTE
-- ================================
CREATE TYPE estado_lote AS ENUM (
    'INGRESADO',
    'LISTO_PARA_FERMENTACION',
    'FERMENTACION',
    'LISTO_PARA_SECADO',
    'SECADO',
    'LISTO_PARA_ALMACEN',
    'ALMACEN'
);

-- ================================
-- 2. LOTES
-- ================================
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    fecha_compra DATE NOT NULL,
    kg_baba_compra NUMERIC(10,2) NOT NULL CHECK (kg_baba_compra > 0),
    kg_segunda NUMERIC(10,2) DEFAULT 0 CHECK (kg_segunda >= 0),
    estado estado_lote NOT NULL,
    kg_neto_final NUMERIC(10,2),
    rendimiento NUMERIC(5,2),
    stock_actual NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 3. PROVEEDORES
-- ================================
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE lote_proveedores (
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id),
    PRIMARY KEY (lote_id, proveedor_id)
);

-- ================================
-- 4. FERMENTACION EVENTOS
-- ================================
CREATE TABLE fermentacion_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    cajon VARCHAR(50),
    brix NUMERIC(5,2),
    ph_pepa NUMERIC(4,2),
    ph_pulpa NUMERIC(4,2),
    temperatura_interna NUMERIC(5,2),
    temperatura_ambiente NUMERIC(5,2),
    es_remocion BOOLEAN DEFAULT FALSE,
    es_ultima_remocion BOOLEAN DEFAULT FALSE,
    prueba_corte BOOLEAN DEFAULT FALSE,
    foto_url TEXT,
    descripcion_prueba TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 5. SECADO
-- ================================
CREATE TABLE secados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID UNIQUE REFERENCES lotes(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_fin DATE,
    hora_fin TIME,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 6. ALMACEN
-- ================================
CREATE TABLE almacenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID UNIQUE REFERENCES lotes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    sacos INTEGER NOT NULL CHECK (sacos > 0),
    kg_brutos NUMERIC(10,2) NOT NULL CHECK (kg_brutos > 0),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 7. ANALISIS MUESTRAS
-- ================================
CREATE TABLE analisis_muestras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    peso_muestra_gramos NUMERIC(8,2) NOT NULL CHECK (peso_muestra_gramos > 0),
    humedad NUMERIC(5,2),
    foto_url TEXT,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 8. ANALISIS DEFECTOS
-- ================================
CREATE TABLE analisis_defectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analisis_id UUID REFERENCES analisis_muestras(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    gramos NUMERIC(8,2),
    porcentaje NUMERIC(5,2)
);

-- ================================
-- 9. SESIONES DE CATA
-- ================================
CREATE TABLE sesiones_cata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'ABIERTA',
    cantidad_catadores INTEGER NOT NULL CHECK (cantidad_catadores > 0),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 10. LINKS DE CATA (TOKEN UNICO)
-- ================================
CREATE TABLE cata_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesion_id UUID REFERENCES sesiones_cata(id) ON DELETE CASCADE,
    token VARCHAR(120) UNIQUE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    fecha_uso TIMESTAMP
);

-- ================================
-- 11. EVALUACIONES DE CATADORES
-- ================================
CREATE TABLE evaluaciones_catador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesion_id UUID REFERENCES sesiones_cata(id) ON DELETE CASCADE,
    link_id UUID REFERENCES cata_links(id),
    nombre_catador VARCHAR(100),
    aroma NUMERIC(4,2),
    sabor NUMERIC(4,2),
    acidez NUMERIC(4,2),
    amargor NUMERIC(4,2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 12. TEMPERATURA AMBIENTE
-- ================================
CREATE TABLE temperatura_ambiente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    temperatura NUMERIC(5,2) NOT NULL,
    fuente VARCHAR(20) DEFAULT 'MANUAL',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- INDICES
-- ================================
CREATE INDEX idx_lotes_estado ON lotes(estado);
CREATE INDEX idx_fermentacion_lote ON fermentacion_eventos(lote_id);
CREATE INDEX idx_analisis_lote ON analisis_muestras(lote_id);
CREATE INDEX idx_sesion_lote ON sesiones_cata(lote_id);
CREATE INDEX idx_links_sesion ON cata_links(sesion_id);
CREATE INDEX idx_eval_sesion ON evaluaciones_catador(sesion_id);
CREATE INDEX idx_temp_fecha ON temperatura_ambiente(fecha);

Perfecto.
Ahora sí vamos a hacer una **documentación técnica formal completa de la base de datos**, pensada para que un DBA o desarrollador backend la entienda sin ver el código fuente.

Voy a estructurarla como documento profesional.

---

# 📘 DOCUMENTACIÓN TÉCNICA

# Base de Datos – Sistema de Trazabilidad de Producción de Cacao

---

# 1️⃣ Descripción General

La base de datos está diseñada en **PostgreSQL** bajo un modelo relacional orientado a:

* Trazabilidad completa por lote
* Control de estados del proceso productivo
* Registro técnico de fermentación y secado
* Gestión logística e inventario
* Control de calidad físico
* Evaluación sensorial distribuida
* Soporte para consultas administrativas
* Escalabilidad futura

El sistema está centrado en la entidad principal:

```
LOTE
```

Todas las demás entidades dependen directa o indirectamente de ella.

---

# 2️⃣ Modelo Conceptual General

```
Lote
 ├── Proveedores (N:N)
 ├── FermentacionEventos (1:N)
 ├── Secado (1:1)
 ├── Almacen (1:1)
 ├── AnalisisMuestras (1:N)
 │      └── AnalisisDefectos (1:N)
 ├── SesionesCata (1:N)
 │      ├── CataLinks (1:N)
 │      └── EvaluacionesCatador (1:N)
 └── TemperaturaAmbiente (consulta independiente)
```

---

# 3️⃣ Estados del Lote

Se implementa un ENUM llamado `estado_lote`.

Valores posibles:

* INGRESADO
* LISTO_PARA_FERMENTACION
* FERMENTACION
* LISTO_PARA_SECADO
* SECADO
* LISTO_PARA_ALMACEN
* ALMACEN

El campo `lotes.estado` almacena el estado actual del lote.

Las transiciones de estado se gestionan a nivel de backend.

---

# 4️⃣ Definición de Entidades

---

## 4.1 LOTES

Entidad central del sistema.

### Propósito

Representa una unidad productiva de cacao desde su ingreso hasta su agotamiento en almacén.

### Campos relevantes

| Campo          | Tipo          | Descripción                    |
| -------------- | ------------- | ------------------------------ |
| id             | UUID          | Identificador único            |
| codigo         | VARCHAR       | Código secuencial único        |
| fecha_compra   | DATE          | Fecha de adquisición           |
| kg_baba_compra | NUMERIC(10,2) | Peso inicial en baba           |
| kg_segunda     | NUMERIC(10,2) | Peso de segunda calidad        |
| estado         | estado_lote   | Estado actual                  |
| kg_neto_final  | NUMERIC(10,2) | Peso neto calculado en almacén |
| rendimiento    | NUMERIC(5,2)  | Rendimiento porcentual         |
| stock_actual   | NUMERIC(10,2) | Stock dinámico disponible      |
| created_at     | TIMESTAMP     | Fecha de creación              |

---

## 4.2 PROVEEDORES

### Propósito

Permitir que un lote esté asociado a uno o más proveedores.

Relación N:N implementada mediante tabla intermedia `lote_proveedores`.

---

## 4.3 FERMENTACION_EVENTOS

### Propósito

Registrar eventos técnicos durante la etapa de fermentación.

Un lote puede tener múltiples eventos.

### Información almacenada

* Fecha y hora
* Tipo de evento
* Cajón
* °Brix
* pH pepa
* pH pulpa
* Temperatura interna
* Temperatura ambiente (manual)
* Indicador de remoción
* Indicador de última remoción
* Indicador de prueba de corte
* URL de imagen
* Descripción opcional

Regla funcional:
Si `es_ultima_remocion = TRUE`, el lote pasa a LISTO_PARA_SECADO.

---

## 4.4 SECADOS

### Propósito

Registrar el periodo de secado del lote.

Relación 1:1 con lotes.

### Campos

* Fecha inicio
* Hora inicio
* Fecha fin
* Hora fin

Al completarse, el lote pasa a LISTO_PARA_ALMACEN.

---

## 4.5 ALMACENES

### Propósito

Registrar ingreso del lote a inventario físico.

Relación 1:1 con lotes.

### Datos registrados

* Fecha
* Hora
* Sacos
* Kg brutos

### Cálculos derivados (gestionados en backend)

```
kg_neto = kg_brutos - (sacos * 0.2)
rendimiento = (kg_neto / kg_baba_compra) * 100
stock_actual = kg_neto
```

El estado cambia a ALMACEN.

---

## 4.6 ANALISIS_MUESTRAS

### Propósito

Registrar análisis físicos de calidad.

Relación 1:N con lotes.

### Campos

* Fecha
* Peso muestra en gramos
* Humedad
* Foto
* Descripción

Impacto en inventario:

```
stock_actual -= peso_muestra_gramos / 1000
```

---

## 4.7 ANALISIS_DEFECTOS

Permite registrar defectos asociados a un análisis.

Relación 1:N con analisis_muestras.

Modelo flexible que permite agregar nuevos tipos de defecto sin alterar estructura.

---

## 4.8 SESIONES_CATA

### Propósito

Representa una sesión formal de evaluación sensorial de un lote.

Relación 1:N con lotes.

Campos:

* lote_id
* estado (ABIERTA / CERRADA)
* cantidad_catadores
* created_at

---

## 4.9 CATA_LINKS

### Propósito

Generar enlaces únicos para cada catador.

Relación 1:N con sesiones_cata.

Campos:

* token único
* usado (boolean)
* fecha_uso

Garantiza:

* Un envío por enlace
* No requiere autenticación
* Control de uso

---

## 4.10 EVALUACIONES_CATADOR

### Propósito

Registrar evaluación individual de cada catador.

Relación 1:N con sesiones_cata.

Campos:

* nombre_catador
* aroma
* sabor
* acidez
* amargor
* observaciones
* created_at

No afecta estado ni inventario.

---

## 4.11 TEMPERATURA_AMBIENTE

### Propósito

Registrar temperatura ambiental independiente del lote.

Campos:

* Fecha
* Hora
* Temperatura
* Fuente (MANUAL / futuro SENSOR)

Se consulta por rango de fechas para análisis de secado.

---

# 5️⃣ Integridad y Restricciones

* Uso de UUID como PK
* Foreign keys con ON DELETE CASCADE
* Checks para valores numéricos positivos
* ENUM para estados de lote
* Índices en campos críticos de consulta

---

# 6️⃣ Índices Implementados

Optimización para:

* Búsqueda por estado
* Consulta por lote
* Consulta por sesión de cata
* Consulta por fecha de temperatura

---

# 7️⃣ Consideraciones de Escalabilidad

El modelo permite:

* Multi-planta (añadiendo entidad planta)
* Movimientos de inventario
* Ventas parciales
* Dashboard analítico
* Integración IoT
* Exportación de reportes
* Auditoría avanzada

---

# 8️⃣ Resumen Técnico Final

La base de datos implementa un modelo relacional orientado a:

* Control completo del ciclo productivo
* Trazabilidad técnica y logística
* Gestión de inventario dinámico
* Evaluación sensorial distribuida
* Consultas administrativas avanzadas

El diseño prioriza:

* Integridad referencial
* Escalabilidad
* Separación de responsabilidades
* Flexibilidad futura
* Consistencia de datos

---
