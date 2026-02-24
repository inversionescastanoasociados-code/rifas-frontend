'use client'

import { WebSocketEvent, BoletaBloqueadaEvent, BoletaVendidaEvent } from '@/types/ventas'

interface RealTimeNotificationsProps {
  eventos: WebSocketEvent[]
}

export function RealTimeNotifications({ eventos }: RealTimeNotificationsProps) {
  const getEventoMessage = (event: WebSocketEvent) => {
    switch (event.type) {
      case 'BOLETA_BLOQUEADA':
        const bloqueada = event.data as BoletaBloqueadaEvent
        return `Boleta #${bloqueada.numero} bloqueada por ${bloqueada.bloqueado_por}`
        
      case 'BOLETA_DESBLOQUEADA':
        const desbloqueada = event.data as BoletaBloqueadaEvent
        return `Boleta #${desbloqueada.numero} liberada`
        
      case 'BOLETA_VENDIDA':
        const vendida = event.data as BoletaVendidaEvent
        return `Boleta #${vendida.numero} vendida`
        
      case 'VENTA_COMPLETADA':
        return `Venta completada: ${event.data.boletas_vendidas} boletas`
        
      default:
        return 'Evento desconocido'
    }
  }

  const getEventoColor = (type: string) => {
    switch (type) {
      case 'BOLETA_BLOQUEADA':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'BOLETA_DESBLOQUEADA':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'BOLETA_VENDIDA':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'VENTA_COMPLETADA':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getEventoIcon = (type: string) => {
    switch (type) {
      case 'BOLETA_BLOQUEADA':
        return '🔒'
      case 'BOLETA_DESBLOQUEADA':
        return '🔓'
      case 'BOLETA_VENDIDA':
        return '🎫'
      case 'VENTA_COMPLETADA':
        return '💰'
      default:
        return '📢'
    }
  }

  if (eventos.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 overflow-hidden">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200">
          <h3 className="text-sm font-medium text-slate-900">Actividad en Tiempo Real</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {eventos.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className={`p-3 border-b border-slate-100 ${getEventoColor(event.type)}`}
            >
              <div className="flex items-start space-x-2">
                <span className="text-lg">{getEventoIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {getEventoMessage(event)}
                  </p>
                  <p className="text-xs opacity-75">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
