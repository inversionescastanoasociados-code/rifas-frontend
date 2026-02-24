'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/config/api'

interface LoginFormData {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  message: string
  data?: {
    token: string
    user: {
      id: string
      email: string
      nombre: string
      rol: string
    }
  }
  error?: string
  details?: Array<{
    field: string
    message: string
  }>
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data: LoginResponse = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.data!.token)
        localStorage.setItem('user', JSON.stringify(data.data!.user))
        router.push('/dashboard')
      } else {
        if (data.error === 'Validation Error' && data.details) {
          const validationErrors = data.details.map(detail => detail.message).join(', ')
          setError(validationErrors)
        } else {
          setError(data.message || 'Error al iniciar sesión')
        }
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-slate-900 mb-2">Bienvenido</h1>
            <p className="text-slate-500 text-sm">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-200 text-black placeholder-slate-500 bg-white"
                placeholder="admin@rifas.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-black mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-200 text-black placeholder-slate-500 bg-white"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              Sistema de Rifas © 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
