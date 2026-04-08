import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PlayFrame } from '../domain/play/models'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnimationStoreState {
  frames: PlayFrame[]
  currentFrameIndex: number
  isPlaying: boolean
  fps: number
  loop: boolean

  // Actions
  addFrame: (frame: PlayFrame) => void
  insertFrame: (index: number, frame: PlayFrame) => void
  deleteFrame: (index: number) => void
  updateFrame: (index: number, frame: PlayFrame) => void
  setCurrentFrameIndex: (index: number) => void
  setIsPlaying: (playing: boolean) => void
  setFps: (fps: number) => void
  setLoop: (loop: boolean) => void
  clearFrames: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAnimationStore = create<AnimationStoreState>()(
  immer((set) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    frames: [],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: 2,
    loop: true,

    // ── Frame actions ────────────────────────────────────────────────────────

    addFrame(frame) {
      set((draft) => {
        draft.frames.push(frame)
      })
    },

    insertFrame(index, frame) {
      set((draft) => {
        draft.frames.splice(index, 0, frame)
      })
    },

    deleteFrame(index) {
      set((draft) => {
        draft.frames.splice(index, 1)
        if (draft.frames.length === 0) {
          draft.currentFrameIndex = 0
        } else {
          draft.currentFrameIndex = Math.min(
            draft.currentFrameIndex,
            draft.frames.length - 1,
          )
        }
      })
    },

    updateFrame(index, frame) {
      set((draft) => {
        draft.frames[index] = frame
      })
    },

    // ── Playback actions ─────────────────────────────────────────────────────

    setCurrentFrameIndex(index) {
      set((draft) => {
        draft.currentFrameIndex = index
      })
    },

    setIsPlaying(playing) {
      set((draft) => {
        draft.isPlaying = playing
      })
    },

    setFps(fps) {
      set((draft) => {
        draft.fps = fps
      })
    },

    setLoop(loop) {
      set((draft) => {
        draft.loop = loop
      })
    },

    // ── Reset ────────────────────────────────────────────────────────────────

    clearFrames() {
      set((draft) => {
        draft.frames = []
        draft.currentFrameIndex = 0
        draft.isPlaying = false
      })
    },
  })),
)
