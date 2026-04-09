import type { Play } from '../../domain/play/models'

export function generateShareUrl(play: Play): string {
  const json = JSON.stringify(play)
  const encoded = btoa(unescape(encodeURIComponent(json)))
  const base = window.location.origin + import.meta.env.BASE_URL
  // Remove trailing slash if present to avoid double slash
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  return `${normalizedBase}/share#${encoded}`
}

export function decodeShareUrl(fragment: string): Play | null {
  try {
    const json = decodeURIComponent(escape(atob(fragment)))
    return JSON.parse(json) as Play
  } catch {
    return null
  }
}

export const SHARE_SIZE_LIMIT = 64 * 1024 // 64KB in bytes

export function isSharePayloadTooLarge(play: Play): boolean {
  const json = JSON.stringify(play)
  const encoded = btoa(unescape(encodeURIComponent(json)))
  return encoded.length > SHARE_SIZE_LIMIT
}
