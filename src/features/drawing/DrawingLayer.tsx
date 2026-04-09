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
  // Track last tap time to suppress the browser's delayed click after touchend
  const lastTapTimeRef = useRef<number>(0)

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

  /** Returns normalised coordinates from a Konva stage event (mouse or touch) */
  function toNorm(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): Point {
    const stage = e.target.getStage()
    if (!stage) return { x: 0, y: 0 }
    const pos = stage.getPointerPosition()
    if (!pos) return { x: 0, y: 0 }
    return { x: scale.toNormX(pos.x), y: scale.toNormY(pos.y) }
  }

  // ── Shared click / tap logic (arrow / line / text / select) ───────────────
  function processClickOrTap(
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
    isTouch: boolean,
  ): void {
    if (isTouch) {
      // Record tap time so the subsequent browser click (fired ~300 ms later) is ignored
      lastTapTimeRef.current = Date.now()
    } else {
      // Skip mouse click that fires shortly after a tap on mobile
      if (Date.now() - lastTapTimeRef.current < 500) return
      // Ignore the synthetic second-click Konva fires as part of a dblclick
      if ((e.evt as MouseEvent).detail === 2) return
    }

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
        // First tap: set start point and wait for second tap
        setDrawingPoints([norm])
      } else {
        // Second tap: finalize the annotation
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

  function handleLayerClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    processClickOrTap(e, false)
  }

  function handleLayerTap(e: Konva.KonvaEventObject<TouchEvent>): void {
    processClickOrTap(e as unknown as Konva.KonvaEventObject<MouseEvent | TouchEvent>, true)
  }

  // ── Double-click / double-tap: cancel in-progress arrow / line drawing ─────
  function handleLayerDblClick(): void {
    if (activeTool === 'arrow' || activeTool === 'line') {
      setDrawingPoints([])
    }
  }

  // ── Zone: shared start / end for mouse and touch ──────────────────────────
  function processZoneStart(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void {
    if (activeTool !== 'zone') return
    zoneStartRef.current = toNorm(e)
  }

  function processZoneEnd(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void {
    if (activeTool !== 'zone') return
    const start = zoneStartRef.current
    if (!start) return
    zoneStartRef.current = null

    const end = toNorm(e)
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    // Ignore tiny drags (accidental taps)
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

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    processZoneStart(e)
  }

  function handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    processZoneEnd(e)
  }

  function handleTouchStart(e: Konva.KonvaEventObject<TouchEvent>): void {
    processZoneStart(e as unknown as Konva.KonvaEventObject<MouseEvent | TouchEvent>)
  }

  function handleTouchEnd(e: Konva.KonvaEventObject<TouchEvent>): void {
    processZoneEnd(e as unknown as Konva.KonvaEventObject<MouseEvent | TouchEvent>)
  }

  // ── Preview line while building arrow/line ────────────────────────────────
  const sf = scale.scaleFactor
  const previewPoints =
    drawingPoints.length >= 1
      ? drawingPoints.flatMap((p) => [scale.toPixelX(p.x), scale.toPixelY(p.y)])
      : null

  return (
    <Layer
      onClick={handleLayerClick}
      onTap={handleLayerTap}
      onDblClick={handleLayerDblClick}
      onDblTap={handleLayerDblClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
          strokeWidth={DEFAULT_STROKE_WIDTH * sf}
          opacity={0.6}
          dash={[6 * sf, 3 * sf]}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
    </Layer>
  )
}
