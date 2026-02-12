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

# 📄 SCRIPT COMPLETO — SISTEMA CACAO

```sql
-- ==========================================
-- SISTEMA INTEGRAL DE GESTION DE CACAO
-- PostgreSQL
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- DEFECTOS FISICOS

CREATE TABLE analisis_defectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analisis_id UUID REFERENCES analisis_fisico(id) ON DELETE CASCADE,
    tipo_defecto VARCHAR(150) NOT NULL,
    gramos NUMERIC(10,2),
    porcentaje NUMERIC(6,2)
);

-- DETALLE PRUEBA DE CORTE

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

-- MEZCLA DE MUESTRAS (ADMIN)

CREATE TABLE cata_mezcla_muestras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cata_id UUID REFERENCES catas(id) ON DELETE CASCADE,
    muestra_id UUID REFERENCES muestras(id)
);

-- ==========================================
-- LOTES DERIVADOS (LOGISTICOS)
-- ==========================================

CREATE TABLE lotes_derivados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    fecha_creacion DATE NOT NULL,
    stock_actual NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RELACION CON LOTES ORIGEN

CREATE TABLE lote_derivado_origen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_derivado_id UUID REFERENCES lotes_derivados(id) ON DELETE CASCADE,
    lote_origen_id UUID REFERENCES lotes(id),
    cantidad_kg NUMERIC(12,2) NOT NULL
);

-- SUBDIVISION DE LOTES DERIVADOS

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
```

---

# 🧠 Lo que este script ya soporta

✔ Producción completa
✔ Inventario dinámico
✔ Muestras con descuento real
✔ Análisis físico estructurado
✔ Prueba de corte detallada
✔ Cata profesional 0–10
✔ Mezcla de muestras
✔ Lotes derivados
✔ Subdivisión de lotes
✔ Trazabilidad en árbol
✔ Temperatura externa

---

