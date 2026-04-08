# ADR-003: Normalized Coordinates (0..1) for All Positional Data

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

Player positions, ball position, arrow endpoints, zone bounds, and free-draw paths must be stored somewhere in the data model. Two approaches were considered:

- **Pixel coordinates** — store the raw `x, y` in canvas pixels
- **Normalized coordinates** — store `x, y` as fractions of court dimensions (0..1)

---

## Decision

All positional data is stored in **normalized coordinates (0..1)** throughout the domain models. Conversion to pixel coordinates happens exclusively in `useCourtScale.ts` at render time.

---

## Rationale

### Resolution independence

A play saved on a 1400px-wide desktop monitor must render identically on a 600px-wide tablet. With pixel coordinates, saved plays would either render at the wrong scale or require a migration pass every time the canvas size changes.

With normalized coordinates, the same `player.x = 0.35` renders at `0.35 × 1400 = 490px` on desktop and `0.35 × 600 = 210px` on tablet — always in the correct relative position.

### Share link compatibility

Share links encode the `Play` object as base64 JSON (see ADR-009). If coordinates were in pixels, a link generated at 1400px wide would look wrong to the recipient on a 600px screen. Normalized coordinates make share links resolution-independent by construction.

### Half-court / full-court switching

When toggling between full court (800×480) and half court (480×480), the court dimensions change. With pixel coordinates, all player positions would need to be re-mapped on every view toggle. With normalized coordinates, no remapping is needed — the same `x, y` values display at the geometrically correct position in either view.

### Aspect ratio handling

A full handball court is 40m×20m (2:1 ratio). Half court is 20m×20m (1:1 ratio). The canvas must letterbox or pillarbox to maintain the correct aspect ratio within its container. The `useCourtScale` hook computes `stageWidth`, `stageHeight`, and letterbox offsets. All other code is insulated from this complexity.

---

## Implementation

```typescript
// src/hooks/useCourtScale.ts
export function useCourtScale(containerRef: RefObject<HTMLDivElement>, view: CourtView) {
  const ASPECT = view === 'full' ? 40 / 20 : 1;     // width / height
  // ... measure container, compute stageWidth/stageHeight with letterboxing
  return {
    stageWidth, stageHeight, offsetX, offsetY,
    toStage:      (nx: number, ny: number) => ({ x: nx * stageWidth, y: ny * stageHeight }),
    toNormalized: (px: number, py: number) => ({ x: px / stageWidth, y: py / stageHeight }),
  };
}
```

Every drag event converts from Konva pixel coordinates to normalized before writing to the store:

```typescript
// PlayerToken.tsx — drag end handler
const { toNormalized } = useCourtScale(containerRef, courtView);
onDragEnd={e => {
  const { x, y } = toNormalized(e.target.x(), e.target.y());
  movePlayer(player.id, x, y);
}}
```

Every render converts from normalized to pixels before setting Konva node positions:

```typescript
// PlayerToken.tsx — render
const { toStage } = useCourtScale(containerRef, courtView);
const { x, y } = toStage(player.x, player.y);
return <Circle x={x} y={y} ... />;
```

---

## Consequences

**Positive:**
- Plays are fully portable across screen sizes, court view modes, and devices
- Share links are resolution-independent
- `useCourtScale` is the single, testable location for all coordinate math
- Court view switching requires no data migration

**Negative:**
- All canvas event handlers must call `toNormalized()` before store writes — easy to forget
- Debugging requires mental conversion: seeing `x=0.35` is less intuitive than `x=490px`
- Mitigation: `useCourtScale` is always available; convention is enforced at PR review
