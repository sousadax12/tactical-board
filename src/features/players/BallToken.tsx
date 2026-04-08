import { Group, Circle, Shape } from 'react-konva'
import type Konva from 'konva'
import type { BallModel } from '../../domain/play/models'
import type { CourtScale } from '../../hooks/useCourtScale'

interface BallTokenProps {
  ball: BallModel
  scale: CourtScale
  onDragEnd: (normX: number, normY: number) => void
}

const BALL_RADIUS = 14

export default function BallToken({ ball, scale, onDragEnd }: BallTokenProps) {
  const r = BALL_RADIUS
  const cx = scale.toPixelX(ball.x)
  const cy = scale.toPixelY(ball.y)

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const nx = Math.max(0, Math.min(1, scale.toNormX(e.target.x())))
    const ny = Math.max(0, Math.min(1, scale.toNormY(e.target.y())))
    e.target.x(scale.toPixelX(nx))
    e.target.y(scale.toPixelY(ny))
    onDragEnd(nx, ny)
  }

  return (
    <Group x={cx} y={cy} draggable onDragEnd={handleDragEnd}>
      {/* Drop shadow */}
      <Circle
        radius={r + 1}
        fill="rgba(0,0,0,0.35)"
        offsetY={-3}
        listening={false}
      />

      {/* Ball body — drawn with raw canvas for gradient + seams */}
      <Shape
        sceneFunc={(ctx, shape) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = (ctx as any)._context as CanvasRenderingContext2D

          raw.save()

          // Clip all drawing to the ball circle
          raw.beginPath()
          raw.arc(0, 0, r, 0, Math.PI * 2)
          raw.clip()

          // ── Base: radial gradient for 3D sphere ────────────────────────────
          const bodyGrad = raw.createRadialGradient(
            -r * 0.3, -r * 0.35, r * 0.04, // highlight origin (top-left)
             0,        0,         r,         // outer edge
          )
          bodyGrad.addColorStop(0,    '#FFFFFF') // bright highlight
          bodyGrad.addColorStop(0.4,  '#E8E8E8') // light grey
          bodyGrad.addColorStop(0.75, '#B0B0B0') // mid grey
          bodyGrad.addColorStop(1,    '#707070') // dark edge
          raw.fillStyle = bodyGrad
          raw.fillRect(-r, -r, r * 2, r * 2)

          // ── Seam lines ─────────────────────────────────────────────────────
          raw.strokeStyle = 'rgba(60, 60, 60, 0.7)'
          raw.lineWidth = 1.5
          raw.lineCap = 'round'

          // Horizontal S-curve (equatorial seam)
          raw.beginPath()
          raw.moveTo(-r * 1.5, 0)
          raw.bezierCurveTo(-r * 0.4, -r * 0.85, r * 0.4, r * 0.85, r * 1.5, 0)
          raw.stroke()

          // Left vertical arc seam
          raw.beginPath()
          raw.moveTo(-r * 0.1, -r * 1.5)
          raw.bezierCurveTo(-r * 0.95, -r * 0.4, -r * 0.95, r * 0.4, -r * 0.1, r * 1.5)
          raw.stroke()

          // Right vertical arc seam
          raw.beginPath()
          raw.moveTo(r * 0.1, -r * 1.5)
          raw.bezierCurveTo(r * 0.95, -r * 0.4, r * 0.95, r * 0.4, r * 0.1, r * 1.5)
          raw.stroke()

          // ── Specular highlight (glossy spot, top-left) ─────────────────────
          const hlGrad = raw.createRadialGradient(
            -r * 0.3, -r * 0.38, 0,
            -r * 0.3, -r * 0.38, r * 0.38,
          )
          hlGrad.addColorStop(0,   'rgba(255,255,255,0.6)')
          hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)')
          hlGrad.addColorStop(1,   'rgba(255,255,255,0)')
          raw.fillStyle = hlGrad
          raw.fillRect(-r, -r, r * 2, r * 2)

          raw.restore()

          // Define circle path for Konva hit detection + outline stroke
          ctx.beginPath()
          ctx.arc(0, 0, r, 0, Math.PI * 2, false)
          ctx.fillStrokeShape(shape)
        }}
        fill="transparent"
        stroke="#888888"
        strokeWidth={1}
      />
    </Group>
  )
}
