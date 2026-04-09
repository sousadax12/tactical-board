import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage } from 'react-konva'
import Konva from 'konva'
import { CourtRenderer } from '../features/court'
import { DrawingLayer } from '../features/drawing'
import { PlayerLayer } from '../features/players'
import { TimelinePanel, usePlayback } from '../features/animation'
import { useCourtScale } from '../hooks/useCourtScale'
import { useBoardStore, useAnimationStore } from '../store'
import { decodeShareUrl } from '../features/export/ShareLinkGenerator'
import { exportAsPng } from '../features/export/PngExporter'
import type { Play } from '../domain/play/models'

function SharedPlayContent({ play }: { play: Play }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const scale = useCourtScale(containerRef)
  const frames = useAnimationStore((s) => s.frames)
  const loadFrame = useBoardStore((s) => s.loadFrame)
  const addFrame = useAnimationStore((s) => s.addFrame)
  const clearFrames = useAnimationStore((s) => s.clearFrames)
  const clearBoard = useBoardStore((s) => s.clearBoard)

  usePlayback()

  useEffect(() => {
    clearFrames()
    clearBoard()
    play.frames.forEach((f) => addFrame(f))
    if (play.frames.length > 0) {
      loadFrame(play.frames[0])
    }
    return () => {
      clearFrames()
    }
  }, [play]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDownloadPng() {
    const stage = stageRef.current
    if (!stage) return
    exportAsPng(stage, play.name || 'shared-play')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0f0f1a' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#1a1a2e',
        borderBottom: '1px solid #2d2d4e',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ color: '#7878cc', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Shared Play
          </span>
          {play.name && (
            <span style={{ color: '#c0c0d8', fontSize: '13px', marginLeft: '10px' }}>
              {play.name}
            </span>
          )}
        </div>
        <button
          onClick={handleDownloadPng}
          style={{
            padding: '6px 12px',
            background: '#2d2d4e',
            border: '1px solid #3d3d6e',
            borderRadius: '6px',
            color: '#c0c0d8',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Download PNG
        </button>
      </div>

      {/* Court area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          background: '#0f0f1a',
        }}
      >
        <Stage ref={stageRef} width={scale.stageWidth} height={scale.stageHeight}>
          <CourtRenderer scale={scale} />
          <DrawingLayer scale={scale} />
          <PlayerLayer scale={scale} onStartEdit={() => undefined} />
        </Stage>
      </div>

      {/* Timeline - only when multiple frames */}
      {frames.length > 1 && (
        <div style={{ flexShrink: 0 }}>
          <TimelinePanel />
        </div>
      )}
    </div>
  )
}

export default function SharedPlayRoute() {
  const [play, setPlay] = useState<Play | null>(null)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) {
      setError(true)
      return
    }
    const decoded = decodeShareUrl(hash)
    if (!decoded) {
      setError(true)
      return
    }
    setPlay(decoded)
  }, [])

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f0f1a',
        color: '#c0c0d8',
        gap: '16px',
      }}>
        <div style={{ fontSize: '32px' }}>!</div>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Invalid share link</div>
        <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', maxWidth: '300px' }}>
          This link may be corrupted or incomplete.
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 20px',
            background: '#4a4a8a',
            border: '1px solid #7878cc',
            borderRadius: '6px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Open New Board
        </button>
      </div>
    )
  }

  if (!play) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f0f1a',
        color: '#666',
        fontSize: '14px',
      }}>
        Loading...
      </div>
    )
  }

  return <SharedPlayContent play={play} />
}
