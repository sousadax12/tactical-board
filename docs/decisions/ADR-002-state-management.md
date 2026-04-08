# ADR-002: State Management — Zustand over Redux Toolkit

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

The application requires state management for:
- The active board (players, ball, drawings, selection)
- Court configuration (view mode, grid, zones)
- Animation timeline (frames, playback state)
- Formation library (saved plays, persistence)

The two primary candidates were **Zustand 4** and **Redux Toolkit (RTK)**.

---

## Decision

Use **Zustand 4.x** with the `immer` and `subscribeWithSelector` middleware.

---

## Rationale

### Shape of the data

The board state is a single structured object, not a large normalized entity graph. RTK's `createEntityAdapter` and normalization utilities are designed for relational data (e.g., a Twitter feed with users, tweets, and likes sharing IDs). The tactical board has:
- 14 players (array, not normalized)
- 1 ball
- N drawing elements (array)
- N frames (array of snapshots)

No cross-slice normalization is needed. RTK's normalized patterns would add boilerplate without benefit.

### Canvas subscription performance

A key requirement is that the Konva canvas only re-renders when relevant state changes. Zustand's `subscribeWithSelector` middleware allows:

```typescript
// Only PlayerLayer re-renders when players[] changes
useStore.subscribe(
  state => state.players,
  players => updatePlayerLayer(players),
  { equalityFn: shallow }
);
```

RTK requires `createSelector` + `useSelector` in each component. Both approaches work, but Zustand's subscription model integrates more cleanly with Konva's imperative node updates during animation playback.

### Boilerplate comparison

For a `movePlayer` action:

**RTK:**
```typescript
// slice definition
const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    movePlayer: (state, action: PayloadAction<{id: string, x: number, y: number}>) => {
      const player = state.players.find(p => p.id === action.payload.id);
      if (player) { player.x = action.payload.x; player.y = action.payload.y; }
    }
  }
});
export const { movePlayer } = boardSlice.actions;
// dispatch(movePlayer({ id, x, y })) at call site
```

**Zustand:**
```typescript
// inside create()
movePlayer: (id, x, y) =>
  set(produce(state => {
    const player = state.players.find(p => p.id === id);
    if (player) { player.x = x; player.y = y; }
  }))
// useStore.getState().movePlayer(id, x, y) at call site
```

Zustand is materially less verbose for this use case.

### Persistence

`librarySlice` needs to persist to `localStorage`. Zustand has a first-class `persist` middleware that wraps any slice with zero configuration. RTK requires `redux-persist` as an additional dependency with a more complex setup (persistReducer, persistStore, PersistGate).

---

## Middleware Stack

```
create()(
  persist(           ← librarySlice only
    subscribeWithSelector(
      immer(
        stateCreator
      )
    )
  )
)
```

- **immer** — allows mutating draft state in actions (no manual spread operators for nested updates)
- **subscribeWithSelector** — efficient per-slice subscriptions for canvas updates
- **persist** — localStorage persistence for `librarySlice`

---

## Consequences

**Positive:**
- ~30% less boilerplate than equivalent RTK code
- `subscribeWithSelector` is ideal for driving Konva layer updates
- `persist` middleware requires no extra dependencies
- Zustand stores are plain objects — easy to serialize for share links and export

**Negative:**
- No Redux DevTools integration by default (Zustand has a devtools middleware, but it's less mature than RTK's)
- No built-in action history — requires custom `useUndoRedo` hook (see ADR-005)
- Smaller ecosystem than Redux — fewer third-party integrations
