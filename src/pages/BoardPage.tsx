import { useRef } from 'react'
import { Stage } from 'react-konva'
import { Toolbar, DrawingLayer } from '../features/drawing'
import { CourtRenderer } from '../features/court'
import { PlayerLayer, PlayerSetupPanel } from '../features/players'
import { LibraryPanel } from '../features/library'
import { useCourtScale } from '../hooks/useCourtScale'

export default function BoardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scale = useCourtScale(containerRef)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
          <Stage width={scale.stageWidth} height={scale.stageHeight}>
            <CourtRenderer scale={scale} />
            <DrawingLayer scale={scale} />
            <PlayerLayer scale={scale} />
          </Stage>
        </div>
        <div
          style={{
            width: 280,
            overflow: 'auto',
            borderLeft: '1px solid #333',
            background: '#1a1a2e',
          }}
        >
          <PlayerSetupPanel />
          <LibraryPanel />
        </div>
      </div>
    </div>
  )
}
