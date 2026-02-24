# 📊 Módulo de Gestión de Ventas Públicas - Frontend

## ¿Qué es?

Módulo completo para que los admins confirmen pagos de clientes que compran desde la web pública. Integra todos los endpoints del backend para:

- ✅ Listar ventas pendientes y abonadas
- ✅ Ver detalles completos de cada venta
- ✅ Confirmar manualmente abonos cuando reciben el comprobante
- ✅ Cancelar ventas si es necesario
- ✅ Ver estadísticas en tiempo real

---

## 📁 Estructura de Archivos Creados

```
src/
├── types/
│   └── ventasPublicas.ts          ← Tipos e interfaces
├── lib/
│   └── ventasPublicasApi.ts       ← Servicio API
├── components/ventasPublicas/
│   ├── ListaVentasPublicas.tsx    ← Lista de ventas con filtros
│   ├── DetalleVentaPublica.tsx    ← Detalle y confirmación
│   └── EstadisticasVentasPublicas.tsx ← KPIs y gráficos
├── app/ventas-publicas/
│   └── page.tsx                   ← Página principal del módulo
└── app/dashboard/page.tsx         ← Dashboard actualizado
```

---

## 🎨 Componentes Principales

### 1. **ListaVentasPublicas.tsx**
Muestra todas las ventas con:
- Filtros dinámicos por rifa y cliente
- Estado visual de cada venta
- Montos pagados vs totales
- Click para ver detalles

### 2. **DetalleVentaPublica.tsx**
Detalle completo con:
- Información del cliente (nombre, teléfono, email, dirección, ID)
- Boletas seleccionadas con estados
- Resumen de montos en tarjeta destacada
- **Lista de abonos pendientes de confirmación**
- Botones para:
  - ✅ Confirmar pago individual
  - ❌ Cancelar venta completa

### 3. **EstadisticasVentasPublicas.tsx**
Dashboard de KPIs con:
- Total de ventas (general)
- Ventas pagadas, abonadas, pendientes
- Saldo total pendiente
- Montos totales en ventas
- % de cobranza
- Tabla desagregada por rifa

---

## 🔄 Flujo de Uso

### Para el Admin:

```
1. Accede a Dashboard → Click en "Ventas Públicas"
   ↓
2. Ve las ventas PENDIENTES + ABONADAS por defecto
   ↓
3. Filtra por rifa o nombre de cliente (opcional)
   ↓
4. Selecciona una venta para ver detalles
   ↓
5. Verifica los datos del cliente en el formulario
   ↓
6. Verifica que el cliente haya pagado en Nequi/Banco
   ↓
7. Copia el monto y fecha de la transacción
   ↓
8. Click en "✅ Confirmar" en el abono correspondiente
   ↓
9. Sistema actualiza automáticamente:
   - Abono → CONFIRMADO
   - Boleta → PAGADA
   - Si todas pagadas → Venta → PAGADA
```

---

## 🔗 Endpoints Utilizados

Todos los endpoints están protegidos con JWT token (Bearer):

```
GET    /api/admin/dashboard/ventas-publicas
       Obtener todas las ventas (con filtros opcionales)

GET    /api/admin/dashboard/ventas-publicas/pendientes
       Obtener solo pendientes + abonadas

GET    /api/admin/dashboard/ventas-publicas/:ventaId
       Obtener detalles completos

POST   /api/admin/dashboard/abonos/:abonoId/confirmar
       Confirmar un abono

POST   /api/admin/dashboard/ventas-publicas/:ventaId/cancelar
       Cancelar venta completa

GET    /api/admin/dashboard/estadisticas
       Stats generales

GET    /api/admin/dashboard/estadisticas/por-rifa
       Stats por rifa
```

---

## 🎯 Estados y Colores

### Estados de Venta
| Estado | Color | Significado |
|--------|-------|------------|
| PAGADA | 🟢 Verde | Pago completo confirmado |
| ABONADA | 🟡 Amarillo | Pago parcial recibido |
| PENDIENTE | 🔵 Azul | Sin pago aún |
| CANCELADA | 🔴 Rojo | Cancelada |

### Estados de Abono
| Estado | Color | Significado |
|--------|-------|------------|
| CONFIRMADO | 🟢 Verde | Admin verificó y confirmó |
| REGISTRADO | 🟠 Naranja | Esperando confirmación |
| ANULADO | 🔴 Rojo | Cancelado |

### Estados de Boleta (dentro del detalle)
| Estado | Significado |
|--------|------------|
| DISPONIBLE | Cliente puede comprar |
| ABONADA | Pago parcial recibido |
| PAGADA | Pago completo confirmado |
| CANCELADA | Cancelada |

---

## 💡 Características Principales

