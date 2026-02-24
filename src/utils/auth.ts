// Utilidad para manejo de tokens y autenticación

export class TokenManager {
  // Limpiar todos los datos de autenticación
  static clearAuthData(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Verificar si el token es válido
  static isTokenValid(): boolean {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      return false
    }

    try {
      // Verificar que el user sea JSON válido
      JSON.parse(user)
      return true
    } catch {
      // Si el user no es JSON válido, limpiar todo
      this.clearAuthData()
      return false
    }
  }

  // Obtener token de forma segura
  static getToken(): string | null {
    if (!this.isTokenValid()) {
      return null
    }
    return localStorage.getItem('token')
  }

  // Obtener usuario de forma segura
  static getUser(): any | null {
    if (!this.isTokenValid()) {
      return null
    }
    
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      this.clearAuthData()
      return null
    }
  }

  // Guardar datos de autenticación de forma segura
  static saveAuthData(token: string, user: any): void {
    try {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    } catch (error) {
      console.error('Error guardando datos de autenticación:', error)
      this.clearAuthData()
    }
  }

  // Manejar error de autenticación
  static handleAuthError(): void {
    console.warn('Error de autenticación detectado, limpiando datos...')
    this.clearAuthData()
    
    // Redirigir a login si estamos en el navegador
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// Hook para verificar autenticación en componentes
export function useAuth() {
  const isAuthenticated = TokenManager.isTokenValid()
  const user = TokenManager.getUser()
  const token = TokenManager.getToken()

  const logout = () => {
    TokenManager.clearAuthData()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return {
    isAuthenticated,
    user,
    token,
    logout
  }
}
