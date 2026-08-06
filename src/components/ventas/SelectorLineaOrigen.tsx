'use client'

import { LINEAS_ORIGEN_VENTA, LineaOrigenVenta } from '@/utils/lineaOrigen'

interface SelectorLineaOrigenProps {
  value: LineaOrigenVenta | null
  onChange: (value: LineaOrigenVenta) => void
  disabled?: boolean
  compact?: boolean
}

export default function SelectorLineaOrigen({
  value,
  onChange,
  disabled = false,
  compact = false,
}: SelectorLineaOrigenProps) {
  return (
    <div>
      <p className={`font-semibold text-slate-700 ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
        ¿Desde dónde se hizo la venta?
      </p>
      <div className={`grid grid-cols-4 ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {LINEAS_ORIGEN_VENTA.map((linea) => (
          <button
            key={linea}
            type="button"
            disabled={disabled}
            onClick={() => onChange(linea)}
            className={`rounded-xl font-bold transition-all border-2 disabled:opacity-50 active:scale-95 ${
              compact ? 'py-2.5 text-sm' : 'py-3 text-sm'
            } ${
              value === linea
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            L{linea}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('PISTA')}
          className={`col-span-2 rounded-xl font-bold transition-all border-2 disabled:opacity-50 active:scale-95 ${
            compact ? 'py-2.5 text-sm' : 'py-3 text-sm'
          } ${
            value === 'PISTA'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          🏪 Pista (físico)
        </button>
      </div>
    </div>
  )
}
