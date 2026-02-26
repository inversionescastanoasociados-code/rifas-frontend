'use client'

import { useEffect, useState, useCallback } from 'react'
import { ventasPublicasApi } from '@/lib/ventasPublicasApi'
import { VentaPublicaListado } from '@/types/ventasPublicas'

interface VentasOnlineBannerProps {
  onVerPendientes?: () => void
}

/**
 * Banner que muestra en tiempo real las ventas online pendientes.
 * Se refresca automáticamente cada 30 segundos.
 * Muestra notificación cuando llega una nueva venta.
 */
export default function VentasOnlineBanner({ onVerPendientes }: VentasOnlineBannerProps) {
  const [pendientes, setPendientes] = useState<VentaPublicaListado[]>([])
  const [count, setCount] = useState(0)
  const [prevCount, setPrevCount] = useState(0)
  const [showPulse, setShowPulse] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [expanded, setExpanded] = useState(false)

  const fetchPendientes = useCallback(async () => {
    try {
      const response = await ventasPublicasApi.getVentasPublicasPendientes()
      if (response.success && response.data) {
        const newCount = response.data.length
        
        // Detectar si llegó una nueva venta
        if (newCount > count && count > 0) {
          setShowPulse(true)
          // Sonido de notificación
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgiKashWA4LlF5k6+riWI7OVN4j62vjGtDP0ttgaqwkXBIRGh6nq2XeVFPXHCRpaKEXk1TaIOdq5V7WVRba4uesJmDY1xbbYadqZqGaGFfboKXpJSJa2NjaH+PlZCLcGhmZHN9iIqJeXJqZWdyfH2BgHl1bmtrb3N0dHZ1c3FvcHFxcnNzcnJycXBwcHBxcXFxcXFxcA==')
            audio.volume = 0.3
            audio.play().catch(() => {})
          } catch {}
          
          setTimeout(() => setShowPulse(false), 3000)
        }
        
        setPrevCount(count)
        setCount(newCount)
        setPendientes(response.data)
        setLastUpdate(new Date())
      }
    } catch (err) {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [count])

  // Polling cada 30 segundos
  useEffect(() => {
    fetchPendientes()
    const interval = setInterval(fetchPendientes, 30000)
    return () => clearInterval(interval)
  }, [fetchPendientes])

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor)
  }

  const timeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)
    
    if (diffMin < 1) return 'Ahora mismo'
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHr < 24) return `Hace ${diffHr}h`
    return `Hace ${diffDays}d`
  }

  if (loading) return null
  if (count === 0) return null

  return (
    <div className={`mb-6 rounded-xl border-2 transition-all duration-500 ${
      showPulse 
        ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg shadow-orange-100 animate-pulse' 
        : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
    }`}>
      {/* Header clickeable */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Icono con badge */}
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              showPulse ? 'bg-orange-500' : 'bg-orange-400'
            } text-white shadow-md transition-colors`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            {/* Badge con número */}
            <span className={`absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full ${
              showPulse ? 'bg-red-500 animate-bounce' : 'bg-red-500'
            }`}>
              {count}
            </span>
          </div>

          <div>
            <h3 className="text-base font-semibold text-orange-900">
              {count === 1 
                ? '🔔 1 Venta Online Pendiente' 
                : `🔔 ${count} Ventas Online Pendientes`
              }
            </h3>
            <p className="text-xs text-orange-700 mt-0.5">
              {showPulse && '¡Nueva venta recibida! • '}
              Actualizado: {lastUpdate ? lastUpdate.toLocaleTimeString('es-CO') : '...'} • 
              Auto-refresh cada 30s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onVerPendientes) onVerPendientes()
            }}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
          >
            Ver Todas →
          </button>
          <svg 
            className={`w-5 h-5 text-orange-600 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Lista expandible de las últimas ventas */}
      {expanded && (
        <div className="border-t border-orange-200 px-4 pb-4">
          <div className="mt-3 space-y-2">
            {pendientes.slice(0, 5).map((venta) => (
              <div 
                key={venta.id}
                onClick={() => onVerPendientes && onVerPendientes()}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-100 hover:border-orange-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🛒</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {venta.cliente_nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      {venta.rifa_nombre} • {venta.cantidad_boletas} boleta{venta.cantidad_boletas !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatoMoneda(Number(venta.monto_total))}
                  </p>
                  <p className="text-xs text-orange-600 font-medium">
                    {timeAgo(venta.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {count > 5 && (
              <p className="text-xs text-center text-orange-600 font-medium pt-2">
                + {count - 5} más...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
