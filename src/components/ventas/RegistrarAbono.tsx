'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ventasApi } from '@/lib/ventasApi'
import { getStorageImageUrl } from '@/lib/storageImageUrl'

interface Props {
  ventaId: string
  onBack: () => void
  onAbonoRegistrado: () => void
}

type ExitoReciente = { tipo: 'abono' | 'pago_total'; monto: number } | null

type AccionGestionar = null | 'abonar' | 'cancelar'

interface VentaNormalizada {
  id: string
  monto_total: number
  total_pagado: number
  saldo_pendiente: number
  estado_venta: string
  nombre: string
  telefono: string
  email?: string
  created_at?: string
  abonos: Array<{ id: string; monto: number; created_at: string; metodo_pago?: string }>
  boletas?: Array<{
    id: string
    numero: number
    estado: string
    bloqueo_hasta?: string | null
    precio_boleta?: number
    total_pagado_boleta?: number
    saldo_pendiente_boleta?: number
    qr_url?: string
    imagen_url?: string
  }>
}

const MEDIOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'nequi', label: 'Nequi' },
  { id: 'transferencia', label: 'PSE' },
  { id: 'tarjeta', label: 'Tarjeta Crédito' },
  { id: 'daviplata', label: 'Daviplata' },
  { id: 'otro', label: 'Otro' }
]

