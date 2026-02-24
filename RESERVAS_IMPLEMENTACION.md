# 📌 Módulo de Reserva de Boletas - Implementación

## 🎯 Descripción General

Se ha implementado un sistema completo de **reserva de boletas** que permite bloquear boletas por un período configurable de tiempo, con la capacidad de convertir esas reservas en ventas o cancelarlas.

## 📦 Nuevos Archivos Creados

### 1. **Componentes UI**

#### `src/components/ventas/DialogoReserva.tsx`
- Diálogo modal para crear una nueva reserva
- Permite seleccionar días de bloqueo (1-30 días)
- Muestra resumen de boletas a reservar
- Botones rápidos para 1, 3, 5 y 7 días
- Estados: confirmación, procesando, completado, error

#### `src/components/ventas/DialogoConvertirReserva.tsx`
- Diálogo modal para convertir una reserva a venta
- Permite elegir entre:
  - **Venta Completa**: pago total
  - **Venta Parcial**: con abono inicial
- Muestra detalles de la reserva original
- Selector de método de pago
- Estados: confirmación, procesando, completado, error

#### `src/components/ventas/MisReservas.tsx`
- Componente para listar y gestionar reservas activas
- Muestra:
  - **Indicador de tiempo restante** (cambia color según urgencia)
  - **Detalles de la reserva** (ID, boletas, días de bloqueo, fecha de expiración)
  - **Botones de acción** (Convertir, Cancelar)
- Estadísticas en tiempo real
- Integración con `DialogoConvertirReserva` para conversión

### 2. **API Service**

#### Actualización de `src/lib/ventasApi.ts`
Se agregaron 5 nuevos métodos:

```typescript
// Crear una nueva reserva
async crearReserva(reservaData: ReservaRequest)

// Convertir una reserva a venta
async convertirReserva(reservaId: string, convertirData: ConvertirReservaRequest)

// Cancelar una reserva existente
async cancelarReserva(reservaId: string, cancelarData: CancelarReservaRequest)

// Obtener detalles de una reserva
async obtenerReserva(reservaId: string)

// Listar todas las reservas activas
async listarReservasActivas(rifaId?: string)
```

### 3. **Tipos TypeScript**

#### Actualización de `src/types/ventas.ts`
Se agregaron nuevas interfaces:

```typescript
// Request para crear reserva
interface ReservaRequest

// Response cuando se crea una reserva
interface ReservaResponse

// Request para convertir reserva a venta
interface ConvertirReservaRequest

// Response cuando se convierte reserva
interface ConvertirReservaResponse

// Request para cancelar reserva
interface CancelarReservaRequest

// Response cuando se cancela reserva
interface CancelarReservaResponse

// Detalle de boleta en una reserva
interface BolataReservada
```

## 🔄 Modifications a Archivos Existentes

### 1. **`src/components/ventas/CarritoVentas.tsx`**

**Cambios realizados:**
- ✅ Actualizado tipo de venta a: `'COMPLETA' | 'ABONO' | 'RESERVA'`
- ✅ Agregado estado `mostrarDialogoReserva`
- ✅ Actualizado UI para mostrar 3 opciones en lugar de 2
- ✅ Lógica condicional para mostrar `DialogoReserva` cuando se selecciona "Reservar"
- ✅ Botón de acción cambia según tipo de venta seleccionado

**Interfaz actualizada:**
```
┌─────────────┬──────────────┬─────────────┐
│   Completa  │  Con Abono   │  Reservar   │
│  Pago total │ Pago parcial │Bloquear bot │
└─────────────┴──────────────┴─────────────┘
```

### 2. **`src/app/ventas/nueva-venta/page.tsx`**

**Cambios realizados:**
- ✅ Agregado import de `MisReservas`
- ✅ Agregado estado `mostrarReservas` para controlar visibilidad
- ✅ Sección collapsible con reservas activas en el flujo principal
- ✅ Se puede expandir/contraer con botón elegante
- ✅ Muestra resumen de reservas pendientes

**Ubicación en el flujo:**
- Se muestra debajo del indicador de pasos
- Arriba del contenido del paso actual
- Siempre accesible sin interrumpir el flujo de venta

