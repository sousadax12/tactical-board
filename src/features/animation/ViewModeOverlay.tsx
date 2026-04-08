import type { CSSProperties } from 'react'
import { useAnimationStore } from '../../store'
import { useBoardStore } from '../../store'

interface ViewModeOverlayProps {
  onExit: () => void
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 8,
  zIndex: 100,
  pointerEvents: 'none', // let clicks through to the canvas by default
}

const panelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(15, 15, 26, 0.82)',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '8px 12px',
  pointerEvents: 'auto',
}

const btn = (accent?: string): CSSProperties => ({
  padding: '6px 14px',
  background: accent ?? 'rgba(255,255,255,0.08)',
  color: '#e0e0e0',
  border: `1px solid ${accent ? accent + '88' : 'rgba(255,255,255,0.18)'}`,
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
  whiteSpace: 'nowrap',
})

const iconBtn = (accent?: string): CSSProperties => ({
  ...btn(accent),
  fontSize: 18,
  padding: '4px 10px',
  lineHeight: 1,
})

export default function ViewModeOverlay({ onExit }: ViewModeOverlayProps) {
  const frames = useAnimationStore((s) => s.frames)
  const isPlaying = useAnimationStore((s) => s.isPlaying)
  const currentFrameIndex = useAnimationStore((s) => s.currentFrameIndex)
  const setIsPlaying = useAnimationStore((s) => s.setIsPlaying)
  const setCurrentFrameIndex = useAnimationStore((s) => s.setCurrentFrameIndex)
  const loadFrame = useBoardStore((s) => s.loadFrame)

  const canPlay = frames.length >= 2

  const handlePlay = () => setIsPlaying(true)

  const handleStop = () => {
    setIsPlaying(false)
    if (frames.length > 0) loadFrame(frames[currentFrameIndex])
  }

  const handlePrev = () => {
    if (frames.length === 0) return
    const idx = Math.max(0, currentFrameIndex - 1)
    setIsPlaying(false)
    setCurrentFrameIndex(idx)
    loadFrame(frames[idx])
  }

  const handleNext = () => {
    if (frames.length === 0) return
    const idx = Math.min(frames.length - 1, currentFrameIndex + 1)
    setIsPlaying(false)
    setCurrentFrameIndex(idx)
    loadFrame(frames[idx])
  }

  return (
    <div style={overlayStyle}>
      {/* Playback controls — only shown when frames exist */}
      {frames.length > 0 && (
        <div style={panelStyle}>
          {isPlaying ? (
            <button style={btn('#c0392b')} onClick={handleStop} title="Stop">
              ⏹ Stop
            </button>
          ) : (
            <>
              <button style={iconBtn()} onClick={handlePrev} disabled={currentFrameIndex === 0} title="Previous frame">
                ◀
              </button>
              <span style={{ color: '#aaa', fontSize: 12, minWidth: 48, textAlign: 'center' }}>
                {currentFrameIndex + 1} / {frames.length}
              </span>
              <button
                style={iconBtn()}
                onClick={handleNext}
                disabled={currentFrameIndex === frames.length - 1}
                title="Next frame"
              >
                ▶
              </button>
              {canPlay && (
                <button style={btn('#2d6a9f')} onClick={handlePlay} title="Play animation">
                  ▶ Play
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Exit button */}
      <div style={panelStyle}>
        <button
          style={btn()}
          onClick={onExit}
          title="Exit view mode"
        >
          ✕ Exit View
        </button>
      </div>
    </div>
  )
}
