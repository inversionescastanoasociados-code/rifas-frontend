import { API_BASE_URL } from '@/config/api'

export interface ClienteRecordatorio {
  id: string
  nombre: string
  telefono: string
  email: string
  identificacion: string
  direccion: string
  created_at: string
  updated_at: string
  total_boletas: number
  boletas_pagadas: number
  boletas_reservadas: number
  boletas_abonadas: number
  deuda_total: number
  total_notificaciones: number
  ultima_notificacion: string | null
}

export interface RecordatorioListResponse {
  success: boolean
  data: ClienteRecordatorio[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ResumenRecordatorios {
  total_pendientes: number
  con_reservadas: number
  con_abonadas: number
  notificados: number
  no_notificados: number
}

export interface NotificacionHistorial {
  id: string
  created_at: string
  notificado_por_nombre: string | null
}

class RecordatoriosApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }
    return data
  }

  async getClientesParaRecordatorio(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    filtro: 'todos' | 'reservadas' | 'abonadas' = 'todos',
    notificado: 'todos' | 'si' | 'no' = 'todos'
  ): Promise<RecordatorioListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      filtro,
      notificado,
      ...(search && { search })
    })

    const response = await fetch(`${API_BASE_URL}/api/recordatorios?${params}`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<RecordatorioListResponse>(response)
  }

  async registrarNotificacion(clienteId: string): Promise<{ success: boolean; data: { id: string; created_at: string } }> {
    const response = await fetch(`${API_BASE_URL}/api/recordatorios/${clienteId}/notificar`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async getResumen(): Promise<{ success: boolean; data: ResumenRecordatorios }> {
    const response = await fetch(`${API_BASE_URL}/api/recordatorios/resumen`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async getNotificacionesCliente(clienteId: string): Promise<{ success: boolean; data: NotificacionHistorial[] }> {
    const response = await fetch(`${API_BASE_URL}/api/recordatorios/${clienteId}/notificaciones`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }
}

export const recordatoriosApi = new RecordatoriosApiService()
