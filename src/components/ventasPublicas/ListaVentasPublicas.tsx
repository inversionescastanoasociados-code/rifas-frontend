'use client'

import { useEffect, useState } from 'react'
import { VentaPublicaListado } from '@/types/ventasPublicas'
import { ventasPublicasApi } from '@/lib/ventasPublicasApi'

interface ListaVentasPublicasProps {
  onSelectVenta: (ventaId: string) => void
  filtroEstado?: string
}

export default function ListaVentasPublicas({
  onSelectVenta,
  filtroEstado
}: ListaVentasPublicasProps) {
  const [ventas, setVentas] = useState<VentaPublicaListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtroRifa, setFiltroRifa] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')

  const cargarVentas = async () => {
    try {
      setLoading(true)
      setError(null)

      let response

      if (filtroEstado === 'pendientes') {
        response = await ventasPublicasApi.getVentasPublicasPendientes()
      } else {
        response = await ventasPublicasApi.getVentasPublicas(
          filtroEstado || undefined,
          filtroRifa || undefined,
          filtroCliente || undefined
        )
      }

      if (!response.success) {
        throw new Error(response.message || 'Error cargando ventas')
      }

      setVentas(response.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(cargarVentas, 300)
    return () => clearTimeout(timer)
  }, [filtroEstado, filtroRifa, filtroCliente])

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PAGADA':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'ABONADA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'PENDIENTE':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'CANCELADA':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300'
    }
  }

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Filtrar por nombre de rifa..."
            value={filtroRifa}
            onChange={(e) => setFiltroRifa(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filtrar por cliente..."
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-slate-600 mt-3">Cargando ventas...</p>
        </div>
      )}

      {/* Mensajes de error */}
      {error && !loading && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-red-700 font-medium">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Lista vacía */}
      {!loading && !error && ventas.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <svg
            className="w-12 h-12 text-slate-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-slate-600">No hay ventas que mostrar</p>
        </div>
      )}

      {/* Lista de ventas */}
      {!loading && !error && ventas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Ventas encontradas: {ventas.length}
            </h3>
          </div>

          {ventas.map((venta) => (
            <div
              key={venta.id}
              onClick={() => onSelectVenta(venta.id)}
              className="bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* ID y Fecha */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    ID VENTA
                  </p>
                  <p className="text-sm font-mono text-slate-900">
                    {venta.id.substring(0, 8)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(venta.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>

                {/* Cliente */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    CLIENTE
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {venta.cliente_nombre}
                  </p>
                  <p className="text-xs text-slate-600">{venta.cliente_telefono}</p>
                </div>

                {/* Rifa */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">RIFA</p>
                  <p className="text-sm text-slate-900">{venta.rifa_nombre}</p>
                  <p className="text-xs text-slate-600">
                    {venta.cantidad_boletas} boleta
                    {venta.cantidad_boletas !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Montos */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    TOTAL / PAGADO
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatoMoneda(venta.monto_total)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      venta.abono_total > 0
                        ? 'text-green-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {formatoMoneda(venta.abono_total)}
                  </p>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoBadgeColor(venta.estado_venta)}`}
                  >
                    {venta.estado_venta}
                  </span>
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
