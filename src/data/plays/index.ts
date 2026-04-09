import { nanoid } from 'nanoid'
import type { Play, PlayFrame } from '../../domain/play/models'

// Normalize frames that used the legacy "ball: {x,y}" field instead of "balls: BallModel[]".
// boardSlice.loadFrame has the same migration for interactive frames; this covers templates.
function normalizeLegacyFrame(frame: PlayFrame): PlayFrame {
  if (frame.balls) return frame
  const oldBall = (frame as unknown as { ball?: { x: number; y: number } }).ball
  return {
    ...frame,
    balls: oldBall ? [{ id: nanoid(), x: oldBall.x, y: oldBall.y, color: '#b0b0b0' }] : [],
  }
}

// Vite auto-discovers all JSON files in this folder at build time.
// To add a new predefined template, drop a .json file here that matches the Play interface.
const modules = import.meta.glob<{ default: Play }>('./*.json', { eager: true })
export const predefinedPlays: Play[] = Object.values(modules).map((m) => ({
  ...m.default,
  frames: m.default.frames.map(normalizeLegacyFrame),
}))
