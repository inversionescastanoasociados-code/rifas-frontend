# 🎯 Casos de Uso - Módulo Ventas Públicas

## Caso 1: Admin Ve Venta Pendiente de Confirmación

**Pasos:**
1. Admin accede a `/dashboard`
2. Click en "Ventas Públicas"
3. Sistema carga lista de ventas PENDIENTES + ABONADAS
4. Admin ve:
   - ID de venta
   - Nombre del cliente
   - Rifa que compró
   - Montos total y pagado
   - Estado (ABONADA)

**Datos Mostrados:**
```
ID: 8f4a2b1c...
Cliente: Juan Pérez
Teléfono: 300 1234567
Rifa: Viaje Cartagena
Total: $100,000
Pagado: $50,000
Estado: ABONADA
```

---

## Caso 2: Admin Selecciona Venta para Confirmar

**Pasos:**
1. Admin hace click en una venta de la lista
2. Sistema carga detalles completos
3. Aparece modal con:
   - ✅ Información del cliente (datos completos)
   - 🎫 Boletas seleccionadas con estados
   - 💰 Resumen de montos
   - ✅ Lista de abonos pendientes
   - ❌ Opción de cancelar venta

**Información Mostrada:**
```
📋 CLIENTE
Nombre: Juan Pérez
Teléfono: 300 1234567
Email: juan@example.com
Identificación: 1.087.654.321
Dirección: Calle 10 #20-30

🎫 BOLETAS
#1 [ABONADA]
#2 [ABONADA]

💰 RESUMEN
Total: $100,000
Pagado: $50,000
Saldo: $50,000
Estado: ABONADA

✅ ABONOS PENDIENTES
Boleta #1 - $50,000 - Nequi - REGISTRADO [✅ Confirmar]
```

---

## Caso 3: Admin Verifica Comprobante en Nequi

**Escenario Real:**
1. Admin recibe notificación: "Nueva venta pública"
2. Abre el detalle de la venta
3. Lee el método de pago: "Nequi"
4. Lee el cliente: "Juan Pérez - 300 1234567"
5. Abre su app de Nequi
6. Busca en "Mis pagos recibidos"
7. Encuentra: "Juan Pérez - $50,000 - 2026-02-21 14:25"
8. Verifica que coincida:
   - ✅ Nombre del cliente
   - ✅ Monto ($50,000)
   - ✅ Fecha reciente

**Confirmación de Identidad:**
```
Nequi Recibido:
├─ De: 300 1234567 (Juan Pérez)
├─ Monto: $50,000
├─ Concepto: "Rifa Cartagena - Boletas #1, #2"
├─ Fecha: 21/02/2026 14:25
└─ Estado: ✅ Exitoso

Dashboard Frontend:
├─ Cliente: Juan Pérez
├─ Teléfono: 300 1234567
├─ Monto: $50,000
├─ Método: Nequi
└─ Boletas: #1, #2
```

---

## Caso 4: Admin Confirma el Pago

**Pasos:**
1. Admin hace click en botón "✅ Confirmar" del abono
2. Aparece spinner "Confirmando..."
3. Se envía petición: `POST /api/admin/dashboard/abonos/{abonoId}/confirmar`
4. Backend:
   - Valida la solicitud
   - Marca abono como CONFIRMADO
   - Actualiza boleta a PAGADA
   - Si todas pagadas → venta a PAGADA
5. Frontend:
   - Muestra mensaje de éxito
   - Recarga página automáticamente
6. Admin ve cambios:
   - Abono ahora: CONFIRMADO ✅
   - Boleta ahora: PAGADA ✅
   - Venta ahora: PAGADA ✅

**Secuencia de Estados:**
```
ANTES:
├─ Abono: REGISTRADO (naranja)
├─ Boleta: ABONADA (amarillo)
└─ Venta: ABONADA (amarillo)

↓ [Click ✅ Confirmar]

DESPUÉS:
├─ Abono: CONFIRMADO (verde) ✅
├─ Boleta: PAGADA (verde) ✅
└─ Venta: PAGADA (verde) ✅
```

---

## Caso 5: Abono Parcial (Compra de 50%)

**Escenario:**
- Cliente compra 2 boletas = $100,000 total
- Paga 50% = $50,000 de abono

**Sistema Crea:**
```
VENTA:
├─ ID: uuid-1
├─ Total: $100,000
├─ Pagado: $50,000
├─ Saldo: $50,000
└─ Estado: ABONADA

ABONOS:
├─ Abono #1
│  ├─ ID: uuid-abono-1
│  ├─ Boleta: #1
│  ├─ Monto: $50,000
│  ├─ Método: Nequi
│  └─ Estado: REGISTRADO
│
└─ Abono #2
   ├─ ID: uuid-abono-2
   ├─ Boleta: #2
   ├─ Monto: $50,000
   ├─ Método: Nequi
   └─ Estado: REGISTRADO
```

**Admin Confirma Primer Abono:**
```
1. Click en "✅ Confirmar" de Boleta #1
   ↓
2. Abono #1 → CONFIRMADO
   Boleta #1 → PAGADA
   Venta → ABONADA (sigue igual, faltan boletas)

3. Admin espera que cliente pague #2
   Cuando pague:
   ├─ Transacción bancaria del cliente
   ├─ Admin ve en Nequi
   └─ Confirma en dashboard

4. Click en "✅ Confirmar" de Boleta #2
   ↓
5. Abono #2 → CONFIRMADO
   Boleta #2 → PAGADA
   Venta → PAGADA ✅ (todas confirmadas)
```

