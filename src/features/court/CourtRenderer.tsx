import React from 'react'
import { Layer, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import type { CourtScale } from '../../hooks/useCourtScale'
import pitchBg from '../../assets/pitch-bg.png'

export interface CourtRendererProps {
  scale: CourtScale
}

const CourtRenderer: React.FC<CourtRendererProps> = ({ scale }) => {
  const [pitchImage] = useImage(pitchBg)

  return (
    <Layer>
      <KonvaImage
        image={pitchImage}
        x={scale.offsetX}
        y={scale.offsetY}
        width={scale.courtWidth}
        height={scale.courtHeight}
        listening={false}
      />
    </Layer>
  )
}

export default CourtRenderer
