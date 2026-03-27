'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/config/api'

interface BoletaResult {
  encontrada: boolean
  disponible?: boolean
  mensaje?: string
  boleta?: {
    id: string
    numero: number
    estado: string
    rifa_id: string
    rifa_nombre: string
    precio_boleta?: number
    cliente_nombre?: string | null
  }
}

interface ClienteForm {
  nombre: string
  telefono: string
  email: string
  direccion: string
  identificacion: string
}

const MEDIOS_PAGO = [
  { id: 'd397d917-c0d0-4c61-b2b3-2ebfab7deeb7', nombre: 'Efectivo' },
  { id: 'af6e15fc-c52c-4491-abe1-20243af301c4', nombre: 'Nequi' },
  { id: 'db94562d-bb01-42a3-9414-6e369a1a70ba', nombre: 'PSE' },
  { id: '57a2f560-b3d7-4fa8-91cf-24e6b2a6d7ff', nombre: 'Tarjeta Crédito' },
]

export default function GanadoresPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; nombre: string; rol: string } | null>(null)
  const [numeroBoleta, setNumeroBoleta] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<BoletaResult | null>(null)
  const [error, setError] = useState('')

  // Form para asignar ganador
  const [cliente, setCliente] = useState<ClienteForm>({
    nombre: '', telefono: '', email: '', direccion: '', identificacion: ''
  })
  const [montoAbono, setMontoAbono] = useState('')
  const [medioPagoId, setMedioPagoId] = useState(MEDIOS_PAGO[0].id)
  const [asignando, setAsignando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) { router.push('/login'); return }
    try {
      const parsed = JSON.parse(userData)
      if (parsed.rol?.toUpperCase() !== 'SUPER_ADMIN') {
        router.push('/dashboard')
        return
      }
      setUser(parsed)
    } catch { router.push('/login') }
  }, [router])

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`)
    return data
  }

  const buscarBoleta = async () => {
    const num = parseInt(numeroBoleta, 10)
    if (!num || num <= 0) { setError('Ingresa un número válido'); return }
    setError('')
    setResultado(null)
    setExito(null)
    setBuscando(true)
    try {
      const data = await apiRequest(`/ventas/ganadores/buscar-boleta?numero=${num}`)
      setResultado(data.data)
      if (data.data.encontrada && data.data.disponible && data.data.boleta?.precio_boleta) {
        setMontoAbono(String(data.data.boleta.precio_boleta))
      }
    } catch (err: any) {
      setError(err.message || 'Error buscando boleta')
    } finally {
      setBuscando(false)
    }
  }

  const asignarGanador = async () => {
    if (!resultado?.boleta || !resultado.disponible) return
    if (!cliente.nombre.trim()) { setError('El nombre es requerido'); return }
    if (!cliente.telefono.trim()) { setError('El teléfono es requerido'); return }
    const monto = parseFloat(montoAbono)
    if (!monto || monto <= 0) { setError('El monto del abono debe ser mayor a 0'); return }
    setError('')
    setAsignando(true)
    try {
      const data = await apiRequest('/ventas/ganadores/asignar', {
        method: 'POST',
        body: JSON.stringify({
          rifa_id: resultado.boleta.rifa_id,
          boleta_id: resultado.boleta.id,
          cliente: {
            nombre: cliente.nombre.trim().toUpperCase(),
            telefono: cliente.telefono.trim(),
            email: cliente.email.trim() || null,
            direccion: cliente.direccion.trim() || null,
            identificacion: cliente.identificacion.trim() || null,
          },
          monto_abono: monto,
          medio_pago_id: medioPagoId,
        }),
      })
      setExito(`Ganador asignado: Boleta #${data.data.boleta_numero} → ${data.data.cliente_nombre} (${data.data.estado_venta})`)
      setResultado(null)
      setCliente({ nombre: '', telefono: '', email: '', direccion: '', identificacion: '' })
      setMontoAbono('')
      setNumeroBoleta('')
    } catch (err: any) {
      setError(err.message || 'Error asignando ganador')
    } finally {
      setAsignando(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-yellow-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 leading-tight">Ganadores</h1>
                <p className="text-[11px] text-slate-400 leading-none">Asignar boletas a ganadores</p>
              </div>
            </div>
            <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200">SUPER ADMIN</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Buscar boleta */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar Boleta
          </h2>
          <div className="flex gap-3">
            <input
              type="number"
              value={numeroBoleta}
              onChange={(e) => setNumeroBoleta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarBoleta()}
              placeholder="Número de boleta..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
              min="1"
            />
            <button
              onClick={buscarBoleta}
              disabled={buscando || !numeroBoleta}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {buscando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {exito && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            {exito}
          </div>
        )}

        {/* Resultado: boleta no encontrada */}
        {resultado && !resultado.encontrada && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-500 text-sm">{resultado.mensaje}</p>
          </div>
        )}

        {/* Resultado: boleta ya asignada */}
        {resultado?.encontrada && !resultado.disponible && resultado.boleta && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Boleta #{resultado.boleta.numero}</h3>
                <p className="text-xs text-slate-500">{resultado.boleta.rifa_nombre}</p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                resultado.boleta.estado === 'PAGADA' ? 'bg-green-50 text-green-700 border border-green-200' :
                resultado.boleta.estado === 'ABONADA' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                resultado.boleta.estado === 'RESERVADA' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-slate-50 text-slate-700 border border-slate-200'
              }`}>
                {resultado.boleta.estado}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">Asignada a: </span>
                {resultado.boleta.cliente_nombre || 'Sin nombre registrado'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Esta boleta ya tiene un cliente asignado y no se puede reasignar desde aquí.</p>
            </div>
          </div>
        )}

        {/* Resultado: boleta disponible → Formulario de asignación */}
        {resultado?.encontrada && resultado.disponible && resultado.boleta && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Boleta #{resultado.boleta.numero} — Disponible</h3>
                <p className="text-xs text-slate-500">{resultado.boleta.rifa_nombre} · Precio: ${resultado.boleta.precio_boleta?.toLocaleString('es-CO')} COP</p>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos del Ganador
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={cliente.nombre}
                  onChange={(e) => setCliente(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono *</label>
                <input
                  type="text"
                  value={cliente.telefono}
                  onChange={(e) => setCliente(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="3001234567"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cédula</label>
                <input
                  type="text"
                  value={cliente.identificacion}
                  onChange={(e) => setCliente(prev => ({ ...prev, identificacion: e.target.value }))}
                  placeholder="Identificación"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label>
                <input
                  type="text"
                  value={cliente.direccion}
                  onChange={(e) => setCliente(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Ciudad / Dirección"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Pago
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Monto del Abono *</label>
                <input
                  type="number"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  placeholder="60000"
                  min="1"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
                {resultado.boleta.precio_boleta && montoAbono && (
                  <p className="text-xs mt-1 text-slate-400">
                    {parseFloat(montoAbono) >= resultado.boleta.precio_boleta
                      ? '✅ Pago completo'
                      : `⚠️ Abono parcial — saldo: $${(resultado.boleta.precio_boleta - parseFloat(montoAbono)).toLocaleString('es-CO')}`
                    }
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Medio de Pago</label>
                <select
                  value={medioPagoId}
                  onChange={(e) => setMedioPagoId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white"
                >
                  {MEDIOS_PAGO.map(mp => (
                    <option key={mp.id} value={mp.id}>{mp.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={asignarGanador}
              disabled={asignando || !cliente.nombre || !cliente.telefono || !montoAbono}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {asignando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Asignar Ganador
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
