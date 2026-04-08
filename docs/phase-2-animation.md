# Phase 2 - Animation System

## Goal

Record multi-frame tactical sequences and play them back with smooth position interpolation, so coaches can show movement flow over time.

## Deliverable

> Coach records a 5-frame fast-break sequence, adjusts timing per step, and plays it back in a loop to show players where to run.

## Prerequisite

Phase 1 complete and passing all acceptance criteria.

---

## Features

### 1. Frame Capture

The current board state is captured as a named snapshot (`Frame`) and appended to the animation timeline.

**Workflow:**
1. Coach positions players for step 1 of the play
2. Presses **"Capture Frame"** button
3. Current `players[]`, `ball`, `drawings[]` are snapped into a `Frame` object and pushed to `animationSlice.frames[]`
4. Coach adjusts positions for step 2, captures again
5. Repeat until sequence is complete

**Frame data model:**
```typescript
interface Frame {
  id: string;
  index: number;
  durationMs: number;    // how long to hold this frame during playback (default 800ms)
  players: Player[];     // full snapshot — not a delta
  ball: Ball;
  drawings: DrawingElement[];
  label?: string;
  thumbnailDataUrl?: string;
}
```

> **Full snapshots, not deltas.** Each frame stores a complete copy of the board state (~2–4KB). This simplifies the interpolation engine significantly and is well within localStorage limits for typical play lengths (10 frames ≈ 30KB).

**Key files:**
- `src/features/animation/FrameControls.tsx` — capture, delete, label buttons
- `src/store/animationSlice.ts` — `captureFrame()`, `deleteFrame()`, `reorderFrames()`, `updateFrameDuration()`

---

### 2. Animation Timeline

A horizontal strip below the canvas showing all captured frames as thumbnail cards.

**Interactions:**
- **Click frame card** → loads that frame's state into `boardSlice` so coach can edit and re-capture
- **Drag to reorder** → updates `frame.index` for all affected frames
- **Per-frame duration** → slider on each card (500ms – 5000ms)
- **Delete frame** → removes from `frames[]`, collapses the gap
- **Active frame highlight** → current frame is visually highlighted

**Thumbnail generation:**
Each frame thumbnail is a small off-screen Konva `Stage` (150×90px) rendered at capture time. The resulting `dataURL` is stored in `frame.thumbnailDataUrl` and displayed in the timeline card. Thumbnails are re-generated when a frame is edited.

**Key files:**
- `src/features/animation/AnimationTimeline.tsx` — frame strip container
- `src/features/animation/FrameThumbnail.tsx` — mini Konva Stage per frame
- `src/features/animation/FrameControls.tsx` — capture/delete/label actions

---

### 3. Playback Engine

Smooth interpolation between frames using `requestAnimationFrame`.

**Architecture:**

```
usePlayback.ts
├── startPlayback()   — begins RAF loop
├── stopPlayback()    — cancels RAF
└── RAF loop:
    ├── Reads current time vs frame start time
    ├── Calculates interpolation factor t = elapsed / durationMs (0..1)
    ├── Lerps player/ball positions: pos = frameN.pos + t * (frameN+1.pos - frameN.pos)
    └── Writes interpolated positions DIRECTLY to Konva nodes (bypasses React)
```

> **Why bypass React during playback?** React's reconciliation cycle adds ~2-4ms per frame. At 60fps, every millisecond counts. By writing directly to Konva node positions (`node.x(newX); node.y(newY); layer.batchDraw()`), we maintain smooth 60fps interpolation without triggering React re-renders. The store is only updated when playback stops.

**Interpolation types:**
- `linear` — constant velocity (default)
- `easeInOut` — slow start, fast middle, slow end (more natural for player movement)

**Playback modes:**
- One-shot — plays through all frames once and stops
- Loop — restarts from frame 0 after the last frame

**Key files:**
- `src/features/animation/usePlayback.ts` — RAF loop, interpolation, direct Konva writes
- `src/features/animation/PlaybackControls.tsx` — Play/Pause/Stop/Loop toggle + progress bar

---

### 4. State Shape (Phase 2 additions)

```typescript
// animationSlice — added to store
{
  frames: Frame[];
  activeFrameIndex: number;      // which frame the timeline highlights
  isRecording: boolean;          // true when user is building a sequence
  isPlaying: boolean;
  playbackProgress: number;      // 0..1 across all frames
  config: AnimationConfig;       // { loop, fps, easingType }
}
```

Zustand `animationSlice` actions:
- `captureFrame()` — snapshots current `boardSlice` state into a new `Frame`
- `deleteFrame(id)` — removes frame, re-indexes remaining frames
- `reorderFrames(fromIndex, toIndex)` — drag-and-drop reorder
- `setActiveFrame(index)` — loads frame into `boardSlice` for editing
- `updateFrameDuration(id, ms)` — updates hold time
- `startPlayback()` / `stopPlayback()` / `seekToFrame(index)`

---

## Interpolation Algorithm

```typescript
// Linear interpolation helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// EaseInOut
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// In the RAF loop:
const t = easingFn(Math.min(elapsed / frame.durationMs, 1));

players.forEach((player, i) => {
  const nextPlayer = nextFrame.players[i];
  const x = lerp(player.x, nextPlayer.x, t) * stageWidth;
  const y = lerp(player.y, nextPlayer.y, t) * stageHeight;
  konvaNodes[player.id].x(x).y(y);
});
layer.batchDraw();
```

Players are matched between frames by `player.id`. If a player exists in frame N but not frame N+1, it fades out (opacity lerp from 1 to 0).

---

## File Structure (additions to Phase 1)

```
src/
├── domain/
│   └── animation/models.ts       ← Frame, AnimationConfig interfaces
├── store/
│   └── animationSlice.ts         ← new slice
└── features/
    └── animation/
        ├── AnimationTimeline.tsx
        ├── FrameThumbnail.tsx
        ├── FrameControls.tsx
        ├── PlaybackControls.tsx
        └── usePlayback.ts
```

---

## Build Steps (Ordered)

1. **Domain model** — add `Frame` and `AnimationConfig` to `src/domain/animation/models.ts`
2. **animationSlice** — implement all actions with immer
3. **Frame capture** — `captureFrame()` action + `FrameControls.tsx` button
4. **Timeline UI** — `AnimationTimeline.tsx` with frame cards
5. **Thumbnail generation** — off-screen Konva Stage in `FrameThumbnail.tsx`
6. **Frame editing** — click frame → loads into `boardSlice` → re-capture workflow
7. **Drag reorder** — HTML5 drag or Konva drag for frame reordering in timeline
8. **Playback engine** — `usePlayback.ts` RAF loop with linear interpolation
9. **Easing** — add `easeInOut` option
10. **Playback controls** — `PlaybackControls.tsx` UI
11. **Play-level save** — extend `librarySlice.savePlay()` to include `frames[]`

---

## Acceptance Criteria

- [ ] "Capture Frame" button appends a snapshot of current board state to the timeline
- [ ] Timeline shows thumbnail cards for each frame in order
- [ ] Clicking a frame card loads that frame into the board for editing
- [ ] Frame cards can be reordered by drag
- [ ] Each frame has a duration slider (500ms–5000ms)
- [ ] Play button animates players smoothly between frame positions at 60fps
- [ ] Positions interpolate linearly (easeInOut optional)
- [ ] Loop toggle works correctly
- [ ] Pause freezes playback at current interpolated position
- [ ] Saved plays in the library include all frames and animate on reload
