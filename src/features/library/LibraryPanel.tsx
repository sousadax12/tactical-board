import { useState } from 'react'
import { nanoid } from 'nanoid'
import type { Play, PlayFrame } from '../../domain/play/models'
import { useBoardStore, useAnimationStore } from '../../store'
import { useLibraryStore } from '../../store'

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function LibraryPanel() {
  const [open, setOpen] = useState(false)
  const [exportState, setExportState] = useState<{ play: Play; editName: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const plays = useLibraryStore((s) => s.plays)
  const deletePlay = useLibraryStore((s) => s.deletePlay)

  function handleSaveCurrent(): void {
    const name = window.prompt('Enter a name for this play:')
    if (!name || name.trim() === '') return
    const boardState = useBoardStore.getState()
    const frame: PlayFrame = {
      id: nanoid(),
      players: boardState.players.map((p) => ({ ...p })),
      balls: boardState.balls.map((b) => ({ ...b })),
      annotations: boardState.annotations.map((a) => ({ ...a })),
    }
    const now = Date.now()
    const play: Play = {
      id: nanoid(),
      name: name.trim(),
      description: '',
      createdAt: now,
      updatedAt: now,
      frames: [frame],
      tags: [],
    }
    useLibraryStore.getState().savePlay(play)
  }

  function handleSaveAnimation(): void {
    const frames = useAnimationStore.getState().frames
    if (frames.length === 0) {
      alert('No frames captured in the timeline. Use "Capture" to add frames first.')
      return
    }
    const name = window.prompt(`Save all ${frames.length} timeline frames as a play:`)
    if (!name?.trim()) return
    const now = Date.now()
    useLibraryStore.getState().savePlay({
      id: nanoid(),
      name: name.trim(),
      description: '',
      createdAt: now,
      updatedAt: now,
      frames,
      tags: [],
    })
  }

  function handleLoad(play: Play): void {
    useBoardStore.getState().loadFrame(play.frames[0])
    useBoardStore.getState().setBoardName(play.name)
    useBoardStore.getState().setBoardDescription(play.description)
    useBoardStore.getState().setBoardTags(play.tags)
    setOpen(false)
  }

  function handleDelete(id: string): void {
    if (window.confirm('Delete this play?')) deletePlay(id)
  }

  function handleExport(play: Play): void {
    setExportState({ play, editName: play.name })
    setCopied(false)
  }

  function toSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }

  function buildJson(play: Play, editName: string): string {
    return JSON.stringify({ ...play, name: editName }, null, 2)
  }

  function handleCopy(): void {
    if (!exportState) return
    const json = buildJson(exportState.play, exportState.editName)
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload(): void {
    if (!exportState) return
    const json = buildJson(exportState.play, exportState.editName)
    const slug = toSlug(exportState.editName) || 'template'
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

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
      <button style={btnStyle} onClick={() => setOpen(true)} title="Play library">
        <span style={{ fontSize: '16px', lineHeight: 1 }}>☰</span>
        <span>Library</span>
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
              width: 'min(520px, 92vw)',
              maxHeight: '78vh',
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
                Play Library
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#3a3aff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={handleSaveCurrent}
                  title="Save the current board state as a single-frame play"
                >
                  Save Frame
                </button>
                <button
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#1a4a2a',
                    color: '#60d080',
                    border: '1px solid #2a6a3a',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={handleSaveAnimation}
                  title="Save all timeline frames as a multi-frame play"
                >
                  Save Animation
                </button>
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
            </div>

            {/* Play list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {plays.length === 0 ? (
                <div
                  style={{
                    padding: '40px 0',
                    textAlign: 'center',
                    color: '#606080',
                    fontSize: '13px',
                  }}
                >
                  No plays saved yet. Set up the board and click "Save Current".
                </div>
              ) : (
                plays.map((play) => (
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
                          marginBottom: '2px',
                        }}
                      >
                        {play.name}
                      </div>
                      {play.description && (
                        <div style={{ fontSize: '12px', color: '#808098', marginBottom: '3px' }}>
                          {play.description}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#505070' }}>
                        {formatDate(play.createdAt)}
                        {play.tags.length > 0 && (
                          <span style={{ marginLeft: '8px', color: '#6060a0' }}>
                            {play.tags.join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#1a3a1a',
                          color: '#60c060',
                          border: '1px solid #2a5a2a',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleLoad(play)}
                      >
                        Load
                      </button>
                      <button
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#1a2a3a',
                          color: '#60a0d0',
                          border: '1px solid #2a4a5a',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleExport(play)}
                        title="Export as template JSON"
                      >
                        JSON
                      </button>
                      <button
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          background: '#3a1a1a',
                          color: '#c06060',
                          border: '1px solid #5a2a2a',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleDelete(play.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export as Template JSON modal */}
      {exportState && (() => {
        const slug = toSlug(exportState.editName) || 'template'
        const json = buildJson(exportState.play, exportState.editName)
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
            }}
            onClick={() => setExportState(null)}
          >
            <div
              style={{
                background: '#1a1a2e',
                border: '1px solid #3d3d6e',
                borderRadius: '10px',
                padding: '20px',
                width: 'min(600px, 94vw)',
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#e0e0ff' }}>
                  Export as Template JSON
                </span>
                <button
                  style={{ background: 'none', border: 'none', color: '#8080a0', cursor: 'pointer', fontSize: '18px' }}
                  onClick={() => setExportState(null)}
                >
                  ✕
                </button>
              </div>

              {/* Editable template name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', color: '#8080b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Template name
                </label>
                <input
                  type="text"
                  value={exportState.editName}
                  onChange={(e) => {
                    setCopied(false)
                    setExportState({ ...exportState, editName: e.target.value })
                  }}
                  style={{
                    background: '#0d0d1e',
                    border: '1px solid #3d3d6e',
                    borderRadius: '5px',
                    color: '#e0e0ff',
                    fontSize: '13px',
                    padding: '6px 10px',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#505070' }}>
                  File: <code style={{ color: '#80c0ff' }}>src/data/plays/{slug}.json</code>
                </span>
              </div>

              {/* JSON preview */}
              <pre
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  background: '#0d0d1e',
                  border: '1px solid #2a2a4a',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '11px',
                  color: '#c0d0e0',
                  margin: 0,
                  whiteSpace: 'pre',
                  maxHeight: '44vh',
                }}
              >
                {json}
              </pre>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  style={{
                    padding: '7px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: copied ? '#1a4a1a' : '#1a2a4a',
                    color: copied ? '#60d080' : '#60a0d0',
                    border: `1px solid ${copied ? '#2a6a2a' : '#2a4a6a'}`,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  style={{
                    padding: '7px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#2a1a4a',
                    color: '#a060d0',
                    border: '1px solid #4a2a6a',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                  onClick={handleDownload}
                >
                  Download {slug}.json
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