export default function RegistrarAbono({ ventaId, onBack, onAbonoRegistrado }: Props) {
  const [venta, setVenta] = useState<VentaNormalizada | null>(null)
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState<AccionGestionar>(null)
  const [monto, setMonto] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<string>(MEDIOS_PAGO[0].id)
  const [notas, setNotas] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const [pagarTodo, setPagarTodo] = useState(false)
  const [exitoReciente, setExitoReciente] = useState<ExitoReciente>(null)

  useEffect(() => {
    cargarDetalle()
  }, [ventaId])

  const cargarDetalle = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ventasApi.getVentaDetalleFinanciero(ventaId)
      const d = response.data as any
      const totalVenta = Number(d.total_venta ?? d.monto_total ?? 0)
      const totalPagado = Number(d.total_pagado ?? 0)
      setVenta({
        id: d.id,
        monto_total: totalVenta,
        total_pagado: totalPagado,
        saldo_pendiente: d.saldo_pendiente ?? totalVenta - totalPagado,
        estado_venta: d.estado_venta ?? 'PENDIENTE',
        nombre: d.cliente_nombre ?? d.nombre ?? '',
        telefono: d.cliente_telefono ?? d.telefono ?? '',
        email: d.cliente_email ?? d.email,
        created_at: d.created_at,
        abonos: d.abonos ?? [],
        boletas: d.boletas ?? []
      })
      setPagarTodo(false)
      setMonto(0)
      setNotas('')
    } catch (err: any) {
      setError(err?.message || 'Error cargando detalle')
    } finally {
      setLoading(false)
    }
  }

  const registrarAbono = async () => {
    if (!venta) return
    
    // Validar monto
    const montoValidado = Number(monto)
    if (isNaN(montoValidado) || montoValidado <= 0) {
      setError('El monto debe ser un número mayor a 0')
      return
    }
    if (montoValidado > venta.saldo_pendiente) {
      setError('El monto no puede superar el saldo pendiente')
      return
    }

    // Validar método de pago
    if (!metodoPago || metodoPago.trim() === '') {
      setError('Debe seleccionar un método de pago')
      return
    }

    setProcesando(true)
    setError(null)
    try {
      const datosAbono = {
        monto: montoValidado,
        metodo_pago: metodoPago,
        notas: notas.trim() || undefined
      }
      await ventasApi.registrarAbono(ventaId, datosAbono)
      await cargarDetalle()
      setMonto(0)
      setNotas('')
      setAccion(null)
      const esPagoTotal = venta.saldo_pendiente - montoValidado <= 0
      setExitoReciente({
        tipo: esPagoTotal ? 'pago_total' : 'abono',
        monto: montoValidado
      })
    } catch (err: any) {
      const responseData = err?.response?.data
      let mensajeError = 'Error registrando abono'
      
      if (responseData?.details && Array.isArray(responseData.details)) {
        // Si hay detalles de validación, mostrarlos
        const detalles = responseData.details.map((d: any) => 
          `${d.field}: ${d.message}`
        ).join(', ')
        mensajeError = `${responseData.message || 'Error de validación'}: ${detalles}`
      } else {
        mensajeError = responseData?.message || 
                      responseData?.error || 
                      err?.message || 
                      'Error registrando abono'
      }
      
      setError(mensajeError)
    } finally {
      setProcesando(false)
    }
  }

  const cancelarTotalidad = async () => {
    setProcesando(true)
    setError(null)
    try {
      // Si tu backend tiene endpoint para cancelar venta, úsalo aquí:
      // await ventasApi.cancelarVenta(ventaId)
      setConfirmarCancelar(false)
      setAccion(null)
      onAbonoRegistrado()
    } catch (err: any) {
      setError(err?.message || 'Error al cancelar')
    } finally {
      setProcesando(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-600">Cargando detalle de la venta...</p>
      </div>
    )
  }

  if (error && !venta) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
        >
          ← Volver
        </button>
      </div>
    )
  }

  if (!venta) return null

  const cerrarExitoYVolver = () => {
    setExitoReciente(null)
    onAbonoRegistrado()
  }

  if (exitoReciente) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {exitoReciente.tipo === 'pago_total'
              ? 'Deuda saldada'
              : 'Abono registrado'}
          </h2>
          <p className="text-slate-600 mb-4">
            {exitoReciente.tipo === 'pago_total'
              ? 'La venta quedó pagada en su totalidad. Ya puedes entregar las boletas al cliente.'
              : `Se registró un abono de $${exitoReciente.monto.toLocaleString()} correctamente.`}
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Monto registrado:</span>
              <span className="font-medium text-slate-900">${exitoReciente.monto.toLocaleString()}</span>
            </div>
          </div>
          {exitoReciente.tipo === 'pago_total' && venta.boletas && venta.boletas.length > 0 && (
            <div className="mb-6">
              <Link
                href={`/ventas/${ventaId}/boletas`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver / Imprimir boletas
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={cerrarExitoYVolver}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  const mostrarFormularioAbono = accion === 'abonar'
  const mostrarFormularioCancelar = accion === 'cancelar'

  // Calcular cantidad de transacciones de abono (agrupando por fecha/hora)
  // Si varios abonos tienen la misma fecha/hora (o muy cercana), se cuentan como 1 transacción
  const cantidadTransaccionesAbono = (() => {
    if (venta.abonos.length === 0) return 0
    
    // Agrupar abonos por fecha/hora redondeada a minutos (misma transacción)
    const grupos = new Set<string>()
    for (const abono of venta.abonos) {
      const fecha = new Date(abono.created_at)
      // Redondear a minutos para agrupar abonos de la misma transacción
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}-${fecha.getHours()}-${fecha.getMinutes()}`
      grupos.add(clave)
    }
    return grupos.size
  })()

  // Mapa para obtener datos de boleta desde un abono (usando boleta_id)
  const boletasPorId: Record<string, {
    id: string
    numero: number
    estado: string
    bloqueo_hasta?: string | null
    precio_boleta?: number
    total_pagado_boleta?: number
    saldo_pendiente_boleta?: number
    qr_url?: string
    imagen_url?: string
  }> = {}
  if (venta.boletas) {
    for (const b of venta.boletas) {
      boletasPorId[b.id] = b
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
        >
          ← Volver a ventas
        </button>
      </div>

      {/* Boletas en cards */}
      {venta.boletas && venta.boletas.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Boletas de esta venta</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {venta.boletas.map((boleta) => (
              <div
                key={boleta.id}
                className="border-2 border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col gap-2"
              >
                <div className="text-2xl font-bold text-slate-800">#{boleta.numero}</div>

                <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold
                  bg-slate-100 text-slate-700">
                  {boleta.estado}
                </span>

                {boleta.imagen_url || boleta.qr_url ? (
                  <div className="mt-2 h-16 flex items-center justify-center">
                    <img
                      src={getStorageImageUrl(boleta.imagen_url) ?? getStorageImageUrl(boleta.qr_url) ?? boleta.imagen_url ?? boleta.qr_url}
                      alt={`Boleta ${boleta.numero}`}
                      className="max-h-14 w-auto object-contain"
                    />
                  </div>
                ) : null}

                <div className="text-[11px] text-left space-y-1 mt-1 text-slate-700">
                  {typeof boleta.precio_boleta === 'number' && (
                    <div>Precio: ${boleta.precio_boleta.toLocaleString()}</div>
                  )}
                  {typeof boleta.total_pagado_boleta === 'number' && (
                    <div>Pagado: ${boleta.total_pagado_boleta.toLocaleString()}</div>
                  )}
                  {typeof boleta.saldo_pendiente_boleta === 'number' && (
                    <div className="font-semibold text-orange-700">
                      Saldo: ${boleta.saldo_pendiente_boleta.toLocaleString()}
                    </div>
                  )}
                  {boleta.estado === 'RESERVADA' && boleta.bloqueo_hasta && (
                    <div className="text-[10px] text-amber-700">
                      Reservada hasta:{' '}
                      {new Date(boleta.bloqueo_hasta).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cliente y datos de la venta */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Información de la venta</h2>
        
        {/* Cliente */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Cliente</div>
          <div className="font-medium text-blue-900">{venta.nombre}</div>
          <div className="text-sm text-blue-800">{venta.telefono}</div>
          {venta.email && <div className="text-sm text-blue-700">{venta.email}</div>}
        </div>

        {/* Información financiera */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <div className="text-slate-500 text-xs mb-1">Total</div>
            <div className="font-medium text-lg">${venta.monto_total.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Pagado</div>
            <div className="font-medium text-lg text-green-600">${venta.total_pagado.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Saldo pendiente</div>
            <div className="font-medium text-lg text-orange-600">${venta.saldo_pendiente.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Estado</div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
              {venta.estado_venta}
            </span>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 border-t border-slate-200 text-sm">
          {venta.created_at && (
            <div>
              <div className="text-slate-500 text-xs mb-1">Fecha de creación</div>
              <div className="font-medium text-slate-700">
                {new Date(venta.created_at).toLocaleDateString()}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(venta.created_at).toLocaleTimeString()}
              </div>
            </div>
          )}
          <div>
            <div className="text-slate-500 text-xs mb-1">Boletas</div>
            <div className="font-medium text-slate-700">
              {venta.boletas?.length || 0} boleta{(venta.boletas?.length || 0) !== 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Transacciones de abono</div>
            <div className="font-medium text-slate-700">
              {cantidadTransaccionesAbono} {cantidadTransaccionesAbono === 1 ? 'transacción' : 'transacciones'}
            </div>
          </div>
          {venta.abonos.length > 0 && (() => {
            const ultimoAbono = venta.abonos[venta.abonos.length - 1]
            return (
              <div>
                <div className="text-slate-500 text-xs mb-1">Último abono</div>
                <div className="font-medium text-slate-700">
                  {new Date(ultimoAbono.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(ultimoAbono.created_at).toLocaleTimeString()}
                </div>
              </div>
            )
          })()}
          {venta.monto_total > 0 && (
            <div>
              <div className="text-slate-500 text-xs mb-1">Porcentaje pagado</div>
              <div className="font-medium text-slate-700">
                {Math.round((venta.total_pagado / venta.monto_total) * 100)}%
              </div>
              <div className="text-xs text-slate-500">
                {venta.total_pagado > 0 ? 'Pagado' : 'Sin pagos'}
              </div>
            </div>
          )}
          <div>
            <div className="text-slate-500 text-xs mb-1">ID Venta</div>
            <div className="font-mono text-xs text-slate-600">
              {venta.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </div>


      {/* Acciones: Cancelar totalidad | Abonar */}
      {!mostrarFormularioAbono && !mostrarFormularioCancelar && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">¿Qué deseas hacer?</h3>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setAccion('cancelar')}
              className="px-6 py-3 border-2 border-red-200 text-red-700 rounded-xl hover:bg-red-50 font-medium transition-colors"
            >
              Cancelar venta
            </button>
            <button
              type="button"
              onClick={() => setAccion('abonar')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
            >
              Registrar abono
            </button>
          </div>
        </div>
      )}

      {/* Formulario: Registrar abono */}
      {mostrarFormularioAbono && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Registrar abono</h3>
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Medio de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-black"
              >
                {MEDIOS_PAGO.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-black mb-1">
                Valor a abonar (máx. ${venta.saldo_pendiente.toLocaleString()})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={venta.saldo_pendiente}
                  value={monto || ''}
                  onChange={(e) => setMonto(Number(e.target.value) || 0)}
                  placeholder="Valor a abonar"
                  disabled={pagarTodo}
                  className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500 bg-white text-black"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={pagarTodo}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setPagarTodo(checked)
                    if (checked && venta) {
                      setMonto(venta.saldo_pendiente)
                    } else {
                      setMonto(0)
                    }
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Pagar saldo total de la venta</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas"
                rows={2}
                className="w-full px-4 py-2 border border-slate-400 rounded-lg resize-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-black placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setAccion(null); setError(null); setMonto(0); setNotas('') }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={registrarAbono}
                disabled={procesando || monto <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {procesando ? 'Registrando...' : 'Registrar abono'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario: Cancelar totalidad */}
      {mostrarFormularioCancelar && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Cancelar venta</h3>
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>
          )}
          {!confirmarCancelar ? (
            <div className="space-y-4">
              <p className="text-slate-600">
                Si cancelas esta venta, las boletas quedarán nuevamente disponibles para otros clientes.
                Esta acción no debería usarse si el cliente simplemente va a pagar la deuda.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAccion(null); setError(null) }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  No, volver
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarCancelar(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Sí, cancelar venta
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-amber-700 font-medium">
                Función de cancelación en desarrollo. Por ahora puedes registrar abonos (incluyendo el pago
                total de la deuda) usando el formulario anterior.
              </p>
              <button
                type="button"
                onClick={() => { setConfirmarCancelar(false); setAccion(null) }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
