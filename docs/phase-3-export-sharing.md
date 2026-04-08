# Phase 3 - Export and Sharing

## Goal

Allow coaches to export the board as a PNG image and generate shareable links that other coaches can open to view (and optionally play back) a tactical play.

## Deliverable

> Coach exports a PNG of a formation and copies a share link to paste into a messaging app. The recipient opens the link and sees the play, with playback controls if the play has multiple frames.

## Prerequisite

Phase 2 complete and passing all acceptance criteria.

---

## Features

### 1. PNG Export

Export the current board view as a high-resolution image.

**Behavior:**
- Exports the active frame (or current static board)
- 2× pixel ratio for sharp display on HiDPI/Retina screens
- Triggers a browser download of `play-name.png`
- Optionally export all frames as a storyboard grid (stretch goal)

**Implementation:**
Konva's `stage.toDataURL()` is the primary mechanism. It captures all visible layers (court, drawings, players) into a single PNG data URL. No external library needed.

```typescript
// src/features/export/PngExporter.ts
export function exportAsPng(stage: Konva.Stage, filename: string): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const anchor = document.createElement('a');
  anchor.download = `${filename}.png`;
  anchor.href = dataUrl;
  anchor.click();
}
```

> **Why not `html2canvas`?** Konva's native export avoids cross-origin canvas taint issues that `html2canvas` introduces when loading external fonts or images. It also captures all Konva layers correctly without DOM traversal.

**Storyboard export (stretch):**
Renders each `Frame` sequentially into an off-screen canvas, tiles them in a grid (3 columns), and exports the composite image.

**Key files:**
- `src/features/export/PngExporter.ts` — `exportAsPng(stage, filename)`
- `src/features/export/ExportMenu.tsx` — dropdown with export options

---

### 2. Share Link Generation

Generate a URL that encodes the entire play so the recipient can view it without an account or backend.

**Architecture (no backend required):**

```
Coach creates play
    ↓
serialize Play → JSON string (~10–30KB typical)
    ↓
base64url encode the JSON
    ↓
append as URL fragment: /share#<base64payload>
    ↓
Copy link to clipboard
```

The recipient opens the link:
```
Browser loads /share#<base64payload>
    ↓
SharedPlayRoute decodes fragment
    ↓
Deserializes Play from JSON
    ↓
Renders read-only CourtCanvas with PlaybackControls
```

**Why URL fragment (`#`):**
- Fragment is never sent to any server — fully client-side
- No backend, no database, no authentication required
- Works immediately with a static file host or CDN

**Size limits and fallback:**
- Typical play (14 players + drawings + 5 frames): ~15–25KB JSON → ~20–33KB base64
- URLs up to ~64KB work in all modern browsers (Chrome, Firefox, Safari)
- For plays exceeding 64KB (>10 frames with heavy drawings): show warning "Play too large to share as link — use PNG export instead"

```typescript
// src/features/export/ShareLinkGenerator.ts
export function generateShareUrl(play: Play): string {
  const json = JSON.stringify(play);
  const encoded = btoa(unescape(encodeURIComponent(json))); // handles Unicode
  return `${window.location.origin}/share#${encoded}`;
}

