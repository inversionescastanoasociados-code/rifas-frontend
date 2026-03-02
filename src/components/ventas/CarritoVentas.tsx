'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import html2canvas from 'html2canvas-pro'
import { ventasApi } from '@/lib/ventasApi'
import { BoletaEnCarrito, Cliente, VentaRequest } from '@/types/ventas'
import BoletaTicket from '@/components/BoletaTicket'
import DialogoReserva from './DialogoReserva'
import ReciboAbono, { ReciboAbonoData } from './ReciboAbono'
import { formatearInputPesos, parsearInputPesos } from '@/utils/formatPesos'
import { normalizarTelefono } from '@/utils/telefono'

const MEDIOS_PAGO_MAP: Record<string, string> = {
  'd397d917-c0d0-4c61-b2b3-2ebfab7deeb7': 'Efectivo',
  'af6e15fc-c52c-4491-abe1-20243af301c4': 'Nequi',
  'db94562d-bb01-42a3-9414-6e369a1a70ba': 'PSE',
  '57a2f560-b3d7-4fa8-91cf-24e6b2a6d7ff': 'Tarjeta Crédito',
}

interface CarritoVentasProps {
  boletas: BoletaEnCarrito[]
  cliente: Cliente
  precioBoleta: number
  rifaId: string
  rifaNombre?: string
  fechaSorteo?: string | null
  onBoletaRemovida: (boletaId: string) => void
  onVentaCompletada: () => void
}

