'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ventasPublicasApi } from '@/lib/ventasPublicasApi'

interface BoletaReservada {
  boleta_id: string
  numero: number
  estado: string
  bloqueo_hasta: string | null
  reserva_token: string | null
  rifa_id: string
  rifa_nombre: string
  fecha_sorteo: string | null
  cliente_id: string | null
  cliente_nombre: string | null
  cliente_telefono: string | null
  cliente_identificacion: string | null
  venta_id: string | null
  estado_venta: string | null
  origen: 'ONLINE' | 'PUNTO_FISICO'
  fecha_reserva: string | null
}

interface BoletaDevuelta {
  boleta_id: string
  numero: number
  estado: string
  es_devolucion: boolean
  devolucion_en: string | null
  cliente_id: string | null
  cliente_nombre: string | null
  cliente_telefono: string | null
  rifa_id: string
  rifa_nombre: string
  precio_boleta: number
  fecha_sorteo: string | null
  disponible_publicacion?: boolean
}

type VistaBoletas = 'reservadas' | 'devueltas'
type FiltroDevolucion = 'disponibles' | 'asignadas'

function esDevolucionDisponible(b: BoletaDevuelta) {
  return (
    b.disponible_publicacion === true ||
    (b.es_devolucion && b.estado === 'DISPONIBLE' && !b.cliente_id)
  )
}

function esDevolucionAsignada(b: BoletaDevuelta) {
  return !!b.devolucion_en && !!b.cliente_id
}

