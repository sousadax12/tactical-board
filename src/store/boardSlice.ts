import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type {
  PlayerModel,
  BallModel,
  Annotation,
  DrawingToolType,
  ID,
  Point,
  PlayFrame,
} from '../domain/play/models'

// ─── Types ────────────────────────────────────────────────────────────────────

type Snapshot = {
  players: PlayerModel[]
  balls: BallModel[]
  annotations: Annotation[]
}

export interface BoardStoreState {
  players: PlayerModel[]
  balls: BallModel[]
  annotations: Annotation[]
  activeTool: DrawingToolType
  selectedId: ID | null
  drawingPoints: Point[]
  /** Undo stack — each entry is a snapshot taken before the mutating action */
  past: Snapshot[]
  /** Redo stack — each entry is a snapshot taken before the undo */
  future: Snapshot[]

  // Actions
  addPlayer: (player: PlayerModel) => void
  updatePlayer: (id: ID, patch: Partial<PlayerModel>) => void
  removePlayer: (id: ID) => void
  addBall: (x: number, y: number, color?: string) => void
  moveBall: (id: ID, x: number, y: number) => void
  updateBall: (id: ID, patch: Partial<BallModel>) => void
  removeBall: (id: ID) => void
  addAnnotation: (ann: Annotation) => void
  updateAnnotation: (id: ID, patch: Partial<Annotation>) => void
  removeAnnotation: (id: ID) => void
  setActiveTool: (tool: DrawingToolType) => void
  setSelectedId: (id: ID | null) => void
  setDrawingPoints: (pts: Point[]) => void
  undo: () => void
  redo: () => void
  clearBoard: () => void
  loadFrame: (frame: PlayFrame) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_UNDO_STEPS = 50
const DEFAULT_BALL_COLOR = '#b0b0b0'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function snapshot(state: BoardStoreState): Snapshot {
  return {
    players: state.players.map((p) => ({ ...p })),
    balls: state.balls.map((b) => ({ ...b })),
    annotations: state.annotations.map((a) => ({ ...a })),
  }
}

function pushUndoCheckpoint(draft: BoardStoreState, snap: Snapshot): void {
  draft.past.push(snap)
  if (draft.past.length > MAX_UNDO_STEPS) {
    draft.past.shift()
  }
  draft.future = []
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBoardStore = create<BoardStoreState>()(
  immer((set) => ({
    // ── Initial state ──────────────────────────────────────────────────────
    players: [],
    balls: [],
    annotations: [],
    activeTool: 'select',
    selectedId: null,
    drawingPoints: [],
    past: [],
    future: [],

    // ── Player actions ─────────────────────────────────────────────────────

    addPlayer(player) {
      set((draft) => {
        draft.players.push(player)
      })
    },

    updatePlayer(id, patch) {
      set((draft) => {
        const snap = snapshot(draft)
        const target = draft.players.find((p) => p.id === id)
        if (!target) return
        Object.assign(target, patch)
        pushUndoCheckpoint(draft, snap)
      })
    },

    removePlayer(id) {
      set((draft) => {
        const index = draft.players.findIndex((p) => p.id === id)
        if (index === -1) return
        const snap = snapshot(draft)
        draft.players.splice(index, 1)
        pushUndoCheckpoint(draft, snap)
      })
    },

    // ── Ball actions ───────────────────────────────────────────────────────

    addBall(x, y, color) {
      set((draft) => {
        const snap = snapshot(draft)
        draft.balls.push({ id: nanoid(), x, y, color: color ?? DEFAULT_BALL_COLOR })
        pushUndoCheckpoint(draft, snap)
      })
    },

    moveBall(id, x, y) {
      set((draft) => {
        const ball = draft.balls.find((b) => b.id === id)
        if (!ball) return
        ball.x = x
        ball.y = y
      })
    },

    updateBall(id, patch) {
      set((draft) => {
        const snap = snapshot(draft)
        const ball = draft.balls.find((b) => b.id === id)
        if (!ball) return
        Object.assign(ball, patch)
        pushUndoCheckpoint(draft, snap)
      })
    },

    removeBall(id) {
      set((draft) => {
        const index = draft.balls.findIndex((b) => b.id === id)
        if (index === -1) return
        const snap = snapshot(draft)
        draft.balls.splice(index, 1)
        pushUndoCheckpoint(draft, snap)
      })
    },

    // ── Annotation actions ─────────────────────────────────────────────────

    addAnnotation(ann) {
      set((draft) => {
        const snap = snapshot(draft)
        draft.annotations.push(ann)
        pushUndoCheckpoint(draft, snap)
      })
    },

    updateAnnotation(id, patch) {
      set((draft) => {
        const target = draft.annotations.find((a) => a.id === id)
        if (!target) return
        Object.assign(target, patch)
      })
    },

    removeAnnotation(id) {
      set((draft) => {
        const index = draft.annotations.findIndex((a) => a.id === id)
        if (index === -1) return
        const snap = snapshot(draft)
        draft.annotations.splice(index, 1)
        pushUndoCheckpoint(draft, snap)
      })
    },

    // ── Tool / selection / drawing ─────────────────────────────────────────

    setActiveTool(tool) {
      set((draft) => {
        draft.activeTool = tool
      })
    },

    setSelectedId(id) {
      set((draft) => {
        draft.selectedId = id
      })
    },

    setDrawingPoints(pts) {
      set((draft) => {
        draft.drawingPoints = pts
      })
    },

    // ── Undo / redo ────────────────────────────────────────────────────────

    undo() {
      set((draft) => {
        if (draft.past.length === 0) return
        const previous = draft.past.pop()!
        draft.future.push({
          players: draft.players.map((p) => ({ ...p })),
          balls: draft.balls.map((b) => ({ ...b })),
          annotations: draft.annotations.map((a) => ({ ...a })),
        })
        draft.players = previous.players
        draft.balls = previous.balls
        draft.annotations = previous.annotations
      })
    },

    redo() {
      set((draft) => {
        if (draft.future.length === 0) return
        const next = draft.future.pop()!
        draft.past.push({
          players: draft.players.map((p) => ({ ...p })),
          balls: draft.balls.map((b) => ({ ...b })),
          annotations: draft.annotations.map((a) => ({ ...a })),
        })
        draft.players = next.players
        draft.balls = next.balls
        draft.annotations = next.annotations
      })
    },

    // ── Board-level ────────────────────────────────────────────────────────

    clearBoard() {
      set((draft) => {
        draft.players = []
        draft.balls = []
        draft.annotations = []
        draft.past = []
        draft.future = []
        draft.selectedId = null
        draft.drawingPoints = []
      })
    },

    loadFrame(frame) {
      set((draft) => {
        draft.players = frame.players.map((p) => ({ ...p }))
        // Migration: old frames used ball: BallModel | null, new format uses balls: BallModel[]
        if (frame.balls) {
          draft.balls = frame.balls.map((b) => ({ ...b }))
        } else {
          const oldBall = (frame as unknown as { ball?: { x: number; y: number } }).ball
          draft.balls = oldBall
            ? [{ id: nanoid(), x: oldBall.x, y: oldBall.y, color: DEFAULT_BALL_COLOR }]
            : []
        }
        draft.annotations = frame.annotations.map((a) => ({ ...a }))
        draft.past = []
        draft.future = []
        draft.selectedId = null
        draft.drawingPoints = []
      })
    },
  })),
)
