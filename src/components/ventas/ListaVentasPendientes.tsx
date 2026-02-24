'use client'

import { useEffect, useState } from 'react'
import RegistrarAbono from './RegistrarAbono'
import { ventasApi } from '@/lib/ventasApi'

interface VentaPendiente {
  id: number
  monto_total: number
  total_pagado: number
  saldo_pendiente: number
  estado_venta: string
  created_at: string
}

interface Props {
  clienteId?: string
}

export default function ListaVentasPendientes({ clienteId }: Props) {
  const [ventas, setVentas] = useState<VentaPendiente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ventaSeleccionada, setVentaSeleccionada] =
    useState<VentaPendiente | null>(null)

  const fetchVentas = async () => {
    if (!clienteId) return

    try {
      setLoading(true)
      setError(null)

      const response = await ventasApi.getVentasPorCliente(clienteId)

      if (!response.success) {
        throw new Error(response.message)
      }

      setVentas(response.data)
    } catch (err: any) {
      setError(err.message || 'Error cargando ventas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVentas()
  }, [clienteId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600">Cargando ventas pendientes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <p className="text-red-600 font-medium">Error:</p>
        <p className="text-slate-700 mt-1">{error}</p>
      </div>
    )
  }

  if (!ventas.length && !ventaSeleccionada) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Ventas Pendientes
        </h2>
        <p className="text-slate-600">
          Este cliente no tiene ventas pendientes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!ventaSeleccionada && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Ventas Pendientes
          </h2>

          <div className="space-y-4">
            {ventas.map((venta) => (
              <div
                key={venta.id}
                className="border border-slate-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">
                    Venta #{venta.id}
                  </p>

                  <p className="text-sm text-slate-500">
                    Fecha:{' '}
                    {new Date(venta.created_at).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-slate-700">
                    Total: ${venta.monto_total.toLocaleString()}
                  </p>

                  <p className="text-sm text-green-600">
                    Pagado: ${venta.total_pagado.toLocaleString()}
                  </p>

                  <p className="text-sm text-red-600 font-semibold">
                    Saldo: ${venta.saldo_pendiente.toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => setVentaSeleccionada(venta)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Gestionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {ventaSeleccionada && (
        <RegistrarAbono
          ventaId={ventaSeleccionada.id.toString()}
          onBack={() => {
            setVentaSeleccionada(null)
            fetchVentas() // 🔥 refresca correctamente después de volver
          }}
          onAbonoRegistrado={() => {
            setVentaSeleccionada(null)
            fetchVentas() // 🔥 refresca lista después de abonar
          }}
        />
      )}
    </div>
  )
}