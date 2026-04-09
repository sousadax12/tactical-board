import { useState } from 'react'
import type { Play } from '../../domain/play/models'
import { useBoardStore, useAnimationStore } from '../../store'
import { predefinedPlays } from '../../data/plays'

function loadTemplate(play: Play, onClose: () => void): void {
  const anim = useAnimationStore.getState()
  if (anim.frames.length > 0) {
    const ok = window.confirm(`Loading "${play.name}" will replace your current frames. Continue?`)
    if (!ok) return
  }
  anim.clearFrames()
  play.frames.forEach((f) => anim.addFrame(f))
  anim.setCurrentFrameIndex(0)
  useBoardStore.getState().loadFrame(play.frames[0])
  onClose()
}

export default function TemplatesPanel() {
  const [open, setOpen] = useState(false)

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '52px',
    padding: '6px 10px',
    background: open ? '#4a4a8a' : '#2d2d4e',
    border: `1px solid ${open ? '#7878cc' : '#3d3d6e'}`,
    borderRadius: '6px',
    color: open ? '#ffffff' : '#c0c0d8',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'background 0.15s, border-color 0.15s',
  }

  return (
    <>
      <button style={btnStyle} onClick={() => setOpen(true)} title="Load a predefined template">
        <span style={{ fontSize: '16px', lineHeight: 1 }}>⊞</span>
        <span>Templates</span>
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: '#1a1a2e',
              border: '1px solid #3d3d6e',
              borderRadius: '10px',
              padding: '20px',
              width: 'min(480px, 90vw)',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#e0e0ff',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Templates
              </span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8080a0',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  padding: '2px 6px',
                }}
                onClick={() => setOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Template list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {predefinedPlays.length === 0 ? (
                <div
                  style={{
                    padding: '32px 0',
                    textAlign: 'center',
                    color: '#606080',
                    fontSize: '13px',
                  }}
                >
                  No templates found. Drop .json files into{' '}
                  <code style={{ color: '#8080c0' }}>src/data/plays/</code>.
                </div>
              ) : (
                predefinedPlays.map((play) => (
                  <div
                    key={play.id}
                    style={{
                      background: '#12122a',
                      border: '1px solid #2a2a4a',
                      borderRadius: '7px',
                      padding: '12px 14px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#e0e0ff',
                          marginBottom: '3px',
                        }}
                      >
                        {play.name}
                      </div>
                      {play.description && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#808098',
                            marginBottom: '4px',
                          }}
                        >
                          {play.description}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#505070' }}>
                        {play.frames.length} {play.frames.length === 1 ? 'frame' : 'frames'}
                        {play.tags.length > 0 && (
                          <span style={{ marginLeft: '8px', color: '#6060a0' }}>
                            {play.tags.join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      style={{
                        flexShrink: 0,
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#1a3a2a',
                        color: '#60c080',
                        border: '1px solid #2a5a3a',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                      onClick={() => loadTemplate(play, () => setOpen(false))}
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
