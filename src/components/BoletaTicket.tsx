'use client'

import { useState, useEffect } from 'react'
import { getStorageImageUrl } from '@/lib/storageImageUrl'
import {
  BOLETA_WIDTH,
  BOLETA_LEFT_WIDTH,
  BOLETA_RIGHT_WIDTH,
  BOLETA_DEFAULT_HEIGHT,
  boletaHeightForImage,
} from '@/constants/boletaDimensions'
import { lineaCondicionesReserva } from '@/utils/boletaReservaText'

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
  abono?: number | string | null
  reservadaHasta?: string | null
  precio?: number | null
  nota?: string | null
}

export default function BoletaTicket(props: BoletaTicketProps) {
  const {
    qrUrl,
    numero,
    imagenUrl,
    rifaNombre,
    estado,
    clienteInfo,
    deuda,
    abono,
    precio,
    nota,
  } = props

  const [imageError, setImageError] = useState(false)
  const [ticketHeight, setTicketHeight] = useState(BOLETA_DEFAULT_HEIGHT)
  const imagen = getStorageImageUrl(imagenUrl ?? null) ?? imagenUrl
  const hasImagen = Boolean(imagen && imagen.trim())

  useEffect(() => {
    if (!hasImagen || !imagen) {
      setTicketHeight(BOLETA_DEFAULT_HEIGHT)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setTicketHeight(boletaHeightForImage(img.naturalWidth, img.naturalHeight))
    }
    img.onerror = () => setTicketHeight(BOLETA_DEFAULT_HEIGHT)
    img.src = imagen
  }, [imagen, hasImagen])

  const estadoNorm = (estado ?? '').toString().trim().toUpperCase()
  const deudaNum =
    typeof deuda === 'number'
      ? deuda
      : deuda
      ? Number(String(deuda).replace(/[^0-9.-]/g, '')) || null
      : null
  const abonoNum =
    typeof abono === 'number'
      ? abono
      : abono
      ? Number(String(abono).replace(/[^0-9.-]/g, '')) || null
      : null
  const precioNum =
    typeof precio === 'number'
      ? precio
      : precio
      ? Number(String(precio).replace(/[^0-9.-]/g, '')) || null
      : null
  const abonoMostrar =
    typeof abonoNum === 'number' && abonoNum > 0
      ? abonoNum
      : typeof precioNum === 'number' &&
        typeof deudaNum === 'number' &&
        deudaNum >= 0 &&
        precioNum >= deudaNum
      ? precioNum - deudaNum
      : null
  const tieneCliente = Boolean(clienteInfo && (clienteInfo.nombre || clienteInfo.identificacion))

  const esReservada = estadoNorm === 'RESERVADA'
  const esCancelada = estadoNorm === 'ANULADA' || estadoNorm === 'CANCELADA'
  const estadoPagadoWords = new Set(['CON_PAGO', 'PAGADA', 'PAGADO', 'VENDIDA'])
  const esPagada = (estadoPagadoWords.has(estadoNorm) || (tieneCliente && deudaNum === 0)) && tieneCliente
  const esAbonada =
    estadoNorm === 'ABONADA' || (tieneCliente && typeof deudaNum === 'number' && deudaNum > 0)

  const lineaReservaCondiciones = lineaCondicionesReserva({
    esReservada,
    esAbonada,
    tieneCliente,
  })

  const badge = (label: string, className: string) => (
    <div
      className={`w-full py-1 text-center font-extrabold text-[10px] ${className}`}
      style={{ letterSpacing: '0.04em' }}
    >
      {label}
    </div>
  )

  const baseText = 'text-[9px] text-left space-y-0.5 text-black leading-snug'

  const renderEstado = () => {
    if (esCancelada) {
      return (
        <div className={baseText}>
          {badge('BOLETA CANCELADA', 'bg-red-600 text-white')}
          <p className="font-bold text-center text-[8px]">Esta boleta no tiene validez</p>
        </div>
      )
    }

    if (esReservada && tieneCliente) {
      return (
        <div className={baseText}>
          {badge('RESERVADA', 'bg-blue-600 text-white')}
          {typeof deudaNum === 'number' && deudaNum > 0 && (
            <p className="font-extrabold text-center">
              Deuda: ${deudaNum.toLocaleString('es-CO')}
            </p>
          )}
          <p className="font-semibold">A nombre de:</p>
          <p className="break-words">{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
        </div>
      )
    }

    if (esReservada && !tieneCliente) {
      return (
        <div className={baseText}>
          {badge('BLOQUEADA', 'bg-amber-200 text-black')}
          <p className="font-semibold text-center text-[8px]">Boleta bloqueada momentáneamente</p>
        </div>
      )
    }

    if (esPagada) {
      return (
        <div className={baseText}>
          {badge('PAGADA', 'bg-green-700 text-white')}
          <p className="font-semibold">A nombre de:</p>
          <p className="break-words">{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
        </div>
      )
    }

    if (esAbonada) {
      return (
        <div className={baseText}>
          {badge('ABONADA', 'bg-orange-400 text-black')}
          {typeof abonoMostrar === 'number' && abonoMostrar > 0 && (
            <p className="font-extrabold text-center text-green-800">
              Abono: ${abonoMostrar.toLocaleString('es-CO')}
            </p>
          )}
          <p className="font-extrabold text-center">
            Deuda: {typeof deudaNum === 'number' ? `$${deudaNum.toLocaleString('es-CO')}` : '—'}
          </p>
          <p className="font-semibold">A nombre de:</p>
          <p className="break-words">{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
        </div>
      )
    }

    return (
      <div className={baseText}>
        {badge('DISPONIBLE', 'bg-emerald-300 text-black')}
      </div>
    )
  }

  const reglaReserva = lineaReservaCondiciones
    ? lineaReservaCondiciones.replace(/^-\s*/, '')
    : null

  return (
    <div
      className="boleta-ticket flex border-2 border-black overflow-hidden bg-white"
      style={{ width: `${BOLETA_WIDTH}px`, height: `${ticketHeight}px`, minWidth: `${BOLETA_WIDTH}px` }}
    >
      <div
        className="flex-shrink-0 flex flex-col bg-white border-r-2 border-black"
        style={{
          width: `${BOLETA_LEFT_WIDTH}px`,
          height: `${ticketHeight}px`,
          padding: '8px 7px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          overflow: 'hidden',
        }}
      >
        <div className="flex-shrink-0 text-[8px] text-black font-semibold leading-snug text-left">
          <p className="m-0">- Boleta sin pagar no juega</p>
          {reglaReserva ? (
            <p className="m-0 font-bold">{`- ${reglaReserva}`}</p>
          ) : (
            <p className="m-0">- Válida hasta el día del sorteo</p>
          )}
          <p className="m-0">- Juega hasta quedar en poder del público</p>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center my-1 overflow-hidden">
          <div className="w-full max-h-full overflow-hidden">{renderEstado()}</div>
        </div>

        <div className="flex-shrink-0 flex justify-center py-1">
          <img
            src={qrUrl}
            alt="QR"
            style={{ width: '68px', height: '68px', border: '1px solid #000' }}
          />
        </div>

        {nota && (
          <div className="flex-shrink-0 text-center text-[7px] italic text-slate-600 max-h-[20px] overflow-hidden leading-tight">
            {nota}
          </div>
        )}

        <div className="flex-shrink-0 text-center pt-0.5">
          <div className="text-lg font-extrabold text-black leading-tight">
            #{numero.toString().padStart(4, '0')}
          </div>
          {typeof precioNum === 'number' && precioNum > 0 && (
            <div className="text-[10px] font-bold text-black">
              ${precioNum.toLocaleString('es-CO')}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 h-full bg-white" style={{ width: `${BOLETA_RIGHT_WIDTH}px` }}>
        {hasImagen && !imageError && imagen ? (
          <img
            src={imagen}
            className="block w-full h-full"
            style={{ objectFit: 'fill' }}
            onLoad={(e) => {
              const img = e.currentTarget
              if (img.naturalWidth > 0) {
                setTicketHeight(boletaHeightForImage(img.naturalWidth, img.naturalHeight))
              }
            }}
            onError={() => setImageError(true)}
            alt={rifaNombre}
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
