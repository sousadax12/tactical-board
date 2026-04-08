# ADR-010: PNG Export via Konva Native toDataURL over html2canvas

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

Coaches need to export the board as a PNG image for use in presentations, printed playbooks, or messaging. Two approaches were evaluated:

- **Konva native** — `stage.toDataURL({ pixelRatio: 2 })`
- **html2canvas** — DOM-to-canvas library that rasterizes HTML elements

---

## Decision

Use **Konva's native `stage.toDataURL()`** for PNG export. Do not add `html2canvas` as a dependency.

---

## Rationale

### The board is entirely in Konva

The tactical board content (court lines, player tokens, arrows, zones) is rendered exclusively inside a Konva `Stage`. No critical visual content exists in the surrounding HTML DOM. `html2canvas` is designed to capture HTML DOM elements — it provides no benefit for a canvas-only content area.

### html2canvas introduces cross-origin taint issues

`html2canvas` rasterizes HTML and may load external resources (fonts, images). If any resource has a different origin, the canvas becomes "tainted" — the browser blocks `toDataURL()` on a tainted canvas, causing the export to fail silently or throw. Konva's `toDataURL()` operates on the Konva canvas directly, which is same-origin by construction.

### Pixel ratio control

```typescript
// High-resolution export (2× for Retina displays)
const dataUrl = stage.toDataURL({ pixelRatio: 2 });
```

This produces an image that is twice the canvas pixel dimensions, ensuring sharp display on HiDPI screens when embedded in a presentation or printed. `html2canvas` has less reliable HiDPI support.

### Implementation

```typescript
// src/features/export/PngExporter.ts
export function exportAsPng(stage: Konva.Stage, filename: string): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const anchor = document.createElement('a');
  anchor.download = `${sanitizeFilename(filename)}.png`;
  anchor.href = dataUrl;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim() || 'play';
}
```

The `sanitizeFilename` function prevents directory traversal and illegal filename characters.

### Storyboard export (Phase 3 stretch)

For exporting all frames as a tiled grid:
1. Create an off-screen HTML `<canvas>` sized for N frames in a 3-column grid
2. For each frame: call `stage.toDataURL()` after loading that frame's state, decode to `ImageData`, draw onto the off-screen canvas at the correct tile position
3. Call `offscreenCanvas.toDataURL()` for the final composite

This approach keeps everything in Konva and native Canvas API — no external libraries.

---

## Consequences

**Positive:**
- No additional dependency (`html2canvas` is ~800KB min)
- No cross-origin taint risk
- Reliable HiDPI output via `pixelRatio: 2`
- Filename is sanitized to prevent filesystem issues

**Negative:**
- Only the Konva canvas content is captured — HTML UI elements (toolbar, timeline) are excluded from the export (this is correct behavior; coaches want the board, not the app chrome)
- Background color must be explicitly set in the export if the Konva stage has a transparent background (set `stage.toDataURL({ mimeType: 'image/png', quality: 1 })` with a white background layer for clean PNG)
