'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClienteSearch from '@/components/ventas/ClienteSearch'
import { Cliente } from '@/types/ventas'
import { ventasApi } from '@/lib/ventasApi'
import ListaVentasPendientes from '@/components/ventas/ListaVentasPendientes'

interface ResultadoBusquedaBoleta {
  boleta_buscada: number
  rifa_nombre: string
  venta_id: string
  estado_venta: string
  created_at: string
  cliente: {
    id: string
    nombre: string
    telefono: string
    email?: string
    identificacion?: string
    direccion?: string
  }
  monto_total: number
  total_pagado: number
  saldo_pendiente: number
  boletas: any[]
}

export default function GestionarAbonosPage() {
  const router = useRouter()

  const [modoBusqueda, setModoBusqueda] = useState<'boleta' | 'cliente'>('boleta')
  const [numeroBoleta, setNumeroBoleta] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)
  const [resultadosBoleta, setResultadosBoleta] = useState<ResultadoBusquedaBoleta[] | null>(null)
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState<string | null>(null)

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

  const volverVentas = () => router.push('/ventas')
  const volverDashboard = () => router.push('/dashboard')

  const buscarPorBoleta = async () => {
    const num = parseInt(numeroBoleta.trim())
    if (isNaN(num) || num <= 0) {
      setErrorBusqueda('Ingresa un número de boleta válido')
      return
    }

    setBuscando(true)
    setErrorBusqueda(null)
    setResultadosBoleta(null)
    setVentaSeleccionadaId(null)

    try {
      const response = await ventasApi.buscarBoletaParaAbono(num)
      const data = response.data

      if (!data.encontrada) {
        setErrorBusqueda(data.mensaje || 'Boleta no encontrada o sin saldo pendiente')
        return
      }

      setResultadosBoleta(data.resultados)

      // Si solo hay un resultado, ir directamente
      if (data.resultados.length === 1) {
        setVentaSeleccionadaId(data.resultados[0].venta_id)
      }
    } catch (err: any) {
      setErrorBusqueda(err.message || 'Error buscando boleta')
    } finally {
      setBuscando(false)
    }
  }

  const resetBusqueda = () => {
    setNumeroBoleta('')
    setResultadosBoleta(null)
    setVentaSeleccionadaId(null)
    setErrorBusqueda(null)
    setClienteSeleccionado(null)
  }

  // Si ya tenemos una venta seleccionada (por boleta), ir al componente RegistrarAbono
  const ventaResultado = resultadosBoleta?.find(r => r.venta_id === ventaSeleccionadaId)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <button type="button" onClick={volverVentas} className="text-slate-600 hover:text-slate-900">
              ← Ventas
            </button>
            <button type="button" onClick={volverDashboard} className="text-slate-500 hover:text-slate-700 text-sm">
              Dashboard
            </button>
            <h1 className="text-xl font-semibold text-slate-900">Gestionar Abonos</h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Selector de modo de búsqueda */}
        {!ventaSeleccionadaId && !clienteSeleccionado && (
          <div className="space-y-6">
            {/* Tabs de búsqueda */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => { setModoBusqueda('boleta'); resetBusqueda() }}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    modoBusqueda === 'boleta'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🎫 Buscar por # Boleta
                </button>
                <button
                  onClick={() => { setModoBusqueda('cliente'); resetBusqueda() }}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    modoBusqueda === 'cliente'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  👤 Buscar por Cliente
                </button>
              </div>

              <div className="p-6">
                {modoBusqueda === 'boleta' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Ingresa el número de la boleta para ver los datos del cliente y registrar abonos.
                    </p>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">#</span>
                        <input
                          type="number"
                          value={numeroBoleta}
                          onChange={(e) => setNumeroBoleta(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && buscarPorBoleta()}
                          placeholder="Ej: 42"
                          min={1}
                          className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-black text-lg font-semibold"
                        />
                      </div>
                      <button
                        onClick={buscarPorBoleta}
                        disabled={buscando || !numeroBoleta.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium whitespace-nowrap"
                      >
                        {buscando ? 'Buscando...' : '🔍 Buscar'}
                      </button>
                    </div>

                    {errorBusqueda && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                        <span className="text-amber-600 text-lg">⚠️</span>
                        <div>
                          <p className="text-amber-800 font-medium text-sm">{errorBusqueda}</p>
                          <p className="text-amber-700 text-xs mt-1">Solo boletas reservadas o con saldo pendiente aparecen aquí.</p>
                        </div>
                      </div>
                    )}

                    {/* Resultados de búsqueda por boleta */}
                    {resultadosBoleta && resultadosBoleta.length > 1 && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 font-medium">Se encontraron {resultadosBoleta.length} resultados:</p>
                        {resultadosBoleta.map((r) => (
                          <button
                            key={r.venta_id}
                            onClick={() => setVentaSeleccionadaId(r.venta_id)}
                            className="w-full text-left border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-slate-900">{r.rifa_nombre}</p>
                                <p className="text-sm text-slate-600">
                                  Cliente: {r.cliente.nombre} · {r.cliente.telefono}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                  {r.boletas.length} boleta{r.boletas.length !== 1 ? 's' : ''} · Estado: {r.estado_venta}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-red-600 font-semibold">
                                  Saldo: ${r.saldo_pendiente.toLocaleString('es-CO')}
                                </p>
                                <p className="text-xs text-slate-500">
                                  de ${r.monto_total.toLocaleString('es-CO')}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {modoBusqueda === 'cliente' && (
                  <ClienteSearch
                    permitirCrear={false}
                    onClienteSelected={(cliente) => setClienteSeleccionado(cliente)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Si se encontró por boleta y hay una venta seleccionada */}
        {ventaSeleccionadaId && (
          <div className="space-y-6">
            {/* Info rápida del resultado de búsqueda */}
            {ventaResultado && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎫</span>
                  <div>
                    <p className="text-sm text-blue-700">
                      Boleta #{ventaResultado.boleta_buscada.toString().padStart(4, '0')} encontrada en
                    </p>
                    <p className="font-semibold text-blue-900">{ventaResultado.rifa_nombre}</p>
                  </div>
                </div>
                <button
                  onClick={resetBusqueda}
                  className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  Nueva búsqueda
                </button>
              </div>
            )}

            <ListaVentasPendientes
              clienteId={ventaResultado?.cliente.id}
              ventaIdDirecta={ventaSeleccionadaId}
            />
          </div>
        )}

        {/* Si busca por cliente */}
        {clienteSeleccionado && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{clienteSeleccionado.nombre}</h2>
                    <p className="text-sm text-slate-600">{clienteSeleccionado.telefono}</p>
                    {clienteSeleccionado.identificacion && (
                      <p className="text-xs text-slate-500">CC: {clienteSeleccionado.identificacion}</p>
                    )}
                    {clienteSeleccionado.email && (
                      <p className="text-xs text-slate-500">{clienteSeleccionado.email}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={resetBusqueda}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cambiar
                </button>
              </div>
            </div>

            <ListaVentasPendientes clienteId={clienteSeleccionado.id} />
          </div>
        )}
      </main>
    </div>
  )
}