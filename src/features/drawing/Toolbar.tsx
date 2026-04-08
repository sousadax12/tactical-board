import React from 'react'
import { useBoardStore } from '../../store'
import type { DrawingToolType } from '../../domain/play/models'

interface ToolDef {
  tool: DrawingToolType
  label: string
  icon: string
}

const TOOLS: ToolDef[] = [
  { tool: 'select', label: 'Select', icon: '↖' },
  { tool: 'arrow', label: 'Arrow', icon: '→' },
  { tool: 'line', label: 'Line', icon: '╱' },
  { tool: 'zone', label: 'Zone', icon: '▭' },
  { tool: 'text', label: 'Text', icon: 'T' },
]

const styles = {
  toolbar: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: '#1a1a2e',
    borderBottom: '1px solid #2d2d4e',
    flexWrap: 'wrap' as const,
  },
  button: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '52px',
    padding: '6px 10px',
    background: '#2d2d4e',
    border: '1px solid #3d3d6e',
    borderRadius: '6px',
    color: '#c0c0d8',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'background 0.15s, border-color 0.15s',
  },
  buttonActive: {
    background: '#4a4a8a',
    border: '1px solid #7878cc',
    color: '#ffffff',
  },
  icon: {
    fontSize: '16px',
    lineHeight: 1,
  },
  divider: {
    width: '1px',
    height: '36px',
    background: '#3d3d6e',
    margin: '0 4px',
  },
  actionButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '52px',
    padding: '6px 10px',
    background: '#2d2d4e',
    border: '1px solid #3d3d6e',
    borderRadius: '6px',
    color: '#c0c0d8',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'background 0.15s',
  },
  clearButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '52px',
    padding: '6px 10px',
    background: '#3d1a1a',
    border: '1px solid #6e3d3d',
    borderRadius: '6px',
    color: '#f08080',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'background 0.15s',
  },
}

export default function Toolbar(): React.ReactElement {
  const activeTool = useBoardStore((s) => s.activeTool)
  const setActiveTool = useBoardStore((s) => s.setActiveTool)
  const undo = useBoardStore((s) => s.undo)
  const redo = useBoardStore((s) => s.redo)
  const clearBoard = useBoardStore((s) => s.clearBoard)
  const past = useBoardStore((s) => s.past)
  const future = useBoardStore((s) => s.future)

  const handleClear = (): void => {
    if (window.confirm('Clear all annotations and players?')) {
      clearBoard()
    }
  }

  return (
    <div style={styles.toolbar} role="toolbar" aria-label="Drawing tools">
      {TOOLS.map(({ tool, label, icon }) => {
        const isActive = activeTool === tool
        return (
          <button
            key={tool}
            style={isActive ? { ...styles.button, ...styles.buttonActive } : styles.button}
            onClick={() => setActiveTool(tool)}
            aria-pressed={isActive}
            title={label}
          >
            <span style={styles.icon}>{icon}</span>
            <span>{label}</span>
          </button>
        )
      })}

      <div style={styles.divider} />

      <button
        style={{
          ...styles.actionButton,
          opacity: past.length === 0 ? 0.4 : 1,
          cursor: past.length === 0 ? 'not-allowed' : 'pointer',
        }}
        onClick={undo}
        disabled={past.length === 0}
        title="Undo"
      >
        <span style={styles.icon}>↩</span>
        <span>Undo</span>
      </button>

      <button
        style={{
          ...styles.actionButton,
          opacity: future.length === 0 ? 0.4 : 1,
          cursor: future.length === 0 ? 'not-allowed' : 'pointer',
        }}
        onClick={redo}
        disabled={future.length === 0}
        title="Redo"
      >
        <span style={styles.icon}>↪</span>
        <span>Redo</span>
      </button>

      <div style={styles.divider} />

      <button style={styles.clearButton} onClick={handleClear} title="Clear board">
        <span style={styles.icon}>✕</span>
        <span>Clear</span>
      </button>
    </div>
  )
}
