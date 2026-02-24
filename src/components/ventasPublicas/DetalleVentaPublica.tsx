'use client'

import { VentaPublicaDetalle, AbonoPublico } from '@/types/ventasPublicas'
import { useState } from 'react'
import { ventasPublicasApi } from '@/lib/ventasPublicasApi'

interface DetalleVentaPublicaProps {
  venta: VentaPublicaDetalle
  onBack: () => void
  onVentaCancelada?: () => void
  onAbonoConfirmado?: (abonoId: string) => void
}

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

      {/* Acciones */}
      <div className="flex gap-3">
        <button
          onClick={handleCancelarVenta}
          disabled={ventaEnCancelacion || venta.estado_venta === 'CANCELADA'}
          className="flex-1 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ventaEnCancelacion ? '⏳ Cancelando...' : '❌ Cancelar Venta'}
        </button>
      </div>
    </div>
  )
}
