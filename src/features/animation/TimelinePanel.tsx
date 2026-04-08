import { nanoid } from 'nanoid'
import type { CSSProperties } from 'react'
import { useAnimationStore } from '../../store'
import { useBoardStore } from '../../store'

// ─── Styles ───────────────────────────────────────────────────────────────────

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  background: '#1a1a2e',
  color: '#e0e0e0',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  borderRadius: '8px',
  minWidth: '260px',
}

const headingStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '2px',
}

const dividerStyle: CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.1)',
}

const controlRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}

const btnStyle = (active?: boolean, disabled?: boolean): CSSProperties => ({
  padding: '5px 12px',
  background: active ? '#4a4a8a' : 'rgba(255,255,255,0.08)',
  color: disabled ? '#555' : '#e0e0e0',
  border: active ? '1px solid #7a7ab0' : '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: '13px',
  opacity: disabled ? 0.5 : 1,
  transition: 'background 0.15s',
})

const selectStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  padding: '4px 6px',
  fontSize: '13px',
  cursor: 'pointer',
}

const frameStripStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '6px',
  overflowX: 'auto',
  paddingBottom: '4px',
}

const frameCellStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  padding: '4px 8px',
  background: active ? '#4a4a8a' : 'rgba(255,255,255,0.07)',
  border: active
    ? '1px solid #7a7ab0'
    : '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px',
  cursor: 'pointer',
  flexShrink: 0,
  fontSize: '12px',
  fontWeight: active ? 700 : 400,
  color: '#e0e0e0',
  userSelect: 'none',
})

const frameDeleteBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#aaa',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  padding: '0 0 0 4px',
  marginLeft: '2px',
}

const addFrameBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  cursor: 'pointer',
  color: '#e0e0e0',
  fontSize: '18px',
  fontWeight: 300,
  flexShrink: 0,
}

const captureBtnStyle: CSSProperties = {
  padding: '7px 14px',
  background: '#4a4a8a',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '13px',
  alignSelf: 'flex-start',
}

const labelStyle: CSSProperties = {
  fontSize: '12px',
  color: '#aaa',
  marginRight: '2px',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimelinePanel() {
  // Animation store
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

  // Board store
  const loadFrame = useBoardStore((s) => s.loadFrame)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCapture = () => {
    const boardState = useBoardStore.getState()
    addFrame({
      id: nanoid(),
      players: boardState.players.map((p) => ({ ...p })),
      ball: boardState.ball ? { ...boardState.ball } : null,
      annotations: boardState.annotations.map((a) => ({ ...a })),
    })
  }

  const handleSelectFrame = (index: number) => {
    setCurrentFrameIndex(index)
    loadFrame(frames[index])
  }

  const handleDeleteFrame = (
    e: React.MouseEvent<HTMLButtonElement>,
    index: number,
  ) => {
    e.stopPropagation()
    const isLast = frames.length === 1
    // animationSlice handles adjusting currentFrameIndex on delete
    deleteFrame(index)
    if (!isLast) {
      // After deletion the slice clamps the index; load whatever frame will be active
      const nextFrames = frames.filter((_, i) => i !== index)
      if (nextFrames.length > 0) {
        const nextIndex = Math.min(index, nextFrames.length - 1)
        loadFrame(nextFrames[nextIndex])
      }
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleStop = () => {
    setIsPlaying(false)
    if (frames.length > 0) {
      loadFrame(frames[currentFrameIndex])
    }
  }

  const handleFpsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFps(Number(e.target.value))
  }

  const handleLoopToggle = () => {
    setLoop(!loop)
  }

  const canPlay = frames.length >= 2

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headingStyle}>Animation</div>

      {/* Controls row */}
      <div style={controlRowStyle}>
        <button
          style={btnStyle(false, !canPlay)}
          disabled={!canPlay || isPlaying}
          onClick={handlePlay}
          aria-label="Play animation"
        >
          Play
        </button>
        <button
          style={btnStyle(false, false)}
          onClick={handleStop}
          aria-label="Stop animation"
        >
          Stop
        </button>

        <span style={labelStyle}>fps:</span>
        <select
          style={selectStyle}
          value={fps}
          onChange={handleFpsChange}
          aria-label="Frames per second"
        >
          {[1, 2, 3, 4, 5].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <button
          style={btnStyle(loop)}
          onClick={handleLoopToggle}
          aria-label={loop ? 'Loop on' : 'Loop off'}
          title="Toggle loop"
        >
          Loop
        </button>
      </div>

      <div style={dividerStyle} />

      {/* Frame strip */}
      <div style={frameStripStyle}>
        {/* Add frame placeholder button */}
        <button
          style={addFrameBtnStyle}
          onClick={handleCapture}
          aria-label="Capture and add current frame"
          title="Capture current frame"
        >
          +
        </button>

        {frames.map((frame, index) => (
          <div
            key={frame.id}
            style={frameCellStyle(index === currentFrameIndex)}
            onClick={() => handleSelectFrame(index)}
            role="button"
            aria-label={`Frame ${index + 1}`}
            aria-pressed={index === currentFrameIndex}
          >
            F{index + 1}
            <button
              style={frameDeleteBtnStyle}
              onClick={(e) => handleDeleteFrame(e, index)}
              aria-label={`Delete frame ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}

        {frames.length === 0 && (
          <span style={{ color: '#555', fontSize: '12px' }}>
            No frames — click + to capture
          </span>
        )}
      </div>

      <div style={dividerStyle} />

      {/* Capture button */}
      <button
        style={captureBtnStyle}
        onClick={handleCapture}
        aria-label="Capture current board state as a frame"
      >
        Capture Frame
      </button>
    </div>
  )
}
