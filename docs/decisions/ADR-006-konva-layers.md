# ADR-006: Three Independent Konva Layers for Render Isolation

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

The tactical board canvas has three categories of content with very different update frequencies:

- **Court geometry** — static; never changes during a session
- **Drawing elements** — changes when coach adds/removes arrows, zones, free draws
- **Players and ball** — changes on every drag event and every animation frame

All content could be placed in a single Konva `Layer`, or split across multiple layers.

---

## Decision

Use **three independent Konva Layers**:

1. `CourtLayer` — court lines, arcs, goal areas (static)
2. `DrawingLayer` — arrows, zones, free-draw paths
3. `PlayerLayer` — player tokens, ball

---

## Rationale

### Konva layers are independent `<canvas>` elements

Each Konva `Layer` is backed by its own HTML `<canvas>` element in the DOM. When a layer is invalidated (`.batchDraw()` called), only that canvas is repainted — other layers are not touched.

With a single layer, every player drag event would repaint the entire canvas including the court geometry. Court geometry involves complex arc calculations (6m line, 9m line). Repainting it on every drag frame wastes CPU and can cause jank.

### Update frequency analysis

| Layer | Triggered by | Frequency |
|---|---|---|
| `CourtLayer` | Initial mount only | Once |
| `DrawingLayer` | Tool commits, undo/redo | Rare (user action) |
| `PlayerLayer` | Drag events, animation RAF | High (every frame) |

Separating `PlayerLayer` means the 60fps animation loop calls `playerLayer.batchDraw()` without touching `CourtLayer` or `DrawingLayer`. This is critical for smooth playback.

### React + Zustand subscription alignment

With `subscribeWithSelector`, each layer subscribes to only its relevant slice:

```typescript
// CourtLayer — no subscription needed, renders once
// DrawingLayer — subscribes to boardSlice.drawings
// PlayerLayer — subscribes to boardSlice.players + boardSlice.ball
```

During animation playback, the RAF loop writes directly to `PlayerLayer` Konva nodes and calls `playerLayer.batchDraw()` — bypassing React and Zustand entirely for that layer. `DrawingLayer` and `CourtLayer` are not affected.

### Z-ordering

The visual stacking order (bottom to top):
1. `CourtLayer` — always behind everything
2. `DrawingLayer` — arrows/zones appear over the court but under players
3. `PlayerLayer` — players are always on top for visibility

This is the natural Konva layer order (first declared = bottom).

---

## Consequences

**Positive:**
- Court geometry is painted exactly once — no wasted repaints
- Animation runs at 60fps without court/drawing repaints
- `subscribeWithSelector` subscriptions align cleanly with layer boundaries
- Z-ordering is explicit and correct

**Negative:**
- Three canvas elements in the DOM vs one (minimal memory overhead)
- Drawing elements that appear "under" a zone must be placed in `DrawingLayer` below zones — requires z-index management within `DrawingLayer` if elements need to be reordered
