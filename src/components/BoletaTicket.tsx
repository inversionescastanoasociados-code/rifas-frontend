'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { getStorageImageUrl } from '@/lib/storageImageUrl'
import {
  BOLETA_WIDTH,
  BOLETA_LEFT_WIDTH,
  BOLETA_RIGHT_WIDTH,
  BOLETA_DEFAULT_HEIGHT,
  boletaHeightForImage,
} from '@/constants/boletaDimensions'
import { lineaCondicionesReserva, textoReservadaHasta } from '@/utils/boletaReservaText'
import { BOLETA_LEFT_BG, BOLETA_LEFT_BORDER, BOLETA_LEFT_FONT, BOLETA_LEFT_MONO } from '@/utils/boletaLeftPanelTheme'

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

type StatusTone = 'reserved' | 'paid' | 'abonada' | 'available' | 'cancel' | 'blocked'

const STATUS_STYLES: Record<StatusTone, string> = {
  reserved: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  paid: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100',
  abonada: 'border-orange-400/40 bg-orange-500/10 text-orange-100',
  available: 'border-teal-400/35 bg-teal-500/10 text-teal-100',
  cancel: 'border-red-400/40 bg-red-500/10 text-red-200',
  blocked: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <div
      className={`w-full py-1.5 px-1 text-center rounded-md border text-[8px] font-semibold uppercase tracking-[0.2em] ${STATUS_STYLES[tone]}`}
    >
      {label}
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[7px] uppercase tracking-[0.16em] text-slate-500 font-semibold mt-1.5 mb-0.5">
      {children}
    </p>
  )
}

function MoneyRow({ label, amount, className }: { label: string; amount: number; className: string }) {
  return (
    <div className={`mt-1 ${className}`}>
      <span className="text-[7px] uppercase tracking-[0.14em] opacity-80 block">{label}</span>
      <span className="text-[10px] font-semibold tabular-nums">${amount.toLocaleString('es-CO')}</span>
    </div>
  )
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
    reservadaHasta,
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
    reservadaHasta,
    esReservada,
    esAbonada,
    tieneCliente,
  })
  const textoReserva = textoReservadaHasta(reservadaHasta)
  const mostrarFechaReserva =
    Boolean(textoReserva) && tieneCliente && (esReservada || esAbonada)

  const clienteBlock = (
    <>
      <FieldLabel>A nombre de</FieldLabel>
      <p className="text-[9px] text-slate-100 leading-snug font-medium">{clienteInfo?.nombre ?? '—'}</p>
      <p className="text-[8px] text-slate-400 tabular-nums">CC {clienteInfo?.identificacion ?? '—'}</p>
    </>
  )

  const reservaDateBlock = mostrarFechaReserva ? (
    <p className="text-[8px] text-cyan-200/95 font-medium mt-2 pt-2 border-t border-white/10 leading-snug">
      {textoReserva}
    </p>
  ) : null

  const renderEstado = () => {
    if (esCancelada) {
      return (
        <div className="space-y-1">
          <StatusPill label="Boleta cancelada" tone="cancel" />
          <p className="text-[8px] text-slate-400">Sin validez</p>
        </div>
      )
    }

    if (esReservada && tieneCliente) {
      return (
        <div>
          <StatusPill label="Reservada" tone="reserved" />
          {typeof deudaNum === 'number' && deudaNum > 0 && (
            <MoneyRow label="Deuda" amount={deudaNum} className="text-amber-200" />
          )}
          {clienteBlock}
          {reservaDateBlock}
        </div>
      )
    }

    if (esReservada && !tieneCliente) {
      return (
        <div>
          <StatusPill label="Bloqueada" tone="blocked" />
          <p className="text-[8px] text-slate-400 mt-1">Temporalmente no disponible</p>
        </div>
      )
    }

    if (esPagada) {
      return (
        <div>
          <StatusPill label="Pagada" tone="paid" />
          {clienteBlock}
        </div>
      )
    }

    if (esAbonada) {
      return (
        <div>
          <StatusPill label="Abonada" tone="abonada" />
          {typeof abonoMostrar === 'number' && abonoMostrar > 0 && (
            <MoneyRow label="Abono" amount={abonoMostrar} className="text-emerald-300" />
          )}
          {typeof deudaNum === 'number' && (
            <MoneyRow label="Deuda" amount={deudaNum} className="text-amber-200" />
          )}
          {clienteBlock}
          {reservaDateBlock}
        </div>
      )
    }

    return (
      <div>
        <StatusPill label="Disponible" tone="available" />
      </div>
    )
  }

  const reglaSecundaria = lineaReservaCondiciones
    ? lineaReservaCondiciones.replace(/^-\s*/, '')
    : 'Válida hasta el día del sorteo'

  return (
    <div
      className="boleta-ticket flex overflow-hidden bg-white shadow-sm"
      style={{
        width: `${BOLETA_WIDTH}px`,
        height: `${ticketHeight}px`,
        minWidth: `${BOLETA_WIDTH}px`,
        border: '1px solid rgba(15, 23, 42, 0.12)',
      }}
    >
      <div
        className="flex-shrink-0 flex flex-col justify-between"
        style={{
          width: `${BOLETA_LEFT_WIDTH}px`,
          height: `${ticketHeight}px`,
          padding: '10px 9px',
          background: BOLETA_LEFT_BG,
          borderRight: BOLETA_LEFT_BORDER,
          fontFamily: BOLETA_LEFT_FONT,
          overflow: 'hidden',
        }}
      >
        <div className="text-[7.5px] uppercase tracking-[0.14em] leading-relaxed font-semibold text-slate-500">
          <p className="m-0 mb-1">Boleta sin pagar no juega</p>
          <p className="m-0 mb-1 text-sky-300/90 normal-case tracking-normal">{reglaSecundaria}</p>
          <p className="m-0">Juega hasta quedar en poder del público</p>
        </div>

        <div className="flex-1 flex items-center my-1.5 min-h-0">
          <div className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-left">
            {renderEstado()}
          </div>
        </div>

        <div className="flex justify-center mb-1.5">
          <div className="rounded-lg bg-white p-[5px] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
            <img src={qrUrl} alt="QR" style={{ width: '72px', height: '72px', display: 'block' }} />
          </div>
        </div>

        {nota && (
          <div className="text-center text-[7px] italic text-slate-500 max-h-[22px] overflow-hidden leading-tight mb-1">
            {nota}
          </div>
        )}

        <div className="text-center pt-1 border-t border-white/[0.08]">
          <div
            className="text-[20px] font-semibold text-slate-50 leading-none tracking-tight tabular-nums"
            style={{ fontFamily: BOLETA_LEFT_MONO }}
          >
            #{numero.toString().padStart(4, '0')}
          </div>
          {typeof precioNum === 'number' && precioNum > 0 && (
            <div className="text-[10px] font-medium text-slate-400 mt-0.5 tabular-nums">
              ${precioNum.toLocaleString('es-CO')}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 h-full" style={{ width: `${BOLETA_RIGHT_WIDTH}px` }}>
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
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <div className="text-center text-slate-800">
              <p className="text-xl font-bold">{rifaNombre}</p>
              <p className="text-sm">Boleta #{numero.toString().padStart(4, '0')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
