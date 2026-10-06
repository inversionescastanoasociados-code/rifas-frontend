const TZ_COLOMBIA = 'America/Bogota'

/** Ej: "23 de diciembre" (día calendario en Colombia, sin hora). */
export function formatReservaHastaCorta(d?: string | null): string | null {
  if (!d) return null
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return null
    return dt.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      timeZone: TZ_COLOMBIA,
    })
  } catch {
    return null
  }
}

/** Ej: "23 de diciembre de 2026" */
export function formatReservaHastaCompleta(d?: string | null): string | null {
  if (!d) return null
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return null
    const parte = dt.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TZ_COLOMBIA,
    })
    return parte
  } catch {
    return null
  }
}

/** Texto unificado para bloque de estado (sin hora). */
export function textoReservadaHasta(d?: string | null): string | null {
  const f = formatReservaHastaCorta(d)
  return f ? `Reservada hasta el ${f}` : null
}

/** Línea de condiciones para boletas reservadas/abonadas con cliente. */
export function lineaCondicionesReserva(opts: {
  reservadaHasta?: string | null
  esReservada: boolean
  esAbonada?: boolean
  tieneCliente: boolean
}): string | null {
  const { reservadaHasta, esReservada, esAbonada, tieneCliente } = opts
  if (!tieneCliente || !(esReservada || esAbonada)) return null
  const t = textoReservadaHasta(reservadaHasta)
  if (!t) return null
  return `- ${t}`
}
