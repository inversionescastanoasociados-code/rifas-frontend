/**
 * Texto fijo en boleta impresa (panel izquierdo del ticket).
 * Plazo de reserva/abono — no confundir con la fecha del premio mayor (26 dic).
 */
export const TEXTO_RESERVADA_HASTA = 'Reservada hasta el 23 de diciembre'

export const LINEA_CONDICIONES_RESERVA = `- ${TEXTO_RESERVADA_HASTA}`

/** Línea de condiciones para boletas reservadas o abonadas con cliente. */
export function lineaCondicionesReserva(opts: {
  esReservada: boolean
  esAbonada?: boolean
  tieneCliente: boolean
}): string | null {
  const { esReservada, esAbonada, tieneCliente } = opts
  if (!tieneCliente || !(esReservada || esAbonada)) return null
  return LINEA_CONDICIONES_RESERVA
}