### ✅ Confirmación de Pagos
- Lista clara de abonos pendientes
- Botón verde para confirmar cada uno
- Estados visuales claros
- Confirmación con animación

### 🔍 Detección de Cambios
- Después de confirmar, página se recarga automáticamente
- Datos siempre actualizados
- Feedback visual inmediato

### 📊 Filtros Dinámicos
- Filtrar por nombre de rifa
- Filtrar por nombre de cliente
- Los filtros funcionan en tiempo real

### 📈 Estadísticas
- KPIs en tarjetas destacadas
- Tabla de detalles por rifa
- Cálculo de % de cobranza
- Totales actualizados en tiempo real

### 🎨 Diseño Consistente
- Colores acordes con otros módulos
- Iconos SVG inline
- Responsive (mobile, tablet, desktop)
- Gradientes y sombras sutiles

---

## 🧪 Pruebas Recomendadas

### 1. Test de Lista
```
1. Accede a /ventas-publicas
2. Verifica que carga la lista
3. Prueba los filtros
4. Cambia entre "Pendientes" y "Todas"
```

### 2. Test de Confirmación
```
1. Selecciona una venta
2. Verifica que carga detalles
3. Haz click en "✅ Confirmar"
4. Verifica que se actualice el estado
```

### 3. Test de Cancelación
```
1. Selecciona una venta (preferiblemente PENDIENTE)
2. Click en "❌ Cancelar Venta"
3. Confirma en el dialog
4. Verifica que regrese a la lista
```

### 4. Test de Estadísticas
```
1. Click en "📈 Estadísticas"
2. Verifica que cargue KPIs
3. Verifica tabla por rifa
4. Los totales deben coincidir
```

---

## 🛠️ Integración en Producción

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
```

### Permisos Requeridos
- El usuario debe tener rol: `SUPER_ADMIN` o `VENDEDOR`
- Token JWT válido en `localStorage.token`

### Headers Automáticos
El servicio `ventasPublicasApi` agrega automáticamente:
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 📋 Checklist de Verificación

- [x] Tipos TypeScript definidos
- [x] Servicio API completo
- [x] Componente ListaVentasPublicas
- [x] Componente DetalleVentaPublica
- [x] Componente EstadisticasVentasPublicas
- [x] Página /ventas-publicas
- [x] Integración en dashboard
- [x] Estilos consistent
- [x] Manejo de errores
- [x] Estados visuales

---

## 🚀 Próximos Pasos Opcionales

1. **Agregar Exportación de Datos**
   - Exportar ventas a CSV
   - Genera reportes PDF

2. **Notificaciones**
   - Avisar cuando hay nuevas ventas
   - WebSocket para actualizaciones en tiempo real

3. **Búsqueda Avanzada**
   - Filtrar por rango de fechas
   - Filtrar por monto
   - Búsqueda de teléfono exacta

4. **Descarga de Comprobante**
   - Generar PDF de venta
   - Enviar por email al cliente

5. **Reenvío Automático**
   - Notificar al cliente cuando se confirma
   - SMS o WhatsApp

---

## 🐛 Troubleshooting

### "No hay ventas que mostrar"
- Verifica que existan ventas en el backend
- Revisa los filtros aplicados
- Cambia a "Todas las Ventas" desde los tabs

### "Error cargando detalles"
- Verifica que el JWT token sea válido
- Revisa la consola del browser (F12)
- Intenta recargar la página

### "El estado no se actualiza después de confirmar"
- La página se recarga automáticamente (normal)
- Espera 1.5 segundos
- Si no actualiza, recarga manualmente

### "Botón de confirmar está deshabilitado"
- El abono ya está CONFIRMADO
- O la venta fue CANCELADA
- Verifica el estado del abono

---

## 📞 Documentación Relacionada

Consulta también:
- Backend: `API_DOCUMENTATION.md`
- Tipos: `src/types/ventasPublicas.ts`
- Servicio: `src/lib/ventasPublicasApi.ts`

---

## 👨‍💻 Código de Referencia

### Importar el servicio API
```typescript
import { ventasPublicasApi } from '@/lib/ventasPublicasApi'
```

### Usarlo en un componente
```typescript
const response = await ventasPublicasApi.getVentasPublicasPendientes()
if (response.success) {
  console.log(response.data)
}
```

---

## 📝 Notas

- Todos los montos se formatean como COP (pesos colombianos)
- Las fechas usan formato local (es-CO)
- El módulo es responsivo pero optimizado para screens ≥768px
- Los estilos usan Tailwind CSS (debe estar configurado en el proyecto)

---

**Creado:** 21 de Febrero, 2026
**Versión:** 1.0.0
**Estado:** ✅ Listo para Producción
