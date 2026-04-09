import { useRef, useState } from 'react'
import Konva from 'konva'
import { Stage } from 'react-konva'
import { Toolbar, DrawingLayer } from '../features/drawing'
import { CourtRenderer } from '../features/court'
import { PlayerLayer, PlayerSetupPanel } from '../features/players'
import { TimelinePanel, ViewModeOverlay, usePlayback } from '../features/animation'
import { useCourtScale } from '../hooks/useCourtScale'
import { useBoardStore } from '../store'
import type { ID } from '../domain/play/models'

interface EditState {
  id: ID
  x: number
  y: number
  value: string
}

export default function BoardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const scale = useCourtScale(containerRef)
  const [viewMode, setViewMode] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const updatePlayer = useBoardStore((s) => s.updatePlayer)
  usePlayback()

  const handleStartEdit = (id: ID, pixelX: number, pixelY: number, label: string) => {
    setEditState({ id, x: pixelX, y: pixelY, value: label })
  }

  const handleFinishEdit = () => {
    if (editState) {
      updatePlayer(editState.id, { label: editState.value })
      setEditState(null)
    }
  }

  const handleCancelEdit = () => setEditState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Main toolbar — hidden in view mode */}
      <div style={{ display: viewMode ? 'none' : 'block' }}>
        <Toolbar onEnterViewMode={() => setViewMode(true)} stageRef={stageRef} />
      </div>

      {/* Animation bar — hidden in view mode */}
      <div style={{ display: viewMode ? 'none' : 'block' }}>
        <TimelinePanel />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>

        {/* Court area */}
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
          <Stage ref={stageRef} width={scale.stageWidth} height={scale.stageHeight}>
            <CourtRenderer scale={scale} />
            <DrawingLayer scale={scale} />
            <PlayerLayer scale={scale} onStartEdit={handleStartEdit} />
          </Stage>

          {/* Inline label editor overlay */}
          {editState && (
            <input
              autoFocus
              value={editState.value}
              maxLength={6}
              onChange={(e) => setEditState({ ...editState, value: e.target.value })}
              onBlur={handleFinishEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
              style={{
                position: 'absolute',
                left: editState.x - 30,
                top: editState.y - 14,
                width: 60,
                textAlign: 'center',
                zIndex: 10,
                background: '#1a1a2e',
                color: '#ffffff',
                border: '2px solid #FFD700',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                outline: 'none',
                padding: '2px 4px',
              }}
            />
          )}

          {viewMode && <ViewModeOverlay onExit={() => setViewMode(false)} />}
        </div>

        {/* Sidebar */}
        <div
          style={{
            width: 'clamp(180px, 20vw, 260px)',
            flexShrink: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            borderLeft: '1px solid #333',
            background: '#1a1a2e',
            display: viewMode ? 'none' : 'block',
          }}
        >
          <PlayerSetupPanel />
        </div>
      </div>
    </div>
  )
}
