import { API_BASE_URL } from '@/config/api'

export interface AdminUsuario {
  id: string
  email: string
  nombre: string
  activo: boolean
  ultimo_login: string | null
  created_at: string
  updated_at: string
}

class AdminUsuariosApiService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`)
    }
    return data
  }

  async listar(): Promise<AdminUsuario[]> {
    const res = await fetch(`${API_BASE_URL}/api/superadmin/admins`, {
      headers: this.getAuthHeaders(),
    })
    const json = await this.handleResponse<{ success: boolean; data: AdminUsuario[] }>(res)
    return json.data
  }

  async crear(payload: {
    email: string
    password: string
    nombre: string
  }): Promise<AdminUsuario> {
    const res = await fetch(`${API_BASE_URL}/api/superadmin/admins`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    const json = await this.handleResponse<{ success: boolean; data: AdminUsuario }>(res)
    return json.data
  }

  async actualizar(
    id: string,
    payload: Partial<{
      email: string
      password: string
      nombre: string
      activo: boolean
    }>
  ): Promise<AdminUsuario> {
    const res = await fetch(`${API_BASE_URL}/api/superadmin/admins/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    const json = await this.handleResponse<{ success: boolean; data: AdminUsuario }>(res)
    return json.data
  }
}

export const adminUsuariosApi = new AdminUsuariosApiService()