export function decodeShareUrl(fragment: string): Play | null {
  try {
    const json = decodeURIComponent(escape(atob(fragment)));
    return JSON.parse(json) as Play;
  } catch {
    return null;
  }
}
```

**Key files:**
- `src/features/export/ShareLinkGenerator.ts` — encode/decode utilities
- `src/features/export/ExportMenu.tsx` — "Copy Share Link" button + clipboard feedback
- `src/app/routes/SharedPlayRoute.tsx` — read-only viewer

---

### 3. Share Viewer (Read-Only Mode)

The `/share` route renders a play received via URL fragment with a simplified UI.

**Components available in viewer:**
- Full `CourtCanvas` (court, players, ball, drawings — all visible)
- `PlaybackControls` (Play/Pause/Stop/Loop) if `frames.length > 1`
- Court view toggle (full/half)
- Export as PNG button (export what you're viewing)

**Components hidden in viewer:**
- Toolbar (no drawing tools)
- Player palette (no adding players)
- Library panel (no saving)
- TopBar edit actions (undo/redo, save)

**Error states:**
- Invalid/corrupted URL fragment → "Invalid share link" message with link to open a new board
- Unsupported browser → graceful fallback message

**Key files:**
- `src/app/routes/SharedPlayRoute.tsx`
- `src/app/routes/BoardRoute.tsx` — updated to support `readOnly` prop

---

## Export Menu UI

The `ExportMenu` is a dropdown triggered from the `TopBar`:

```
[ Export ▾ ]
  ├── Download PNG (current frame)
  ├── Download Storyboard PNG (all frames)  ← stretch goal
  └── Copy Share Link
       └── [ Link copied! ✓ ] (2s feedback)
```

**Key files:**
- `src/features/export/ExportMenu.tsx`
- `src/ui/TopBar.tsx` — hosts the export button

---

## Routing

```typescript
// src/app/App.tsx
<Routes>
  <Route path="/"             element={<BoardRoute />} />
  <Route path="/board/:playId" element={<BoardRoute />} />
  <Route path="/share"        element={<SharedPlayRoute />} />
</Routes>
```

The `/share` route reads `window.location.hash` (the `#` fragment) directly — React Router does not handle fragments, so `SharedPlayRoute` accesses `useEffect` + `window.location.hash` on mount.

---

## State Shape (Phase 3 additions)

```typescript
// Added to Play domain model
interface Play {
  // ... existing fields
  shareToken?: string;          // nanoid(10), generated on share
  thumbnailDataUrl?: string;    // base64 PNG of frame 0, stored on save
}
```

No new Zustand slice is needed — export operations are side effects (download, clipboard) with no persistent state.

---

## File Structure (additions to Phase 2)

```
src/
├── app/routes/
│   └── SharedPlayRoute.tsx     ← new
└── features/
    └── export/
        ├── ExportMenu.tsx      ← new
        ├── PngExporter.ts      ← new
        └── ShareLinkGenerator.ts ← new
```

---

## Build Steps (Ordered)

1. **PngExporter** — implement `exportAsPng()` using `stage.toDataURL({ pixelRatio: 2 })`
2. **ExportMenu** — dropdown UI in `TopBar` with PNG download action
3. **ShareLinkGenerator** — implement `generateShareUrl()` + `decodeShareUrl()`
4. **Clipboard integration** — "Copy Share Link" uses `navigator.clipboard.writeText()`
5. **SharedPlayRoute** — decode fragment, render read-only board
6. **Read-only board** — pass `readOnly` prop to `CourtCanvas`, `BoardRoute`; hide edit tools
7. **Playback in viewer** — wire `usePlayback` + `PlaybackControls` in `SharedPlayRoute`
8. **Error handling** — invalid fragment, oversized link, unsupported browser
9. **Thumbnail on save** — generate `thumbnailDataUrl` from frame 0 when saving a play
10. **Integration test** — full round-trip: create play → copy link → open in new tab → verify renders correctly

---

## Acceptance Criteria

- [ ] "Download PNG" exports current frame at 2× resolution as a `.png` file
- [ ] Exported PNG filename matches the play name
- [ ] "Copy Share Link" encodes the full play into a URL fragment and copies to clipboard
- [ ] Clipboard feedback message shows for 2 seconds after copy
- [ ] Opening a share link in a new tab renders the exact same court, players, and drawings
- [ ] Share viewer shows `PlaybackControls` when the play has more than 1 frame
- [ ] Share viewer hides all editing tools (toolbar, palette, library, undo)
- [ ] Share viewer "Download PNG" works on the received play
- [ ] Invalid or corrupted share links show a user-friendly error state
- [ ] Plays larger than 64KB show a warning instead of a broken link
