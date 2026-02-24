# API Reference for Reportes

Este documento consolida todas las APIs usadas en el frontend que son relevantes para el módulo de `reportes`. Incluye descripción, métodos, dónde se usan en el repo y recomendaciones de uso para los reportes.

---

## Endpoints principales

- **GET /api/rifas**
  - Descripción: Lista todas las rifas.
  - Uso en el repo: `rifaApi.getRifas()` — [src/lib/rifaApi.ts](src/lib/rifaApi.ts)
  - Páginas/components que lo llaman: [src/app/rifas/page.tsx](src/app/rifas/page.tsx), [src/app/reportes/page.tsx](src/app/reportes/page.tsx), [src/app/ventas/page.tsx](src/app/ventas/page.tsx).
  - Útil para: poblar listados y filtros de rifa en el reportes.

- **GET /api/rifas/:id**
  - Descripción: Detalle de una rifa.
  - Uso: `rifaApi.getRifaById()` — [src/lib/rifaApi.ts](src/lib/rifaApi.ts)
  - Útil para: metadatos de rifa (nombre, fecha de sorteo, estado) en los reportes.

- **GET /api/rifas/:id/stats**
  - Descripción: Estadísticas agregadas de la rifa (si el backend las provee).
  - Uso: `rifaApi.getRifaStats()` / `ventasApi.getRifaStats()` (implementado en ambos clientes) — [src/lib/rifaApi.ts](src/lib/rifaApi.ts), [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Útil para: métricas pre-aggregadas (totales, venta neta, boletas vendidas) — de alto valor para dashboards.

---

## Boletas

- **GET /api/boletas/rifa/:rifaId/full-status**
  - Descripción: Devuelve todas las boletas de la rifa con estado detallado (vendida, disponible, bloqueada, etc.).
  - Uso: `boletaApi.getBoletasByRifa()` — [src/lib/boletaApi.ts](src/lib/boletaApi.ts)
  - Llamado desde: [src/app/boletas/ver/page.tsx](src/app/boletas/ver/page.tsx), [src/app/reportes/page.tsx](src/app/reportes/page.tsx).
  - Útil para: conteos por estado, reconstrucción de ventas (cuando `/ventas` no está disponible), series temporales a nivel de boleta.

- **GET /api/boletas/rifa/:rifaId** (variante usada en `ventasApi.getBoletasDisponibles`)
  - Descripción: Endpoint que devuelve boletas disponibles por rifa (según implementación backend).
  - Uso: `ventasApi.getBoletasDisponibles()` — [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Útil para: KPI de stock disponible en reportes y listados.

- **GET /api/boletas/:boletaId**
  - Descripción: Detalle de una boleta.
  - Uso: `boletaApi.getBoletaById()` — [src/lib/boletaApi.ts](src/lib/boletaApi.ts)
  - Llamado desde: [src/app/boletas/[id]/page.tsx](src/app/boletas/[id]/page.tsx), impresiones.
  - Útil para: unir venta ↔ boleta, inspección puntual en reportes.

- **POST /api/rifas/:rifaId/generate-boletas**
  - Descripción: Genera boletas para una rifa.
  - Uso: `boletaApi.generarBoletas()` — [src/lib/boletaApi.ts](src/lib/boletaApi.ts)
  - Útil para: auditoría de cambios de stock, no directo en visualización de reportes.

---

## Ventas

- **POST /api/ventas**
  - Descripción: Crear una nueva venta (incluye boletas, cliente, método de pago, totales).
  - Uso: `ventasApi.crearVenta()` — [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Llamado desde: [src/components/ventas/CarritoVentas.tsx](src/components/ventas/CarritoVentas.tsx)
  - Útil para: registrar ingresos; fuente primaria de `venta_id`, `metodo_pago`, `fecha`, `total_venta`.

- **GET /api/ventas/rifa/:rifaId**
  - Descripción: Obtener ventas asociadas a una rifa (detalle por venta).
  - Uso: `ventasApi.getVentasPorRifa()` — [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Llamado desde: [src/app/reportes/page.tsx](src/app/reportes/page.tsx)
  - IMPORTANTE: el backend en este proyecto valida `rifa_id` como numérico en algunas rutas; si `rifa.id` en frontend es UUID, la llamada puede devolver 400. Verificar contrato (numérico vs UUID).
  - Útil para: series temporales de ventas, ingresos por rifa, análisis por método de pago, ventas por cliente.

---

## Bloqueos y control de venta (operacional)

- **POST /api/boletas/:boletaId/block**
  - Descripción: Bloqueo temporal de boleta para compra.
  - Uso: `ventasApi.bloquearBoleta()` — [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Llamado desde: [src/components/ventas/SelectorBoletas.tsx](src/components/ventas/SelectorBoletas.tsx)
  - Útil para: métricas de intentos de compra, tiempo de reserva, abandono.

- **GET /api/boletas/:boletaId/check-block?reserva_token=...**
  - Descripción: Verificar validez de un bloqueo.
  - Uso: `ventasApi.verificarBloqueo()` — [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Útil para: medir expiraciones y tasa de conversión por reserva.

- **POST /api/boletas/:boletaId/unblock**
  - Descripción: Desbloquear boleta.
  - Uso: `ventasApi.desbloquearBoleta()` — [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Útil para: analizar liberaciones y re-disponibilidad.

- **PUT /api/boletas/:boletaId**
  - Descripción: Actualizar estado de boleta (p.ej. marcar como vendida, asignar `venta_id`).
  - Uso: `ventasApi.actualizarEstadoBoleta()` — [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Útil para: seguimiento de cambios de estado y auditoría.

---

## Clientes / Usuario

- **POST /api/auth/login**
  - Descripción: Autenticación — devuelve `token` y `user`.
  - Uso: [src/app/login/page.tsx](src/app/login/page.tsx), [src/components/ui/PasswordConfirmDialog.tsx](src/components/ui/PasswordConfirmDialog.tsx)
  - Útil para: obtener `token` necesario para llamadas autenticadas.

- **/api/clientes** (GET/POST/PUT/DELETE) y **/api/clientes/search?q=...** / **/api/clientes/cedula/:cedula**
  - Descripción: CRUD y búsqueda de clientes.
  - Uso: `clienteApi` / `ventasApi.buscarCliente*` — [src/lib/clienteApi.ts](src/lib/clienteApi.ts), [src/lib/ventasApi.ts](src/lib/ventasApi.ts)
  - Útil para: segmentación en reportes, top clientes, cohortes.

---

## Helpers y utilidades del frontend

- `ventasApi.bloquearBoletaConReintentos`, `verificarBloqueoPeriodico`, `liberarBloqueosMultiples`
  - No son endpoints nuevos, pero orquestan llamadas a los endpoints de boletas y proporcionan telemetría operacional (reintentos, fallos, tiempos).
  - Uso en: `src/components/ventas/*`.

---

## Recomendaciones para `reportes`

- Priorizar llamadas a (en este orden):
  1. `/api/ventas/rifa/:rifaId` — para series y detalles por venta.
 2. `/api/rifas/:id/stats` o `/api/boletas/rifa/:rifaId/stats` — si existen estadísticas pre-aggregadas las usarás para rendimiento.
 3. `/api/boletas/rifa/:rifaId/full-status` — para conteos por estado y reconstrucción cuando falte `/ventas`.

- Campos útiles a extraer en cada entidad:
  - Venta: `id`, `created_at`/`fecha`, `total_venta`, `metodo_pago`, `cliente_id`, `boletas[]`.
  - Boleta: `id`, `numero`, `estado`, `venta_id`, `reserva_token`, `updated_at`.
  - Rifa: `id`, `nombre`, `fecha_sorteo`, `estado`, `total_boletas`.
  - Cliente: `id`, `nombre`, `email`, `identificacion`.

- Contrato crítico: confirma si `rifa_id` para `/api/ventas/rifa/:rifaId` debe ser numérico o puede ser UUID. Si backend exige número, el frontend debe mapear o usar el campo numérico; en tanto, `full-status` de boletas puede usarse como fallback.

---

## Ejemplos rápidos de uso (cliente frontend)

```ts
// Obtener rifas
const rifas = await rifaApi.getRifas()

// Obtener boletas con estado completo para una rifa
const boletas = await boletaApi.getBoletasByRifa(rifaId)

// Intentar obtener ventas por rifa (manejar 400/404)
try {
  const ventas = await ventasApi.getVentasPorRifa(rifaId)
} catch (err) {
  // fallback: derivar ventas agrupando boletas por venta_id
}
```

---

