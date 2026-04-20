'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { vendedoresStatsApi, VendedorStats, ResumenGlobal } from '@/lib/vendedoresStatsApi'

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)

const todayISO = () => new Date().toISOString().slice(0, 10)

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-indigo-100 text-indigo-700',
  ADMIN: 'bg-emerald-100 text-emerald-700',
  VENDEDOR: 'bg-amber-100 text-amber-700'
}

export default function VendedoresStatsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<VendedorStats[]>([])
  const [resumen, setResumen] = useState<ResumenGlobal | null>(null)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtroRol, setFiltroRol] = useState<'TODOS' | 'VENDEDOR' | 'ADMIN' | 'SUPER_ADMIN'>('TODOS')
  const [search, setSearch] = useState('')

  // Auth: solo SUPER_ADMIN
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const u = JSON.parse(userData)
      const rol = String(u.rol || '').toUpperCase()
      if (rol === 'SUPER_ADMIN') {
        setAuthorized(true)
      } else {
        router.push('/dashboard')
      }
    } catch {
      router.push('/login')
    }
  }, [router])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await vendedoresStatsApi.list(fechaInicio || undefined, fechaFin || undefined)
      setData(res.data)
      setResumen(res.resumen)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized])

  const filtered = useMemo(() => {
    return data.filter(d => {
      if (filtroRol !== 'TODOS' && d.rol !== filtroRol) return false
      if (search) {
        const s = search.toLowerCase()
        if (!d.nombre.toLowerCase().includes(s) && !d.email.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [data, filtroRol, search])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </a>
              <span className="text-slate-300">/</span>
              <h1 className="text-base font-semibold text-slate-800">Vendedores</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filtros */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-slate-500">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                max={fechaFin || todayISO()}
                onChange={e => setFechaInicio(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                max={todayISO()}
                onChange={e => setFechaFin(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Rol</label>
              <select
                value={filtroRol}
                onChange={e => setFiltroRol(e.target.value as typeof filtroRol)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="TODOS">Todos</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="VENDEDOR">Vendedor</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Buscar</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nombre o email"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Cargando…' : 'Aplicar'}
              </button>
              <button
                onClick={() => {
                  setFechaInicio('')
                  setFechaFin('')
                  setFiltroRol('TODOS')
                  setSearch('')
                  setTimeout(load, 0)
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                const t = todayISO()
                setFechaInicio(t)
                setFechaFin(t)
                setTimeout(load, 0)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - 6)
                setFechaInicio(start.toISOString().slice(0, 10))
                setFechaFin(end.toISOString().slice(0, 10))
                setTimeout(load, 0)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date(end.getFullYear(), end.getMonth(), 1)
                setFechaInicio(start.toISOString().slice(0, 10))
                setFechaFin(end.toISOString().slice(0, 10))
                setTimeout(load, 0)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              Mes actual
            </button>
          </div>
        </section>

        {/* Resumen global */}
        {resumen && (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Vendedores activos" value={resumen.vendedores_activos} />
            <KpiCard label="Ventas" value={resumen.total_ventas} />
            <KpiCard label="Clientes únicos" value={resumen.clientes_unicos} />
            <KpiCard label="Monto total" value={fmtMoney(resumen.monto_total)} />
            <KpiCard label="Abonado" value={fmtMoney(resumen.abonado_total)} highlight="emerald" />
            <KpiCard label="Saldo pendiente" value={fmtMoney(resumen.saldo_pendiente)} highlight="amber" />
          </section>
        )}

        {/* Tabla */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Equipo ({filtered.length})</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="p-10 flex items-center justify-center text-slate-400">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">Sin resultados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2 text-left">Usuario</th>
                    <th className="px-4 py-2 text-left">Rol</th>
                    <th className="px-4 py-2 text-right">Ventas</th>
                    <th className="px-4 py-2 text-right">Clientes</th>
                    <th className="px-4 py-2 text-right">Boletas vendidas</th>
                    <th className="px-4 py-2 text-right">Reservadas</th>
                    <th className="px-4 py-2 text-right">Abonadas</th>
                    <th className="px-4 py-2 text-right">Pagadas</th>
                    <th className="px-4 py-2 text-right">Monto</th>
                    <th className="px-4 py-2 text-right">Abonado</th>
                    <th className="px-4 py-2 text-right">Saldo</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-2">
                        <div className="font-medium text-slate-800">{v.nombre}</div>
                        <div className="text-xs text-slate-400">{v.email}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_BADGE[v.rol] || 'bg-slate-100 text-slate-600'}`}>
                          {v.rol}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-700">{v.total_ventas}</td>
                      <td className="px-4 py-2 text-right text-slate-700">{v.clientes_unicos}</td>
                      <td className="px-4 py-2 text-right text-slate-700">{v.boletas_vendidas}</td>
                      <td className="px-4 py-2 text-right text-amber-600">{v.boletas_reservadas}</td>
                      <td className="px-4 py-2 text-right text-blue-600">{v.boletas_abonadas}</td>
                      <td className="px-4 py-2 text-right text-emerald-600">{v.boletas_pagadas}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-800">{fmtMoney(v.monto_total)}</td>
                      <td className="px-4 py-2 text-right text-emerald-600">{fmtMoney(v.abonado_total)}</td>
                      <td className="px-4 py-2 text-right text-amber-600">{fmtMoney(v.saldo_pendiente)}</td>
                      <td className="px-4 py-2 text-right">
                        <a
                          href={`/vendedores/${v.id}${fechaInicio || fechaFin ? `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}` : ''}`}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Ver detalle →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function KpiCard({ label, value, highlight }: { label: string; value: string | number; highlight?: 'emerald' | 'amber' }) {
  const color =
    highlight === 'emerald' ? 'text-emerald-600' :
    highlight === 'amber' ? 'text-amber-600' :
    'text-slate-800'
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${color}`}>{value}</div>
    </div>
  )
}
