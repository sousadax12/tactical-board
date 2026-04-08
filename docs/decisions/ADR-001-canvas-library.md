# ADR-001: Canvas Library — Konva.js over Fabric.js and Plain Canvas

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

The tactical board requires an interactive 2D canvas with:
- Multiple draggable objects (players, ball, drawing elements)
- Hit-testing (click to select)
- Layer isolation (court layer, drawing layer, player layer)
- HiDPI / Retina display support
- Smooth 60fps animation during playback
- React integration without fighting the render model

Three options were evaluated: **Konva.js**, **Fabric.js**, and **plain HTML5 Canvas API**.

---

## Decision

Use **Konva.js 9.x** via the `react-konva` binding.

---

## Rationale

### Konva.js vs Fabric.js

| Concern | Konva.js | Fabric.js |
|---|---|---|
| React integration | Native (`react-konva`) — declarative JSX nodes | Imperative — must manually sync canvas with React state |
| Layer isolation | First-class `Layer` concept with independent canvas elements | Single canvas; manual layering |
| Drag-and-drop | Built-in per-node drag with events | Built-in but bypasses React state |
| Event delegation | Yes — efficient hit-testing on the stage | Yes |
| Bundle size | ~230KB min | ~320KB min |
| TypeScript types | Good (`@types/konva` bundled) | Adequate |
| Animation | Tween API + direct node mutation for RAF | Fabric.Animation — less control |

Fabric.js requires imperative canvas manipulation that fights React's reconciliation model. Every state change must be reflected both in React state AND on the Fabric canvas, creating a dual source of truth.

### Konva.js vs Plain Canvas API

Plain canvas would give maximum control and minimum bundle size, but requires implementing from scratch: hit-testing, object model, drag-and-drop, layer management, HiDPI scaling, and event delegation. The engineering cost is disproportionate to the benefit given Konva already provides all of these.

### react-konva integration

`react-konva` maps Konva nodes to React components (`<Stage>`, `<Layer>`, `<Circle>`, `<Line>`, etc.). React manages component lifecycle; Konva manages the canvas rendering. This means:
- Player positions are driven by Zustand state → React props → Konva node attributes
- During animation playback, we bypass React and write directly to Konva nodes for 60fps performance (see ADR-008)

---

## Consequences

**Positive:**
- Declarative canvas that stays in sync with React state automatically
- Built-in drag events emit normalized coordinates — no manual hit-testing
- Independent layers mean only the affected layer re-renders on state change
- HiDPI handled automatically by Konva's `devicePixelRatio` scaling

**Negative:**
- Adds ~230KB to the bundle (mitigated by Vite tree-shaking and code splitting)
- Konva's object model adds indirection — direct canvas operations require `getNode()` refs
- Learning curve for developers unfamiliar with Konva's layer/node architecture
