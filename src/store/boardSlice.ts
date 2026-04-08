import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
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
  annotations: Annotation[]
}

export interface BoardStoreState {
  players: PlayerModel[]
  ball: BallModel | null
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
  placeBall: (x: number, y: number) => void
  moveBall: (x: number, y: number) => void
  removeBall: () => void
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a shallow snapshot of the mutable parts of the board state.
 * Called *before* applying a mutation so the old state can be restored.
 */
function snapshot(state: BoardStoreState): Snapshot {
  return {
    players: state.players.map((p) => ({ ...p })),
    annotations: state.annotations.map((a) => ({ ...a })),
  }
}

/**
 * Pushes `snap` onto `past`, enforcing MAX_UNDO_STEPS, and clears `future`.
 * Must be called on the draft inside an immer producer.
 */
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
    ball: null,
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

    placeBall(x, y) {
      set((draft) => {
        draft.ball = { x, y }
      })
    },

    moveBall(x, y) {
      set((draft) => {
        if (!draft.ball) return
        draft.ball.x = x
        draft.ball.y = y
      })
    },

    removeBall() {
      set((draft) => {
        draft.ball = null
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
          annotations: draft.annotations.map((a) => ({ ...a })),
        })
        draft.players = previous.players
        draft.annotations = previous.annotations
      })
    },

    redo() {
      set((draft) => {
        if (draft.future.length === 0) return
        const next = draft.future.pop()!
        draft.past.push({
          players: draft.players.map((p) => ({ ...p })),
          annotations: draft.annotations.map((a) => ({ ...a })),
        })
        draft.players = next.players
        draft.annotations = next.annotations
      })
    },

    // ── Board-level ────────────────────────────────────────────────────────

    clearBoard() {
      set((draft) => {
        draft.players = []
        draft.ball = null
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
        draft.annotations = frame.annotations.map((a) => ({ ...a }))
        draft.past = []
        draft.future = []
        draft.selectedId = null
        draft.drawingPoints = []
      })
    },
  })),
)