---

## Caso 6: Cliente Cancela Compra

**Escenario:**
- Venta creada hace 2 horas
- Cliente comunicó que no va a pagar
- Admin necesita liberar las boletas

**Pasos:**
1. Admin abre detalle de venta
2. Hace scroll hasta abajo
3. Click en botón rojo "❌ Cancelar Venta"
4. Aparece confirmación: "¿Deseas cancelar? Se liberarán boletas"
5. Admin confirma
6. Sistema:
   - Venta → CANCELADA
   - Boletas → DISPONIBLE
   - Se libera bloqueo
7. Admin ve mensajes "✅ Venta cancelada y boletas liberadas"
8. Sistema regresa a lista

**Estado Final:**
```
ANTES:
├─ Venta: ABONADA
├─ Boleta #1: ABONADA
└─ Boleta #2: ABONADA

↓ [Click ❌ Cancelar]

DESPUÉS:
├─ Venta: CANCELADA ❌
├─ Boleta #1: DISPONIBLE ✅
└─ Boleta #2: DISPONIBLE ✅
```

---

## Caso 7: Admin Usa Filtros

**Escenario 1: Filtrar por Rifa**
1. Admin está viendo todas las ventas (80 total)
2. Escribe en "Filtrar por nombre de rifa": "Cartagena"
3. Sistema filtra automáticamente
4. Muestra solo 12 ventas de esa rifa
5. Admin puede confirmar solo ese grupo

**Escenario 2: Filtrar por Cliente**
1. Admin recibe llamada de cliente: "Soy Margarita Vargas"
2. Escribe en filtro "Filtrar por cliente": "Margarita"
3. Sistema muestra todas sus compras (2 riendas con 3 compras)
4. Admin puede ver historial rápidamente

---

## Caso 8: Admin Ve Estadísticas

**Acceso:**
1. Click en tab "📈 Estadísticas"
2. Aparecen KPIs como tarjetas:

```
┌─────────────────────────────────┐
│ Total Ventas     Pagadas  Abonadas │
│     45              20      18     │
│ Pendientes    Saldo Pendiente     │
│      7              $400,000      │
└─────────────────────────────────┘

┌──────────────────────────────────┐
│ Total en Ventas  Total Abonado  │
│  $2,250,000      $1,850,000     │
│ % de Cobranza: 82.2%           │
└──────────────────────────────────┘

┌──────────────────────────────────────┐
│ Rifa: Viaje Cartagena               │
│ Ventas: 25 | Clientes: 20           │
│ Total: $1,500,000 | Abonado: 80%    │
└──────────────────────────────────────┘
```

**Información Útil:**
- Admin ve rápido cuánto se ha cobrado
- Identifica cuál rifa recauda mejor
- Sabe cuánto saldo aún falta

---

## Caso 9: Error - Boleta Expirada

**Escenario:**
- Cliente compró hace 15 minutos
- Bloqueo se expira
- Admin intenta confirmar

**Qué Pasa:**
```
Backend detecta:
└─ Bloqueo expirado
   └─ Retorna error
      └─ Frontend muestra:
         "Error: Bloqueo expirado"

Admin debe:
1. Contactar al cliente
2. Si pagó: cliente puede recomprar
3. Si no pagó: se cancela automáticamente
```

---

## Caso 10: Error - Método de Pago No Reconocido

**Escenario:**
- Admin ve método: "Transferencia Bancaria"
- No está en la app del banco
- Pide comprobante al cliente

**Pasos:**
1. Admin pide foto de comprobante al cliente
2. Cliente envía captura del recibo
3. Admin verifica:
   - ✅ Monto correcto
   - ✅ Número de referencia (si aplica)
   - ✅ Nombre del banco
4. Admin hace click en "✅ Confirmar"
5. Sistema marca como confirmado

---

## Casos de Error - Manejo

### Error: "No hay ventas que mostrar"
**Causa:** Los filtros son muy restrictivos
**Solución:** Limpiar filtros o cambiar a "Todas las Ventas"

### Error: "Error cargando ventas"
**Causa:** Problema de conexión o token expirado
**Solución:** Recargar página, verificar token

### Error: "Error confiriendo pago"
**Causa:** El abono ya fue confirmado o ID inválido
**Solución:** Recargar y validar

---

## Resumen de Flujo Completo

```
CLIENTE en Web Pública:
1. Ve rifas activas
2. Selecciona boletas #1, #2
3. Ingresa datos personales
4. Selecciona pago de 50% = $50,000
5. Elige método: Nequi
6. Completa pago en Nequi
7. Recibe comprobante

↓ [Venta creada en sistema]

ADMIN en Dashboard:
1. Accede a Ventas Públicas
2. Ve venta ABONADA en la lista
3. Hace click para ver detalles
4. Verifica datos del cliente
5. Verifica comprobante en Nequi
6. Confirma el pago
7. Sistema actualiza todo

↓ [Confirmación de pago]

RESULTADO FINAL:
- Boletas #1, #2 → PAGADAS
- Venta → PAGADA
- Cliente recibe confirmación
- Admin ve venta en estadísticas
```

---

**Casos de Uso Documentados:** 21/Feb/2026
**Versión:** 1.0.0
