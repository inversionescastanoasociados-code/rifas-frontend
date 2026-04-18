// Configuración de medios de pago por rol
// ADMIN/SUPER_ADMIN usan la cuenta principal
// VENDEDOR usa su propia cuenta

import { TokenManager } from '@/utils/auth'

interface PaymentInfo {
  llave: string | null
  cuentaBancolombia: string
  titular: string
  whatsapp: string | null
}

const ADMIN_PAYMENT: PaymentInfo = {
  llave: '0091761012',
  cuentaBancolombia: '70800002342',
  titular: 'INVERSIONES CASTAÑO SAS',
  whatsapp: null,
}

const VENDEDOR_PAYMENT: PaymentInfo = {
  llave: null,
  cuentaBancolombia: '70800002404',
  titular: 'Inversiones Castaño asociados',
  whatsapp: '3228015848',
}

export function getPaymentInfo(): PaymentInfo {
  const user = TokenManager.getUser()
  const rol = user?.rol?.toUpperCase()
  if (rol === 'VENDEDOR') return VENDEDOR_PAYMENT
  return ADMIN_PAYMENT
}

/**
 * Genera el bloque de texto de medios de pago para mensajes de WhatsApp.
 * Formato multilinea para incluir en mensajes.
 */
export function getMediosDePagoTexto(): string {
  const info = getPaymentInfo()
  let texto = `*MEDIOS DE PAGO*\n`
  if (info.llave) {
    texto += `💰 LLAVE ${info.llave} \n`
  }
  texto += `💰 CUENTA DE AHORROS BANCOLOMBIA: ${info.cuentaBancolombia}\n`
  texto += `${info.titular}\n`
  if (info.whatsapp) {
    texto += `📲 WHATSAPP: ${info.whatsapp}\n`
  }
  texto += `\n*Importante: enviar comprobante de pago una vez realizada la transferencia* ✅`
  return texto
}

/**
 * Versión con saltos de línea extras al inicio (para concatenar en mensajes).
 */
export function getMediosDePagoBloque(): string {
  return `\n\n${getMediosDePagoTexto()}`
}
