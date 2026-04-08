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

const BASE_RADIUS = 20

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
  const r = BASE_RADIUS * scale.scaleFactor
  const fontSize = Math.round(14 * scale.scaleFactor)
  const strokeColor = isSelected ? '#FFD700' : '#FFFFFF'
  const strokeWidth = (isSelected ? 3 : 2) * scale.scaleFactor

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const normX = clampNorm(scale.toNormX(e.target.x()))
    const normY = clampNorm(scale.toNormY(e.target.y()))
    e.target.x(scale.toPixelX(normX))
    e.target.y(scale.toPixelY(normY))
    onDragEnd(player.id, normX, normY)
  }

  const handleClick = () => onSelect(player.id)

  return (
    <Group
      x={scale.toPixelX(player.x)}
      y={scale.toPixelY(player.y)}
      draggable
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      <Circle radius={r} fill={player.color} stroke={strokeColor} strokeWidth={strokeWidth} />
      <Text
        x={-r}
        y={-fontSize * 0.5}
        width={r * 2}
        height={fontSize}
        text={String(player.number)}
        fill="#FFFFFF"
        fontStyle="bold"
        fontSize={fontSize}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  )
}
