import React from 'react'
import { Arrow, Line, Rect, Text } from 'react-konva'
import type { Annotation, ID } from '../../domain/play/models'
import type { CourtScale } from '../../hooks/useCourtScale'

interface AnnotationRendererProps {
  annotation: Annotation
  scale: CourtScale
  isSelected: boolean
  onSelect: (id: ID) => void
}

/** Darkens a hex colour by mixing it with black at the given ratio */
function darkenColor(hex: string, amount = 0.2): string {
  const raw = hex.replace('#', '')
  const r = parseInt(raw.substring(0, 2), 16)
  const g = parseInt(raw.substring(2, 4), 16)
  const b = parseInt(raw.substring(4, 6), 16)
  const dr = Math.round(r * (1 - amount))
  const dg = Math.round(g * (1 - amount))
  const db = Math.round(b * (1 - amount))
  return `rgb(${dr},${dg},${db})`
}

export default function AnnotationRenderer({
  annotation,
  scale,
  isSelected,
  onSelect,
}: AnnotationRendererProps): React.ReactElement | null {
  const handleClick = (): void => {
    onSelect(annotation.id)
  }

  switch (annotation.type) {
    case 'arrow': {
      const points = annotation.points.flatMap((p) => [
        scale.toPixelX(p.x),
        scale.toPixelY(p.y),
      ])
      return (
        <Arrow
          points={points}
          stroke={annotation.color}
          strokeWidth={isSelected ? annotation.strokeWidth + 2 : annotation.strokeWidth}
          fill={annotation.color}
          dash={annotation.dashed ? [8, 4] : undefined}
          pointerLength={10}
          pointerWidth={8}
          lineCap="round"
          lineJoin="round"
          shadowColor={isSelected ? annotation.color : undefined}
          shadowBlur={isSelected ? 8 : 0}
          onClick={handleClick}
          onTap={handleClick}
        />
      )
    }

    case 'line': {
      const points = annotation.points.flatMap((p) => [
        scale.toPixelX(p.x),
        scale.toPixelY(p.y),
      ])
      return (
        <Line
          points={points}
          stroke={annotation.color}
          strokeWidth={isSelected ? annotation.strokeWidth + 2 : annotation.strokeWidth}
          dash={annotation.dashed ? [8, 4] : undefined}
          lineCap="round"
          lineJoin="round"
          shadowColor={isSelected ? annotation.color : undefined}
          shadowBlur={isSelected ? 8 : 0}
          onClick={handleClick}
          onTap={handleClick}
        />
      )
    }

    case 'zone': {
      const px = scale.toPixelX(annotation.x)
      const py = scale.toPixelY(annotation.y)
      const pw = annotation.width * scale.courtWidth
      const ph = annotation.height * scale.courtHeight
      return (
        <Rect
          x={px}
          y={py}
          width={pw}
          height={ph}
          fill={annotation.color}
          opacity={annotation.opacity}
          stroke={isSelected ? '#fff' : darkenColor(annotation.color)}
          strokeWidth={isSelected ? 2 : 1}
          dash={isSelected ? [6, 3] : undefined}
          onClick={handleClick}
          onTap={handleClick}
        />
      )
    }

    case 'text': {
      const px = scale.toPixelX(annotation.x)
      const py = scale.toPixelY(annotation.y)
      return (
        <Text
          x={px}
          y={py}
          text={annotation.text}
          fill={annotation.color}
          fontSize={annotation.fontSize}
          fontStyle={isSelected ? 'bold' : 'normal'}
          shadowColor={isSelected ? annotation.color : undefined}
          shadowBlur={isSelected ? 6 : 0}
          onClick={handleClick}
          onTap={handleClick}
        />
      )
    }

    default:
      return null
  }
}
