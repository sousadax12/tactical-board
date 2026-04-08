import { useEffect, useRef, useCallback } from 'react'
import { useAnimationStore } from '../../store'
import { useBoardStore } from '../../store'
import type { PlayFrame, PlayerModel, BallModel } from '../../domain/play/models'

// ─── Lerp helpers ─────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpPlayers(
  current: PlayerModel[],
  next: PlayerModel[],
  t: number,
): PlayerModel[] {
  return current.map((player) => {
    const nextPlayer = next.find((p) => p.id === player.id)
    if (!nextPlayer) return player
    return {
      ...player,
      x: lerp(player.x, nextPlayer.x, t),
      y: lerp(player.y, nextPlayer.y, t),
    }
  })
}

function lerpBall(
  current: BallModel | null,
  next: BallModel | null,
  t: number,
): BallModel | null {
  if (!current) return null
  if (!next) return current
  return {
    x: lerp(current.x, next.x, t),
    y: lerp(current.y, next.y, t),
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlayback(): void {
  const frames = useAnimationStore((s) => s.frames)
  const currentFrameIndex = useAnimationStore((s) => s.currentFrameIndex)
  const isPlaying = useAnimationStore((s) => s.isPlaying)
  const fps = useAnimationStore((s) => s.fps)
  const loop = useAnimationStore((s) => s.loop)
  const setCurrentFrameIndex = useAnimationStore((s) => s.setCurrentFrameIndex)
  const setIsPlaying = useAnimationStore((s) => s.setIsPlaying)

  const loadFrame = useBoardStore((s) => s.loadFrame)

  // Mutable refs — avoids stale closures in the RAF callback
  const rafIdRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const accumulatorRef = useRef<number>(0)

  // Keep latest store values accessible inside the RAF without re-registering
  const framesRef = useRef<PlayFrame[]>(frames)
  const currentFrameIndexRef = useRef<number>(currentFrameIndex)
  const fpsRef = useRef<number>(fps)
  const loopRef = useRef<boolean>(loop)

  framesRef.current = frames
  currentFrameIndexRef.current = currentFrameIndex
  fpsRef.current = fps
  loopRef.current = loop

  const cancelRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    lastTimestampRef.current = null
  }, [])

  const tick = useCallback(
    (timestamp: number) => {
      const frames = framesRef.current
      const fps = fpsRef.current
      const loop = loopRef.current

      // Guard: need at least 2 frames to animate
      if (frames.length < 2) {
        setIsPlaying(false)
        return
      }

      // Compute elapsed ms
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
      }
      const elapsed = timestamp - lastTimestampRef.current
      lastTimestampRef.current = timestamp

      // Advance accumulator
      accumulatorRef.current += (elapsed * fps) / 1000

      // Advance whole-frame steps
      while (accumulatorRef.current >= 1) {
        accumulatorRef.current -= 1
        const nextIndex = currentFrameIndexRef.current + 1

        if (nextIndex >= frames.length) {
          // Reached the end
          if (loop) {
            currentFrameIndexRef.current = 0
          } else {
            // Show last frame and stop
            loadFrame(frames[frames.length - 1])
            setCurrentFrameIndex(frames.length - 1)
            setIsPlaying(false)
            return
          }
        } else {
          currentFrameIndexRef.current = nextIndex
        }

        setCurrentFrameIndex(currentFrameIndexRef.current)
      }

      // Sub-frame interpolation
      const idx = currentFrameIndexRef.current
      const nextIdx =
        idx + 1 < frames.length ? idx + 1 : loop ? 0 : idx

      const currentFrame = frames[idx]
      const nextFrame = frames[nextIdx]
      const t = accumulatorRef.current % 1

      const interpolatedFrame: PlayFrame = {
        id: currentFrame.id,
        players: lerpPlayers(currentFrame.players, nextFrame.players, t),
        ball: lerpBall(currentFrame.ball, nextFrame.ball, t),
        annotations: currentFrame.annotations,
      }

      loadFrame(interpolatedFrame)

      // Schedule next tick
      rafIdRef.current = requestAnimationFrame(tick)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadFrame, setCurrentFrameIndex, setIsPlaying],
  )

  useEffect(() => {
    if (isPlaying && frames.length >= 2) {
      accumulatorRef.current = 0
      lastTimestampRef.current = null
      rafIdRef.current = requestAnimationFrame(tick)
    } else {
      cancelRaf()
    }

    return cancelRaf
  }, [isPlaying, frames.length, tick, cancelRaf])
}
