'use client'

/**
 * Trigger a browser download from a data URL or blob URL.
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Export a DOM element to PNG using html2canvas (dynamic import to keep bundle small).
 */
export async function exportElementToPng(
  el: HTMLElement,
  filename: string,
  options: { background?: string; scale?: number } = {}
) {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(el, {
    backgroundColor: options.background ?? '#ffffff',
    scale: options.scale ?? 2,
    useCORS: true,
    logging: false,
  })
  const dataUrl = canvas.toDataURL('image/png')
  downloadDataUrl(dataUrl, filename)
}

/**
 * Export SVG element to a downloadable .svg file.
 */
export function exportSvg(svg: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer()
  let source = serializer.serializeToString(svg)
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Export raw JSON configuration.
 */
export function exportJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Generate a small thumbnail data URL (PNG) for a DOM element.
 */
export async function generateThumbnail(
  el: HTMLElement,
  maxW = 240
): Promise<string> {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 1,
      useCORS: true,
      logging: false,
      width: el.clientWidth,
      height: el.clientHeight,
    })
    // Downscale to thumbnail
    const ratio = maxW / canvas.width
    const thumb = document.createElement('canvas')
    thumb.width = maxW
    thumb.height = Math.max(1, Math.round(canvas.height * ratio))
    const ctx = thumb.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height)
    return thumb.toDataURL('image/png')
  } catch {
    return ''
  }
}
