'use client'

import { NOTERICH_LOGO_DATA_URL } from '@/components/brand/noterich-logo'

/**
 * Draw a NoteRich logo watermark on a canvas (for free-user PNG exports).
 * The watermark is placed in the bottom-right corner with 30% opacity.
 *
 * @param ctx - The canvas 2D context
 * @param canvasWidth - The canvas width in pixels
 * @param canvasHeight - The canvas height in pixels
 * @returns Promise<boolean> - true if watermark was drawn, false if skipped
 */
export async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const logo = new Image()
    logo.crossOrigin = 'anonymous'
    logo.onload = () => {
      const logoWidth = logo.naturalWidth || 214
      const logoHeight = logo.naturalHeight || 42
      if (!logoWidth || !logoHeight) {
        resolve(false)
        return
      }
      // Scale watermark to ~15% of canvas width, max height 8% of canvas
      const maxW = canvasWidth * 0.15
      const maxH = canvasHeight * 0.08
      const scale = Math.min(maxW / logoWidth, maxH / logoHeight, 1)
      const finalW = Math.max(20, logoWidth * scale)
      const finalH = Math.max(6, logoHeight * scale)

      if (finalH < 6) {
        resolve(false)
        return
      }

      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.drawImage(
        logo,
        canvasWidth - finalW - 12,
        canvasHeight - finalH - 12,
        finalW,
        finalH,
      )
      ctx.restore()
      resolve(true)
    }
    logo.onerror = () => resolve(false)
    logo.src = NOTERICH_LOGO_DATA_URL
  })
}
