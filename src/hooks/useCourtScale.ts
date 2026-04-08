import { useState, useCallback, useEffect } from 'react'

/**
 * Single authority for converting between normalized [0..1] coords
 * and pixel coords on the Konva stage.
 *
 * Maintains aspect ratio of a standard handball court (40:20 = 2:1).
 */

const COURT_ASPECT = 40 / 20 // 2.0

export interface CourtScale {
  /** Stage pixel width (= container width) */
  stageWidth: number
  /** Stage pixel height (= container height) */
  stageHeight: number
  /** Convert normalized x [0..1] → pixel x */
  toPixelX: (nx: number) => number
  /** Convert normalized y [0..1] → pixel y */
  toPixelY: (ny: number) => number
  /** Convert pixel x → normalized x */
  toNormX: (px: number) => number
  /** Convert pixel y → normalized y */
  toNormY: (py: number) => number
  /** Horizontal pixel offset (letterboxing) */
  offsetX: number
  /** Vertical pixel offset (letterboxing) */
  offsetY: number
  /** Effective court width in pixels */
  courtWidth: number
  /** Effective court height in pixels */
  courtHeight: number
  /**
   * Uniform size multiplier relative to an 800px reference court width.
   * Use to scale token radii, font sizes, and stroke widths.
   */
  scaleFactor: number
}

interface Dims {
  width: number
  height: number
}

function computeScale(w: number, h: number) {
  const containerAspect = w / h
  let courtWidth: number
  let courtHeight: number

  if (containerAspect > COURT_ASPECT) {
    courtHeight = h
    courtWidth = courtHeight * COURT_ASPECT
  } else {
    courtWidth = w
    courtHeight = courtWidth / COURT_ASPECT
  }

  return {
    offsetX: (w - courtWidth) / 2,
    offsetY: (h - courtHeight) / 2,
    courtWidth,
    courtHeight,
  }
}

export function useCourtScale(containerRef: React.RefObject<HTMLDivElement | null>): CourtScale {
  const [dims, setDims] = useState<Dims>({ width: 800, height: 400 })

  const update = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (w > 0 && h > 0) setDims({ width: w, height: h })
  }, [containerRef])

  useEffect(() => {
    // Run immediately so first render uses real container size
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [update, containerRef])

  const { offsetX, offsetY, courtWidth, courtHeight } = computeScale(dims.width, dims.height)

  const toPixelX = useCallback(
    (nx: number) => offsetX + nx * courtWidth,
    [offsetX, courtWidth],
  )
  const toPixelY = useCallback(
    (ny: number) => offsetY + ny * courtHeight,
    [offsetY, courtHeight],
  )
  const toNormX = useCallback(
    (px: number) => (px - offsetX) / courtWidth,
    [offsetX, courtWidth],
  )
  const toNormY = useCallback(
    (py: number) => (py - offsetY) / courtHeight,
    [offsetY, courtHeight],
  )

  return {
    stageWidth: dims.width,
    stageHeight: dims.height,
    offsetX,
    offsetY,
    courtWidth,
    courtHeight,
    scaleFactor: courtWidth / 800,
    toPixelX,
    toPixelY,
    toNormX,
    toNormY,
  }
}
