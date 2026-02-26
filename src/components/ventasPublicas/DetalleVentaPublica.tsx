'use client'

import { VentaPublicaDetalle, AbonoPublico } from '@/types/ventasPublicas'
import { useState } from 'react'
import { ventasPublicasApi } from '@/lib/ventasPublicasApi'
import { ventasApi } from '@/lib/ventasApi'

interface DetalleVentaPublicaProps {
  venta: VentaPublicaDetalle
  onBack: () => void
  onVentaCancelada?: () => void
  onAbonoConfirmado?: (abonoId: string) => void
}

const MEDIOS_PAGO = [
  { id: 'efectivo', label: '💵 Efectivo' },
  { id: 'nequi', label: '📱 Nequi' },
  { id: 'transferencia', label: '🏦 PSE / Transferencia' },
  { id: 'tarjeta', label: '💳 Tarjeta Crédito' },
  { id: 'daviplata', label: '📲 Daviplata' },
  { id: 'otro', label: '🔄 Otro' }
]

export default function DetalleVentaPublica({
  venta,
  onBack,
  onVentaCancelada,
  onAbonoConfirmado
}: DetalleVentaPublicaProps) {
  const [abonoEnConfirmacion, setAbonoEnConfirmacion] = useState<string | null>(
    null
  )
  const [ventaEnCancelacion, setVentaEnCancelacion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // Estado para registrar abono/pago
  const [mostrarFormAbono, setMostrarFormAbono] = useState(false)
  const [montoAbono, setMontoAbono] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<string>(MEDIOS_PAGO[0].id)
  const [notasAbono, setNotasAbono] = useState('')
  const [pagarTodo, setPagarTodo] = useState(false)
  const [procesandoAbono, setProcesandoAbono] = useState(false)

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor)
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PAGADA':
        return 'bg-green-100 text-green-800'
      case 'ABONADA':
        return 'bg-yellow-100 text-yellow-800'
      case 'PENDIENTE':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELADA':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getEstadoAbonoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADO':
        return 'bg-green-100 text-green-800'
      case 'REGISTRADO':
        return 'bg-orange-100 text-orange-800'
      case 'ANULADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const handleConfirmarPago = async (abonoId: string) => {
    try {
      setError(null)
      setExito(null)
      setAbonoEnConfirmacion(abonoId)

      const response = await ventasPublicasApi.confirmarPagoAbono(abonoId)

      if (!response.success) {
        throw new Error(response.message || 'Error confiriendo pago')
      }

      setExito('✅ Pago confirmado correctamente')
      setAbonoEnConfirmacion(null)

      if (onAbonoConfirmado) {
        onAbonoConfirmado(abonoId)
      }

      // Recargar los datos después de 1.5s
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
      setAbonoEnConfirmacion(null)
    }
  }

  const handleCancelarVenta = async () => {
    if (!window.confirm('¿Deseas cancelar esta venta? Se liberarán todas las boletas')) {
      return
    }

    try {
      setError(null)
      setExito(null)
      setVentaEnCancelacion(true)

      const response = await ventasPublicasApi.cancelarVentaPublica(
        venta.id,
        'Cancelada desde dashboard'
      )

      if (!response.success) {
        throw new Error(response.message || 'Error cancelando venta')
      }

      setExito('✅ Venta cancelada y boletas liberadas')
      setVentaEnCancelacion(false)

      if (onVentaCancelada) {
        onVentaCancelada()
      }

      // Volver a la lista después de 1.5s
      setTimeout(() => {
        onBack()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
      setVentaEnCancelacion(false)
    }
  }

  const handleRegistrarAbono = async () => {
    const montoValidado = Number(montoAbono)
    if (isNaN(montoValidado) || montoValidado <= 0) {
      setError('El monto debe ser un número mayor a 0')
      return
    }
    if (montoValidado > venta.saldo_pendiente) {
      setError('El monto no puede superar el saldo pendiente')
      return
    }
    if (!metodoPago || metodoPago.trim() === '') {
      setError('Debe seleccionar un método de pago')
      return
    }

    setProcesandoAbono(true)
    setError(null)
    setExito(null)

    try {
      const datosAbono = {
        monto: montoValidado,
        metodo_pago: metodoPago,
        notas: notasAbono.trim() || undefined
      }

      await ventasApi.registrarAbono(venta.id, datosAbono)

      const esPagoTotal = venta.saldo_pendiente - montoValidado <= 0

      setExito(
        esPagoTotal
          ? '✅ ¡Pago total registrado! La venta queda PAGADA. Las boletas se han entregado al cliente.'
          : `✅ Abono de ${formatoMoneda(montoValidado)} registrado exitosamente.`
      )

      setMostrarFormAbono(false)
      setMontoAbono(0)
      setNotasAbono('')
      setPagarTodo(false)

      if (onAbonoConfirmado) {
        onAbonoConfirmado(venta.id)
      }

      // Recargar la página después de 2s para reflejar cambios
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error registrando abono'
      setError(msg)
    } finally {
      setProcesandoAbono(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Volver</span>
        </button>
        <h2 className="text-lg font-semibold text-slate-900">
          Venta #{venta.id.substring(0, 8)}
        </h2>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {exito && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm font-medium">{exito}</p>
        </div>
      )}

      {/* Información del Cliente */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          📋 Información del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">NOMBRE</p>
            <p className="text-sm font-medium text-slate-900">
              {venta.cliente_nombre}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">TELÉFONO</p>
            <p className="text-sm text-slate-900">{venta.cliente_telefono}</p>
          </div>
          {venta.cliente_email && (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">EMAIL</p>
              <p className="text-sm text-slate-900">{venta.cliente_email}</p>
            </div>
          )}
          {venta.cliente_identificacion && (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">
                IDENTIFICACIÓN
              </p>
              <p className="text-sm text-slate-900">
                {venta.cliente_identificacion}
              </p>
            </div>
          )}
          {venta.cliente_direccion && (
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 font-medium mb-1">
                DIRECCIÓN
              </p>
              <p className="text-sm text-slate-900">{venta.cliente_direccion}</p>
            </div>
          )}
        </div>
      </div>

      {/* Información de la Rifa y Boletas */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          🎫 Boletas Seleccionadas
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">RIFA</p>
              <p className="text-sm font-medium text-slate-900">
                {venta.rifa_nombre}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">
                PRECIO BOLETA
              </p>
              <p className="text-sm font-medium text-slate-900">
                {formatoMoneda(venta.precio_boleta)}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500 font-medium mb-3">NÚMEROS</p>
            <div className="flex flex-wrap gap-2">
              {venta.boletas.map((boleta) => (
                <div
                  key={boleta.boleta_id}
                  className="inline-flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200"
                >
                  <span className="text-sm font-medium text-slate-900">
                    #{boleta.numero}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEstadoBadgeColor(boleta.estado)}`}
                  >
                    {boleta.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Montos */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          💰 Resumen de Pago
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-700">Total de la venta:</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatoMoneda(venta.monto_total)}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-700">Total pagado:</p>
            <p className="text-sm font-semibold text-green-700">
              {formatoMoneda(venta.abono_total)}
            </p>
          </div>
          <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
            <p className="text-sm font-medium text-slate-900">Saldo pendiente:</p>
            <p
              className={`text-sm font-bold ${
                venta.saldo_pendiente > 0
                  ? 'text-red-700'
                  : 'text-green-700'
              }`}
            >
              {formatoMoneda(venta.saldo_pendiente)}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-blue-200">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadgeColor(venta.estado_venta)}`}
          >
            Estado: {venta.estado_venta}
          </span>
        </div>
      </div>

      {/* Abonos Pendientes */}
      {venta.abonos_pendientes && venta.abonos_pendientes.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            ✅ Abonos Pendientes de Confirmación ({venta.abonos_pendientes.filter(a => a.estado === 'REGISTRADO').length})
          </h3>

          <div className="space-y-3">
            {venta.abonos_pendientes.map((abono) => (
              <div
                key={abono.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      BOLETA
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      #{abono.boleta_numero}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      MONTO
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatoMoneda(abono.monto)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      MÉTODO
                    </p>
                    <p className="text-sm text-slate-900">
                      {abono.medio_pago_nombre}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      ESTADO
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEstadoAbonoBadgeColor(abono.estado)}`}
                    >
                      {abono.estado}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    {abono.estado === 'REGISTRADO' && (
                      <button
                        onClick={() => handleConfirmarPago(abono.id)}
                        disabled={abonoEnConfirmacion === abono.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {abonoEnConfirmacion === abono.id ? (
                          <>
                            <span className="inline-block animate-spin">⏳</span>
                            <span>Confirmando...</span>
                          </>
                        ) : (
                          <>
                            <span>✅</span>
                            <span>Confirmar</span>
                          </>
                        )}
                      </button>
                    )}
                    {abono.estado === 'CONFIRMADO' && (
                      <span className="text-xs font-medium text-green-700">
                        Confirmado
                      </span>
                    )}
                  </div>
                </div>
                {abono.notas && (
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="font-medium">Notas:</span> {abono.notas}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* REGISTRAR ABONO / PAGO — Sección principal de acción  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {venta.estado_venta !== 'CANCELADA' && venta.estado_venta !== 'PAGADA' && venta.saldo_pendiente > 0 && (
        <div className="bg-white rounded-lg border-2 border-emerald-200 p-6">
          {!mostrarFormAbono ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                💰 Acciones de Pago
              </h3>
              <p className="text-xs text-slate-600">
                Registra un abono parcial o el pago total para esta venta online.
                El sistema actualizará automáticamente el estado de la venta y las boletas.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setMostrarFormAbono(true)
                    setPagarTodo(false)
                    setMontoAbono(0)
                    setError(null)
                    setExito(null)
                  }}
                  className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Registrar Abono
                </button>
                <button
                  onClick={() => {
                    setMostrarFormAbono(true)
                    setPagarTodo(true)
                    setMontoAbono(venta.saldo_pendiente)
                    setError(null)
                    setExito(null)
                  }}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pagar Total ({formatoMoneda(venta.saldo_pendiente)})
                </button>
                <a
                  href={`/ventas`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ir al módulo de ventas
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {pagarTodo ? '💳 Registrar Pago Total' : '💰 Registrar Abono'}
                </h3>
                <button
                  onClick={() => {
                    setMostrarFormAbono(false)
                    setError(null)
                    setMontoAbono(0)
                    setNotasAbono('')
                    setPagarTodo(false)
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info resumen rápido */}
              <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-slate-600">Saldo pendiente:</span>
                <span className="font-bold text-red-700 text-lg">{formatoMoneda(venta.saldo_pendiente)}</span>
              </div>

              {/* Medio de pago */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Medio de pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900"
                >
                  {MEDIOS_PAGO.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Monto a abonar (máx. {formatoMoneda(venta.saldo_pendiente)})
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      min={1}
                      max={venta.saldo_pendiente}
                      value={montoAbono || ''}
                      onChange={(e) => setMontoAbono(Number(e.target.value) || 0)}
                      placeholder="0"
                      disabled={pagarTodo}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 bg-white text-slate-900 text-lg font-medium"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pagarTodo}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setPagarTodo(checked)
                      setMontoAbono(checked ? venta.saldo_pendiente : 0)
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Pagar saldo total de la venta</span>
                </label>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Notas (opcional)</label>
                <textarea
                  value={notasAbono}
                  onChange={(e) => setNotasAbono(e.target.value)}
                  placeholder="Ej: Comprobante Nequi #12345, pago verificado..."
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setMostrarFormAbono(false)
                    setError(null)
                    setMontoAbono(0)
                    setNotasAbono('')
                    setPagarTodo(false)
                  }}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegistrarAbono}
                  disabled={procesandoAbono || montoAbono <= 0}
                  className="flex-1 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {procesandoAbono ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <span>{pagarTodo ? '✅' : '💰'}</span>
                      <span>
                        {pagarTodo
                          ? `Confirmar Pago Total (${formatoMoneda(montoAbono)})`
                          : `Registrar Abono (${formatoMoneda(montoAbono)})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensaje si venta ya está pagada */}
      {venta.estado_venta === 'PAGADA' && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-green-800 text-lg">Venta Completamente Pagada</p>
          <p className="text-green-700 text-sm mt-1">Todas las boletas han sido entregadas al cliente.</p>
          <a
            href={`/ventas/${venta.id}/boletas`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver / Imprimir Boletas
          </a>
        </div>
      )}

      {/* Acciones secundarias */}
      <div className="flex gap-3">
        <button
          onClick={handleCancelarVenta}
          disabled={ventaEnCancelacion || venta.estado_venta === 'CANCELADA' || venta.estado_venta === 'PAGADA'}
          className="flex-1 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ventaEnCancelacion ? '⏳ Cancelando...' : '❌ Cancelar Venta'}
        </button>
      </div>
    </div>
  )
}