## 🚀 Flujo de Uso

### **Crear una Reserva**

1. Seleccionar rifa → Seleccionar boletas → Datos cliente
2. En el carrito, seleccionar opción **📌 Reservar**
3. Se abre `DialogoReserva` donde:
   - Configurar días de bloqueo (slider o botones)
   - Revisar resumen de boletas
   - Agregar notas (opcional)
4. Confirmar → Se crea reserva con estado `PENDIENTE`
5. Boletas quedan `BLOQUEADAS` por N días

### **Ver Reservas Activas**

1. En nueva-venta, expandir sección **📌 Mis Reservas Activas**
2. Se muestra lista con:
   - Rifa y cantidad de boletas
   - Tiempo restante de bloqueo
   - Botones: Convertir o Cancelar

### **Convertir Reserva a Venta**

1. Desde `MisReservas`, hacer click en **Convertir a Venta**
2. Se abre `DialogoConvertirReserva` donde:
   - Elegir tipo: Completa o Parcial
   - Ingresar monto si es abono
   - Seleccionar método de pago
3. Confirmar → Se convierte a `VENTA`
4. Si es abono → se crea con saldo pendiente
5. Boletas pasan a disponibles/pagadas

### **Cancelar Reserva**

1. Desde `MisReservas`, hacer click en **Cancelar**
2. Solicita motivo (prompt)
3. Confirmar → Se cancela reserva
4. Boletas se liberan automáticamente
5. Estado: `CANCELADA`

## 📊 Estados de la Venta (Reserva)

```
PENDIENTE  ←→  Reserva creada, esperando decisión
               ├─→ ABONADA (si se convierte con abono)
               ├─→ COMPLETADA (si se convierte completa)
               └─→ CANCELADA (si se cancela)

EXPIRADA (opcional) ← Si pasa el tiempo de bloqueo sin decisión
```

## ⏱️ Configuración de Bloqueo

El tiempo de bloqueo es **totalmente configurable:**

- **Frontend**: Slider de 1-30 días en `DialogoReserva`
- **Backend**: El endpoint acepta `dias_bloqueo` en el request
- **Auto-expiración**: Job en backend libera boletas automáticamente tras expiración

## 🔐 Seguridad

- ✅ Validaciones en frontend
- ✅ Token JWT en headers
- ✅ Verificación de roles (VENDEDOR, SUPER_ADMIN)
- ✅ Boletas bloqueadas con `reserva_token` único
- ✅ Endpoints protegidos en backend

## 📱 Responsive Design

- ✅ UI adaptativa a dispositivos móviles
- ✅ Grid layout dinámico
- ✅ Botones accesibles en pantallas pequeñas
- ✅ Modales optimizados para mobile

## 🎨 UX Improvements

- ✅ Colores diferenciados por estado (azul venta, ámbar reserva)
- ✅ Iconos clarificadores (📌 para reserva)
- ✅ Estados visuales claros (spinner, checkmark, error)
- ✅ Animaciones suaves en transiciones
- ✅ Mensajes de confirmación y aclaraciones

## ✅ Funcionalidades Completadas

- [x] Crear reserva con días configurables
- [x] Convertir reserva a venta completa
- [x] Convertir reserva a venta con abono
- [x] Cancelar reserva con motivo
- [x] Listar reservas activas
- [x] Mostrar tiempo restante
- [x] Integración con flujo de nueva-venta
- [x] Diálogos modales para cada acción
- [x] Validaciones completas
- [x] Manejo de errores

## 🔗 Endpoints Backend Requeridos

```json
POST /api/ventas/reservar
POST /api/ventas/:id/convertir-reserva
POST /api/ventas/:id/cancelar-reserva
GET /api/ventas/:id
GET /api/ventas/reservas/activas
```

## 📝 Próximas Mejoras

- [ ] Dashboard de reservas por vendedor
- [ ] Historial de reservas canceladas
- [ ] Recordatorios automáticos (email)
- [ ] Botón de prórroga en reservas cercanas a vencer
- [ ] Reportes de conversión reserva→venta

---

**Integración completa y lista para producción** ✨
