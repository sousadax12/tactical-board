import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Play, ID } from '../domain/play/models'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LibraryStoreState {
  plays: Play[]

  // Actions
  savePlay: (play: Play) => void
  deletePlay: (id: ID) => void
  getPlay: (id: ID) => Play | undefined
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLibraryStore = create<LibraryStoreState>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      plays: [],

      // ── Actions ──────────────────────────────────────────────────────────

      savePlay(play) {
        set((state) => {
          const index = state.plays.findIndex((p) => p.id === play.id)
          if (index !== -1) {
            const updated = [...state.plays]
            updated[index] = play
            return { plays: updated }
          }
          return { plays: [...state.plays, play] }
        })
      },

      deletePlay(id) {
        set((state) => ({
          plays: state.plays.filter((p) => p.id !== id),
        }))
      },

      getPlay(id) {
        return get().plays.find((p) => p.id === id)
      },
    }),
    {
      name: 'handball-library',
    },
  ),
)
