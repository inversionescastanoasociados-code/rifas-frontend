/** UUIDs de medios_pago en producción */
export const MEDIO_PAGO_EFECTIVO_ID = 'd397d917-c0d0-4c61-b2b3-2ebfab7deeb7'
export const MEDIO_PAGO_PSE_ID = 'db94562d-bb01-42a3-9414-6e369a1a70ba'
export const MEDIO_PAGO_CUENTA_EXTRANJERO_ID = 'c8f4e2a1-9b3d-4e7f-8c6d-5a4b3c2d1e0f'

/** Claves del formulario de abonos (RegistrarAbono, ventas públicas) */
export const MEDIO_ABONO_EFECTIVO = 'efectivo'
export const MEDIO_ABONO_PSE = 'transferencia'
export const MEDIO_ABONO_CUENTA_EXTRANJERO = 'cuenta_extranjero'

/** Select de ventas / convertir reserva (UUID) */
export const MEDIOS_PAGO_VENTAS_UI = [
  { id: MEDIO_PAGO_EFECTIVO_ID, label: 'Efectivo' },
  { id: MEDIO_PAGO_PSE_ID, label: 'PSE' },
  { id: MEDIO_PAGO_CUENTA_EXTRANJERO_ID, label: 'Cuenta extranjero' },
] as const

/** Select de abonos (clave string → backend metodoPagoMap) */
export const MEDIOS_PAGO_ABONO_UI = [
  { id: MEDIO_ABONO_EFECTIVO, label: 'Efectivo' },
  { id: MEDIO_ABONO_PSE, label: 'PSE' },
  { id: MEDIO_ABONO_CUENTA_EXTRANJERO, label: 'Cuenta extranjero' },
] as const

export const MEDIOS_PAGO_MAP: Record<string, string> = {
  [MEDIO_PAGO_EFECTIVO_ID]: 'Efectivo',
  [MEDIO_PAGO_PSE_ID]: 'PSE',
  [MEDIO_PAGO_CUENTA_EXTRANJERO_ID]: 'Cuenta extranjero',
}

export function requiereComprobanteMedio(medioIdOrKey: string | null | undefined): boolean {
  if (!medioIdOrKey) return false
  const m = medioIdOrKey.trim().toLowerCase()
  if (
    m === MEDIO_PAGO_EFECTIVO_ID ||
    m === MEDIO_ABONO_EFECTIVO ||
    m === 'efectivo'
  ) {
    return false
  }
  if (
    m === MEDIO_PAGO_PSE_ID ||
    m === MEDIO_ABONO_PSE ||
    m === 'transferencia' ||
    m === 'pse'
  ) {
    return false
  }
  if (
    m === MEDIO_PAGO_CUENTA_EXTRANJERO_ID ||
    m === MEDIO_ABONO_CUENTA_EXTRANJERO ||
    m === 'cuenta_extranjero' ||
    m === 'cuenta extranjero'
  ) {
    return false
  }
  return true
}

export function labelMedioPagoId(medioId: string | null | undefined): string {
  if (!medioId) return 'este medio'
  return MEDIOS_PAGO_MAP[medioId] || 'este medio'
}
