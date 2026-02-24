'use client'

import { useState, useEffect } from 'react'
import { ventasApi } from '@/lib/ventasApi'
import { ReservaResponse } from '@/types/ventas'
import DialogoConvertirReserva from './DialogoConvertirReserva'

interface MisReservasProps {
  rifaId?: string
  onReservaSeleccionada?: (reserva: ReservaResponse) => void
}

export default function MisReservas({ rifaId, onReservaSeleccionada }: MisReservasProps) {
  const [reservas, setReservas] = useState<ReservaResponse[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaResponse | null>(null)
  const [mostrarDialogoConvertir, setMostrarDialogoConvertir] = useState(false)
  const [procesandoCancelacion, setProcesandoCancelacion] = useState<string | null>(null)

  // Cargar reservas
  useEffect(() => {
    cargarReservas()
  }, [rifaId])

  const cargarReservas = async () => {
    try {
      setCargando(true)
      setError(null)

      const respuesta = await ventasApi.listarReservasActivas(rifaId)
      setReservas(respuesta.data)
    } catch (error: any) {
      console.error('Error cargando reservas:', error)
      setError(error.message || 'Error al cargar las reservas')
    } finally {
      setCargando(false)
    }
  }

  const calcularTiempoRestante = (bloqueHasta: string) => {
    const ahora = new Date()
    const expiracion = new Date(bloqueHasta)
    const diff = expiracion.getTime() - ahora.getTime()

    if (diff <= 0) return { texto: 'Expirada', urgente: false, expired: true }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    let texto = ''
    if (dias > 0) texto = `${dias}d ${horas}h`
    else if (horas > 0) texto = `${horas}h ${minutos}m`
    else texto = `${minutos}m`

    const urgente = dias === 0 && horas <= 6 // Rojo si menos de 6 horas
    return { texto, urgente, expired: false }
  }

  const handleCancelar = async (reserva: ReservaResponse) => {
    const motivo = prompt(
      `¿Seguro que deseas cancelar la reserva de ${reserva.cantidad_boletas} boletas?\n\nMotivo (opcional):`
    )

    if (motivo === null) return // Usuario canceló

    setProcesandoCancelacion(reserva.reserva_id)

    try {
      await ventasApi.cancelarReserva(reserva.reserva_id, {
        motivo: motivo || 'No especificado'
      })

      // Recargar lista
      await cargarReservas()
    } catch (error: any) {
      alert('Error al cancelar la reserva: ' + error.message)
    } finally {
      setProcesandoCancelacion(null)
    }
  }

  const handleConvertir = (reserva: ReservaResponse) => {
    setReservaSeleccionada(reserva)
    setMostrarDialogoConvertir(true)
  }

  const handleReservaConvertida = () => {
    setMostrarDialogoConvertir(false)
    setReservaSeleccionada(null)
    cargarReservas()
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-slate-600">Cargando reservas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
        <button
          onClick={cargarReservas}
          className="ml-4 underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (reservas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
        <div className="text-slate-500 mb-2">📌</div>
        <p className="text-slate-600 font-medium">No hay reservas activas</p>
        <p className="text-sm text-slate-500 mt-1">
          Crea una reserva para bloquear boletas
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Mis Reservas Activas</h2>
            <p className="text-sm text-slate-600 mt-1">
              {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} pendiente{reservas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={cargarReservas}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {reservas.map((reserva) => {
            const tiempoRestante = calcularTiempoRestante(reserva.bloqueo_hasta)

            return (
              <div
                key={reserva.reserva_id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">
                        {reserva.rifa_titulo}
                      </h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        {reserva.cantidad_boletas} boleta{reserva.cantidad_boletas !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {reserva.cliente_nombre && (
                      <p className="text-sm text-slate-600 mt-1">
                        Cliente: <span className="font-medium">{reserva.cliente_nombre}</span>
                      </p>
                    )}
                  </div>

                  {/* Indicador de tiempo */}
                  <div
                    className={`text-center px-3 py-2 rounded-lg ${
                      tiempoRestante.expired
                        ? 'bg-red-100 text-red-800'
                        : tiempoRestante.urgente
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="text-xs font-medium">Expira en</p>
                    <p className="text-sm font-bold">
                      {tiempoRestante.texto}
                    </p>
                  </div>
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-slate-600">ID Reserva</p>
                    <p className="font-mono text-xs text-slate-900">
                      {reserva.reserva_id.slice(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Bloqueo</p>
                    <p className="font-medium text-slate-900">
                      {reserva.dias_bloqueo} días
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Hasta</p>
                    <p className="font-medium text-slate-900">
                      {new Date(reserva.bloqueo_hasta).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Creado</p>
                    <p className="font-medium text-slate-900">
                      {reserva.created_at
                        ? new Date(reserva.created_at).toLocaleDateString()
                        : 'Hoy'}
                    </p>
                  </div>
                </div>

                {/* Notas */}
                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConvertir(reserva)}
                    disabled={procesandoCancelacion === reserva.reserva_id}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    ✓ Convertir a Venta
                  </button>
                  <button
                    onClick={() => handleCancelar(reserva)}
                    disabled={procesandoCancelacion === reserva.reserva_id}
                    className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Diálogo convertir reserva */}
      {reservaSeleccionada && (
        <DialogoConvertirReserva
          isOpen={mostrarDialogoConvertir}
          reserva={reservaSeleccionada}
          onClose={() => {
            setMostrarDialogoConvertir(false)
            setReservaSeleccionada(null)
          }}
          onReservaConvertida={handleReservaConvertida}
        />
      )}
    </>
  )
}
