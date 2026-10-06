import { BOLETA_LEFT_WIDTH } from '@/constants/boletaDimensions'

/** Estilos compartidos panel izquierdo (React inline + descarga HTML). */
export const BOLETA_LEFT_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
export const BOLETA_LEFT_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
export const BOLETA_LEFT_BG =
  'linear-gradient(165deg, #0a0f1a 0%, #121a2e 48%, #0f1628 100%)'
export const BOLETA_LEFT_BORDER = '1px solid rgba(148, 163, 184, 0.22)'

export function boletaLeftPanelRootStyle(height: number): string {
  return [
    `flex-shrink:0`,
    `display:flex`,
    `flex-direction:column`,
    `justify-content:space-between`,
    `width:${BOLETA_LEFT_WIDTH}px`,
    `height:${height}px`,
    `padding:10px 9px`,
    `box-sizing:border-box`,
    `background:${BOLETA_LEFT_BG}`,
    `border-right:${BOLETA_LEFT_BORDER}`,
    `font-family:${BOLETA_LEFT_FONT}`,
    `color:#cbd5e1`,
    `overflow:hidden`,
  ].join(';')
}

export function buildBoletaLeftPanelHtml(args: {
  height: number
  caducidadText: string
  estadoHTML: string
  qrSrc: string
  numPad: string
  precioNum: number | null
  notaHtml?: string
}): string {
  const { height, caducidadText, estadoHTML, qrSrc, numPad, precioNum, notaHtml = '' } = args
  const precioBlock = precioNum
    ? `<div style="font-size:10px;font-weight:500;color:#94a3b8;letter-spacing:0.02em;margin-top:2px;">$${precioNum.toLocaleString('es-CO')}</div>`
    : ''

  return `
    <div style="${boletaLeftPanelRootStyle(height)}">
      <div style="font-size:7.5px;line-height:1.45;color:#64748b;text-transform:uppercase;letter-spacing:0.14em;font-weight:600;">
        <p style="margin:0 0 4px 0;">Boleta sin pagar no juega</p>
        <p style="margin:0 0 4px 0;color:#7dd3fc;">${caducidadText.replace(/^-\s*/, '')}</p>
        <p style="margin:0;">Juega hasta quedar en poder del público</p>
      </div>
      <div style="flex:1;display:flex;align-items:center;margin:6px 0;min-height:0;">
        <div style="width:100%;padding:8px 6px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);font-size:9px;line-height:1.35;color:#e2e8f0;text-align:left;">
          ${estadoHTML}
        </div>
      </div>
      <div style="display:flex;justify-content:center;margin-bottom:6px;">
        <div style="background:#fff;padding:5px;border-radius:8px;box-shadow:0 0 0 1px rgba(255,255,255,0.12);">
          <img src="${qrSrc}" style="width:72px;height:72px;display:block;" alt="QR" />
        </div>
      </div>
      ${notaHtml}
      <div style="text-align:center;padding-top:4px;border-top:1px solid rgba(255,255,255,0.08);">
        <div style="font-family:${BOLETA_LEFT_MONO};font-size:20px;font-weight:600;color:#f8fafc;letter-spacing:-0.02em;">#${numPad}</div>
        ${precioBlock}
      </div>
    </div>
  `
}

/** Badge HTML para descarga masiva (alineado con BoletaTicket). */
export function statusBadgeHtml(label: string, tone: 'reserved' | 'paid' | 'abonada' | 'available' | 'cancel' | 'blocked'): string {
  const styles: Record<string, string> = {
    reserved: 'color:#bae6fd;border:1px solid rgba(56,189,248,0.45);background:rgba(14,165,233,0.12)',
    paid: 'color:#bbf7d0;border:1px solid rgba(74,222,128,0.4);background:rgba(34,197,94,0.12)',
    abonada: 'color:#fed7aa;border:1px solid rgba(251,146,60,0.45);background:rgba(249,115,22,0.12)',
    available: 'color:#a7f3d0;border:1px solid rgba(52,211,153,0.4);background:rgba(16,185,129,0.1)',
    cancel: 'color:#fecaca;border:1px solid rgba(248,113,113,0.45);background:rgba(239,68,68,0.12)',
    blocked: 'color:#fde68a;border:1px solid rgba(251,191,36,0.4);background:rgba(245,158,11,0.12)',
  }
  return `<div style="width:100%;padding:6px 4px;text-align:center;font-weight:600;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;border-radius:6px;margin-bottom:6px;${styles[tone]}">${label}</div>`
}
