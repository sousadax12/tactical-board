# ADR-005: Undo/Redo via Custom History Stack over External Library

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

The board editor requires undo/redo for all board mutations (player moves, drawing additions/removals, player additions/removals). Two approaches were evaluated:

- **Custom history hook** (`useUndoRedo.ts`) wrapping `boardSlice`
- **External library** (`zundo`, `redux-undo`, or `immer-history`)

---

## Decision

Implement a **custom `useUndoRedo.ts` hook** with a 50-snapshot history stack.

---

## Rationale

### Scope is limited to `boardSlice`

Undo/redo applies only to the active board state (`players`, `ball`, `drawings`). It does NOT apply to:
- `courtSlice` (view toggles are not undoable)
- `animationSlice` (frame operations have their own delete/reorder UI)
- `librarySlice` (library mutations are intentional saves)

A library like `zundo` wraps the entire store, requiring explicit exclusion configuration to avoid recording irrelevant state changes.

### Snapshot size is small

Each `boardSlice` snapshot is ~4–8KB (14 players + ball + ~10 drawings). A 50-snapshot stack = ~200–400KB in memory. This is negligible.

### Implementation is straightforward

```typescript
// src/hooks/useUndoRedo.ts
const MAX_HISTORY = 50;

export function useUndoRedo() {
  const past = useRef<BoardState[]>([]);
  const future = useRef<BoardState[]>([]);

  const push = (snapshot: BoardState) => {
    past.current = [...past.current.slice(-MAX_HISTORY + 1), snapshot];
    future.current = [];  // branching clears future
  };

  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [useStore.getState().boardSnapshot(), ...future.current];
    useStore.getState().loadSnapshot(prev);
  };

  const redo = () => {
    const next = future.current.shift();
    if (!next) return;
    past.current = [...past.current, useStore.getState().boardSnapshot()];
    useStore.getState().loadSnapshot(next);
  };

  return { push, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
```

This is ~40 lines and fully covers the requirement. An external library would add dependency overhead with no additional capability for this use case.

### Triggering snapshots

`boardSlice` actions that mutate state call `push()` before applying the mutation. This is done via a Zustand middleware pattern — a thin wrapper that intercepts write actions:

```typescript
// Only these actions are recorded in history:
// addPlayer, removePlayer, movePlayer, moveBall,
// addDrawing, removeDrawing, clearBoard
```

---

## Keyboard Integration

`useKeyboardShortcuts.ts` listens for:
- `Ctrl+Z` / `Cmd+Z` → `undo()`
- `Ctrl+Y` / `Cmd+Shift+Z` → `redo()`

---

## Consequences

**Positive:**
- Zero additional dependencies
- History scope is explicit and correct (boardSlice only)
- Full control over which actions are recordable
- Can be extended with action labels for a visible history panel

**Negative:**
- Must manually annotate which actions push to history — easy to miss a new action
- No time-travel debugging integration (not a requirement for this app)
