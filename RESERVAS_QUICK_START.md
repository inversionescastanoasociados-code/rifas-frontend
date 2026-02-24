# 🚀 Guía Rápida - Módulo de Reservas

## 🎯 Quick Start

### Para Vendedores

#### 1️⃣ Crear una Reserva
```
1. Ir a "Ventas" → "Nueva Venta"
2. Seleccionar Rifa
3. Seleccionar Boletas (ej: #0045, #0046, #0047)
4. Completar datos del cliente
5. En el carrito, seleccionar botón "📌 Reservar"
6. Configurar días de bloqueo (ej: 5 días)
7. Confirmar → ¡Reserva creada!
```

#### 2️⃣ Ver Mis Reservas

```
En "Nueva Venta":
1. Hacer click en "📌 Mis Reservas Activas" (expandir)
2. Se muestra lista de todas las reservas pendientes
3. Cada reserva muestra:
   - Rifa y cantidad de boletas
   - Tiempo restante en rojo (si es urgente)
   - Botones de acción
```

#### 3️⃣ Convertir a Venta

```
Desde "Mis Reservas":
1. Click en "✓ Convertir a Venta"
2. Elegir tipo:
   ├─ Completa: pago total (ej: $150,000)
   └─ Parcial: con abono (ej: paga $50,000 hoy, debe $100,000)
3. Seleccionar método de pago (Efectivo, Nequi, PSE, etc)
4. Confirmar → ¡Venta creada!
```

#### 4️⃣ Cancelar Reserva

```
Desde "Mis Reservas":
1. Click en "✕ Cancelar"
2. Ingresar motivo (ej: "Cliente cambió de opinión")
3. Confirmar → Boletas se liberan
```

---

## 📊 Estados y Transiciones

```
                     ┌─────────────┐
                     │   RESERVA   │
                     │   PENDIENTE │
                     └──────┬──────┘
                            │
                 ┌──────────┼──────────┐
                 │          │          │
        ┌────────▼────────┐ │ ┌───────▼────────┐
        │   CONVERTIDA    │ │ │   CANCELADA    │
        │   (con venta)   │ │ │ (liberada)     │
        └─────────────────┘ │ └────────────────┘
        (pago completo)     │
        (o con abono)       │
                            │
                   (tiempo expira)
                            │
                    ┌───────▼────────┐
                    │   EXPIRADA     │
                    │  (liberada auto)│
                    └────────────────┘
```

---

## 🎛️ Configuración

### Días de Bloqueo

```typescript
// En DialogoReserva.tsx - editar el rango de días:

// Slider actual (1-30 días):
<input
  type="range"
  min="1"
  max="30"    // ← CAMBIAR AQUÍ para permitir más/menos días
  value={diasBloqueo}
/>

// Botones rápidos (editar estos):
{[1, 3, 5, 7].map((dias) => (  // ← CAMBIAR días disponibles
  <button key={dias}>
    {dias}d
  </button>
))}
```

### Métodos de Pago (en CarritoVentas.tsx)

```typescript
<select value={medioPagoId}>
  <option value="d397d917-c0d0-4c61-b2b3-2ebfab7deeb7">
    Efectivo
  </option>
  <option value="af6e15fc-c52c-4491-abe1-20243af301c4">
    Nequi
  </option>
  {/* Agregar más métodos aquí */}
</select>
```

---

## 🔗 Implementación Técnica

### Flujo de Datos

```
┌─────────────────┐
│ DialogoReserva  │ (colecta info)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ ventasApi.crearReserva()    │
└────────┬────────────────────┘
         │ POST /api/ventas/reservar
         ▼
┌─────────────────────────────┐
│ Backend (gestiona bloqueos) │
└────────┬────────────────────┘
         │ 201 Created
         ▼
┌─────────────────┐
│ ReservaResponse │ (éxito)
└─────────────────┘
```

### Convertir Reserva

```
┌──────────────────────┐
│ MisReservas.tsx      │ (lista reservas)
└─────┬────────────────┘
      │ seleccionar reserva
      ▼
┌──────────────────────────┐
│ DialogoConvertirReserva  │
└─────┬────────────────────┘
      │ ventasApi.convertirReserva()
      │ POST /api/ventas/:id/convertir-reserva
      ▼
┌──────────────────────┐
│ Venta creada         │
│ (COMPLETA/ABONADA)   │
└──────────────────────┘
```

