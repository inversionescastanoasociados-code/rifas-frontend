'use client'

import { useRouter } from 'next/navigation'

export default function VentasHomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-slate-600 hover:text-slate-900"
            >
              ← Dashboard
            </button>
            <h1 className="text-xl font-semibold text-slate-900">
              Sistema de Ventas
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-slate-900">
            ¿Qué deseas hacer?
          </h2>
          <p className="text-slate-600 mt-2">
            Selecciona una opción para continuar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nueva Venta */}
          <button
            onClick={() => router.push('/ventas/nueva-venta')}
            className="bg-white border border-slate-200 rounded-xl p-8 text-left hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              Nueva venta
            </h3>
            <p className="text-slate-600 mt-2">
              Registrar una nueva venta de boletas para un cliente
            </p>
          </button>

          {/* Gestionar / Abonos */}
          <button
            onClick={() => router.push('/ventas/gestionar')}
            className="bg-white border border-slate-200 rounded-xl p-8 text-left hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 9V7a5 5 0 00-10 0v2M5 13h14l-1.5 8h-11L5 13z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              Cobrar venta pendiente
            </h3>
            <p className="text-slate-600 mt-2">
              Registrar pagos o abonos a ventas existentes
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}