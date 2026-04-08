# Phase 1 - MVP: Static Tactical Board

## Goal

A fully functional static board where coaches can place players, draw tactical elements, and save/load named formations — no animation yet.

## Deliverable

> Coach opens the app, places 7v7 players on the court, draws arrows and zone highlights, saves a named formation, and reloads it in a later session.

---

## Features

### 1. Court Renderer

Displays a scalable handball court with accurate proportions (40m x 20m full court, 20m x 20m half court).

**Visual elements:**
- Outer boundary lines
- Center line and center circle
- 6m goal area arc (both ends)
- 9m free-throw line arc (both ends)
- 7m penalty mark
- Goal dimensions

**Controls:**
- Toggle between full court, half court (attack side), half court (defense side)
- Toggle grid lines on/off
- Toggle zone marker labels on/off

**Key files:**
- `src/features/court/courtGeometry.ts` — pure functions returning line/arc definitions per `CourtView`
- `src/features/court/CourtLayer.tsx` — Konva `Layer` rendering court geometry
- `src/features/court/CourtRenderer.tsx` — maps `CourtView` to geometry and aspect ratio
- `src/hooks/useCourtScale.ts` — responsive scaling, HiDPI support, coordinate conversion

---

### 2. Player System

Drag players from a palette onto the court. Move, label, and remove them.

**Players:**
- Attack: A1–A7 (red by default)
- Defense: D1–D7 (blue by default)
- Goalkeeper: GK (distinct visual — different shape or border)
- Ball: independent draggable token

**Interactions:**
- Drag from palette → drops onto court at cursor position
- Drag existing player → updates normalized position in store
- Click to select (shows selection ring)
- Delete key removes selected player(s)
- Double-click label to rename (optional, Phase 1 stretch)

**Key files:**
- `src/features/players/PlayerToken.tsx` — Konva `Circle` + `Text`, draggable
- `src/features/players/PlayerLayer.tsx` — Konva `Layer` containing all tokens
- `src/features/players/BallToken.tsx` — ball draggable token
- `src/ui/Toolbar.tsx` — player palette (drag source)
- `src/store/boardSlice.ts` — `addPlayer`, `movePlayer`, `removePlayer`, `moveBall`

---

### 3. Drawing Tools

Five tools selectable from the toolbar:

| Tool | Behavior |
|---|---|
| **Select** | Click to select elements, drag to move |
| **Arrow** | Click + drag draws directed arrow; release commits it |
| **Zone** | Click + drag draws filled rectangle with color |
| **Free Draw** | Mouse down/move/up traces a freehand line |
| **Eraser** | Click a drawing element to delete it |

**Arrow options:** solid / dashed / dotted line style, bidirectional toggle, color picker.

**Zone options:** fill color with opacity slider, optional text label.

**In-progress ghost:** while drawing, a semi-transparent preview renders on `DrawingCanvas`. On mouse-up it is committed to `boardSlice.drawings[]`.

**Key files:**
- `src/features/drawing/DrawingLayer.tsx` — renders committed `DrawingElement[]`
- `src/features/drawing/DrawingCanvas.tsx` — captures pointer events, renders in-progress ghost
- `src/features/drawing/useDrawingTool.ts` — hook managing active tool + in-progress state
- `src/features/drawing/ArrowElement.tsx` — Konva `Arrow` with arrowhead + style
- `src/features/drawing/ZoneElement.tsx` — Konva `Rect` with fill + optional label
- `src/features/drawing/FreeDrawElement.tsx` — Konva `Line` in bezier tension mode
- `src/store/boardSlice.ts` — `addDrawing`, `removeDrawing`, `updateDrawing`

---

### 4. Undo / Redo

Every board mutation is reversible with Ctrl+Z / Ctrl+Y (or Cmd on Mac).

**Implementation:** `useUndoRedo.ts` wraps `boardSlice` with a history stack (max 50 snapshots). On each action that mutates `players`, `ball`, or `drawings`, the previous state is pushed onto the stack. Undo pops and restores; redo walks forward.

**Keyboard shortcuts** (managed by `useKeyboardShortcuts.ts`):
- `Ctrl+Z` → undo
- `Ctrl+Y` / `Ctrl+Shift+Z` → redo
- `Delete` / `Backspace` → remove selected elements
- `Escape` → deselect / cancel in-progress draw

**Key files:**
- `src/hooks/useUndoRedo.ts`
- `src/hooks/useKeyboardShortcuts.ts`

---

### 5. Formation Library

Save and reload named tactical formations.

