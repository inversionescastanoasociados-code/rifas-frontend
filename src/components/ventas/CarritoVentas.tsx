'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ventasApi } from '@/lib/ventasApi'
import { BoletaEnCarrito, Cliente, VentaRequest } from '@/types/ventas'
import DialogoReserva from './DialogoReserva'

interface CarritoVentasProps {
  boletas: BoletaEnCarrito[]
  cliente: Cliente
  precioBoleta: number
  rifaId: string
  onBoletaRemovida: (boletaId: string) => void
  onVentaCompletada: () => void
}

export default function CarritoVentas({ 
  boletas, 
  cliente, 
  precioBoleta, 
  rifaId,
  onBoletaRemovida,
  onVentaCompletada
}: CarritoVentasProps) {
  const [medioPagoId, setMedioPagoId] = useState<string>('d397d917-c0d0-4c61-b2b3-2ebfab7deeb7')
  const [notas, setNotas] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paso, setPaso] = useState<'resumen' | 'procesando' | 'completado' | 'error'>('resumen')
  
  // Estados para abonos parciales
  const [tipoVenta, setTipoVenta] = useState<'COMPLETA' | 'ABONO' | 'RESERVA'>('COMPLETA')
  const [montoAbono, setMontoAbono] = useState<number>(0)
  const [ventaResponse, setVentaResponse] = useState<any>(null)
  const [mostrarDialogoReserva, setMostrarDialogoReserva] = useState(false)

  // Calcular totales
  const subtotal = boletas.length * precioBoleta
  const total = subtotal
  const saldoPendiente = tipoVenta === 'ABONO' ? total - montoAbono : 0

  // Remover boleta del carrito
  const removerBoleta = async (boleta: BoletaEnCarrito) => {
    try {
      await ventasApi.desbloquearBoleta(boleta.id, boleta.reserva_token)
      onBoletaRemovida(boleta.id)
    } catch (error) {
      console.error('Error removiendo boleta:', error)
      setError('Error al remover boleta del carrito')
    }
  }

  // Procesar venta
  const procesarVenta = async () => {
    if (!cliente?.nombre || !cliente?.telefono) {
      setError('Complete la información del cliente')
      return
    }

    if (boletas.length === 0) {
      setError('Seleccione al menos una boleta')
      return
    }

    // Validaciones para abonos
    if (tipoVenta === 'ABONO') {
      if (montoAbono <= 0) {
        setError('El monto de abono debe ser mayor a 0')
        return
      }
      if (montoAbono >= total) {
        setError('Para pago completo, seleccione "Venta Completa"')
        return
      }
    }

    setProcesando(true)
    setError(null)
    setPaso('procesando')

    try {
      const ventaData: VentaRequest = {
        rifa_id: rifaId,
        cliente: {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email,
          direccion: cliente.direccion,
          identificacion: cliente.identificacion
        },
        boletas: boletas.map(b => ({
          id: b.id,
          reserva_token: b.reserva_token
        })),
        medio_pago_id: medioPagoId,
        total_venta: total,
        total_pagado: tipoVenta === 'ABONO' ? montoAbono : total,
        notas: notas || undefined
      }

      const response = await ventasApi.crearVenta(ventaData)
      setVentaResponse(response.data)
      
      // Éxito - se queda en la vista de completado hasta que el usuario pulse un botón
      setPaso('completado')
    } catch (error: any) {
      console.error('Error procesando venta:', error)
      setError(error.message || 'Error procesando la venta')
      setPaso('error')
    } finally {
      setProcesando(false)
    }
  }

  // Liberar todos los bloqueos en caso de error
  const liberarBloqueos = async () => {
    try {
      await ventasApi.liberarBloqueosMultiples(
        boletas.map(b => ({ id: b.id, reserva_token: b.reserva_token }))
      )
    } catch (error) {
      console.error('Error liberando bloqueos:', error)
    }
  }

  // Cancelar venta
  const cancelarVenta = async () => {
    await liberarBloqueos()
    onBoletaRemovida('all')
  }

  // Formatear tiempo restante
  const tiempoRestante = (boleta: BoletaEnCarrito) => {
    const ahora = new Date()
    const expiracion = new Date(boleta.bloqueo_hasta)
    const diff = expiracion.getTime() - ahora.getTime()
    
    if (diff <= 0) return 'Expirado'
    
    const minutos = Math.floor(diff / (1000 * 60))
    const segundos = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${minutos}:${segundos.toString().padStart(2, '0')}`
  }

  if (paso === 'procesando') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Procesando Venta</h3>
          <p className="text-slate-600">Estamos procesando tu venta...</p>
        </div>
      </div>
    )
  }

  if (paso === 'completado') {
    const esVentaCompleta = tipoVenta === 'COMPLETA' && ventaResponse?.id

    return (
      <div className="space-y-6">
        {/* Mensaje de éxito */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {tipoVenta === 'ABONO' ? '¡Venta con Abono Creada!' : '¡Venta Completada!'}
            </h3>
            <p className="text-slate-600 mb-4">
              {tipoVenta === 'ABONO' 
                ? 'La venta con abono se ha procesado exitosamente'
                : 'La venta se ha procesado exitosamente'
              }
            </p>
            
            {/* Mostrar detalles de la venta si hay respuesta */}
            {ventaResponse && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
                <h4 className="font-medium text-slate-900 mb-3">Detalles de la Venta</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">ID Venta:</span>
                    <span className="font-mono text-slate-900">{ventaResponse.id?.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total:</span>
                    <span className="font-medium text-slate-900">${total.toLocaleString()}</span>
                  </div>
                  {tipoVenta === 'ABONO' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Abono:</span>
                        <span className="font-medium text-green-600">${montoAbono.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Saldo Pendiente:</span>
                        <span className="font-medium text-orange-600">${saldoPendiente.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Estado:</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          PENDIENTE
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cliente:</span>
                    <span className="font-medium text-slate-900">{ventaResponse.cliente_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Boletas:</span>
                    <span className="font-medium text-slate-900">{boletas.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Solo para venta completa: mostrar botones Ver/Imprimir y Volver */}
            {esVentaCompleta ? (
              <div className="flex justify-center gap-4">
                <Link
                  href={`/ventas/${ventaResponse.id}/boletas`}
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
                <button
                  onClick={onVentaCompletada}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Volver
                </button>
              </div>
            ) : (
              <button
                onClick={onVentaCompletada}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Nueva Venta
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-black">Resumen de Venta</h2>
        <div className="text-sm text-slate-600">
          {boletas.length} boleta{boletas.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Boletas en el carrito */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-black mb-3">Boletas Seleccionadas</h3>
        <div className="space-y-2">
          {boletas.map((boleta) => (
            <div
              key={boleta.id}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="font-medium text-slate-900">
                  #{boleta.numero.toString().padStart(4, '0')}
                </div>
                <div className="text-sm text-slate-600">
                  ${precioBoleta.toFixed(2)}
                </div>
                <div className="text-xs text-amber-600">
                  Bloqueo: {tiempoRestante(boleta)}
                </div>
              </div>
              <button
                onClick={() => removerBoleta(boleta)}
                disabled={procesando}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tipo de Venta */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-black mb-3">Tipo de Operación</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTipoVenta('COMPLETA')}
            disabled={procesando}
            className={`p-4 border-2 rounded-lg transition-all ${
              tipoVenta === 'COMPLETA'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="font-medium text-sm">Venta Completa</div>
            <div className="text-xs text-slate-600 mt-1">Pago total</div>
          </button>
          <button
            onClick={() => setTipoVenta('ABONO')}
            disabled={procesando}
            className={`p-4 border-2 rounded-lg transition-all ${
              tipoVenta === 'ABONO'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="font-medium text-sm">Con Abono</div>
            <div className="text-xs text-slate-600 mt-1">Pago parcial</div>
          </button>
          <button
            onClick={() => setTipoVenta('RESERVA')}
            disabled={procesando}
            className={`p-4 border-2 rounded-lg transition-all ${
              tipoVenta === 'RESERVA'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="font-medium text-sm">📌 Reservar</div>
            <div className="text-xs text-slate-600 mt-1">Bloquear boletas</div>
          </button>
        </div>
      </div>

      {/* Abono Parcial */}
      {tipoVenta === 'ABONO' && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-black mb-3">Monto de Abono</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-black font-semibold mb-1">
                Valor a abonar hoy
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(Math.max(0, Number(e.target.value)))}
                  min="1"
                  max={total - 1}
                  className="w-full pl-8 pr-3 py-2 border border-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-black"
                  placeholder="0"
                />
              </div>
              {montoAbono > 0 && (
                <div className="mt-2 text-sm text-slate-600">
                  Saldo pendiente: <span className="font-medium text-orange-600">${saldoPendiente.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {/* Sugerencias de abono */}
            <div className="flex gap-2">
              <button
                onClick={() => setMontoAbono(Math.floor(total * 0.3))}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
              >
                30%
              </button>
              <button
                onClick={() => setMontoAbono(Math.floor(total * 0.5))}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
              >
                50%
              </button>
              <button
                onClick={() => setMontoAbono(Math.floor(total * 0.7))}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
              >
                70%
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información del cliente */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Cliente</h3>
        <div className="text-sm text-blue-800">
          <div className="font-medium">{cliente?.nombre || 'Sin nombre'}</div>
          {cliente?.telefono && <div>{cliente.telefono}</div>}
          {cliente?.email && <div>{cliente.email}</div>}
        </div>
      </div>

      {/* Método de pago - Solo para Venta Completa y Abono */}
      {tipoVenta !== 'RESERVA' && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-black mb-2">
            Método de Pago
          </label>
          <select
            value={medioPagoId}
            onChange={(e) => setMedioPagoId(e.target.value)}
            disabled={procesando}
            className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-black"
          >
            <option value="d397d917-c0d0-4c61-b2b3-2ebfab7deeb7">Efectivo</option>
            <option value="af6e15fc-c52c-4491-abe1-20243af301c4">Nequi</option>
            <option value="db94562d-bb01-42a3-9414-6e369a1a70ba">PSE</option>
            <option value="57a2f560-b3d7-4fa8-91cf-24e6b2a6d7ff">Tarjeta Crédito</option>
          </select>
        </div>
      )}

      {/* Notas - Solo para Venta Completa y Abono */}
      {tipoVenta !== 'RESERVA' && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-black mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            disabled={procesando}
            rows={2}
            className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none bg-white text-black placeholder:text-slate-500"
            placeholder={tipoVenta === 'ABONO' ? 'Detalles del abono y acuerdo de pago...' : 'Notas adicionales sobre la venta...'}
          />
        </div>
      )}

      {/* Resumen de totales */}
      <div className="border-t border-slate-200 pt-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal ({boletas.length} boletas)</span>
            <span className="text-slate-900">${subtotal.toFixed(2)}</span>
          </div>
          
          {tipoVenta === 'ABONO' && montoAbono > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Abono inicial</span>
                <span className="text-green-600 font-medium">${montoAbono.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Saldo pendiente</span>
                <span className="text-orange-600 font-medium">${saldoPendiente.toFixed(2)}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between text-lg font-medium border-t pt-2">
            <span className="text-slate-900">
              {tipoVenta === 'ABONO' ? 'Total Venta' : 'Total a Pagar'}
            </span>
            <span className="text-slate-900">${total.toFixed(2)}</span>
          </div>
          
          {tipoVenta === 'ABONO' && (
            <div className="flex justify-between text-sm bg-amber-50 p-2 rounded">
              <span className="text-amber-800">Pagado hoy</span>
              <span className="text-amber-800 font-medium">${montoAbono.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-3">
        {boletas.length > 0 && (
          <button
            onClick={cancelarVenta}
            disabled={procesando}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        
        {tipoVenta === 'RESERVA' ? (
          <button
            onClick={() => setMostrarDialogoReserva(true)}
            disabled={procesando || boletas.length === 0 || !cliente.nombre || !cliente.telefono}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {procesando ? 'Procesando...' : `📌 Crear Reserva`}
          </button>
        ) : (
          <button
            onClick={procesarVenta}
            disabled={procesando || boletas.length === 0 || !cliente.nombre || !cliente.telefono || (tipoVenta === 'ABONO' && montoAbono <= 0)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {procesando 
              ? 'Procesando...' 
              : tipoVenta === 'ABONO' 
                ? `Crear Abono ($${montoAbono.toFixed(2)})`
                : `Completar Venta ($${total.toFixed(2)})`
            }
          </button>
        )}
      </div>

      {/* Diálogo de reserva */}
      <DialogoReserva
        isOpen={mostrarDialogoReserva}
        boletas={boletas}
        cliente={cliente}
        precioBoleta={precioBoleta}
        rifaId={rifaId}
        onClose={() => setMostrarDialogoReserva(false)}
        onReservaCompletada={() => {
          setMostrarDialogoReserva(false)
          onVentaCompletada()
        }}
      />
    </div>
  )
}
