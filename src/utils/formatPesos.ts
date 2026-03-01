/**
 * Utilidad para formatear inputs de dinero en formato de pesos colombianos.
 * Ejemplo: 120000 → "$ 120.000"
 * 
 * Uso en inputs:
 *   value={formatearInputPesos(monto)}
 *   onChange={(e) => setMonto(parsearInputPesos(e.target.value))}
 */

/** Convierte un número a string formateado: 120000 → "120.000" (sin símbolo $) */
export function formatearInputPesos(valor: number): string {
  if (!valor || valor === 0) return ''
  return valor.toLocaleString('es-CO')
}

/** Convierte un string formateado a número: "120.000" → 120000 */
export function parsearInputPesos(texto: string): number {
  if (!texto || texto.trim() === '') return 0
  // Remover todo excepto dígitos
  const soloDigitos = texto.replace(/[^\d]/g, '')
  return parseInt(soloDigitos, 10) || 0
}

/** 
 * Formatea un número como moneda colombiana completa: 120000 → "$ 120.000"
 * Para mostrar (no para inputs)
 */
export function formatoMonedaCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}
