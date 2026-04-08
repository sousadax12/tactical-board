import { Group, Circle, Text } from 'react-konva'
import type Konva from 'konva'
import type { PlayerModel, ID } from '../../domain/play/models'
import type { CourtScale } from '../../hooks/useCourtScale'

export interface PlayerTokenProps {
  player: PlayerModel
  scale: CourtScale
  isSelected: boolean
  onSelect: (id: ID) => void
  onDragEnd: (id: ID, normX: number, normY: number) => void
}

const RADIUS = 20

/**
 * Clamps a normalized coordinate to [0..1].
 */
function clampNorm(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export default function PlayerToken({
  player,
  scale,
  isSelected,
  onSelect,
  onDragEnd,
}: PlayerTokenProps) {
  const strokeColor = isSelected ? '#FFD700' : '#FFFFFF'
  const strokeWidth = isSelected ? 3 : 2

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const rawNormX = scale.toNormX(e.target.x())
    const rawNormY = scale.toNormY(e.target.y())
    const normX = clampNorm(rawNormX)
    const normY = clampNorm(rawNormY)

    // Snap back to clamped pixel position so the token stays within the court
    e.target.x(scale.toPixelX(normX))
    e.target.y(scale.toPixelY(normY))

    onDragEnd(player.id, normX, normY)
  }

  const handleClick = () => {
    onSelect(player.id)
  }

  return (
    <Group
      x={scale.toPixelX(player.x)}
      y={scale.toPixelY(player.y)}
      draggable
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      <Circle
        x={0}
        y={0}
        radius={RADIUS}
        fill={player.color}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <Text
        x={-RADIUS}
        y={-7}
        width={RADIUS * 2}
        height={14}
        text={String(player.number)}
        fill="#FFFFFF"
        fontStyle="bold"
        fontSize={14}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  )
}
