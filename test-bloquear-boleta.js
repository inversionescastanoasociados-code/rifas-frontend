// Prueba del endpoint de bloquear boleta
import { ventasApi } from '../src/lib/ventasApi'

// Función para probar el endpoint de bloquear boleta
async function probarBloquearBoleta() {
  console.log('🧪 Iniciando prueba del endpoint bloquear boleta...')
  
  // ID de una boleta de prueba (debes reemplazar con un ID real)
  const boletaId = 'test-boleta-id'
  const tiempoBloqueo = 5 // 5 minutos para la prueba
  
  try {
    console.log(`📋 Intentando bloquear boleta ${boletaId} por ${tiempoBloqueo} minutos...`)
    
    // Llamar al endpoint
    const response = await ventasApi.bloquearBoleta(boletaId, tiempoBloqueo)
    
    console.log('✅ Respuesta exitosa:', response)
    console.log('🔒 Boleta bloqueada correctamente')
    console.log('📄 Datos del bloqueo:', response.data)
    
    // Verificar que la respuesta tenga los campos esperados
    if (response.data && response.data.reserva_token) {
      console.log('✅ Token de reserva obtenido:', response.data.reserva_token)
    }
    
    if (response.data && response.data.bloqueo_hasta) {
      console.log('⏰ Bloqueo válido hasta:', new Date(response.data.bloqueo_hasta).toLocaleString())
    }
    
    return response.data
    
  } catch (error) {
    console.error('❌ Error al bloquear boleta:', error)
    
    // Analizar el tipo de error
    if (error.message && error.message.includes('404')) {
      console.error('🔍 El endpoint no existe o la boleta no fue encontrada')
    } else if (error.message && error.message.includes('401')) {
      console.error('🔐 Problema de autenticación - verifica el token')
    } else if (error.message && error.message.includes('409')) {
      console.error('⚠️ La boleta ya está bloqueada o no está disponible')
    }
    
    throw error
  }
}

// Función para probar el desbloqueo
async function probarDesbloquearBoleta(boletaId: string, reservaToken: string) {
  console.log('🔓 Iniciando prueba del endpoint desbloquear boleta...')
  
  try {
    const response = await ventasApi.desbloquearBoleta(boletaId, reservaToken)
    console.log('✅ Boleta desbloqueada correctamente:', response)
    return response.data
  } catch (error) {
    console.error('❌ Error al desbloquear boleta:', error)
    throw error
  }
}

// Función para probar verificación de bloqueo
async function probarVerificarBloqueo(boletaId: string, reservaToken: string) {
  console.log('🔍 Iniciando prueba del endpoint verificar bloqueo...')
  
  try {
    const response = await ventasApi.verificarBloqueo(boletaId, reservaToken)
    console.log('✅ Verificación de bloqueo:', response)
    console.log('📊 Estado del bloqueo:', {
      valid: response.data.valid,
      expired: response.data.expired
    })
    return response.data
  } catch (error) {
    console.error('❌ Error al verificar bloqueo:', error)
    throw error
  }
}

// Ejecutar pruebas completas
async function ejecutarPruebasCompletas() {
  console.log('🚀 Iniciando pruebas completas del sistema de bloqueo de boletas')
  
  const boletaId = 'test-boleta-id' // Reemplazar con ID real
  
  try {
    // 1. Probar bloqueo
    const bloqueo = await probarBloquearBoleta()
    
    if (bloqueo && bloqueo.reserva_token) {
      // 2. Probar verificación
      await probarVerificarBloqueo(boletaId, bloqueo.reserva_token)
      
      // 3. Probar desbloqueo
      await probarDesbloquearBoleta(boletaId, bloqueo.reserva_token)
    }
    
    console.log('🎉 Todas las pruebas completadas exitosamente')
    
  } catch (error) {
    console.error('💥 Las pruebas fallaron:', error)
  }
}

// Exportar funciones para uso en otros archivos
export {
  probarBloquearBoleta,
  probarDesbloquearBoleta,
  probarVerificarBloqueo,
  ejecutarPruebasCompletas
}

// Ejecutar si se corre directamente este archivo
if (typeof window !== 'undefined') {
  // En el navegador, exponer funciones globalmente
  (window as any).pruebasBloqueo = {
    probarBloquearBoleta,
    probarDesbloquearBoleta,
    probarVerificarBloqueo,
    ejecutarPruebasCompletas
  }
  
  console.log('🌐 Funciones de prueba disponibles en window.pruebasBloqueo')
  console.log('📝 Para ejecutar: window.pruebasBloqueo.ejecutarPruebasCompletas()')
}