**Operations:**
- **Save** — opens `SavePlayDialog` (name + optional tags), calls `librarySlice.savePlay()`, persists to `localStorage`
- **Load** — click play in `LibraryPanel` sidebar → loads players/ball/drawings into `boardSlice`
- **Duplicate** — copy a play under a new name
- **Delete** — with confirmation dialog
- **Auto-save** — `usePersistence.ts` debounces writes to `localStorage` every 2 seconds

**Key files:**
- `src/features/library/LibraryPanel.tsx` — sidebar list
- `src/features/library/PlayCard.tsx` — thumbnail + name + action buttons
- `src/features/library/SavePlayDialog.tsx` — name/tags modal
- `src/store/librarySlice.ts` — CRUD actions, `persist` middleware
- `src/hooks/usePersistence.ts` — debounced auto-save

---

## State Shape (Phase 1)

```typescript
// boardSlice — the active board being edited
{
  players: Player[];
  ball: Ball;
  drawings: DrawingElement[];
  selectedIds: string[];
  activeTool: DrawingToolType;
}

// librarySlice — persisted to localStorage
{
  plays: Play[];
  activePlayId: string | null;
}

// courtSlice
{
  config: CourtConfig; // view, showGridLines, showZoneMarkers
}
```

---

## File Structure

```
src/
├── domain/
│   ├── court/models.ts
│   ├── player/models.ts
│   ├── drawing/models.ts
│   └── play/models.ts
├── store/
│   ├── index.ts
│   ├── courtSlice.ts
│   ├── boardSlice.ts
│   └── librarySlice.ts
├── features/
│   ├── court/
│   │   ├── CourtCanvas.tsx
│   │   ├── CourtLayer.tsx
│   │   ├── CourtRenderer.tsx
│   │   └── courtGeometry.ts
│   ├── players/
│   │   ├── PlayerLayer.tsx
│   │   ├── PlayerToken.tsx
│   │   └── BallToken.tsx
│   ├── drawing/
│   │   ├── DrawingLayer.tsx
│   │   ├── DrawingCanvas.tsx
│   │   ├── useDrawingTool.ts
│   │   ├── ArrowElement.tsx
│   │   ├── ZoneElement.tsx
│   │   └── FreeDrawElement.tsx
│   └── library/
│       ├── LibraryPanel.tsx
│       ├── PlayCard.tsx
│       └── SavePlayDialog.tsx
├── hooks/
│   ├── useUndoRedo.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useCourtScale.ts
│   └── usePersistence.ts
├── ui/
│   ├── TopBar.tsx
│   ├── Toolbar.tsx
│   ├── Modal.tsx
│   └── theme.ts
└── utils/
    ├── coords.ts
    ├── idGenerator.ts
    └── colorUtils.ts
```

---

## Build Steps (Ordered)

1. **Scaffold** — Vite + React TS, install dependencies, configure ESLint/Prettier
2. **Domain models** — write all TypeScript interfaces in `src/domain/`
3. **Zustand store** — implement `courtSlice`, `boardSlice`, `librarySlice`
4. **Court renderer** — `courtGeometry.ts` + `CourtLayer.tsx` + `useCourtScale.ts`
5. **Player system** — `PlayerToken`, `PlayerLayer`, `BallToken`, palette in `Toolbar`
6. **Drawing tools** — `DrawingCanvas` + all element components + `useDrawingTool`
7. **Undo/redo + keyboard shortcuts** — `useUndoRedo`, `useKeyboardShortcuts`
8. **Library** — `librarySlice`, `LibraryPanel`, `SavePlayDialog`, `usePersistence`
9. **Integration + polish** — wire all features, test full coach workflow

---

## Dependencies

```bash
npm create vite@latest . -- --template react-ts
npm install konva@^9.3.6 react-konva@^18.2.10 zustand@^4.5.2 immer@^10.1.1 react-router-dom@^6.23.0 nanoid@^5.0.7
npm install -D vitest@^1.6.0 @testing-library/react@^15.0.7 @testing-library/user-event@^14.5.2
```

## Acceptance Criteria

- [ ] Court renders full and half views with correct handball geometry
- [ ] 7 attack + 7 defense + GK + ball tokens are draggable on the court
- [ ] Arrow, zone, and free-draw tools create and commit drawing elements
- [ ] Ctrl+Z / Ctrl+Y undo and redo all mutations
- [ ] Formations can be named, saved, loaded, and deleted
- [ ] Board auto-saves to localStorage every 2 seconds
- [ ] All coordinates are normalized (0..1) — board loads correctly after window resize
