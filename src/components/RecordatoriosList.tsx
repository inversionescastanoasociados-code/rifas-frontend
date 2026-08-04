'use client'

import { useState, useEffect, useCallback } from 'react'
import { recordatoriosApi, ClienteRecordatorio, ResumenRecordatorios, Vendedor } from '@/lib/recordatoriosApi'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getLoggedUserVendedorInfo(): { isVendedor: boolean; vendedorId: string } {
  try {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (userData) {
      const user = JSON.parse(userData)
      if (user.rol?.toUpperCase() === 'VENDEDOR' && user.id) {
        return { isVendedor: true, vendedorId: user.id }
      }
    }
  } catch { /* ignore */ }
  return { isVendedor: false, vendedorId: '' }
}

export default function RecordatoriosList() {
  const loggedUser = getLoggedUserVendedorInfo()
  const [clientes, setClientes] = useState<ClienteRecordatorio[]>([])
  const [resumen, setResumen] = useState<ResumenRecordatorios | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'reservadas' | 'abonadas'>('todos')
  const [filtroNotificado, setFiltroNotificado] = useState<'todos' | 'si' | 'no'>('todos')
  const [filtroVendedor, setFiltroVendedor] = useState<string>(loggedUser.vendedorId)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [marcandoContactado, setMarcandoContactado] = useState<string | null>(null)
  const isVendedor = loggedUser.isVendedor

  useEffect(() => {
    recordatoriosApi.getVendedores()
      .then(res => setVendedores(res.data || []))
      .catch(() => setVendedores([]))
  }, [])

  const fetchClientes = useCallback(async (page: number = 1) => {
    setLoading(true)
    try {
      const [listResponse, resumenResponse] = await Promise.all([
        recordatoriosApi.getClientesParaRecordatorio(page, pagination.limit, searchQuery, filtroActivo, filtroNotificado, filtroVendedor),
        recordatoriosApi.getResumen(filtroVendedor)
      ])
      setClientes(listResponse.data)
      setPagination(listResponse.pagination)
      setResumen(resumenResponse.data)
    } catch (error) {
      console.error('Error fetching recordatorios:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filtroActivo, filtroNotificado, filtroVendedor, pagination.limit])

  useEffect(() => {
    fetchClientes(1)
  }, [fetchClientes])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchTerm)
  }

  const handleMarcarContactado = async (cliente: ClienteRecordatorio) => {
    setMarcandoContactado(cliente.id)
    try {
      await recordatoriosApi.registrarNotificacion(cliente.id)
      setClientes(prev => prev.map(c =>
        c.id === cliente.id
          ? {
              ...c,
              total_notificaciones: c.total_notificaciones + 1,
              ultima_notificacion: new Date().toISOString()
            }
          : c
      ))
      if (resumen && cliente.total_notificaciones === 0) {
        setResumen({
          ...resumen,
          notificados: resumen.notificados + 1,
          no_notificados: Math.max(resumen.no_notificados - 1, 0)
        })
      }
    } catch (error) {
      console.error('Error marcando contactado:', error)
    } finally {
      setMarcandoContactado(null)
    }
  }

  const handlePageChange = (page: number) => {
    fetchClientes(page)
  }

  const filters = [
    { key: 'todos' as const, label: 'Todos Pendientes', count: resumen?.total_pendientes ?? 0, color: 'bg-slate-900', textColor: 'text-white' },
    { key: 'reservadas' as const, label: 'Con Reservadas', count: resumen?.con_reservadas ?? 0, color: 'bg-yellow-500', textColor: 'text-white' },
    { key: 'abonadas' as const, label: 'Con Abonadas', count: resumen?.con_abonadas ?? 0, color: 'bg-blue-600', textColor: 'text-white' },
  ]

  const contactoFilters = [
    { key: 'todos' as const, label: 'Todos', count: resumen?.total_pendientes ?? 0, emoji: '📋' },
    { key: 'no' as const, label: 'Sin contactar', count: resumen?.no_notificados ?? 0, emoji: '🔴' },
    { key: 'si' as const, label: 'Contactados', count: resumen?.notificados ?? 0, emoji: '✅' },
  ]

  const BotonContactado = ({ cliente, fueContactado }: { cliente: ClienteRecordatorio; fueContactado: boolean }) => (
    <button
      onClick={() => handleMarcarContactado(cliente)}
      disabled={marcandoContactado === cliente.id}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${
        fueContactado
          ? 'bg-green-600 text-white hover:bg-green-500 shadow-sm'
          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
      }`}
      title={fueContactado ? 'Registrar nuevo contacto por llamada' : 'Marcar como contactado por llamada'}
    >
      {marcandoContactado === cliente.id ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {fueContactado ? 'Contactado' : 'Marcar contactado'}
        </>
      )}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">📞 Recordatorios de Cobro</h2>
          <p className="text-sm text-slate-500 mt-1">
            Clientes con boleta sin pagar o con abono menor a $80.000 — marca cuando los contactes por llamada
          </p>
        </div>
      </div>

      {!isVendedor && (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">👤 Filtrar por Vendedor / Admin</label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroVendedor('')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filtroVendedor === ''
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            👥 Todos
          </button>
          {vendedores.map((v) => (
            <button
              key={v.id}
              onClick={() => setFiltroVendedor(v.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                filtroVendedor === v.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {v.rol === 'SUPER_ADMIN' ? '👑' : v.rol === 'ADMIN' ? '🔑' : '🏷️'} {v.nombre}
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltroActivo(f.key)}
            className={`rounded-xl p-3 text-center transition-all cursor-pointer hover:scale-105 hover:shadow-md ${f.color} ${
              filtroActivo === f.key ? 'ring-2 ring-offset-2 ring-slate-900 scale-105' : ''
            }`}
          >
            <div className={`text-xl font-black ${f.textColor}`}>{f.count}</div>
            <div className={`text-xs font-semibold mt-1 ${f.textColor} opacity-80`}>{f.label}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {contactoFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltroNotificado(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filtroNotificado === f.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.emoji} {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none text-black placeholder-slate-500 bg-white"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors font-semibold"
          >
            🔍 Buscar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-3"></div>
            <p className="text-slate-500 font-medium">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-slate-500 font-medium">No hay clientes pendientes con estos filtros</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Vendedor</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Boletas Pend.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Deuda</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Registrado</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientes.map((cliente) => {
                    const fueContactado = cliente.total_notificaciones > 0
                    return (
                      <tr
                        key={cliente.id}
                        className={`transition-colors ${
                          fueContactado ? 'bg-green-50/60 hover:bg-green-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                              fueContactado
                                ? 'bg-gradient-to-br from-green-500 to-green-600'
                                : 'bg-gradient-to-br from-slate-700 to-slate-500'
                            }`}>
                              {cliente.nombre?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-black flex items-center gap-1.5">
                                {cliente.nombre}
                                {fueContactado && (
                                  <span className="text-green-600 text-xs" title={`Contactado ${cliente.total_notificaciones} vez(es)`}>✓</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{cliente.email || cliente.identificacion}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-black font-medium">{cliente.telefono}</td>
                        <td className="px-4 py-3">
                          {cliente.vendedor_nombre ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-semibold">
                              👤 {cliente.vendedor_nombre}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {(cliente.boletas_reservadas || 0) > 0 && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded font-bold">
                                {cliente.boletas_reservadas} Res
                              </span>
                            )}
                            {(cliente.boletas_abonadas || 0) > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded font-bold">
                                {cliente.boletas_abonadas} Abo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-red-700">
                          {formatCurrency(cliente.deuda_total || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatDateShort(cliente.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {fueContactado ? (
                            <div>
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                                ✅ {cliente.total_notificaciones}x
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {formatDateTime(cliente.ultima_notificacion)}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full font-semibold">
                              🔴 Sin contactar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <BotonContactado cliente={cliente} fueContactado={fueContactado} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-slate-100">
              {clientes.map((cliente) => {
                const fueContactado = cliente.total_notificaciones > 0
                return (
                  <div key={cliente.id} className={`p-4 ${fueContactado ? 'bg-green-50/60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                        fueContactado
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : 'bg-gradient-to-br from-slate-700 to-slate-500'
                      }`}>
                        {cliente.nombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-black truncate flex items-center gap-1">
                          {cliente.nombre}
                          {fueContactado && <span className="text-green-600 text-xs">✓</span>}
                        </div>
                        <a href={`tel:${cliente.telefono}`} className="text-sm text-indigo-600 font-medium">
                          {cliente.telefono}
                        </a>
                        <div className="text-xs text-slate-500">{formatDateShort(cliente.created_at)}</div>
                        {cliente.vendedor_nombre && (
                          <div className="text-xs text-indigo-600 font-medium mt-0.5">👤 {cliente.vendedor_nombre}</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {(cliente.boletas_reservadas || 0) > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded font-bold">
                          {cliente.boletas_reservadas} Res
                        </span>
                      )}
                      {(cliente.boletas_abonadas || 0) > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded font-bold">
                          {cliente.boletas_abonadas} Abo
                        </span>
                      )}
                      <span className="text-xs font-bold text-red-700">
                        Deuda: {formatCurrency(cliente.deuda_total || 0)}
                      </span>
                      {fueContactado ? (
                        <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded font-semibold">
                          ✅ Contactado {cliente.total_notificaciones}x
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-600 text-xs px-1.5 py-0.5 rounded font-semibold">
                          🔴 Sin contactar
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <BotonContactado cliente={cliente} fueContactado={fueContactado} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-700 font-medium">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} clientes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-sm font-bold text-black">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
