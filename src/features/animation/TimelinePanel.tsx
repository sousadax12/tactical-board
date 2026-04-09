import { nanoid } from 'nanoid'
import type { CSSProperties } from 'react'
import { useAnimationStore } from '../../store'
import { useBoardStore } from '../../store'

const bar: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 12px',
  background: '#13132a',
  borderBottom: '1px solid #2d2d4e',
  minHeight: '40px',
  overflowX: 'auto',
  flexShrink: 0,
}

const captureBtn: CSSProperties = {
  flexShrink: 0,
  padding: '4px 10px',
  background: '#3a3aaa',
  color: '#fff',
  border: '1px solid #5a5acc',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
}

const ctrlBtn = (active?: boolean, disabled?: boolean): CSSProperties => ({
  flexShrink: 0,
  padding: '4px 10px',
  background: active ? '#4a4a8a' : 'rgba(255,255,255,0.07)',
  color: disabled ? '#555' : '#e0e0e0',
  border: active ? '1px solid #7a7ab0' : '1px solid rgba(255,255,255,0.14)',
  borderRadius: '4px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 500,
  fontSize: '12px',
  opacity: disabled ? 0.45 : 1,
  whiteSpace: 'nowrap',
})

const frameCell = (active: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  padding: '3px 8px',
  background: active ? '#4a4a8a' : 'rgba(255,255,255,0.07)',
  border: active ? '1px solid #7a7ab0' : '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px',
  cursor: 'pointer',
  flexShrink: 0,
  fontSize: '12px',
  fontWeight: active ? 700 : 400,
  color: '#e0e0e0',
  userSelect: 'none',
  whiteSpace: 'nowrap',
})

const delBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#999',
  cursor: 'pointer',
  fontSize: '13px',
  lineHeight: 1,
  padding: '0 0 0 3px',
}

const selectStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '4px',
  padding: '3px 5px',
  fontSize: '12px',
  cursor: 'pointer',
  flexShrink: 0,
}

const divider: CSSProperties = {
  width: '1px',
  height: '22px',
  background: '#3d3d6e',
  flexShrink: 0,
  margin: '0 2px',
}

const label: CSSProperties = {
  fontSize: '11px',
  color: '#888',
  flexShrink: 0,
}

export default function TimelinePanel() {
  const frames = useAnimationStore((s) => s.frames)
  const currentFrameIndex = useAnimationStore((s) => s.currentFrameIndex)
  const isPlaying = useAnimationStore((s) => s.isPlaying)
  const fps = useAnimationStore((s) => s.fps)
  const loop = useAnimationStore((s) => s.loop)
  const addFrame = useAnimationStore((s) => s.addFrame)
  const deleteFrame = useAnimationStore((s) => s.deleteFrame)
  const setCurrentFrameIndex = useAnimationStore((s) => s.setCurrentFrameIndex)
  const setIsPlaying = useAnimationStore((s) => s.setIsPlaying)
  const setFps = useAnimationStore((s) => s.setFps)
  const setLoop = useAnimationStore((s) => s.setLoop)
  const loadFrame = useBoardStore((s) => s.loadFrame)

  function handleCapture() {
    const b = useBoardStore.getState()
    addFrame({
      id: nanoid(),
      players: b.players.map((p) => ({ ...p })),
      balls: b.balls.map((ball) => ({ ...ball })),
      annotations: b.annotations.map((a) => ({ ...a })),
    })
  }

  function handleSelectFrame(index: number) {
    setCurrentFrameIndex(index)
    loadFrame(frames[index])
  }

  function handleDeleteFrame(e: React.MouseEvent, index: number) {
    e.stopPropagation()
    const nextFrames = frames.filter((_, i) => i !== index)
    deleteFrame(index)
    if (nextFrames.length > 0) {
      const nextIndex = Math.min(index, nextFrames.length - 1)
      loadFrame(nextFrames[nextIndex])
    }
  }

  function handleStop() {
    setIsPlaying(false)
    if (frames.length > 0) loadFrame(frames[currentFrameIndex])
  }

  const canPlay = frames.length >= 2

  return (
    <div style={bar} role="toolbar" aria-label="Animation timeline">
      {/* Capture */}
      <button style={captureBtn} onClick={handleCapture} title="Capture current board as a frame">
        + Capture
      </button>

      <div style={divider} />

      {/* Frame strip */}
      {frames.length === 0 ? (
        <span style={{ ...label, fontStyle: 'italic' }}>No frames yet</span>
      ) : (
        frames.map((frame, index) => (
          <div
            key={frame.id}
            style={frameCell(index === currentFrameIndex)}
            onClick={() => handleSelectFrame(index)}
            role="button"
            aria-label={`Frame ${index + 1}`}
            aria-pressed={index === currentFrameIndex}
          >
            F{index + 1}
            <button
              style={delBtn}
              onClick={(e) => handleDeleteFrame(e, index)}
              aria-label={`Delete frame ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))
      )}

      <div style={divider} />

      {/* Play controls */}
      <button
        style={ctrlBtn(false, !canPlay || isPlaying)}
        disabled={!canPlay || isPlaying}
        onClick={() => setIsPlaying(true)}
        title={canPlay ? 'Play' : 'Need at least 2 frames'}
      >
        ▶ Play
      </button>
      <button style={ctrlBtn()} onClick={handleStop} title="Stop">
        ■ Stop
      </button>

      <div style={divider} />

      <span style={label}>fps</span>
      <select
        style={selectStyle}
        value={fps}
        onChange={(e) => setFps(Number(e.target.value))}
        aria-label="Frames per second"
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <button
        style={ctrlBtn(loop)}
        onClick={() => setLoop(!loop)}
        title="Toggle loop"
      >
        Loop
      </button>
    </div>
  )
}
