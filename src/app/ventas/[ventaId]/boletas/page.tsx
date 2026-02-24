'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ventasApi } from '@/lib/ventasApi'
import { getStorageImageUrl } from '@/lib/storageImageUrl'

interface BoletaInfo {
  id: string
  numero: number
  estado: string
  precio_boleta?: number
  total_pagado_boleta?: number
  saldo_pendiente_boleta?: number
  qr_url?: string
  imagen_url?: string
}

export default function VentasBoletasPage() {
  const params = useParams()
  const router = useRouter()
  const ventaId = params.ventaId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [boletas, setBoletas] = useState<BoletaInfo[]>([])
  const [estadoVenta, setEstadoVenta] = useState('')

  useEffect(() => {
    if (!ventaId) return
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchDetalle()
  }, [ventaId, router])

  const fetchDetalle = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ventasApi.getVentaDetalleFinanciero(ventaId)
      const data = response.data as any
      setClienteNombre(data.cliente_nombre ?? data.nombre ?? 'Cliente')
      setBoletas(data.boletas ?? [])
      setEstadoVenta(data.estado_venta ?? '')
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar la venta')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Cargando boletas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow border border-red-200 p-6 max-w-md">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">
            Entregar boletas
          </h1>
          <p className="text-slate-600 text-sm">
            Cliente: <span className="font-medium text-slate-800">{clienteNombre}</span>
            {estadoVenta && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {estadoVenta}
              </span>
            )}
          </p>
        </div>

        {boletas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-600">
            No hay boletas asociadas a esta venta.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boletas.map((boleta) => (
              <div
                key={boleta.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-between gap-3"
              >
                <div className="text-2xl font-bold text-slate-800">
                  #{boleta.numero}
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {boleta.estado}
                </span>
                {(boleta.imagen_url || boleta.qr_url) && (
                  <div className="h-20 flex items-center justify-center">
                    <img
                      src={getStorageImageUrl(boleta.imagen_url) ?? getStorageImageUrl(boleta.qr_url) ?? boleta.imagen_url ?? boleta.qr_url}
                      alt={`Boleta ${boleta.numero}`}
                      className="max-h-16 w-auto object-contain"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 w-full justify-center">
                  <Link
                    href={`/boletas/${boleta.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/boletas/${boleta.id}/print`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Imprimir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}
