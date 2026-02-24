'use client'

import { useState } from 'react'
import BoletaTicket from './BoletaTicket'

interface BoletaPreviewProps {
  qrBaseUrl: string
  imagenUrl: string
  diseñoTemplate: string
  rifaId: string
  boletaNumero: number
  barcode: string
}

export default function BoletaPreview({
  qrBaseUrl,
  imagenUrl,
  diseñoTemplate,
  rifaId,
  boletaNumero,
  barcode,
}: BoletaPreviewProps) {
  const [imageError, setImageError] = useState(false)

  // URL objetivo que debe resolver el QR (p. ej. link a la boleta)
  const targetUrl = `${qrBaseUrl}/${rifaId}/${boletaNumero}`

  // Genero la imagen del QR (BoletaTicket espera una URL de imagen para el QR)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    targetUrl
  )}`

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Vista Previa de Boleta</h3>

      {/* Reutilizamos BoletaTicket para renderizar la preview como DISPONIBLE */}
      <div className="mb-4">
        <BoletaTicket
          qrUrl={qrImageUrl}
          barcode={barcode}
          numero={boletaNumero}
          imagenUrl={imagenUrl}
          rifaNombre={diseñoTemplate ?? `Rifa ${rifaId}`}
          estado="DISPONIBLE"
        />
      </div>

      {/* Información de configuración (opcional, igual que antes) */}
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="font-medium text-slate-700 mb-1">Configuración QR:</div>
          <div className="text-slate-600 break-all text-xs">{targetUrl}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="font-medium text-slate-700 mb-1">Código de Barras:</div>
          <div className="text-slate-600 font-mono text-xs">{barcode}</div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        <p>• Vista previa (DISPONIBLE) del diseño de boleta impresa</p>
        <p>• El QR apunta a: {targetUrl}</p>
        <p>• Cada boleta tendrá número único y código de barras</p>
      </div>
    </div>
  )
}