import { useRef, useState } from 'react'
import { Stage } from 'react-konva'
import { Toolbar, DrawingLayer } from '../features/drawing'
import { CourtRenderer } from '../features/court'
import { PlayerLayer, PlayerSetupPanel } from '../features/players'
import { LibraryPanel } from '../features/library'
import { TimelinePanel, ViewModeOverlay, usePlayback } from '../features/animation'
import { useCourtScale } from '../hooks/useCourtScale'

export default function BoardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scale = useCourtScale(containerRef)
  const [viewMode, setViewMode] = useState(false)
  usePlayback()

  // Keep a single stable DOM tree so containerRef never unmounts.
  // Show/hide toolbar and sidebar via display:none so the ResizeObserver
  // on containerRef fires correctly when they disappear.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Toolbar — hidden in view mode */}
      <div style={{ display: viewMode ? 'none' : 'block' }}>
        <Toolbar onEnterViewMode={() => setViewMode(true)} />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>

        {/* Court area — always rendered, ref is stable */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
            overflow: 'hidden',
            background: '#0f0f1a',
          }}
        >
          <Stage width={scale.stageWidth} height={scale.stageHeight}>
            <CourtRenderer scale={scale} />
            <DrawingLayer scale={scale} />
            <PlayerLayer scale={scale} />
          </Stage>

          {/* View mode overlay floats above the canvas */}
          {viewMode && <ViewModeOverlay onExit={() => setViewMode(false)} />}
        </div>

        {/* Sidebar — hidden in view mode */}
        <div
          style={{
            width: 'clamp(200px, 22vw, 280px)',
            flexShrink: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            borderLeft: '1px solid #333',
            background: '#1a1a2e',
            display: viewMode ? 'none' : 'block',
          }}
        >
          <PlayerSetupPanel />
          <LibraryPanel />
          <TimelinePanel />
        </div>
      </div>
    </div>
  )
}
