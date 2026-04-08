# ADR-011: Pure Function Court Geometry over Static SVG

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

The handball court must be rendered with accurate proportions (IHF regulations). Two approaches were evaluated:

- **Static SVG** — embed an SVG file of the court, scale it to fit the canvas
- **Pure function geometry** — `courtGeometry.ts` computes court line/arc definitions as normalized coordinate arrays, rendered by Konva

---

## Decision

Implement the court as **pure function geometry** in `courtGeometry.ts` that returns arrays of line and arc definitions in normalized coordinates (0..1). Render via Konva `Line` and `Arc` nodes in `CourtLayer.tsx`.

---

## Rationale

### Court view switching

The app supports three views: full court, half court (attack side), half court (defense side). A static SVG would require three separate SVG files, or complex clipping/transform logic on a single SVG.

The pure function approach accepts a `CourtView` parameter and returns the correct lines:

```typescript
// src/features/court/courtGeometry.ts
export function getCourtLines(view: CourtView): CourtLine[] {
  const lines: CourtLine[] = [...commonLines];
  if (view === 'full') lines.push(...fullCourtLines);
  if (view === 'half-attack') lines.push(...attackHalfLines);
  if (view === 'half-defense') lines.push(...defenseHalfLines);
  return lines;
}
```

### Normalized coordinate alignment

The geometry functions return coordinates in the same normalized (0..1) system used throughout the app (see ADR-003). SVG coordinates would require a separate scaling/transform layer to convert to normalized space.

### Testability

Pure functions are trivially testable:

```typescript
// Example test
it('full court has center line at x=0.5', () => {
  const lines = getCourtLines('full');
  const centerLine = lines.find(l => l.id === 'center-line');
  expect(centerLine.points[0]).toBe(0.5); // x1 = 0.5 (normalized)
});
```

SVG geometry embedded in a file cannot be unit-tested without a DOM environment.

### IHF court dimensions (normalized)

Full court: 40m × 20m

```
Outer boundary:      x: 0..1,  y: 0..1
Center line:         x: 0.5,   y: 0..1
Goal area (6m arc):  center at x: 0 or 1,  y: 0.5; radius: 6/40 = 0.15 (x-axis), 6/20 = 0.30 (y-axis)
Free throw (9m arc): center at x: 0 or 1,  y: 0.5; radius: 9/40 = 0.225 (x-axis), 9/20 = 0.45 (y-axis)
Penalty mark:        x: 7/40 = 0.175 from each goal line,  y: 0.5
Goal:                width: 3m → 3/20 = 0.15 of height; depth: 1m → 1/40 = 0.025
```

Note: handball court arcs are true circles in meter space but become ellipses in pixel space if the canvas aspect ratio differs from 2:1. `useCourtScale` applies `scaleX`/`scaleY` separately to maintain the correct ellipse appearance.

### Dynamic feature toggles

The pure function can accept options for optional visual elements:

```typescript
export function getCourtLines(view: CourtView, options: {
  showZoneMarkers: boolean;
  showGridLines: boolean;
}): CourtLine[]
```

SVG would require CSS class toggles or `display:none` manipulations.

---

## Consequences

**Positive:**
- Single source of geometric truth — no SVG file to maintain
- View switching is instant (different function call, same Konva layer)
- Fully testable with unit tests
- Normalized coordinate output aligns with the rest of the codebase
- Feature toggles are first-class parameters

**Negative:**
- Court arcs must be approximated as cubic Bezier curves in Konva (Konva's `Arc` is a sector, not a standalone arc). The 6m and 9m semicircular arcs require `arcTo` approximation or manual control points — more complex than referencing an SVG `path d` attribute
- Initial development time is higher than importing a pre-made SVG
