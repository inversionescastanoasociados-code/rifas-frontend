'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { boletaApi } from '@/lib/boletaApi'
import BoletaTicket from '@/components/BoletaTicket'
import type { BoletaDetail } from '@/types/boleta'

export default function BoletaPrintPage() {
  const params = useParams()
  const router = useRouter()
  const [boleta, setBoleta] = useState<BoletaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      router.push('/login')
      return
    }

    fetchBoletaDetail()
  }, [router])

  const fetchBoletaDetail = async () => {
    try {
      setLoading(true)
      const boletaId = params.id as string
      
      if (!boletaId) {
        setError('ID de boleta no proporcionado')
        return
      }

      const response = await boletaApi.getBoletaById(boletaId)
      setBoleta(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los detalles de la boleta')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    if (boleta) {
      // Auto-print when page loads
      setTimeout(() => {
        handlePrint()
      }, 1000)
    }
  }, [boleta])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-500">Cargando boleta para impresión...</div>
      </div>
    )
  }

  if (error || !boleta) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error || 'No se encontró la boleta'}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print mb-6 flex justify-center space-x-4">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Boleta
        </button>
        <button
          onClick={() => window.close()}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cerrar
        </button>
      </div>

      {/* Mismo componente BoletaTicket que la vista de detalle — diseño idéntico */}
      <div className="flex justify-center">
        <BoletaTicket
          qrUrl={boleta.qr_url}
          barcode={boleta.barcode}
          numero={boleta.numero}
          imagenUrl={boleta.imagen_url}
          rifaNombre={boleta.rifa_nombre}
          estado={boleta.estado}
          clienteInfo={boleta.cliente_info}
        />
      </div>

      {/* Additional Information - Hidden when printing */}
      <div className="no-print mt-6 max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Información Adicional</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">ID Boleta:</span>
            <p className="font-medium text-slate-900">{boleta.id}</p>
          </div>
          <div>
            <span className="text-slate-600">Código Barras:</span>
            <p className="font-mono text-slate-900">{boleta.barcode}</p>
          </div>
          <div>
            <span className="text-slate-600">Fecha Creación:</span>
            <p className="text-slate-900">{new Date(boleta.created_at).toLocaleString('es-CO')}</p>
          </div>
          <div>
            <span className="text-slate-600">QR URL:</span>
            <p className="text-slate-900 break-all">{boleta.qr_url}</p>
          </div>
        </div>

        {boleta.cliente_info && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="font-medium text-slate-900 mb-2">Información del Cliente</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Nombre:</span>
                <p className="text-slate-900">{boleta.cliente_info.nombre}</p>
              </div>
              <div>
                <span className="text-slate-600">Teléfono:</span>
                <p className="text-slate-900">{boleta.cliente_info.telefono}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .min-h-screen {
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .border-2 {
            border-width: 2pt !important;
          }
          
          img {
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
            page-break-inside: avoid;
          }
          
          .w-2\\/3 {
            width: 66.666667% !important;
          }
          
          .w-1\\/3 {
            width: 33.333333% !important;
          }
          
          .whitespace-nowrap {
            white-space: nowrap !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .space-y-2 > * + * {
            margin-top: 0.5rem !important;
          }
          
          .w-28 {
            width: 7rem !important;
          }
          
          .h-28 {
            height: 7rem !important;
          }
          
          .h-12 {
            height: 3rem !important;
          }
        }
      `}</style>
    </div>
  )
}
