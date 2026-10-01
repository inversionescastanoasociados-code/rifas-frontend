/** Formato estándar de número de boleta en la UI (4 dígitos). */
export function formatNumeroBoleta(numero: number): string {
  return String(numero).padStart(4, '0')
}

/** Solo dígitos del término (ignora #, espacios, guiones). */
export function extractBoletaDigits(raw: string): string {
  return raw.trim().replace(/^#+\s*/, '').replace(/\D/g, '')
}

/** El usuario parece buscar un número de boleta, no un nombre. */
export function looksLikeBoletaNumberQuery(raw: string): boolean {
  const t = raw.trim()
  if (!t) return false
  const compact = t.replace(/\s/g, '')
  if (/^#?\d+$/.test(compact)) return true
  const digits = extractBoletaDigits(t)
  if (!digits) return false
  return digits.length === extractBoletaDigits(compact)
}

export function matchesNumeroBoleta(numero: number, rawQuery: string): boolean {
  const digits = extractBoletaDigits(rawQuery)
  if (!digits) return false

  const padded = formatNumeroBoleta(numero)
  const plain = String(numero)
  const parsed = parseInt(digits, 10)

  if (!Number.isNaN(parsed) && parsed === numero) return true
  if (digits === padded || digits === plain) return true
  if (padded.includes(digits) || plain.includes(digits)) return true

  return false
}

export function isExactNumeroBoletaMatch(numero: number, rawQuery: string): boolean {
  const digits = extractBoletaDigits(rawQuery)
  if (!digits) return false
  const parsed = parseInt(digits, 10)
  return (
    (!Number.isNaN(parsed) && parsed === numero) ||
    digits === formatNumeroBoleta(numero) ||
    digits === String(numero)
  )
}

type ClienteSearchFields = {
  cliente_nombre?: string | null
  cliente_telefono?: string | null
  cliente_identificacion?: string | null
  rifa_nombre?: string | null
}

function includesTerm(haystack: string | null | undefined, term: string): boolean {
  if (!haystack || !term) return false
  return haystack.toLowerCase().includes(term.toLowerCase())
}

/** Búsqueda unificada para módulo boletas reservadas / devueltas. */
export function matchesBoletaModuleSearch(
  numero: number,
  query: string,
  fields: ClienteSearchFields
): boolean {
  const q = query.trim()
  if (!q) return true

  const termLower = q.toLowerCase()
  const numeroMatch = matchesNumeroBoleta(numero, q)

  if (looksLikeBoletaNumberQuery(q)) {
    return (
      numeroMatch ||
      (fields.cliente_telefono != null && fields.cliente_telefono.replace(/\D/g, '').includes(extractBoletaDigits(q))) ||
      includesTerm(fields.cliente_identificacion, q)
    )
  }

  return (
    numeroMatch ||
    includesTerm(fields.cliente_nombre, termLower) ||
    includesTerm(fields.cliente_telefono, termLower) ||
    includesTerm(fields.cliente_identificacion, termLower) ||
    includesTerm(fields.rifa_nombre, termLower)
  )
}

export function sortByNumeroMatchFirst<T extends { numero: number }>(
  items: T[],
  query: string
): T[] {
  if (!looksLikeBoletaNumberQuery(query.trim())) return items
  return [...items].sort((a, b) => {
    const aExact = isExactNumeroBoletaMatch(a.numero, query) ? 1 : 0
    const bExact = isExactNumeroBoletaMatch(b.numero, query) ? 1 : 0
    if (aExact !== bExact) return bExact - aExact
    const aPartial = matchesNumeroBoleta(a.numero, query) ? 1 : 0
    const bPartial = matchesNumeroBoleta(b.numero, query) ? 1 : 0
    if (aPartial !== bPartial) return bPartial - aPartial
    return a.numero - b.numero
  })
}
