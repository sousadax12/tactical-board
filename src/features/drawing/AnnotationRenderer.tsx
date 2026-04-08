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
  const sf = scale.scaleFactor
  const handleClick = (): void => onSelect(annotation.id)

  switch (annotation.type) {
    case 'arrow': {
      const points = annotation.points.flatMap((p) => [
        scale.toPixelX(p.x),
        scale.toPixelY(p.y),
      ])
      const sw = annotation.strokeWidth * sf
      return (
        <Arrow
          points={points}
          stroke={annotation.color}
          strokeWidth={isSelected ? sw + 2 * sf : sw}
          fill={annotation.color}
          dash={annotation.dashed ? [8 * sf, 4 * sf] : undefined}
          pointerLength={10 * sf}
          pointerWidth={8 * sf}
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
      const sw = annotation.strokeWidth * sf
      return (
        <Line
          points={points}
          stroke={annotation.color}
          strokeWidth={isSelected ? sw + 2 * sf : sw}
          dash={annotation.dashed ? [8 * sf, 4 * sf] : undefined}
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
          strokeWidth={isSelected ? 2 * sf : sf}
          dash={isSelected ? [6 * sf, 3 * sf] : undefined}
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
          fontSize={annotation.fontSize * sf}
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
