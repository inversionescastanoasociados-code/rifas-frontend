'use client'

import { useState } from 'react'
import { ventasApi } from '@/lib/ventasApi'
import { BoletaEnCarrito, Cliente } from '@/types/ventas'

interface DialogoReservaProps {
  isOpen: boolean
  boletas: BoletaEnCarrito[]
  cliente: Cliente
  precioBoleta: number
  rifaId: string
  onClose: () => void
  onReservaCompletada: () => void
}

export default function DialogoReserva({
  isOpen,
  boletas,
  cliente,
  precioBoleta,
  rifaId,
  onClose,
  onReservaCompletada
}: DialogoReservaProps) {
  const [diasBloqueo, setDiasBloqueo] = useState<number>(5)
  const [notas, setNotas] = useState<string>('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paso, setPaso] = useState<'confirmacion' | 'procesando' | 'completado' | 'error'>('confirmacion')
  const [reservaResponse, setReservaResponse] = useState<any>(null)

  if (!isOpen) return null

  const subtotal = boletas.length * precioBoleta
  const fechaExpiracion = new Date(Date.now() + diasBloqueo * 24 * 60 * 60 * 1000)

  const procesarReserva = async () => {
    if (!cliente.nombre || !cliente.telefono) {
      setError('Complete la información del cliente')
      return
    }

    if (boletas.length === 0) {
      setError('Seleccione al menos una boleta')
      return
    }

    if (diasBloqueo < 1 || diasBloqueo > 30) {
      setError('Los días de bloqueo deben ser entre 1 y 30')
      return
    }

    setProcesando(true)
    setError(null)
    setPaso('procesando')

    try {
      const respuesta = await ventasApi.crearReserva({
        rifa_id: rifaId,
        cliente: {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email,
          identificacion: cliente.identificacion,
          direccion: cliente.direccion
        },
        boletas: boletas.map(b => b.id),
        dias_bloqueo: diasBloqueo,
        notas: notas || undefined
      })

      setReservaResponse(respuesta.data)
      setPaso('completado')

      // Notificar después de 2 segundos
      // setTimeout(() => {
      //   onReservaCompletada()
      // }, 2000)
    } catch (error: any) {
      console.error('Error procesando reserva:', error)
      setError(error.message || 'Error procesando la reserva')
      setPaso('error')
    } finally {
      setProcesando(false)
    }
  }

  const handleClose = () => {
  if (!procesando) {
    if (paso === 'completado') {
      onReservaCompletada()
    }

    setError(null)
    setPaso('confirmacion')
    setDiasBloqueo(5)
    setNotas('')
    onClose()
  }
}

  // Estado procesando
  if (paso === 'procesando') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Creando Reserva</h3>
            <p className="text-slate-600">Procesando tu reserva...</p>
          </div>
        </div>
      </div>
    )
  }

  // Estado completado
  if (paso === 'completado') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              ¡Reserva Creada!
            </h3>
            <p className="text-slate-600 mb-4">
              La reserva se ha creado exitosamente
            </p>

            {reservaResponse && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4 text-left">
                <h4 className="font-medium text-slate-900 mb-3">Detalles de la Reserva</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">ID Reserva:</span>
                    <span className="font-mono text-slate-900">{reservaResponse.reserva_id?.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Boletas:</span>
                    <span className="font-medium text-slate-900">{reservaResponse.cantidad_boletas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Días Bloqueo:</span>
                    <span className="font-medium text-slate-900">{diasBloqueo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bloqueo Hasta:</span>
                    <span className="font-medium text-slate-900">
                      {new Date(reservaResponse.bloqueo_hasta).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estado:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      PENDIENTE
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cliente:</span>
                    <span className="font-medium text-slate-900">{cliente.nombre}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estado error
  if (paso === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Error al Crear Reserva
            </h3>
            <p className="text-red-600 mb-4">{error}</p>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={procesarReserva}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estado confirmación
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Confirmar Reserva</h2>
          <p className="text-sm text-slate-600 mt-1">
            Bloquea boletas por un período de tiempo
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Resumen de boletas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">Boletas a Reservar</h3>
            <div className="space-y-2">
              {boletas.slice(0, 3).map((boleta) => (
                <div key={boleta.id} className="flex justify-between text-sm">
                  <span className="text-blue-800">#{boleta.numero.toString().padStart(4, '0')}</span>
                  <span className="text-blue-600 font-medium">${precioBoleta.toLocaleString()}</span>
                </div>
              ))}
              {boletas.length > 3 && (
                <div className="text-sm text-blue-600 italic">
                  +{boletas.length - 3} boletas más...
                </div>
              )}
            </div>
            <div className="border-t border-blue-200 mt-3 pt-3">
              <div className="flex justify-between font-medium">
                <span className="text-blue-900">Total ({boletas.length} boletas)</span>
                <span className="text-blue-900">${subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Configuración de bloqueo */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">
              Días de Bloqueo
            </label>
            <div className="space-y-3">
              <div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={diasBloqueo}
                  onChange={(e) => setDiasBloqueo(Number(e.target.value))}
                  disabled={procesando}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="mt-2 text-center">
                  <span className="text-2xl font-bold text-blue-600">{diasBloqueo}</span>
                  <span className="text-slate-600 ml-2">días</span>
                </div>
              </div>

              {/* Botones rápidos */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 7].map((dias) => (
                  <button
                    key={dias}
                    onClick={() => setDiasBloqueo(dias)}
                    disabled={procesando}
                    className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                      diasBloqueo === dias
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dias}d
                  </button>
                ))}
              </div>

              {/* Fecha de expiración */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-600">Bloqueo hasta:</p>
                <p className="text-sm font-medium text-slate-900">
                  {fechaExpiracion.toLocaleDateString()} {fechaExpiracion.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">Cliente</h3>
            <div className="text-sm text-slate-700 space-y-1">
              <div className="font-medium">{cliente.nombre}</div>
              {cliente.telefono && <div>Tel: {cliente.telefono}</div>}
              {cliente.email && <div>Email: {cliente.email}</div>}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              disabled={procesando}
              rows={3}
              className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none bg-white text-black placeholder:text-slate-500"
              placeholder="Detalles sobre la reserva..."
            />
          </div>

          {/* Aclaraciones */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-2">⏱️ Aclaraciones Importantes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Las boletas estarán bloqueadas por {diasBloqueo} días</li>
              <li>Pasado este tiempo, se liberarán automáticamente</li>
              <li>Puedes convertirla a venta en cualquier momento</li>
              <li>O cancelarla si cambias de opinión</li>
            </ul>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-3">
          <button
            onClick={handleClose}
            disabled={procesando}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={procesarReserva}
            disabled={procesando || boletas.length === 0 || !cliente.nombre || !cliente.telefono}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {procesando ? 'Procesando...' : '📌 Crear Reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}
