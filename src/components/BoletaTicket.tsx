'use client'

import { useState, useEffect } from 'react'
import { getStorageImageUrl } from '@/lib/storageImageUrl'

interface BoletaTicketProps {
  qrUrl: string
  barcode: string
  numero: number
  imagenUrl?: string | null
  rifaNombre: string
  estado: string
  clienteInfo?: {
    nombre: string
    identificacion?: string
  } | null
  deuda?: number | string | null
  reservadaHasta?: string | null
}

export default function BoletaTicket(props: BoletaTicketProps) {
  const {
    qrUrl,
    barcode,
    numero,
    imagenUrl,
    rifaNombre,
    estado,
    clienteInfo,
    deuda,
    reservadaHasta,
  } = props

  const [imageError, setImageError] = useState(false)
  const imagen = getStorageImageUrl(imagenUrl ?? null) ?? imagenUrl
  const hasImagen = Boolean(imagen && imagen.trim())

  // --- Helpers ---
  const estadoNorm = (estado ?? '').toString().trim().toUpperCase()
  const deudaNum =
    typeof deuda === 'number'
      ? deuda
      : deuda
      ? Number(String(deuda).replace(/[^0-9.-]/g, '')) || null
      : null
  const tieneCliente = Boolean(clienteInfo && (clienteInfo.nombre || clienteInfo.identificacion))

  const formatDateDisplay = (d?: string | null) => {
    if (!d) return undefined
    try {
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return d
      return dt.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return d
    }
  }

  const reservadaHastaFmt = formatDateDisplay(reservadaHasta ?? null)

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('BoletaTicket props', {
      estado,
      estadoNorm,
      deuda,
      deudaNum,
      clienteInfo,
      reservadaHasta,
      reservadaHastaFmt,
    })
  }, [estado, deuda, clienteInfo, reservadaHasta, reservadaHastaFmt])

  // --- Interpretación de estados ---
  // Reservada toma PRECEDENCIA absoluta si estado === 'RESERVADA'
  const esReservada = estadoNorm === 'RESERVADA'
  const esCancelada = estadoNorm === 'ANULADA' || estadoNorm === 'CANCELADA'

  const estadoPagadoWords = new Set(['CON_PAGO', 'PAGADA', 'PAGADO', 'VENDIDA'])
  const esPagada = (estadoPagadoWords.has(estadoNorm) || (tieneCliente && deudaNum === 0)) && tieneCliente

  const esAbonada = (estadoNorm === 'ABONADA' || (tieneCliente && typeof deudaNum === 'number' && deudaNum > 0))

  const badge = (label: string, className: string) => (
    <div className={`w-full py-1 rounded-md text-center font-extrabold text-[11px] tracking-wide ${className}`}>
      {label}
    </div>
  )

  const baseText = 'text-[10px] text-center space-y-1 text-black'

  const renderEstado = () => {
    // 1) Cancelada (muy alta prioridad)
    if (esCancelada) {
      return (
        <div className={baseText}>
          {badge('BOLETA CANCELADA', 'bg-red-600 text-white')}
          <p className="font-bold">Esta boleta no tiene validez</p>
        </div>
      )
    }

    // 2) RESERVADA (precede a abonada/pagada): con cliente
    if (esReservada && tieneCliente) {
      return (
        <div className={baseText}>
          {badge('RESERVADA', 'bg-blue-600 text-white')}
          <p className="font-semibold">A nombre de:</p>
          <p>{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
          <p className="font-bold">Reservada hasta: {reservadaHastaFmt ?? '—'}</p>
        </div>
      )
    }

    // 3) RESERVADA sin cliente => BLOQUEADA
    if (esReservada && !tieneCliente) {
      return (
        <div className={baseText}>
          {badge('BLOQUEADA', 'bg-amber-200 text-black')}
          <p className="font-semibold">Boleta bloqueada momentáneamente</p>
          
        </div>
      )
    }

    // 4) PAGADA (cliente + deuda 0 o estado explícito de pago/venta)
    if (esPagada) {
      return (
        <div className={baseText}>
          {badge('PAGADA', 'bg-green-700 text-white')}
          <p className="font-semibold">A nombre de:</p>
          <p>{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
        </div>
      )
    }

    // 5) ABONADA (cliente + deuda > 0)
    if (esAbonada) {
      return (
        <div className={baseText}>
          {badge('ABONADA', 'bg-orange-400 text-black')}
          <p className="font-extrabold">Deuda: {typeof deudaNum === 'number' ? `$${deudaNum.toLocaleString('es-CO')}` : '—'}</p>
          <p className="font-semibold">A nombre de:</p>
          <p>{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
        </div>
      )
    }

    // 6) DISPONIBLE (fallback cuando ninguno de los anteriores aplica)
    return (
      <div className={baseText}>
        {badge('DISPONIBLE', 'bg-emerald-300 text-black')}
      </div>
    )
  }

  return (
    <div className="flex border-2 border-black rounded-lg overflow-hidden bg-white mx-auto" style={{ width: '800px', height: '352px' }}>
      {/* LEFT */}
      <div className="flex-shrink-0 p-2 flex flex-col justify-between border-r-2 border-black" style={{ width: '179px' }}>
        <div className="text-[10px] text-center space-y-0.5 text-black font-medium">
          <p>- Boleta sin pagar no juega</p>
          <p>- 128 días de caducidad</p>
          <p>- Juega hasta quedar en poder del público</p>
        </div>

        {renderEstado()}

        <div className="flex justify-center">
          <img src={qrUrl} className="w-20 h-20 border border-black" />
        </div>

        <div className="space-y-1">
          <img
            src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcode)}&code=Code128&dpi=96`}
            className="w-full h-8"
          />
          <div className="text-center text-lg font-extrabold text-black">
            #{numero.toString().padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-shrink-0 h-full" style={{ width: '621px' }}>
        {hasImagen && !imageError && imagen ? (
          <img
            src={imagen}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <div className="text-center text-black">
              <p className="text-xl font-bold">{rifaNombre}</p>
              <p>Boleta #{numero.toString().padStart(4, '0')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}