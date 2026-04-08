import React, { useEffect, useCallback, useRef } from 'react'
import { Layer, Line, Rect } from 'react-konva'
import type Konva from 'konva'
import { nanoid } from 'nanoid'
import type {
  ArrowAnnotation,
  LineAnnotation,
  ZoneAnnotation,
  TextAnnotation,
  Point,
} from '../../domain/play/models'
import { useBoardStore } from '../../store'
import type { CourtScale } from '../../hooks/useCourtScale'
import AnnotationRenderer from './AnnotationRenderer'

interface DrawingLayerProps {
  scale: CourtScale
}

const DEFAULT_ARROW_COLOR = '#FF6B35'
const DEFAULT_LINE_COLOR = '#FF6B35'
const DEFAULT_ZONE_COLOR = '#FFD700'
const DEFAULT_TEXT_COLOR = '#FFFFFF'
const DEFAULT_STROKE_WIDTH = 3
const DEFAULT_FONT_SIZE = 18

export default function DrawingLayer({ scale }: DrawingLayerProps): React.ReactElement {
  const annotations = useBoardStore((s) => s.annotations)
  const activeTool = useBoardStore((s) => s.activeTool)
  const selectedId = useBoardStore((s) => s.selectedId)
  const drawingPoints = useBoardStore((s) => s.drawingPoints)
  const addAnnotation = useBoardStore((s) => s.addAnnotation)
  const setSelectedId = useBoardStore((s) => s.setSelectedId)
  const setDrawingPoints = useBoardStore((s) => s.setDrawingPoints)
  const removeAnnotation = useBoardStore((s) => s.removeAnnotation)

  // Track zone rect start point in a ref to avoid stale closure issues
  const zoneStartRef = useRef<Point | null>(null)

  // ── Keyboard: delete selected annotation ──────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        removeAnnotation(selectedId)
        setSelectedId(null)
      }
    },
    [selectedId, removeAnnotation, setSelectedId],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Stage pointer event helpers ───────────────────────────────────────────

  /** Returns normalised coordinates from a Konva stage event */
  function toNorm(e: Konva.KonvaEventObject<MouseEvent>): Point {
    const stage = e.target.getStage()
    if (!stage) return { x: 0, y: 0 }
    const pos = stage.getPointerPosition()
    if (!pos) return { x: 0, y: 0 }
    return { x: scale.toNormX(pos.x), y: scale.toNormY(pos.y) }
  }

  // ── Layer click (arrow / line / text / select-deselect) ───────────────────
  function handleLayerClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    // Ignore the synthetic second-click that Konva fires as part of a dblclick
    if (e.evt.detail === 2) return

    // Only process clicks that land on the background rect (not on annotations)
    const clickedOnEmpty =
      e.target === (e.target.getStage() as unknown) ||
      (e.target as unknown as { name: () => string }).name() === 'drawing-bg'

    if (activeTool === 'select') {
      if (clickedOnEmpty) setSelectedId(null)
      return
    }

    if (activeTool === 'text') {
      const norm = toNorm(e)
      const text = window.prompt('Enter annotation text:')
      if (!text || text.trim() === '') return
      const ann: TextAnnotation = {
        id: nanoid(),
        type: 'text',
        x: norm.x,
        y: norm.y,
        text: text.trim(),
        color: DEFAULT_TEXT_COLOR,
        fontSize: DEFAULT_FONT_SIZE,
      }
      addAnnotation(ann)
      return
    }

    if (activeTool === 'arrow' || activeTool === 'line') {
      const norm = toNorm(e)
      // Always read from store directly to avoid stale closure
      const current = useBoardStore.getState().drawingPoints

      if (current.length === 0) {
        // First click: set start point and wait for second click
        setDrawingPoints([norm])
      } else {
        // Second click: finalize the annotation
        const pts = [...current, norm]
        if (activeTool === 'arrow') {
          const ann: ArrowAnnotation = {
            id: nanoid(),
            type: 'arrow',
            points: pts,
            color: DEFAULT_ARROW_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            dashed: false,
          }
          addAnnotation(ann)
        } else {
          const ann: LineAnnotation = {
            id: nanoid(),
            type: 'line',
            points: pts,
            color: DEFAULT_LINE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            dashed: true,
          }
          addAnnotation(ann)
        }
        setDrawingPoints([])
      }
    }
  }

  // ── Double-click: cancel in-progress arrow / line drawing ─────────────────
  function handleLayerDblClick(): void {
    if (activeTool === 'arrow' || activeTool === 'line') {
      setDrawingPoints([])
    }
  }

  // ── Zone: mousedown / mouseup ─────────────────────────────────────────────
  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (activeTool !== 'zone') return
    zoneStartRef.current = toNorm(e)
  }

  function handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (activeTool !== 'zone') return
    const start = zoneStartRef.current
    if (!start) return
    zoneStartRef.current = null

    const end = toNorm(e)
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    // Ignore tiny drags (accidental clicks)
    if (width < 0.01 || height < 0.01) return

    const ann: ZoneAnnotation = {
      id: nanoid(),
      type: 'zone',
      x,
      y,
      width,
      height,
      color: DEFAULT_ZONE_COLOR,
      opacity: 0.3,
    }
    addAnnotation(ann)
  }

  // ── Preview line while building arrow/line ────────────────────────────────
  const previewPoints =
    drawingPoints.length >= 1
      ? drawingPoints.flatMap((p) => [scale.toPixelX(p.x), scale.toPixelY(p.y)])
      : null

  return (
    <Layer
      onClick={handleLayerClick}
      onDblClick={handleLayerDblClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Full-coverage transparent rect so the layer captures all pointer events */}
      <Rect
        name="drawing-bg"
        x={0}
        y={0}
        width={scale.stageWidth}
        height={scale.stageHeight}
        fill="transparent"
        listening={true}
      />
      {annotations.map((ann) => (
        <AnnotationRenderer
          key={ann.id}
          annotation={ann}
          scale={scale}
          isSelected={ann.id === selectedId}
          onSelect={setSelectedId}
        />
      ))}

      {/* Preview line while drawing arrow/line */}
      {previewPoints !== null && (activeTool === 'arrow' || activeTool === 'line') && (
        <Line
          points={previewPoints}
          stroke={DEFAULT_ARROW_COLOR}
          strokeWidth={DEFAULT_STROKE_WIDTH}
          opacity={0.6}
          dash={[6, 3]}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
    </Layer>
  )
}
