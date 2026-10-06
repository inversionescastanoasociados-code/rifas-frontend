/** Texto fijo en boleta impresa (no depende de sorteo ni bloqueo_hasta). */
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
