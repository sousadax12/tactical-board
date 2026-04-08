import { useState, useCallback, useEffect } from 'react'

/**
 * Single authority for converting between normalized [0..1] coords
 * and pixel coords on the Konva stage.
 *
 * Maintains aspect ratio of a standard handball court (40:20 = 2:1).
 */

const COURT_ASPECT = 40 / 20 // 2.0

export interface CourtScale {
  /** Stage pixel width */
  stageWidth: number
  /** Stage pixel height */
  stageHeight: number
  /** Convert normalized x [0..1] → pixel x */
  toPixelX: (nx: number) => number
  /** Convert normalized y [0..1] → pixel y */
  toPixelY: (ny: number) => number
  /** Convert pixel x → normalized x */
  toNormX: (px: number) => number
  /** Convert pixel y → normalized y */
  toNormY: (py: number) => number
  /** Horizontal pixel offset (for letterboxing) */
  offsetX: number
  /** Vertical pixel offset (for letterboxing) */
  offsetY: number
  /** Effective court width in pixels */
  courtWidth: number
  /** Effective court height in pixels */
  courtHeight: number
}

function computeScale(
  containerWidth: number,
  containerHeight: number,
): Omit<CourtScale, 'toPixelX' | 'toPixelY' | 'toNormX' | 'toNormY'> {
  const containerAspect = containerWidth / containerHeight

  let courtWidth: number
  let courtHeight: number

  if (containerAspect > COURT_ASPECT) {
    // Container is wider than court → fit height
    courtHeight = containerHeight
    courtWidth = courtHeight * COURT_ASPECT
  } else {
    // Container is taller → fit width
    courtWidth = containerWidth
    courtHeight = courtWidth / COURT_ASPECT
  }

  const offsetX = (containerWidth - courtWidth) / 2
  const offsetY = (containerHeight - courtHeight) / 2

  return {
    stageWidth: containerWidth,
    stageHeight: containerHeight,
    offsetX,
    offsetY,
    courtWidth,
    courtHeight,
  }
}

export function useCourtScale(containerRef: React.RefObject<HTMLDivElement | null>): CourtScale {
  const [dims, setDims] = useState({ width: 800, height: 400 })

  const update = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current
      if (clientWidth > 0 && clientHeight > 0) {
        setDims({ width: clientWidth, height: clientHeight })
      }
    }
  }, [containerRef])

  useEffect(() => {
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [update, containerRef])

  const base = computeScale(dims.width, dims.height)

  const toPixelX = useCallback(
    (nx: number) => base.offsetX + nx * base.courtWidth,
    [base.offsetX, base.courtWidth],
  )
  const toPixelY = useCallback(
    (ny: number) => base.offsetY + ny * base.courtHeight,
    [base.offsetY, base.courtHeight],
  )
  const toNormX = useCallback(
    (px: number) => (px - base.offsetX) / base.courtWidth,
    [base.offsetX, base.courtWidth],
  )
  const toNormY = useCallback(
    (py: number) => (py - base.offsetY) / base.courtHeight,
    [base.offsetY, base.courtHeight],
  )

  return { ...base, toPixelX, toPixelY, toNormX, toNormY }
}
