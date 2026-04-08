/**
 * Handball court geometry — all values in normalized coordinates [0..1]
 * Standard handball court: 40m × 20m
 * Origin: top-left
 */

export interface CourtRect {
  x: number
  y: number
  w: number
  h: number
}

export interface CourtCircle {
  cx: number
  cy: number
  r: number
}

export interface CourtArc {
  cx: number
  cy: number
  r: number
  startAngle: number
  endAngle: number
  /** true = clockwise */
  clockwise: boolean
}

export interface HandballCourtGeometry {
  /** Outer boundary */
  outline: CourtRect
  /** Center line x */
  centerLineX: number
  /** Center circle */
  centerCircle: CourtCircle
  /** Center spot */
  centerSpot: CourtCircle
  /** Left 6m goal area (D-line) */
  leftGoalArea: CourtArc
  /** Right 6m goal area (D-line) */
  rightGoalArea: CourtArc
  /** Left 9m free-throw arc */
  leftFreeThrow: CourtArc
  /** Right 9m free-throw arc */
  rightFreeThrow: CourtArc
  /** Left goalkeeper area */
  leftGoal: CourtRect
  /** Right goalkeeper area */
  rightGoal: CourtRect
  /** Left penalty spot */
  leftPenaltySpot: CourtCircle
  /** Right penalty spot */
  rightPenaltySpot: CourtCircle
  /** Left 7m line */
  leftSevenMLine: { x: number; y1: number; y2: number }
  /** Right 7m line */
  rightSevenMLine: { x: number; y1: number; y2: number }
}

/**
 * Real dimensions (metres):
 *   Court: 40 × 20
 *   Goal: 3m wide × 2m high, centred on each end line
 *   Goal area (6m line): semicircle r=6m from each goal post centre
 *   Free throw (9m line): dashed arc r=9m
 *   Penalty spot: 7m from goal line, centred
 *   Centre circle: r=3m
 */
const W = 40 // metres
const H = 20

function nx(m: number) {
  return m / W
}
function ny(m: number) {
  return m / H
}

// Goal is 3m wide, centred on end line
const GOAL_W = 3
const GOAL_HALF = GOAL_W / 2
const GOAL_DEPTH = 1 // visual depth behind end line (not real)

// Goal centre in metres from top edge
const GOAL_CY = H / 2 // 10m from top

export const COURT_GEOMETRY: HandballCourtGeometry = {
  outline: { x: 0, y: 0, w: 1, h: 1 },

  centerLineX: nx(20),

  centerCircle: {
    cx: nx(20),
    cy: ny(10),
    r: nx(3),
  },

  centerSpot: {
    cx: nx(20),
    cy: ny(10),
    r: nx(0.15),
  },

  // 6m goal area arc — radius 6m from goal-post centres
  leftGoalArea: {
    cx: nx(0),
    cy: ny(GOAL_CY),
    r: nx(6),
    startAngle: -90,
    endAngle: 90,
    clockwise: true,
  },

  rightGoalArea: {
    cx: nx(W),
    cy: ny(GOAL_CY),
    r: nx(6),
    startAngle: 90,
    endAngle: 270,
    clockwise: true,
  },

  // 9m free-throw dashed arc
  leftFreeThrow: {
    cx: nx(0),
    cy: ny(GOAL_CY),
    r: nx(9),
    startAngle: -90,
    endAngle: 90,
    clockwise: true,
  },

  rightFreeThrow: {
    cx: nx(W),
    cy: ny(GOAL_CY),
    r: nx(9),
    startAngle: 90,
    endAngle: 270,
    clockwise: true,
  },

  leftGoal: {
    x: nx(-GOAL_DEPTH),
    y: ny(GOAL_CY - GOAL_HALF),
    w: nx(GOAL_DEPTH),
    h: ny(GOAL_W),
  },

  rightGoal: {
    x: nx(W),
    y: ny(GOAL_CY - GOAL_HALF),
    w: nx(GOAL_DEPTH),
    h: ny(GOAL_W),
  },

  leftPenaltySpot: {
    cx: nx(7),
    cy: ny(GOAL_CY),
    r: nx(0.15),
  },

  rightPenaltySpot: {
    cx: nx(W - 7),
    cy: ny(GOAL_CY),
    r: nx(0.15),
  },

  // 7m line — short line 1m wide centred on y
  leftSevenMLine: {
    x: nx(7),
    y1: ny(GOAL_CY - 0.5),
    y2: ny(GOAL_CY + 0.5),
  },

  rightSevenMLine: {
    x: nx(W - 7),
    y1: ny(GOAL_CY - 0.5),
    y2: ny(GOAL_CY + 0.5),
  },
}
