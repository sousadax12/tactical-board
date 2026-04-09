import type { Play } from '../../domain/play/models'

export function validateAndParsePlay(raw: unknown): Play | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.id !== 'string') return null
  if (typeof obj.name !== 'string') return null
  if (!Array.isArray(obj.frames) || obj.frames.length === 0) return null
  for (const frame of obj.frames as unknown[]) {
    if (!frame || typeof frame !== 'object') return null
    const f = frame as Record<string, unknown>
    if (typeof f.id !== 'string') return null
    if (!Array.isArray(f.players)) return null
    if (!Array.isArray(f.annotations)) return null
    // Accept both old format (ball) and new format (balls)
    if (f.balls !== undefined && !Array.isArray(f.balls)) return null
    if (f.ball !== null && f.ball !== undefined && typeof f.ball !== 'object') return null
  }
  return raw as Play
}
