import React, { useRef, useState } from 'react'
import Konva from 'konva'
import { Stage } from 'react-konva'
import { Toolbar, DrawingLayer } from '../features/drawing'
import { CourtRenderer } from '../features/court'
import { PlayerLayer, PlayerSetupPanel } from '../features/players'
import { TimelinePanel, ViewModeOverlay, usePlayback } from '../features/animation'
import { useCourtScale } from '../hooks/useCourtScale'
import { useBoardStore } from '../store'
import type { ID } from '../domain/play/models'

const infoInputBase: React.CSSProperties = {
  background: '#0d0d1e',
  border: '1px solid #2a2a4e',
  borderRadius: '5px',
  color: '#c0c0e0',
  fontSize: '12px',
  padding: '5px 10px',
  outline: 'none',
}

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
  const boardName = useBoardStore((s) => s.boardName)
  const setBoardName = useBoardStore((s) => s.setBoardName)
  const boardDescription = useBoardStore((s) => s.boardDescription)
  const setBoardDescription = useBoardStore((s) => s.setBoardDescription)
  const boardTags = useBoardStore((s) => s.boardTags)
  const setBoardTags = useBoardStore((s) => s.setBoardTags)
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

      {/* Board info bar — hidden in view mode */}
      {!viewMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: '#13132a',
            borderBottom: '1px solid #222240',
          }}
        >
          <input
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="Untitled play"
            style={{
              ...infoInputBase,
              flex: '0 0 auto',
              width: '200px',
              color: '#e0e0ff',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid #3d3d6e',
            }}
            title="Play name"
          />
          <input
            type="text"
            value={boardDescription}
            onChange={(e) => setBoardDescription(e.target.value)}
            placeholder="Description"
            style={{ ...infoInputBase, flex: 1 }}
            title="Description"
          />
          <input
            type="text"
            value={boardTags.join(', ')}
            onChange={(e) =>
              setBoardTags(
                e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Tags (comma separated)"
            style={{ ...infoInputBase, flex: '0 0 auto', width: '220px' }}
            title="Tags"
          />
        </div>
      )}

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
