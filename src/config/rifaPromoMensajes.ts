/**
 * Textos de premios y reglas de participación (rifa activa).
 * Usar en WhatsApp, ventas públicas y seguimiento para mantener un solo criterio.
 */

export const MINIMO_ABONO_ANTICIPADO_COP = 80_000

export function getBloqueReglasPremiosWhatsApp(): string {
  return (
    `\n\n🏆 *PARA PARTICIPAR EN LOS PREMIOS:*\n` +
    `🚗 *Anticipado (14 de noviembre):* Hyundai i10 0 km 2027 — mínimo *$80.000* abonados por boleta\n` +
    `🚛 *Premio mayor (26 de diciembre):* Camión FVR 0 km 2027 + todo para la rumba navideña (evaluado en *$10.000.000*) — boleta pagada al 100%`
  )
}

export function getBloquePremiosSeguimientoWhatsApp(): string {
  return (
    `🎯 *Premios de la rifa:*\n` +
    `🚗 *Anticipado 14 de noviembre:* Hyundai i10 0 km 2027 — mínimo *$80.000* por boleta\n` +
    `🚛 *Premio mayor 26 de diciembre:* Camión FVR 0 km 2027 + rumba navideña ($10 millones) — boleta pagada al 100%\n\n`
  )
}
