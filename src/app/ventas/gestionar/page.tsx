'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClienteSearch from '@/components/ventas/ClienteSearch'
import { Cliente } from '@/types/ventas'
import ListaVentasPendientes from '@/components/ventas/ListaVentasPendientes'

export default function GestionarAbonosPage() {
  const router = useRouter()

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null)

  const volverVentas = () => router.push('/ventas')
  const volverDashboard = () => router.push('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header alineado con /ventas y /ventas/nueva-venta */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <button
              type="button"
              onClick={volverVentas}
              className="text-slate-600 hover:text-slate-900"
            >
              ← Ventas
            </button>
            <button
              type="button"
              onClick={volverDashboard}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Dashboard
            </button>
            <h1 className="text-xl font-semibold text-slate-900">
              Gestionar Abonos
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Paso 1: Buscar Cliente */}
        {!clienteSeleccionado && (
          <ClienteSearch
            permitirCrear={false}
            onClienteSelected={(cliente) => {
              setClienteSeleccionado(cliente)
            }}
            
          />
        )}

        {/* Paso 2: Cliente Seleccionado */}
        {clienteSeleccionado && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Cliente Seleccionado
                  </h2>
                  <p className="text-slate-700 mt-1">
                    {clienteSeleccionado.nombre}
                  </p>
                  <p className="text-sm text-slate-500">
                    {clienteSeleccionado.telefono}
                  </p>
                  {clienteSeleccionado.email && (
                    <p className="text-sm text-slate-500">
                      {clienteSeleccionado.email}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setClienteSeleccionado(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cambiar Cliente
                </button>
              </div>
            </div>

            {/* Paso 3: Listar ventas pendientes */}
            <ListaVentasPendientes
              clienteId={clienteSeleccionado.id}
            />
          </div>
        )}
      </main>
    </div>
  )
}