---

## 💥 Manejo de Errores

### Errores Comunes

```
1. "El monto de abono debe ser mayor a 0"
   → Significa que seleccionó "Parcial" pero no ingresó monto
   → Solución: Ingresar monto válido

2. "Complete la información del cliente"
   → Falta nombre o teléfono del cliente
   → Solución: Ir atrás y completar datos

3. "Error procesando la reserva"
   → Error de conexión o validación en backend
   → Solución: Reintentar o contactar soporte

4. "Bloqueo expirado"
   → Las boletas ya se liberaron por tiempo
   → Solución: Crear nueva reserva
```

---

## 📋 APIs Utilizadas

### Frontend → Backend

#### Crear Reserva
```json
POST /api/ventas/reservar
Authorization: Bearer {token}
Content-Type: application/json

{
  "rifa_id": "550e8400-e29b-41d4-a716-446655440000",
  "cliente": {
    "nombre": "Juan Pérez",
    "telefono": "3001234567",
    "email": "juan@email.com",
    "identificacion": "1023456789"
  },
  "boletas": ["uuid-1", "uuid-2", "uuid-3"],
  "dias_bloqueo": 5,
  "notas": "VIP - Urgente"
}

Response 201:
{
  "success": true,
  "data": {
    "reserva_id": "venta-uuid",
    "tipo": "RESERVA_FORMAL",
    "rifa_titulo": "Rifa Navidad",
    "cantidad_boletas": 3,
    "dias_bloqueo": 5,
    "bloqueo_hasta": "2026-02-26T14:30:00Z",
    "estado_venta": "PENDIENTE",
    "boletas_reservadas": [...]
  }
}
```

#### Convertir a Venta
```json
POST /api/ventas/{reserva_id}/convertir-reserva
Authorization: Bearer {token}

{
  "monto_total": 500000,
  "total_pagado": 250000,
  "medio_pago_id": "uuid-efectivo"
}

Response 200:
{
  "success": true,
  "data": {
    "venta_id": "uuid",
    "tipo": "VENTA_CONVERTIDA",
    "cantidad_boletas": 3,
    "monto_total": 500000,
    "total_pagado": 250000,
    "saldo_pendiente": 250000,
    "estado_venta": "ABONADA"
  }
}
```

#### Cancelar Reserva
```json
POST /api/ventas/{reserva_id}/cancelar-reserva
Authorization: Bearer {token}

{
  "motivo": "Cliente cambió de opinión"
}

Response 200:
{
  "success": true,
  "data": {
    "reserva_id": "uuid",
    "boletas_liberadas": 3,
    "estado_venta": "CANCELADA",
    "motivo": "Cliente cambió de opinión"
  }
}
```

---

## 🧪 Testing

### Escenarios de Prueba

```
✅ Caso 1: Creación exitosa de reserva
   → Seleccionar boletas → Reservar → Verificar en "Mis Reservas"

✅ Caso 2: Conversión a venta completa
   → Crear reserva → Convertir (pago total) → Verificar venta creada

✅ Caso 3: Conversión con abono
   → Crear reserva → Convertir (parcial) → Verificar saldo pendiente

✅ Caso 4: Cancelación
   → Crear reserva → Cancelar → Verificar boletas liberadas

✅ Caso 5: Expiración automática
   → Crear reserva → Esperar (simular) → Verificar se libera

✅ Caso 6: Múltiples reservas
   → Crear varias → Expandir "Mis Reservas" → Verificar todas se muestren
```

---

## 🔔 Integración Recomendada

### Notificaciones
```typescript
// Para avisarle al cliente que su reserva está por expirar:
// Agregar notificación en MisReservas cuando dias_restantes <= 1
```

### Reportes
```typescript
// Potencial métrica: Tasa de conversión reserva→venta
// = (reservas convertidas / reservas creadas) * 100
```

---

## 📞 Soporte

Para preguntas sobre la implementación, ver:
- `RESERVAS_IMPLEMENTACION.md` - Documentación técnica completa
- Archivos componentes comentados en `src/components/ventas/`
- Types en `src/types/ventas.ts`

**Contacto**: Equipo de desarrollo
