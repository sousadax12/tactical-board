# ADR-004: Full Frame Snapshots over Delta Encoding for Animation

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

The animation system stores the board state at each keyframe. Two storage strategies were evaluated:

- **Full snapshots** — each `Frame` contains a complete copy of `players[]`, `ball`, and `drawings[]`
- **Delta encoding** — each `Frame` stores only what changed from the previous frame (position diffs, added/removed elements)

---

## Decision

Use **full frame snapshots**. Each `Frame` stores a complete copy of all board state.

---

## Rationale

### Storage cost is acceptable

A typical frame for a 14-player scenario:
- 14 `Player` objects × ~100 bytes each = 1,400 bytes
- `Ball` = ~50 bytes
- ~5–10 `DrawingElement` objects × ~150 bytes = 750–1,500 bytes
- Per-frame total: **~2–4KB JSON**

A 10-frame play: ~25–40KB. A 20-frame play: ~50–80KB. `localStorage` allows ~5MB per origin. A coach would need 60+ frame plays before approaching limits. When the limit is reached, Phase 2 adds IndexedDB via `idb` as a fallback.

### Interpolation engine simplicity

With full snapshots, playback interpolation is straightforward:

```typescript
// Frame N → Frame N+1: lerp each player position
players.forEach((player, i) => {
  const next = frames[activeFrameIndex + 1].players[i];
  interpolatedX = lerp(player.x, next.x, t);
  interpolatedY = lerp(player.y, next.y, t);
});
```

With delta encoding, the interpolation engine must:
1. Reconstruct frame N's full state by replaying all deltas from frame 0
2. Reconstruct frame N+1's full state similarly
3. Then interpolate between the two reconstructed states

Delta encoding moves complexity from storage to the playback engine — the wrong trade-off for this application.

### Random access to frames

Coaches click arbitrary frames in the timeline to jump to them for editing. With full snapshots, this is O(1): `boardSlice.loadFrame(frames[index])`. With deltas, jumping to frame 7 requires replaying deltas 0→7, which is O(n) and introduces latency visible in the UI.

### Frame editing simplicity

When a coach edits a frame (load frame → adjust positions → re-capture), only that frame's snapshot is replaced. With deltas, editing frame N invalidates all subsequent deltas that reference frame N as their base.

---

## When to reconsider

If plays routinely exceed 20 frames with dense drawings (>100 drawing elements per frame), storage may become a concern. At that point, evaluate:
- Compression: `lz-string` can compress the JSON by 60–70%
- Reference frames: store a full snapshot every 5 frames; deltas only for frames in between
- IndexedDB: already planned for Phase 2 when `localStorage` limits approach

---

## Consequences

**Positive:**
- Interpolation engine is simple and correct
- Frame seeking is O(1)
- Frame editing is isolated — no cascading invalidation
- Snapshot format is identical to the live board state format — no transformation needed

**Negative:**
- Storage per play is larger than delta encoding (acceptable at current play lengths)
- Duplicate data across frames when few elements change between frames
