'use client'

import { useState, useEffect, useCallback } from 'react'
import { ventasApi } from '@/lib/ventasApi'
import { BoletaDisponible, BoletaEnCarrito, BoletaBloqueada } from '@/types/ventas'
import { useRef } from 'react'


interface SelectorBoletasProps {
  rifaId: string
  precioBoleta: number
  onBoletaSeleccionada: (boleta: BoletaEnCarrito) => void
  onBoletaRemovida: (boletaId: string) => void
  boletasSeleccionadas: BoletaEnCarrito[]


  
}




export default function SelectorBoletas({ 
  rifaId, 
  precioBoleta, 
  onBoletaSeleccionada, 
  onBoletaRemovida,
  boletasSeleccionadas 
}: SelectorBoletasProps) {
  const [boletasDisponibles, setBoletasDisponibles] = useState<BoletaDisponible[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [boletasPorPagina] = useState(20)
  const [bloqueando, setBloqueando] = useState<Set<string>>(new Set())
  const intervalosRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())


  // Cargar boletas disponibles
  const cargarBoletasDisponibles = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await ventasApi.getBoletasDisponibles(rifaId)
      const boletas = response.data || []
      
      // Filtrar solo las boletas disponibles y transformar al formato esperado
      const boletasDisponibles = boletas
        .filter((boleta: any) => boleta.estado === 'DISPONIBLE')
        .map((boleta: any) => ({
          id: boleta.id,
          numero: boleta.numero,
          estado: 'DISPONIBLE' as const,
          qr_url: boleta.qr_url || '',
          barcode: boleta.barcode || '',
          imagen_url: boleta.imagen_url,
          rifa_nombre: '',
          rifa_id: rifaId,
          precio: 0
        }))
      
      setBoletasDisponibles(boletasDisponibles)
      
      // Si no hay boletas disponibles, mostrar mensaje informativo
      if (boletasDisponibles.length === 0) {
        const totalBoletas = boletas.length
        const reservadas = boletas.filter((b: any) => b.estado === 'RESERVADA').length
        const vendidas = boletas.filter((b: any) => b.estado === 'VENDIDA').length
        
        setError(`No hay boletas disponibles. Total: ${totalBoletas}, Reservadas: ${reservadas}, Vendidas: ${vendidas}`)
      }
    } catch (error: any) {
      console.error('Error cargando boletas:', error)
      
      // Verificar si es un error de endpoint no encontrado
      if (error.message && error.message.includes('Endpoint no encontrado')) {
        setError('El endpoint de boletas no está disponible. Contacte al administrador.')
      } else {
        setError('Error cargando boletas disponibles')
      }
      
      setBoletasDisponibles([]) // Establecer array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }, [rifaId])

  // Bloquear boleta al seleccionarla
  const seleccionarBoleta = async (boleta: BoletaDisponible) => {
    if (bloqueando.has(boleta.id)) return
    
    setBloqueando(prev => new Set(prev).add(boleta.id))
    
    try {
      // Bloquear la boleta
      const response = await ventasApi.bloquearBoleta(boleta.id, 15) // 15 minutos
      const bloqueo = response.data
      
      // Agregar al carrito
      const boletaEnCarrito: BoletaEnCarrito = {
        id: boleta.id,
        numero: boleta.numero,
        precio: precioBoleta,
        reserva_token: bloqueo.reserva_token,
        bloqueo_hasta: bloqueo.bloqueo_hasta,
        qr_url: boleta.qr_url,
        barcode: boleta.barcode,
        imagen_url: boleta.imagen_url,
      }
      
      onBoletaSeleccionada(boletaEnCarrito)
      
      // Remover de disponibles
      setBoletasDisponibles(prev => prev.filter(b => b.id !== boleta.id))
      
      // Iniciar verificación periódica del bloqueo
      const intervalId = await ventasApi.verificarBloqueoPeriodico(
  boleta.id,
  bloqueo.reserva_token,
  (valid) => {
    if (!valid) {
      onBoletaRemovida(boleta.id)
      setBoletasDisponibles(prev => [...prev, boleta])

      const interval = intervalosRef.current.get(boleta.id)
      if (interval) {
        clearInterval(interval)
        intervalosRef.current.delete(boleta.id)
      }
    }
  }
)

intervalosRef.current.set(boleta.id, intervalId)

      
    } catch (error) {
      setError(`La boleta #${boleta.numero} ya fue seleccionada por otro usuario. Por favor elige otra boleta.`)
      console.error('Error bloqueando boleta:', error)
      // refrescar lista inmediatamente
      // cargarBoletasDisponibles()
    } finally {
      setBloqueando(prev => {
        const newSet = new Set(prev)
        newSet.delete(boleta.id)
        return newSet
      })
    }
  }

  // Remover boleta del carrito y desbloquear
  const removerBoleta = async (boleta: BoletaEnCarrito) => {
    try {
      await ventasApi.desbloquearBoleta(boleta.id, boleta.reserva_token)
      
    const interval = intervalosRef.current.get(boleta.id)
if (interval) {
  clearInterval(interval)
  intervalosRef.current.delete(boleta.id)
}


      // Devolver a disponibles
      const boletaDisponible: BoletaDisponible = {
        id: boleta.id,
        numero: boleta.numero,
        estado: 'DISPONIBLE',
        qr_url: boleta.qr_url,
        barcode: boleta.barcode,
        imagen_url: boleta.imagen_url,
        rifa_nombre: '', // No disponible en este contexto
        rifa_id: rifaId,
        precio: precioBoleta,
      }
      
      setBoletasDisponibles(prev => [...prev, boletaDisponible])
      onBoletaRemovida(boleta.id)
      
    } catch (error) {
      console.error('Error desbloqueando boleta:', error)
    }
  }

  // Filtrar boletas por búsqueda
  const boletasFiltradas = (boletasDisponibles || []).filter(boleta =>
    boleta.numero.toString().includes(busqueda)
  )

  // Paginación
  const totalPaginas = Math.ceil(boletasFiltradas.length / boletasPorPagina)
  const boletasPagina = boletasFiltradas.slice(
    (pagina - 1) * boletasPorPagina,
    pagina * boletasPorPagina
  )

  // Cargar boletas al montar
  useEffect(() => {
    cargarBoletasDisponibles()
  }, [cargarBoletasDisponibles])


  useEffect(() => {
  return () => {
    if (boletasSeleccionadas.length > 0) {
      ventasApi.liberarBloqueosMultiples(
        boletasSeleccionadas.map(b => ({
          id: b.id,
          reserva_token: b.reserva_token
        }))
      )
    }

    // limpiar todos los intervalos
    intervalosRef.current.forEach(interval => {
      clearInterval(interval)
    })

    intervalosRef.current.clear()
  }
}, [])


useEffect(() => {
  const handleBeforeUnload = () => {
    if (boletasSeleccionadas.length > 0) {
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_API_URL}/boletas/unblock-multiple`,
        JSON.stringify({
          boletas: boletasSeleccionadas.map(b => ({
            id: b.id,
            reserva_token: b.reserva_token
          }))
        })
      )
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}, [boletasSeleccionadas])



  // Actualización periódica de disponibles
  useEffect(() => {
    const interval = setInterval(() => {
      if (boletasDisponibles.length >= 0) { // Solo actualizar si hay datos
        cargarBoletasDisponibles()
      }
    }, 30000) // 30 segundos
    return () => clearInterval(interval)
  }, [cargarBoletasDisponibles, boletasDisponibles.length])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-slate-900">Seleccionar Boletas Disponibles</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600">
            <span className="font-medium">{boletasDisponibles?.length || 0}</span> disponibles
          </div>
          <button
            onClick={cargarBoletasDisponibles}
            disabled={loading}
            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por número de boleta..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="text-black placeholder:text-slate-500 w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
        />
      </div>

      {/* Boletas Seleccionadas */}
      {boletasSeleccionadas.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-3">
            Boletas Seleccionadas ({boletasSeleccionadas.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {boletasSeleccionadas.map((boleta) => (
              <div
                key={boleta.id}
                className="bg-white border border-blue-300 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
<div className="font-medium text-blue-900">
  #{String(boleta.numero).padStart(4, '0')}
</div>                  <div className="text-xs text-blue-700">
                    Bloqueada hasta: {new Date(boleta.bloqueo_hasta).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => removerBoleta(boleta)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Boletas Disponibles */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-4">
            <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-600">Cargando boletas disponibles...</p>
        </div>
      ) : boletasPagina.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {busqueda ? 'No se encontraron boletas' : 'No hay boletas disponibles'}
          </h3>
          <p className="text-slate-600 mb-4 max-w-md mx-auto">
            {busqueda 
              ? `No hay boletas que coincidan con "${busqueda}". Intenta con otro número de boleta.`
              : 'Todas las boletas de esta rifa pueden estar vendidas o reservadas. Intenta más tarde o contacta al administrador.'
            }
          </p>
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {boletasPagina.map((boleta) => (
            <button
              key={boleta.id}
              onClick={() => seleccionarBoleta(boleta)}
              disabled={bloqueando.has(boleta.id)}
              className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">
                  #{boleta.numero.toString().padStart(4, '0')}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  ${precioBoleta.toFixed(2)}
                </div>
                {bloqueando.has(boleta.id) && (
                  <div className="text-xs text-blue-600 mt-2">
                    Bloqueando...
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPagina(prev => Math.max(1, prev - 1))}
            disabled={pagina === 1}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-600">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(prev => Math.min(totalPaginas, prev + 1))}
            disabled={pagina === totalPaginas}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
