import { API_BASE_URL } from '@/config/api'

export interface VendedorStats {
  id: string
  nombre: string
  email: string
  rol: 'SUPER_ADMIN' | 'ADMIN' | 'VENDEDOR' | string
  activo: boolean
  ultimo_login: string | null
  created_at: string
  total_ventas: number
  monto_total: number
  abonado_total: number
  saldo_pendiente: number
  clientes_unicos: number
  boletas_vendidas: number
  boletas_pagadas: number
  boletas_abonadas: number
  boletas_reservadas: number
  abonos_registrados: number
  abonos_monto: number
}

export interface ResumenGlobal {
  total_ventas: number
  monto_total: number
  abonado_total: number
  saldo_pendiente: number
  clientes_unicos: number
  vendedores_activos: number
}

export interface VendedorDetalleResumen {
  total_ventas: number
  monto_total: number
  abonado_total: number
  saldo_pendiente: number
  clientes_unicos: number
  boletas_vendidas: number
  boletas_pagadas: number
  boletas_abonadas: number
  boletas_reservadas: number
  abonos_registrados: number
  abonos_monto: number
}

export interface VendedorClienteRow {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  total_ventas: number
  monto_total: number
  abonado_total: number
  saldo_pendiente: number
  ultima_venta: string | null
}

export interface VendedorVentaRow {
  id: string
  created_at: string
  monto_total: number
  abono_total: number
  saldo_pendiente: number
  estado_venta: string
  cliente_id: string
  cliente_nombre: string
  cliente_telefono: string | null
  rifa_id: string
  rifa_nombre: string
  total_boletas: number
}

export interface VendedorDetalleResponse {
  success: boolean
  vendedor: {
    id: string
    nombre: string
    email: string
    rol: string
    telefono: string | null
    activo: boolean
    ultimo_login: string | null
    created_at: string
  }
  resumen: VendedorDetalleResumen
  clientes: VendedorClienteRow[]
  ventas: VendedorVentaRow[]
}

interface ListResponse {
  success: boolean
  data: VendedorStats[]
  resumen: ResumenGlobal
}

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.append(k, v)
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export const vendedoresStatsApi = {
  async list(fechaInicio?: string, fechaFin?: string): Promise<ListResponse> {
    const qs = buildQuery({ fechaInicio, fechaFin })
    const res = await fetch(`${API_BASE_URL}/api/vendedores-stats${qs}`, {
      headers: getAuthHeaders()
    })
    return handleResponse<ListResponse>(res)
  },

  async detalle(id: string, fechaInicio?: string, fechaFin?: string): Promise<VendedorDetalleResponse> {
    const qs = buildQuery({ fechaInicio, fechaFin })
    const res = await fetch(`${API_BASE_URL}/api/vendedores-stats/${id}${qs}`, {
      headers: getAuthHeaders()
    })
    return handleResponse<VendedorDetalleResponse>(res)
  }
}
