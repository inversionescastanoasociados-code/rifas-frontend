/** UUIDs de medios_pago en producción */
export const MEDIO_PAGO_EFECTIVO_ID = 'd397d917-c0d0-4c61-b2b3-2ebfab7deeb7'
export const MEDIO_PAGO_PSE_ID = 'db94562d-bb01-42a3-9414-6e369a1a70ba'

/** Claves del formulario de abonos (RegistrarAbono) */
export const MEDIO_ABONO_EFECTIVO = 'efectivo'
export const MEDIO_ABONO_PSE = 'transferencia'

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
  return true
}
