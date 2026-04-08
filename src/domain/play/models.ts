// All domain model interfaces for the handball tactical board
// Coordinates are normalized 0..1 (decoupled from render resolution)

export type ID = string

// ─── Court ───────────────────────────────────────────────────────────────────

export type CourtZone = 'attack' | 'defense' | 'neutral'

// ─── Players ─────────────────────────────────────────────────────────────────

export type TeamSide = 'home' | 'away'

export interface PlayerModel {
  id: ID
  teamSide: TeamSide
  number: number
  label: string
  /** Normalized x position [0..1] */
  x: number
  /** Normalized y position [0..1] */
  y: number
  color: string
}

// ─── Drawing / Annotations ────────────────────────────────────────────────────

export type DrawingToolType = 'arrow' | 'line' | 'zone' | 'text' | 'select'

export interface Point {
  x: number
  y: number
}

export interface ArrowAnnotation {
  id: ID
  type: 'arrow'
  points: Point[] // at least 2 points
  color: string
  strokeWidth: number
  dashed: boolean
}

export interface LineAnnotation {
  id: ID
  type: 'line'
  points: Point[]
  color: string
  strokeWidth: number
  dashed: boolean
}

export interface ZoneAnnotation {
  id: ID
  type: 'zone'
  /** Top-left normalized */
  x: number
  y: number
  width: number
  height: number
  color: string
  opacity: number
}

export interface TextAnnotation {
  id: ID
  type: 'text'
  x: number
  y: number
  text: string
  color: string
  fontSize: number
}

export type Annotation =
  | ArrowAnnotation
  | LineAnnotation
  | ZoneAnnotation
  | TextAnnotation

// ─── Play / Frame ─────────────────────────────────────────────────────────────

/** Full snapshot of a single animation frame */
export interface PlayFrame {
  id: ID
  players: PlayerModel[]
  ball: BallModel | null
  annotations: Annotation[]
}

// ─── Play (a saved tactical play) ─────────────────────────────────────────────

export interface Play {
  id: ID
  name: string
  description: string
  createdAt: number // epoch ms
  updatedAt: number
  /** For Phase 1 there is always exactly one frame */
  frames: PlayFrame[]
  tags: string[]
}

// ─── Ball ─────────────────────────────────────────────────────────────────────

export interface BallModel {
  /** Normalized x position [0..1] */
  x: number
  /** Normalized y position [0..1] */
  y: number
}

// ─── Active Board State ────────────────────────────────────────────────────────

export interface BoardState {
  /** Players currently on the board */
  players: PlayerModel[]
  /** Ball on the board, or null if not placed */
  ball: BallModel | null
  /** Annotations drawn on the board */
  annotations: Annotation[]
  /** Which drawing tool is selected */
  activeTool: DrawingToolType
  /** Currently selected annotation/player id */
  selectedId: ID | null
  /** Pending points for multi-point drawing (arrow/line) */
  drawingPoints: Point[]
}

// ─── Library ──────────────────────────────────────────────────────────────────

export interface LibraryState {
  plays: Play[]
}
