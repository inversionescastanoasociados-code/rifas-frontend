/**
 * Temporarily neutralise every CSS transform between `el` and the document root
 * so that html2canvas captures the element at its native 800×352 size.
 * Returns a restore function that puts the original values back.
 */
function neutraliseAncestorTransforms(el: HTMLElement): () => void {
  const saved: { el: HTMLElement; transform: string; height: string }[] = []
  let node = el.parentElement
  while (node && node !== document.documentElement) {
    const ct = node.style.transform
    const ch = node.style.height
    if (ct || getComputedStyle(node).transform !== 'none') {
      saved.push({ el: node, transform: ct, height: ch })
      node.style.transform = 'none'
      // The outer wrapper shrinks its height to match the scaled size — expand it
      node.style.height = 'auto'
    }
    node = node.parentElement
  }
  return () => {
    for (const s of saved) {
      s.el.style.transform = s.transform
      s.el.style.height = s.height
    }
  }
}

export async function downloadBoletaImage(options: {
  elementId: string
  fileName: string
  scale?: number
}) {
  const { elementId, fileName, scale = 4 } = options

  const source = document.getElementById(elementId) as HTMLElement | null
  if (!source) return false

  // Neutralizar transformaciones de ancestros
  const restore = neutraliseAncestorTransforms(source)

  // Forzar dimensiones fijas para exportación
  const prevWidth = source.style.width
  const prevHeight = source.style.height
  source.style.width = '800px'
  source.style.height = '352px'

  try {
    const html2canvas = (await import('html2canvas-pro')).default
    const canvas = await html2canvas(source, {
      width: 800,
      height: 352,
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const link = document.createElement('a')
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()
    return true
  } catch (err) {
    console.error('Error capturando boleta:', err)
    return false
  } finally {
    source.style.width = prevWidth
    source.style.height = prevHeight
    restore()
  }
}
