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