export default function BoletasReservadasPage() {
  const router = useRouter()
  const [vista, setVista] = useState<VistaBoletas>('reservadas')
  const [boletas, setBoletas] = useState<BoletaReservada[]>([])
  const [boletasDevueltas, setBoletasDevueltas] = useState<BoletaDevuelta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroOrigen, setFiltroOrigen] = useState<string>('TODOS')
  const [filtroRifa, setFiltroRifa] = useState<string>('TODAS')
  const [liberando, setLiberando] = useState<string | null>(null)
  const [liberandoVenta, setLiberandoVenta] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    tipo: 'boleta' | 'venta'
    id: string
    mensaje: string
    esDevolucion: boolean
  } | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [filtroDevolucion, setFiltroDevolucion] = useState<FiltroDevolucion>('disponibles')
  const [modoCaptura, setModoCaptura] = useState(false)

  const fetchBoletas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [resReservadas, resDevueltas] = await Promise.all([
        ventasPublicasApi.getBoletasReservadas(),
        ventasPublicasApi.getBoletasDevueltas(),
      ])
      if (resReservadas.success && resReservadas.data) {
        setBoletas(resReservadas.data)
      } else {
        throw new Error(resReservadas.message || 'Error cargando boletas reservadas')
      }
      if (resDevueltas.success && resDevueltas.data) {
        setBoletasDevueltas(resDevueltas.data)
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchBoletas()
  }, [fetchBoletas, router])

  // Mostrar mensaje de éxito temporal
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  // Liberar una boleta individual
  const handleLiberarBoleta = async (boletaId: string, esDevolucion: boolean) => {
    try {
      setLiberando(boletaId)
      setConfirmDialog(null)
      const response = await ventasPublicasApi.liberarBoleta(boletaId, esDevolucion)
      if (response.success) {
        showSuccess(esDevolucion ? 'Boleta liberada y marcada como devolución' : 'Boleta liberada correctamente')
        await fetchBoletas()
      } else {
        throw new Error(response.message || 'Error al liberar boleta')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLiberando(null)
    }
  }

  // Liberar todas las boletas de una venta
  const handleLiberarVenta = async (ventaId: string, esDevolucion: boolean) => {
    try {
      setLiberandoVenta(ventaId)
      setConfirmDialog(null)
      const response = await ventasPublicasApi.liberarBoletasDeVenta(ventaId, esDevolucion)
      if (response.success) {
        showSuccess(
          esDevolucion
            ? 'Boletas liberadas y marcadas como devolución'
            : 'Todas las boletas de la venta fueron liberadas'
        )
        await fetchBoletas()
      } else {
        throw new Error(response.message || 'Error al liberar boletas de la venta')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLiberandoVenta(null)
    }
  }

  // Obtener rifas únicas para el filtro
  const rifasUnicas = Array.from(new Set(boletas.map(b => b.rifa_nombre))).sort()

  const formatNumeroBoleta = (numero: number) => String(numero).padStart(4, '0')

  // Filtrar boletas
  const boletasFiltradas = boletas.filter(b => {
    const term = searchTerm.trim().toLowerCase()
    const numeroTerm = term.replace(/^#/, '')

    const matchSearch =
      !term ||
      formatNumeroBoleta(b.numero).includes(numeroTerm) ||
      b.numero.toString() === numeroTerm ||
      (b.cliente_nombre && b.cliente_nombre.toLowerCase().includes(term)) ||
      (b.cliente_telefono && b.cliente_telefono.includes(term)) ||
      (b.cliente_identificacion && b.cliente_identificacion.includes(term))

    const matchOrigen = filtroOrigen === 'TODOS' || b.origen === filtroOrigen
    const matchRifa = filtroRifa === 'TODAS' || b.rifa_nombre === filtroRifa

    return matchSearch && matchOrigen && matchRifa
  })

  // Agrupar boletas por venta_id para el botón "Liberar Todas"
  const ventasConBoletas = boletasFiltradas.reduce((acc, b) => {
    if (b.venta_id) {
      if (!acc[b.venta_id]) acc[b.venta_id] = []
      acc[b.venta_id].push(b)
    }
    return acc
  }, {} as Record<string, BoletaReservada[]>)

  // Resumen
  const totalReservadas = boletas.length
  const totalOnline = boletas.filter(b => b.origen === 'ONLINE').length
  const totalFisico = boletas.filter(b => b.origen === 'PUNTO_FISICO').length
  const totalExpiradas = boletas.filter(b => {
    if (!b.bloqueo_hasta) return false
    return new Date(b.bloqueo_hasta) < new Date()
  }).length

  const devueltasBase = boletasDevueltas.filter(b => {
    if (filtroDevolucion === 'disponibles') return esDevolucionDisponible(b)
    return esDevolucionAsignada(b)
  })

  const devueltasFiltradas = devueltasBase.filter(b => {
    const term = searchTerm.trim().toLowerCase()
    const numeroTerm = term.replace(/^#/, '')
    const matchRifa = filtroRifa === 'TODAS' || b.rifa_nombre === filtroRifa
    if (!term) return matchRifa
    return (
      matchRifa &&
      (formatNumeroBoleta(b.numero).includes(numeroTerm) ||
        b.numero.toString() === numeroTerm ||
        b.rifa_nombre.toLowerCase().includes(term) ||
        (b.cliente_nombre && b.cliente_nombre.toLowerCase().includes(term)) ||
        (b.cliente_telefono && b.cliente_telefono.includes(term)))
    )
  })

  const countDevDisponibles = boletasDevueltas.filter(esDevolucionDisponible).length
  const countDevAsignadas = boletasDevueltas.filter(esDevolucionAsignada).length

  const devueltasPorRifa = devueltasFiltradas.reduce((acc, b) => {
    const key = b.rifa_nombre
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {} as Record<string, BoletaDevuelta[]>)

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpirada = (bloqueoHasta: string | null) => {
    if (!bloqueoHasta) return false
    return new Date(bloqueoHasta) < new Date()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ← Dashboard
                </button>
              </div>
              <h1 className="text-3xl font-light text-slate-900">
                Boletas Reservadas
              </h1>
              <p className="text-slate-600 mt-1">
                Administra reservas, libera boletas y consulta devoluciones
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchBoletas}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {!modoCaptura && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setVista('reservadas')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              vista === 'reservadas'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Reservadas ({totalReservadas})
          </button>
          <button
            type="button"
            onClick={() => setVista('devueltas')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              vista === 'devueltas'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Devueltas ({countDevDisponibles + countDevAsignadas})
          </button>
        </div>
        )}

        {/* Mensaje de éxito */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">{successMsg}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {vista === 'reservadas' && !loading && (
        <>
        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Reservadas</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{totalReservadas}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider">Online</p>
            <p className="text-2xl font-semibold text-blue-700 mt-1">{totalOnline}</p>
          </div>
          <div className="bg-white rounded-xl border border-purple-200 p-4">
            <p className="text-xs font-medium text-purple-500 uppercase tracking-wider">Punto Físico</p>
            <p className="text-2xl font-semibold text-purple-700 mt-1">{totalFisico}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <p className="text-xs font-medium text-red-500 uppercase tracking-wider">Expiradas</p>
            <p className="text-2xl font-semibold text-red-700 mt-1">{totalExpiradas}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por número, cliente, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro Origen */}
            <select
              value={filtroOrigen}
              onChange={(e) => setFiltroOrigen(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos los orígenes</option>
              <option value="ONLINE">🌐 Online</option>
              <option value="PUNTO_FISICO">🏪 Punto Físico</option>
            </select>

            {/* Filtro Rifa */}
            <select
              value={filtroRifa}
              onChange={(e) => setFiltroRifa(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAS">Todas las rifas</option>
              {rifasUnicas.map(rifa => (
                <option key={rifa} value={rifa}>{rifa}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Cargando boletas...</p>
            </div>
          </div>
        )}

        {vista === 'reservadas' && !loading && boletasFiltradas.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-700 mb-1">Sin boletas reservadas</h3>
            <p className="text-slate-500 text-sm">
              {searchTerm || filtroOrigen !== 'TODOS' || filtroRifa !== 'TODAS'
                ? 'No hay boletas que coincidan con los filtros aplicados'
                : 'No hay boletas en estado reservado actualmente'}
            </p>
          </div>
        )}

        {/* Tabla de boletas */}
        {boletasFiltradas.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Boleta</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rifa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Origen</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reserva hasta</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado Venta</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {boletasFiltradas.map((boleta) => (
                    <tr key={boleta.boleta_id} className={`hover:bg-slate-50 transition-colors ${isExpirada(boleta.bloqueo_hasta) ? 'bg-red-50/50' : ''}`}>
                      {/* Número de boleta */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-semibold text-sm">
                          #{String(boleta.numero).padStart(4, '0')}
                        </span>
                      </td>

                      {/* Rifa */}
                      <td className="px-4 py-3">
                        <p className="text-slate-900 font-medium truncate max-w-[180px]">{boleta.rifa_nombre}</p>
                        {boleta.fecha_sorteo && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Sorteo: {new Date(boleta.fecha_sorteo).toLocaleDateString('es-CO')}
                          </p>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3">
                        {boleta.cliente_nombre ? (
                          <div>
                            <p className="text-slate-900 font-medium">{boleta.cliente_nombre}</p>
                            {boleta.cliente_telefono && (
                              <p className="text-xs text-slate-400">{boleta.cliente_telefono}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Sin cliente</span>
                        )}
                      </td>

                      {/* Origen */}
                      <td className="px-4 py-3">
                        {boleta.origen === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🌐 Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🏪 Físico
                          </span>
                        )}
                      </td>

                      {/* Bloqueo hasta */}
                      <td className="px-4 py-3">
                        {boleta.bloqueo_hasta ? (
                          <div>
                            <p className={`text-sm font-medium ${isExpirada(boleta.bloqueo_hasta) ? 'text-red-600' : 'text-slate-700'}`}>
                              {formatFecha(boleta.bloqueo_hasta)}
                            </p>
                            {isExpirada(boleta.bloqueo_hasta) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 mt-0.5">
                                ⚠ Expirada
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Sin fecha límite</span>
                        )}
                      </td>

                      {/* Estado Venta */}
                      <td className="px-4 py-3">
                        {boleta.estado_venta ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            boleta.estado_venta === 'SIN_REVISAR'
                              ? 'bg-yellow-100 text-yellow-800'
                              : boleta.estado_venta === 'PENDIENTE'
                              ? 'bg-orange-100 text-orange-800'
                              : boleta.estado_venta === 'ABONADA'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {boleta.estado_venta}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Liberar boleta individual */}
                          <button
                            onClick={() => setConfirmDialog({
                              tipo: 'boleta',
                              id: boleta.boleta_id,
                              mensaje: `¿Liberar la boleta #${String(boleta.numero).padStart(4, '0')}? Quedará disponible para la venta nuevamente.`,
                              esDevolucion: false,
                            })}
                            disabled={liberando === boleta.boleta_id}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {liberando === boleta.boleta_id ? (
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                Liberando...
                              </span>
                            ) : (
                              '🔓 Liberar'
                            )}
                          </button>

                          {/* Liberar todas las boletas de la venta */}
                          {boleta.venta_id && ventasConBoletas[boleta.venta_id] && ventasConBoletas[boleta.venta_id].length > 1 && (
                            <button
                              onClick={() => setConfirmDialog({
                                tipo: 'venta',
                                id: boleta.venta_id!,
                                mensaje: `¿Liberar TODAS las ${ventasConBoletas[boleta.venta_id!].length} boletas de esta venta? La venta será cancelada.`,
                                esDevolucion: false,
                              })}
                              disabled={liberandoVenta === boleta.venta_id}
                              className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {liberandoVenta === boleta.venta_id ? (
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                                  Liberando...
                                </span>
                              ) : (
                                `🔓 Liberar Todas (${ventasConBoletas[boleta.venta_id].length})`
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer con conteo */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
              Mostrando {boletasFiltradas.length} de {boletas.length} boletas reservadas
            </div>
          </div>
        )}
        </>
        )}

        {vista === 'devueltas' && !loading && (
          <>
            {!modoCaptura && (
              <>
                <div className="mb-6 bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900">
                  Historial de boletas liberadas como <strong>devolución</strong>. Las disponibles se pueden publicar;
                  al venderse pasan a <strong>asignadas</strong> (conservamos la fecha en que se marcaron).
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setFiltroDevolucion('disponibles')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      filtroDevolucion === 'disponibles'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Disponibles ({countDevDisponibles})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroDevolucion('asignadas')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      filtroDevolucion === 'asignadas'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Ya con cliente ({countDevAsignadas})
                  </button>
                  {filtroDevolucion === 'disponibles' && countDevDisponibles > 0 && (
                    <button
                      type="button"
                      onClick={() => setModoCaptura(true)}
                      className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                    >
                      📸 Modo captura
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder={
                          filtroDevolucion === 'asignadas'
                            ? 'Buscar # boleta, rifa o cliente...'
                            : 'Buscar por # boleta o rifa...'
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <select
                      value={filtroRifa}
                      onChange={(e) => setFiltroRifa(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="TODAS">Todas las rifas</option>
                      {Array.from(new Set(devueltasBase.map(b => b.rifa_nombre))).sort().map(rifa => (
                        <option key={rifa} value={rifa}>{rifa}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {modoCaptura && (
              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  onClick={() => setModoCaptura(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Salir de modo captura
                </button>
              </div>
            )}

            {devueltasFiltradas.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                {filtroDevolucion === 'disponibles'
                  ? 'No hay boletas en devolución disponibles para publicar.'
                  : 'Aún no hay boletas devueltas reasignadas a un cliente.'}
              </div>
            ) : filtroDevolucion === 'disponibles' ? (
              <div
                id="devoluciones-captura-publicacion"
                className={`rounded-3xl overflow-hidden ${
                  modoCaptura
                    ? 'p-8 sm:p-10 bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-950 shadow-2xl'
                    : 'p-6 bg-white border border-slate-200'
                }`}
              >
                <div className={`text-center mb-8 ${modoCaptura ? 'text-white' : 'text-slate-800'}`}>
                  <p className={`text-xs uppercase tracking-[0.2em] font-semibold ${modoCaptura ? 'text-violet-200' : 'text-violet-600'}`}>
                    Boletas en devolución
                  </p>
                  <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${modoCaptura ? 'text-white' : 'text-slate-900'}`}>
                    Disponibles para apartar
                  </h2>
                  <p className={`text-sm mt-2 ${modoCaptura ? 'text-violet-100/90' : 'text-slate-500'}`}>
                    {devueltasFiltradas.length} número{devueltasFiltradas.length !== 1 ? 's' : ''} listo{devueltasFiltradas.length !== 1 ? 's' : ''} · {formatFecha(new Date().toISOString())}
                  </p>
                </div>

                {Object.entries(devueltasPorRifa)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([rifaNombre, items]) => (
                    <div key={rifaNombre} className="mb-8 last:mb-0">
                      {!modoCaptura && (
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1">{rifaNombre}</h3>
                      )}
                      {modoCaptura && (
                        <p className="text-center text-violet-200 text-sm font-medium mb-4">{rifaNombre}</p>
                      )}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                        {items
                          .sort((a, b) => a.numero - b.numero)
                          .map(b => (
                            <div
                              key={b.boleta_id}
                              className={`group relative aspect-[4/5] rounded-2xl p-[2px] shadow-md transition-transform hover:scale-[1.02] ${
                                modoCaptura
                                  ? 'bg-gradient-to-br from-amber-300 via-violet-300 to-indigo-400'
                                  : 'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600'
                              }`}
                            >
                              <div className="h-full w-full rounded-[14px] bg-white flex flex-col items-center justify-center px-2 py-3">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-violet-600">
                                  Devolución
                                </span>
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums leading-none mt-1">
                                  {formatNumeroBoleta(b.numero)}
                                </span>
                                {!modoCaptura && (
                                  <span className="text-[10px] text-slate-400 mt-2 text-center line-clamp-2 leading-tight">
                                    {rifaNombre}
                                  </span>
                                )}
                                <span className="mt-auto pt-2 text-[10px] font-semibold text-emerald-600">
                                  LIBRE
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}

                {modoCaptura && (
                  <p className="text-center text-violet-300/80 text-xs mt-8">
                    Captura esta pantalla para publicar en redes · Los números siguen disponibles en ventas
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-indigo-50 border-b border-indigo-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-indigo-800 uppercase">Boleta</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-indigo-800 uppercase">Rifa</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-indigo-800 uppercase">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-indigo-800 uppercase">Estado boleta</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-indigo-800 uppercase">Devolución marcada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devueltasFiltradas.map(b => (
                      <tr key={b.boleta_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-semibold">#{formatNumeroBoleta(b.numero)}</td>
                        <td className="px-4 py-3">{b.rifa_nombre}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{b.cliente_nombre || '—'}</p>
                          {b.cliente_telefono && (
                            <p className="text-xs text-slate-400">{b.cliente_telefono}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {b.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatFecha(b.devolucion_en)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 border-t px-4 py-3 text-sm text-slate-500">
                  {devueltasFiltradas.length} reasignada{devueltasFiltradas.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmación */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Confirmar liberación</h3>
            </div>
            <p className="text-slate-600 mb-4">{confirmDialog.mensaje}</p>
            <label className="flex items-start gap-3 mb-6 p-3 rounded-lg border border-violet-200 bg-violet-50 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmDialog.esDevolucion}
                onChange={(e) =>
                  setConfirmDialog(prev => (prev ? { ...prev, esDevolucion: e.target.checked } : null))
                }
                className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-violet-950">
                <span className="font-semibold">Devolución</span>
                <span className="block text-violet-800/90 text-xs mt-0.5">
                  La boleta queda libre y aparecerá en el apartado Devueltas hasta que se venda de nuevo.
                </span>
              </span>
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.tipo === 'boleta') {
                    handleLiberarBoleta(confirmDialog.id, confirmDialog.esDevolucion)
                  } else {
                    handleLiberarVenta(confirmDialog.id, confirmDialog.esDevolucion)
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sí, liberar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
