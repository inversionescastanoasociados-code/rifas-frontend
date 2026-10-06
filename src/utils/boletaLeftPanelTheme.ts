import { BOLETA_LEFT_WIDTH } from '@/constants/boletaDimensions'

export const BOLETA_LEFT_FONT = 'Arial, Helvetica, sans-serif'

export function boletaLeftPanelRootStyle(height: number): string {
  return [
    `flex-shrink:0`,
    `display:flex`,
    `flex-direction:column`,
    `width:${BOLETA_LEFT_WIDTH}px`,
    `height:${height}px`,
    `padding:8px 7px`,
    `box-sizing:border-box`,
    `background:#ffffff`,
    `border-right:2px solid #000`,
    `font-family:${BOLETA_LEFT_FONT}`,
    `color:#000`,
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
    ? `<div style="font-size:10px;font-weight:700;color:#000;margin-top:2px;">$${precioNum.toLocaleString('es-CO')}</div>`
    : ''

  const regla2 = caducidadText.startsWith('-')
    ? caducidadText
    : `- ${caducidadText}`

  return `
    <div style="${boletaLeftPanelRootStyle(height)}">
      <div style="flex-shrink:0;font-size:8px;line-height:1.35;font-weight:600;text-align:left;">
        <p style="margin:0;">- Boleta sin pagar no juega</p>
        <p style="margin:0;font-weight:700;">${regla2}</p>
        <p style="margin:0;">- Juega hasta quedar en poder del público</p>
      </div>
      <div style="flex:1;min-height:0;display:flex;align-items:center;margin:4px 0;overflow:hidden;">
        <div style="width:100%;font-size:9px;line-height:1.3;color:#000;text-align:left;">
          ${estadoHTML}
        </div>
      </div>
      <div style="flex-shrink:0;display:flex;justify-content:center;padding:4px 0;">
        <img src="${qrSrc}" style="width:68px;height:68px;border:1px solid #000;display:block;" alt="QR" />
      </div>
      ${notaHtml}
      <div style="flex-shrink:0;text-align:center;padding-top:2px;">
        <div style="font-size:18px;font-weight:800;color:#000;line-height:1.1;">#${numPad}</div>
        ${precioBlock}
      </div>
    </div>
  `
}

export function statusBadgeHtml(
  label: string,
  tone: 'reserved' | 'paid' | 'abonada' | 'available' | 'cancel' | 'blocked'
): string {
  const styles: Record<string, string> = {
    reserved: 'background:#2563eb;color:#fff',
    paid: 'background:#15803d;color:#fff',
    abonada: 'background:#fb923c;color:#000',
    available: 'background:#6ee7b7;color:#000',
    cancel: 'background:#dc2626;color:#fff',
    blocked: 'background:#fde68a;color:#000',
  }
  return `<div style="width:100%;padding:4px 0;text-align:center;font-weight:800;font-size:10px;letter-spacing:0.04em;margin-bottom:4px;${styles[tone]}">${label.toUpperCase()}</div>`
}
