import { Group, Circle, Shape } from 'react-konva'
import type Konva from 'konva'
import type { BallModel, ID } from '../../domain/play/models'
import type { CourtScale } from '../../hooks/useCourtScale'

interface BallTokenProps {
  ball: BallModel
  scale: CourtScale
  isSelected: boolean
  onSelect: (id: ID) => void
  onDragEnd: (id: ID, normX: number, normY: number) => void
}

const BASE_BALL_RADIUS = 8

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}

export default function BallToken({ ball, scale, isSelected, onSelect, onDragEnd }: BallTokenProps) {
  const r = BASE_BALL_RADIUS * scale.scaleFactor
  const cx = scale.toPixelX(ball.x)
  const cy = scale.toPixelY(ball.y)
  const color = ball.color || '#b0b0b0'

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const nx = Math.max(0, Math.min(1, scale.toNormX(e.target.x())))
    const ny = Math.max(0, Math.min(1, scale.toNormY(e.target.y())))
    e.target.x(scale.toPixelX(nx))
    e.target.y(scale.toPixelY(ny))
    onDragEnd(ball.id, nx, ny)
  }

  return (
    <Group
      x={cx}
      y={cy}
      draggable
      onDragEnd={handleDragEnd}
      onClick={() => onSelect(ball.id)}
      onTap={() => onSelect(ball.id)}
    >
      {/* Drop shadow */}
      <Circle
        radius={r + 1}
        fill="rgba(0,0,0,0.35)"
        offsetY={-3}
        listening={false}
      />

      {/* Selection ring */}
      {isSelected && (
        <Circle
          radius={r + 3}
          stroke="#FFD700"
          strokeWidth={2}
          fill="transparent"
          listening={false}
        />
      )}

      {/* Ball body — radial gradient + seams */}
      <Shape
        sceneFunc={(ctx, shape) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = (ctx as any)._context as CanvasRenderingContext2D

          raw.save()

          raw.beginPath()
          raw.arc(0, 0, r, 0, Math.PI * 2)
          raw.clip()

          // Base radial gradient using ball color
          const bodyGrad = raw.createRadialGradient(
            -r * 0.3, -r * 0.35, r * 0.04,
             0,        0,         r,
          )
          bodyGrad.addColorStop(0,    lighten(color, 0.85))
          bodyGrad.addColorStop(0.4,  lighten(color, 0.35))
          bodyGrad.addColorStop(0.75, color)
          bodyGrad.addColorStop(1,    darken(color, 0.45))
          raw.fillStyle = bodyGrad
          raw.fillRect(-r, -r, r * 2, r * 2)

          // Seam lines
          raw.strokeStyle = 'rgba(0, 0, 0, 0.45)'
          raw.lineWidth = 1.5
          raw.lineCap = 'round'

          raw.beginPath()
          raw.moveTo(-r * 1.5, 0)
          raw.bezierCurveTo(-r * 0.4, -r * 0.85, r * 0.4, r * 0.85, r * 1.5, 0)
          raw.stroke()

          raw.beginPath()
          raw.moveTo(-r * 0.1, -r * 1.5)
          raw.bezierCurveTo(-r * 0.95, -r * 0.4, -r * 0.95, r * 0.4, -r * 0.1, r * 1.5)
          raw.stroke()

          raw.beginPath()
          raw.moveTo(r * 0.1, -r * 1.5)
          raw.bezierCurveTo(r * 0.95, -r * 0.4, r * 0.95, r * 0.4, r * 0.1, r * 1.5)
          raw.stroke()

          // Specular highlight
          const hlGrad = raw.createRadialGradient(
            -r * 0.3, -r * 0.38, 0,
            -r * 0.3, -r * 0.38, r * 0.38,
          )
          hlGrad.addColorStop(0,   'rgba(255,255,255,0.65)')
          hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)')
          hlGrad.addColorStop(1,   'rgba(255,255,255,0)')
          raw.fillStyle = hlGrad
          raw.fillRect(-r, -r, r * 2, r * 2)

          raw.restore()

          ctx.beginPath()
          ctx.arc(0, 0, r, 0, Math.PI * 2, false)
          ctx.fillStrokeShape(shape)
        }}
        fill="transparent"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={1}
      />
    </Group>
  )
}