export default function CarritoVentas({ 
  boletas, 
  cliente, 
  precioBoleta, 
  rifaId,
  rifaNombre,
  fechaSorteo,
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
  const [abonosPorBoleta, setAbonosPorBoleta] = useState<Record<string, number>>({})
  const [ventaResponse, setVentaResponse] = useState<any>(null)
  const [mostrarDialogoReserva, setMostrarDialogoReserva] = useState(false)
  const [reciboData, setReciboData] = useState<ReciboAbonoData | null>(null)

  // Calcular totales
  const subtotal = boletas.length * precioBoleta
  const total = subtotal
  const montoAbono = tipoVenta === 'ABONO' ? Object.values(abonosPorBoleta).reduce((sum, v) => sum + (v || 0), 0) : 0
  const saldoPendiente = tipoVenta === 'ABONO' ? total - montoAbono : 0

  // Helpers para abono por boleta
  const setAbonoBoleta = (boletaId: string, monto: number) => {
    setAbonosPorBoleta(prev => ({ ...prev, [boletaId]: Math.max(0, Math.min(monto, precioBoleta)) }))
  }

  const aplicarPorcentajeATodas = (porcentaje: number) => {
    const montoIndividual = Math.floor(precioBoleta * porcentaje)
    const nuevo: Record<string, number> = {}
    boletas.forEach(b => { nuevo[b.id] = montoIndividual })
    setAbonosPorBoleta(nuevo)
  }

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
        setError('Debes abonar al menos a una boleta')
        return
      }
      if (montoAbono >= total) {
        setError('Para pago completo, seleccione "Venta Completa"')
        return
      }
      // Validar que ningún abono exceda el precio de la boleta
      for (const boleta of boletas) {
        const abonoIndividual = abonosPorBoleta[boleta.id] || 0
        if (abonoIndividual > precioBoleta) {
          setError(`El abono de boleta #${boleta.numero.toString().padStart(4, '0')} no puede exceder $${precioBoleta.toLocaleString('es-CO')}`)
          return
        }
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
        notas: notas || undefined,
        ...(tipoVenta === 'ABONO' ? {
          abonos_por_boleta: boletas
            .filter(b => (abonosPorBoleta[b.id] || 0) > 0)
            .map(b => ({
              boleta_id: b.id,
              monto: abonosPorBoleta[b.id]
            }))
        } : {})
      }

      const response = await ventasApi.crearVenta(ventaData)
      setVentaResponse(response.data)
      
      // Generar datos para recibo
      const boletasResp = response.data?.boletas ?? []
      const mpLabel = MEDIOS_PAGO_MAP[medioPagoId] || 'Otro'
      const pagadoHoy = tipoVenta === 'ABONO' ? montoAbono : total
      setReciboData({
        tipo: tipoVenta === 'ABONO' ? 'venta_abono' : 'venta_nueva',
        montoRegistrado: pagadoHoy,
        totalVenta: total,
        totalPagado: pagadoHoy,
        saldoPendiente: tipoVenta === 'ABONO' ? saldoPendiente : 0,
        clienteNombre: cliente.nombre,
        clienteTelefono: cliente.telefono,
        clienteEmail: cliente.email,
        clienteIdentificacion: cliente.identificacion,
        rifaNombre: rifaNombre,
        metodoPago: mpLabel,
        notas: notas || undefined,
        ventaId: response.data?.id,
        boletas: boletasResp.map((b: any) => {
          const abonoBoleta = tipoVenta === 'ABONO' ? (abonosPorBoleta[b.id] || 0) : precioBoleta
          const saldoB = precioBoleta - abonoBoleta
          return {
            numero: b.numero,
            estado: abonoBoleta >= precioBoleta ? 'PAGADA' : abonoBoleta > 0 ? 'ABONADA' : 'PENDIENTE',
            precioBoleta: precioBoleta,
            totalPagado: abonoBoleta,
            saldoPendiente: saldoB > 0 ? saldoB : 0
          }
        })
      })
      
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

  // Liberar todos los bloqueos en caso de cancelación
  const liberarBloqueos = async () => {
    // Intentar liberar cada boleta individualmente (silenciar errores)
    for (const b of boletas) {
      try {
        await ventasApi.desbloquearBoleta(b.id, b.reserva_token)
      } catch {
        // Silenciar: la boleta puede ya haberse expirado o liberado
      }
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

  // Hooks de descarga (deben estar antes de cualquier return condicional)
  const descargarBoleta = useCallback(async (boletaNumero: number, identificacion: string, elementId: string) => {
    const el = document.getElementById(elementId)
    if (!el) return
    try {
      const canvas = await html2canvas(el, {
        scale: 4.03, // 800*4.03 ≈ 3224, 352*4.03 ≈ 1417
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      const cc = (identificacion || 'SIN_CC').replace(/\s+/g, '_')
      link.download = `boleta_${boletaNumero.toString().padStart(4, '0')}_CC_${cc}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Error descargando boleta:', err)
    }
  }, [])

  const descargarTodas = useCallback(async () => {
    const boletasData = ventaResponse?.boletas ?? []
    const identificacion = cliente.identificacion || 'SIN_CC'
    for (const b of boletasData) {
      const elementId = `boleta-print-${b.id}`
      await descargarBoleta(b.numero, identificacion, elementId)
      await new Promise(r => setTimeout(r, 500))
    }
  }, [ventaResponse, cliente.identificacion, descargarBoleta])

  // Generar link de WhatsApp para notificar al cliente
  const generarLinkWhatsApp = useCallback(() => {
    if (!cliente.telefono) return null

    const boletasVenta = ventaResponse?.boletas ?? []
    const numerosStr = boletasVenta.map((b: any) => `#${b.numero.toString().padStart(4, '0')}`).join(', ')
    const estadoVenta = tipoVenta === 'ABONO' ? 'ABONADA' : tipoVenta === 'RESERVA' ? 'RESERVADA' : 'PAGADA'
    const linkBoletas = 'https://elgrancamion.com/boletas'

    let mensaje = `Hola ${cliente.nombre} 👋\n\n`
    mensaje += `Se registró tu compra en *${rifaNombre || 'la rifa'}*.\n\n`
    mensaje += `🎫 *Boleta${boletasVenta.length > 1 ? 's' : ''}:* ${numerosStr}\n`
    mensaje += `📋 *Estado:* ${estadoVenta}\n`
    mensaje += `💰 *Total:* $${total.toLocaleString('es-CO')}\n`

    if (tipoVenta === 'ABONO' && saldoPendiente > 0) {
      mensaje += `✅ *Abonado:* $${montoAbono.toLocaleString('es-CO')}\n`
      mensaje += `⚠️ *Saldo pendiente:* $${saldoPendiente.toLocaleString('es-CO')}\n\n`
      mensaje += `Recuerda completar el pago antes de la fecha del sorteo. Boleta sin pagar no juega.\n`
    } else if (tipoVenta === 'COMPLETA') {
      mensaje += `\n✅ Pago completo. ¡Tu boleta ya está participando!\n`
    }

    if (linkBoletas) {
      mensaje += `\n📥 Descarga tus boletas aquí:\n${linkBoletas}\n`
    }

    mensaje += `\n¡Buena suerte! 🍀`

    const tel = normalizarTelefono(cliente.telefono)

    return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
  }, [cliente, ventaResponse, tipoVenta, rifaNombre, total, montoAbono, saldoPendiente])

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
    const boletasVenta = ventaResponse?.boletas ?? []

    return (
      <div className="space-y-6">
        {/* Modal de Recibo/Factura */}
        {reciboData && (
          <ReciboAbono
            data={reciboData}
            onClose={() => setReciboData(null)}
          />
        )}

        {/* Sección de Boletas para imprimir/descargar */}
        {boletasVenta.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">🎫 Boletas de la Compra</h3>
              <div className="flex gap-2">
                <button
                  onClick={descargarTodas}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Todas
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {boletasVenta.map((b: any) => (
                <div key={b.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-900">Boleta #{b.numero.toString().padStart(4, '0')}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => descargarBoleta(b.numero, cliente.identificacion || '', `boleta-print-${b.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar
                      </button>
                      <Link
                        href={`/boletas/${b.id}/print`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                      </Link>
                    </div>
                  </div>
                  {/* Boleta renderizada */}
                  <div className="overflow-x-auto">
                    <div id={`boleta-print-${b.id}`}>
                      <BoletaTicket
                        qrUrl={b.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=boleta-${b.id}`}
                        barcode={b.barcode || ''}
                        numero={b.numero}
                        imagenUrl={b.imagen_url}
                        rifaNombre={rifaNombre || ''}
                        estado={tipoVenta === 'ABONO' ? 'ABONADA' : 'CON_PAGO'}
                        clienteInfo={{
                          nombre: cliente.nombre,
                          identificacion: cliente.identificacion
                        }}
                        deuda={tipoVenta === 'ABONO' ? saldoPendiente / boletasVenta.length : 0}
                        precio={precioBoleta}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              const boletasResp = ventaResponse?.boletas ?? []
              const mpLabel = MEDIOS_PAGO_MAP[medioPagoId] || 'Otro'
              const pagadoHoy = tipoVenta === 'ABONO' ? montoAbono : total
              setReciboData({
                tipo: tipoVenta === 'ABONO' ? 'venta_abono' : 'venta_nueva',
                montoRegistrado: pagadoHoy,
                totalVenta: total,
                totalPagado: pagadoHoy,
                saldoPendiente: tipoVenta === 'ABONO' ? saldoPendiente : 0,
                clienteNombre: cliente.nombre,
                clienteTelefono: cliente.telefono,
                clienteEmail: cliente.email,
                clienteIdentificacion: cliente.identificacion,
                rifaNombre: rifaNombre,
                metodoPago: mpLabel,
                notas: notas || undefined,
                ventaId: ventaResponse?.id,
                boletas: boletasResp.map((b: any) => {
                  const abonoBoleta = tipoVenta === 'ABONO' ? (abonosPorBoleta[b.id] || 0) : precioBoleta
                  const saldoB = precioBoleta - abonoBoleta
                  return {
                    numero: b.numero,
                    estado: abonoBoleta >= precioBoleta ? 'PAGADA' : abonoBoleta > 0 ? 'ABONADA' : 'PENDIENTE',
                    precioBoleta: precioBoleta,
                    totalPagado: abonoBoleta,
                    saldoPendiente: saldoB > 0 ? saldoB : 0
                  }
                })
              })
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ver Recibo
          </button>
          <button
            onClick={onVentaCompletada}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Nueva Venta
          </button>
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
                  ${precioBoleta.toLocaleString('es-CO')}
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

      {/* Abono por boleta individual */}
      {tipoVenta === 'ABONO' && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-black mb-3">Abono por Boleta</h3>
          <p className="text-xs text-slate-500 mb-3">
            Ingresa cuánto abonar a cada boleta individualmente. Precio por boleta: <strong>${precioBoleta.toLocaleString('es-CO')}</strong>
          </p>

          {/* Botones rápidos para todas */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs text-slate-500 self-center mr-1">Aplicar a todas:</span>
            <button
              onClick={() => aplicarPorcentajeATodas(0.3)}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 font-medium"
            >
              30%
            </button>
            <button
              onClick={() => aplicarPorcentajeATodas(0.5)}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 font-medium"
            >
              50%
            </button>
            <button
              onClick={() => aplicarPorcentajeATodas(0.7)}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 font-medium"
            >
              70%
            </button>
            <button
              onClick={() => setAbonosPorBoleta({})}
              className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 font-medium"
            >
              Limpiar
            </button>
          </div>

          {/* Inputs por boleta */}
          <div className="space-y-3">
            {boletas.map((boleta) => {
              const abonoActual = abonosPorBoleta[boleta.id] || 0
              const saldoBoleta = precioBoleta - abonoActual
              return (
                <div
                  key={boleta.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="flex-shrink-0 w-16">
                    <div className="text-sm font-bold text-slate-800">#{boleta.numero.toString().padStart(4, '0')}</div>
                    <div className="text-[10px] text-slate-500">${precioBoleta.toLocaleString('es-CO')}</div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatearInputPesos(abonoActual)}
                        onChange={(e) => {
                          const val = parsearInputPesos(e.target.value)
                          setAbonoBoleta(boleta.id, Math.min(val, precioBoleta))
                        }}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right w-24">
                    {abonoActual > 0 ? (
                      <div>
                        <div className="text-[10px] text-slate-500">Saldo</div>
                        <div className={`text-xs font-semibold ${saldoBoleta > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          ${saldoBoleta.toLocaleString('es-CO')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin abono</span>
                    )}
                  </div>
                  {/* Botones rápidos individuales */}
                  <div className="flex-shrink-0 flex gap-1">
                    {[0.5, 1].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setAbonoBoleta(boleta.id, Math.floor(precioBoleta * pct))}
                        className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] hover:bg-slate-300"
                      >
                        {pct === 1 ? '100%' : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen de abonos */}
          {montoAbono > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-green-800">Total abonado hoy:</span>
                <span className="font-bold text-green-700">${montoAbono.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-orange-700">Saldo pendiente total:</span>
                <span className="font-bold text-orange-600">${saldoPendiente.toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}
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
            <span className="text-slate-900">${subtotal.toLocaleString('es-CO')}</span>
          </div>
          
          {tipoVenta === 'ABONO' && montoAbono > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Abono inicial</span>
                <span className="text-green-600 font-medium">${montoAbono.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Saldo pendiente</span>
                <span className="text-orange-600 font-medium">${saldoPendiente.toLocaleString('es-CO')}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between text-lg font-medium border-t pt-2">
            <span className="text-slate-900">
              {tipoVenta === 'ABONO' ? 'Total Venta' : 'Total a Pagar'}
            </span>
            <span className="text-slate-900">${total.toLocaleString('es-CO')}</span>
          </div>
          
          {tipoVenta === 'ABONO' && (
            <div className="flex justify-between text-sm bg-amber-50 p-2 rounded">
              <span className="text-amber-800">Pagado hoy</span>
              <span className="text-amber-800 font-medium">${montoAbono.toLocaleString('es-CO')}</span>
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
                ? `Crear Abono ($${montoAbono.toLocaleString('es-CO')})`
                : `Completar Venta ($${total.toLocaleString('es-CO')})`
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
        rifaNombre={rifaNombre}
        fechaSorteo={fechaSorteo}
        onClose={() => setMostrarDialogoReserva(false)}
        onReservaCompletada={() => {
          setMostrarDialogoReserva(false)
          onVentaCompletada()
        }}
      />
    </div>
  )
}
