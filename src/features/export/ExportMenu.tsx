import React, { useState, useRef, useEffect } from 'react'
import Konva from 'konva'
import { exportAsPng } from './PngExporter'
import { generateShareUrl, isSharePayloadTooLarge } from './ShareLinkGenerator'
import { exportAsJson } from './JsonExporter'
import { validateAndParsePlay } from './JsonImporter'
import { useBoardStore, useAnimationStore } from '../../store'
import type { Play, PlayFrame } from '../../domain/play/models'

interface ExportMenuProps {
  stageRef: React.RefObject<Konva.Stage | null>
}

export default function ExportMenu({ stageRef }: ExportMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [warning, setWarning] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const players = useBoardStore((s) => s.players)
  const balls = useBoardStore((s) => s.balls)
  const annotations = useBoardStore((s) => s.annotations)
  const frames = useAnimationStore((s) => s.frames)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleDownloadPng() {
    const stage = stageRef.current
    if (!stage) return
    exportAsPng(stage, 'tactical-play')
    setOpen(false)
  }

  function buildSharePlay(): Play {
    const now = Date.now()
    const boardFrame: PlayFrame = {
      id: crypto.randomUUID(),
      players: players.map((p) => ({ ...p })),
      balls: balls.map((b) => ({ ...b })),
      annotations: annotations.map((a) => ({ ...a })),
    }
    const shareFrames = frames.length > 0 ? frames : [boardFrame]
    return {
      id: crypto.randomUUID(),
      name: 'Shared Play',
      description: '',
      createdAt: now,
      updatedAt: now,
      frames: shareFrames,
      tags: [],
    }
  }

  function handleExportJson() {
    const play = buildSharePlay()
    exportAsJson(play)
    setOpen(false)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
    setOpen(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-imported
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string)
        const play = validateAndParsePlay(parsed)
        if (!play) {
          setWarning('Invalid play file — could not import')
          setTimeout(() => setWarning(''), 4000)
          return
        }
        const anim = useAnimationStore.getState()
        anim.clearFrames()
        play.frames.forEach((f) => anim.addFrame(f))
        anim.setCurrentFrameIndex(0)
        useBoardStore.getState().loadFrame(play.frames[0])
      } catch {
        setWarning('Could not read file — make sure it is valid JSON')
        setTimeout(() => setWarning(''), 4000)
      }
    }
    reader.readAsText(file)
  }

  async function handleCopyShareLink() {
    const play = buildSharePlay()
    if (isSharePayloadTooLarge(play)) {
      setWarning('Play too large to share as link — use PNG export instead')
      setTimeout(() => setWarning(''), 4000)
      return
    }
    const url = generateShareUrl(play)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setOpen(false)
    setTimeout(() => setCopied(false), 2000)
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
    position: 'relative',
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    background: '#1a1a2e',
    border: '1px solid #3d3d6e',
    borderRadius: '6px',
    overflow: 'hidden',
    zIndex: 100,
    minWidth: '180px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  }

  const itemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    background: 'transparent',
    border: 'none',
    color: '#c0c0d8',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'left',
    transition: 'background 0.1s',
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button style={btnStyle} onClick={() => setOpen((o) => !o)} title="Export options">
        <span style={{ fontSize: '16px', lineHeight: 1 }}>⬇</span>
        <span>{copied ? 'Copied!' : 'Export'}</span>
      </button>

      {warning && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#3d1a1a',
            border: '1px solid #6e3d3d',
            borderRadius: '6px',
            color: '#f08080',
            fontSize: '11px',
            padding: '8px 12px',
            zIndex: 100,
            maxWidth: '220px',
          }}
        >
          {warning}
        </div>
      )}

      {open && (
        <div style={dropdownStyle}>
          <button
            style={itemStyle}
            onClick={handleDownloadPng}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#2d2d4e')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            ⬇ Download PNG
          </button>
          <button
            style={{ ...itemStyle, borderTop: '1px solid #2d2d4e' }}
            onClick={handleCopyShareLink}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#2d2d4e')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            🔗 Copy Share Link
          </button>
          <button
            style={{ ...itemStyle, borderTop: '1px solid #2d2d4e' }}
            onClick={handleExportJson}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#2d2d4e')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            &#123;&#125; Export JSON
          </button>
          <button
            style={{ ...itemStyle, borderTop: '1px solid #2d2d4e' }}
            onClick={handleImportClick}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#2d2d4e')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            ⬆ Import JSON
          </button>
        </div>
      )}
    </div>
  )
}
