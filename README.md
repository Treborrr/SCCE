# 📘 CICLO DEFINITIVO DEL LOTE

## Sistema de Trazabilidad de Producción de Cacao

---

# 🟫 1️⃣ INGRESO A PLANTA

## 🎯 Propósito

Representa el nacimiento formal del lote dentro del sistema.

Un lote puede representar:

* Una compra individual
* La unión de dos compras consolidadas en un solo lote físico

---

## 📌 Datos que se registran

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

Aquí comienza la trazabilidad histórica.
El lote aún no entra en proceso productivo.

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

La fermentación no es un formulario único.
Es una secuencia de eventos independientes.

Cada acción genera un registro.

---

## 🔹 Tipos de eventos

* Inicio
* Remoción (cantidad variable, no fija)
* Control
* Final

🔴 Importante:
Una remoción **ya no puede** ser el evento final.
El cierre de fermentación solo ocurre con un evento tipo `FINAL`.

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

## 🔹 Si hay prueba de corte

Debe permitir:

* 📷 Foto (opcional y editable posteriormente)
* 📝 Descripción (opcional y editable posteriormente)

No es obligatoria en el momento del registro.

---

## 🔹 Finalización de fermentación

Solo ocurre cuando se registra un evento tipo:

```
FINAL
```

Cuando eso ocurre:

* La fermentación termina
* El lote entra inmediatamente a secado
* Se elimina el estado “LISTO_PARA_SECADO”

---

# 🟫 3️⃣ SECADO

## 🎯 Proceso pasivo dependiente del clima

Cuando termina fermentación:

Estado cambia automáticamente a:

```
SECADO
```

No existe un estado intermedio.

---

## 📌 Inicio de secado

* Fecha inicio = fecha fin de fermentación (automática)
* Hora inicio = hora del evento final

---

## 📌 Durante secado

* No existen eventos técnicos del lote
* No se registran remociones
* No se registran parámetros internos

Es un proceso pasivo.

---

## 🌡 Temperatura ambiente

Se gestiona en sistema independiente.

Puede:

* Registrarse manualmente
* Conectarse a sensor en el futuro

No está vinculada obligatoriamente al lote.
Solo se consulta para análisis histórico.

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

---

# 🟫 4️⃣ ALMACÉN

Cuando el lote físicamente entra a almacén:

Estado cambia a:

```
ALMACEN
```

Aquí nace el inventario real.

---

## 📌 Datos que se registran

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

# 🟫 5️⃣ MUESTRAS (Nueva Entidad Central de Calidad)

🔴 Cambio importante en tu modelo:

Ahora la muestra es la entidad que descuenta stock.

---

## 🎯 Propósito

Representa una extracción física de cacao desde el lote.

Un lote puede tener múltiples muestras.

Cada muestra:

* Tiene un peso específico
* Descuenta del stock
* Es la base para análisis y cata

---

## 📌 Registro de muestra

El usuario registra:

* Fecha
* Peso muestra (gramos)

Al guardarse:

```
stockActual -= pesoMuestra / 1000
```

Solo se descuenta al crear la muestra.

---

# 🟫 6️⃣ ANÁLISIS FÍSICO

## 🎯 Dependencia

Un análisis físico pertenece a una muestra.

Relación:

```
Lote
  → Muestras
      → Análisis físicos
```

---

## 📌 Datos del análisis físico

* Fecha
* Humedad
* Defectos físicos (estructura flexible)
* Prueba de corte (si aplica)
* Foto
* Descripción

No descuenta stock (eso ya lo hizo la muestra).

---

# 🟫 7️⃣ CATA

## 🎯 Dependencia

La cata pertenece a una muestra.

Es independiente del análisis físico.

Puede existir:

* Con análisis físico
* Sin análisis físico

Relación:

```
Lote
  → Muestras
      → Catas
```

---

## 📌 Características

* Puede registrarse el mismo día
* Puede registrarse semanas después
* Puede haber múltiples catas por muestra
* No cambia estado
* No afecta stock

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

Una vez en ALMACEN:

* Permanece ahí hasta agotar stock
* No cambia más de estado productivo

---

# 🧠 SISTEMA CONCEPTUAL FINAL

Tu sistema ahora es:

Un sistema integral de:

* Trazabilidad por lote
* Control técnico de fermentación
* Control pasivo de secado
* Control logístico de almacén
* Gestión de inventario dinámico
* Gestión de muestras físicas
* Control de calidad técnico
* Evaluación sensorial
* Base para análisis climático futuro

---

# 🧩 Modelo limpio simplificado

```
Lote
 ├── FermentacionEventos
 ├── Secado
 ├── Almacen
 ├── Muestras
 │     ├── AnalisisFisico
 │     └── Cata
 └── TemperaturaAmbiente (externo)
```

