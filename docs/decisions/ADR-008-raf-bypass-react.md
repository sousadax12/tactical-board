# ADR-008: Bypass React Renders During Animation Playback via Direct Konva Node Mutation

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

During animation playback, player and ball positions must be interpolated and rendered at 60fps. Two approaches were evaluated:

- **React-driven** — update Zustand state on every RAF tick → React re-renders `PlayerLayer` → Konva repaints
- **Direct Konva mutation** — write interpolated positions directly to Konva node objects → call `layer.batchDraw()`

---

## Decision

During animation playback, **write positions directly to Konva nodes** and call `playerLayer.batchDraw()`. React and Zustand are bypassed for the duration of playback. The store is updated once when playback stops.

---

## Rationale

### React reconciliation adds ~2–4ms per frame

React's reconciliation cycle — diffing the virtual DOM, scheduling updates, flushing to the actual DOM — takes 2–4ms in a typical React 18 app. At 60fps, each frame has a budget of 16.6ms. Spending 2–4ms on React overhead for every frame leaves only 12–14ms for:
- RAF callback execution
- Interpolation math
- Konva canvas repaint

On lower-end devices (tablets, older laptops), this budget is tight. React overhead would cause visible frame drops.

### Konva nodes are mutable objects

Konva nodes (`Circle`, `Line`, etc.) are plain JavaScript objects with getter/setter methods. Mutating them is immediate and does not trigger any React lifecycle:

```typescript
// usePlayback.ts — inside the RAF loop
playerKonvaNodes[player.id].x(interpolatedX);
playerKonvaNodes[player.id].y(interpolatedY);
// After updating all nodes:
playerLayer.batchDraw();
```

`batchDraw()` queues a single repaint of the layer's canvas element on the next browser paint cycle — no React involvement.

### State consistency is maintained

The Zustand store is not updated during playback. This is intentional:
- The store represents the **canonical authored state** (the frames as the coach saved them)
- Interpolated positions during playback are **ephemeral display state** — they don't need to be persisted

When playback stops:
- If stopped at frame N, the store is restored to frame N's snapshot
- If paused mid-interpolation, the store is updated to the nearest frame boundary

### Node ref acquisition

`PlayerLayer.tsx` maintains a `Map<playerId, Konva.Circle>` ref updated via Konva's `ref` callback:

```typescript
const nodeRefs = useRef<Map<string, Konva.Circle>>(new Map());

// In PlayerToken:
<Circle ref={node => { if (node) nodeRefs.current.set(player.id, node); }} ... />
```

`usePlayback.ts` receives this ref and uses it during the RAF loop.

---

## Scope of the bypass

The React bypass applies **only to `PlayerLayer` during active playback**. `CourtLayer` and `DrawingLayer` are unaffected — they continue to be React-driven. If drawings need to animate in a future phase (e.g., arrow paths that appear progressively), the same direct-mutation pattern applies.

---

## Consequences

**Positive:**
- Smooth 60fps interpolation on mid-range devices
- No React overhead during time-critical RAF loop
- `batchDraw()` efficiently repaints only the player canvas element

**Negative:**
- Two sources of position truth during playback (Konva nodes vs Zustand store) — requires discipline to restore store on stop/pause
- Konva node refs must be maintained in sync with `players[]` — refs are added on mount, removed on unmount, requiring careful cleanup
- More complex code than the purely React-driven approach; requires clear comments explaining why the bypass exists
