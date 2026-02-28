'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import VentasOnlineBanner from '@/components/ventasPublicas/VentasOnlineBanner'

interface User {
  id: string
  email: string
  nombre: string
  rol: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.nombre}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Ventas Online Pendientes */}
        {(user.rol === 'SUPER_ADMIN' || user.rol === 'VENDEDOR') && (
          <VentasOnlineBanner onVerPendientes={() => router.push('/ventas-publicas')} />
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-black mb-4">
            Bienvenido al Dashboard
          </h2>
          <p className="text-slate-600 mb-6">
            Usuario logueado: <span className="font-medium">{user.nombre}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Rol</h3>
              <p className="text-2xl font-light text-slate-900">{user.rol}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-2">ID de Usuario</h3>
              <p className="text-sm font-mono text-slate-900">{user.id}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Estado</h3>
              <p className="text-2xl font-light text-green-600">Activo</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-black mb-4">Módulos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Módulo de Ventas - Disponible para SUPER_ADMIN y VENDEDOR */}
              {(user.rol === 'SUPER_ADMIN' || user.rol === 'VENDEDOR') && (
                <a
                  href="/ventas"
                  className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-blue-900 mb-2 ml-3">Ventas</h4>
                  </div>
                  <p className="text-sm text-blue-700">Sistema de ventas con bloqueo en tiempo real</p>
                  <div className="mt-3 flex items-center text-xs text-blue-600">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      En vivo
                    </span>
                  </div>
                </a>
              )}

              {/* Módulo de Ventas Públicas - Disponible para SUPER_ADMIN y VENDEDOR */}
              {(user.rol === 'SUPER_ADMIN' || user.rol === 'VENDEDOR') && (
                <a
                  href="/ventas-publicas"
                  className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white group-hover:bg-green-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-green-900 mb-2 ml-3">Ventas Públicas</h4>
                  </div>
                  <p className="text-sm text-green-700">Confirmar pagos desde la web pública</p>
                  <div className="mt-3 flex items-center text-xs text-green-600">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      Nuevo
                    </span>
                  </div>
                </a>
              )}

              {/* Módulo de Boletas Reservadas - Disponible para SUPER_ADMIN y VENDEDOR */}
              {(user.rol === 'SUPER_ADMIN' || user.rol === 'VENDEDOR') && (
                <a
                  href="/boletas-reservadas"
                  className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white group-hover:bg-amber-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-amber-900 mb-2 ml-3">Boletas Reservadas</h4>
                  </div>
                  <p className="text-sm text-amber-700">Administrar y liberar boletas reservadas sin pago</p>
                  <div className="mt-3 flex items-center text-xs text-amber-600">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                      Nuevo
                    </span>
                  </div>
                </a>
              )}
              
              <a
                href="/clientes"
                className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <h4 className="text-lg font-medium text-slate-900 mb-2">Clientes</h4>
                <p className="text-sm text-slate-600">Gestionar clientes del sistema</p>
              </a>
              {user.rol === 'SUPER_ADMIN' && (
                <a
                  href="/rifas"
                  className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h4 className="text-lg font-medium text-slate-900 mb-2">Rifas</h4>
                  <p className="text-sm text-slate-600">Gestionar rifas y sorteos</p>
                </a>
              )}
              {user.rol === 'SUPER_ADMIN' && (
                <a
                  href="/boletas/ver"
                  className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h4 className="text-lg font-medium text-slate-900 mb-2">Boletas</h4>
                  <p className="text-sm text-slate-600">Ver todas las boletas del sistema</p>
                </a>
              )}
              {(user.rol === 'SUPER_ADMIN' || user.rol === 'VENDEDOR') ? (
                <a
                  href="/analytics"
                  className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h4 className="text-lg font-medium text-slate-900 mb-2">Reportes</h4>
                  <p className="text-sm text-slate-600">Ver reportes y métricas de rifas</p>
                </a>
              ) : (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 opacity-50">
                  <h4 className="text-lg font-medium text-slate-400 mb-2">Reportes</h4>
                  <p className="text-sm text-slate-400">Próximamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
