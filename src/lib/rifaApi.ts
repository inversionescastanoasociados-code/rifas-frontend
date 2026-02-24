import { API_BASE_URL } from '@/config/api'
import { 
  Rifa, 
  RifaCreateRequest, 
  RifaUpdateRequest, 
  RifaListResponse, 
  RifaResponse, 
  RifaStatsResponse,
  RifaCreateResponse,
  RifaDeleteResponse,
  ApiError 
} from '@/types/rifa'

class RifaApiService {
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
      if (data.error === 'Validation Error' && data.details) {
        const validationErrors = data.details.map((detail: any) => 
          `${detail.field}: ${detail.message}`
        ).join(', ')
        throw new Error(validationErrors)
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }
    
    return data
  }

  async createRifa(rifaData: RifaCreateRequest): Promise<RifaCreateResponse> {
    const response = await fetch(`${API_BASE_URL}/api/rifas`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(rifaData)
    })
    return this.handleResponse<RifaCreateResponse>(response)
  }

  async getRifas(): Promise<RifaListResponse> {
    const response = await fetch(`${API_BASE_URL}/api/rifas`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<RifaListResponse>(response)
  }

  async getRifaById(id: string): Promise<RifaResponse> {
    const response = await fetch(`${API_BASE_URL}/api/rifas/${id}`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<RifaResponse>(response)
  }

  async getRifaStats(id: string): Promise<RifaStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/rifas/${id}/stats`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<RifaStatsResponse>(response)
  }

  async updateRifa(id: string, rifaData: RifaUpdateRequest): Promise<RifaResponse> {
    const response = await fetch(`${API_BASE_URL}/api/rifas/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(rifaData)
    })
    return this.handleResponse<RifaResponse>(response)
  }

  async deleteRifa(id: string): Promise<RifaDeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/rifas/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<RifaDeleteResponse>(response)
  }

  async changeRifaEstado(id: string, estado: string): Promise<RifaResponse> {
    const response = await fetch(`${API_BASE_URL}/api/rifas/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ estado })
    })
    return this.handleResponse<RifaResponse>(response)
  }
}

export const rifaApi = new RifaApiService()
