# ADR-009: URL Fragment Base64 Encoding for Share Links

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

Coaches need to share a tactical play with other coaches via a link (messaging app, email). Options evaluated:

- **Short URL with backend** — store play in a database, return `share.app/s/abc123`
- **URL query parameter** — encode play in `?data=<base64>` query string
- **URL fragment** — encode play in `#<base64>` fragment
- **File export** — share a `.json` or `.png` file instead of a link

---

## Decision

Encode the `Play` object as **base64 JSON in the URL fragment** (`/share#<base64payload>`).

---

## Rationale

### Fragment is never sent to a server

The URL fragment (`#...`) is a client-side-only construct. Browsers do not include the fragment in HTTP requests. This means:
- The encoded play data never touches any server — complete privacy
- No server infrastructure required
- No risk of encoded data being logged in server access logs

### vs Query parameter (`?data=...`)

Query parameters are included in HTTP requests and therefore in server access logs. Even though the app is static (no server processing), the hosting CDN (Vercel, Netlify, etc.) would log the full URL including the `?data=` parameter, exposing coaching data. The fragment avoids this.

### vs Short URL with backend

A backend short URL would require:
- Database to store play → short ID mapping
- API endpoint to create and resolve short URLs
- Authentication to prevent abuse
- Hosting and operational overhead

This contradicts ADR-007 (no backend for Phases 1–3) and is disproportionate for the sharing use case.

### Encoding implementation

```typescript
// Encode
const json = JSON.stringify(play);
const encoded = btoa(unescape(encodeURIComponent(json)));
const url = `${window.location.origin}/share#${encoded}`;

// Decode (in SharedPlayRoute)
const fragment = window.location.hash.slice(1); // remove '#'
const json = decodeURIComponent(escape(atob(fragment)));
const play = JSON.parse(json) as Play;
```

`encodeURIComponent` + `unescape` before `btoa` handles Unicode characters in play names and labels (e.g., accented characters in French or German team names). Omitting this causes `btoa` to throw on multi-byte characters.

### URL length limits

| Browser | Max URL length |
|---|---|
| Chrome | ~2MB |
| Firefox | ~64KB |
| Safari | ~80KB |
| IE 11 | ~2KB (irrelevant) |

Firefox's 64KB limit is the binding constraint. Typical play size:
- 14 players + ball: ~1,500 bytes JSON
- 10 drawing elements: ~1,500 bytes JSON
- 5 frames (full snapshots): ~15,000 bytes JSON
- Total: ~18KB JSON → ~24KB base64 → well within 64KB

A 20-frame play with 30 drawings: ~50KB JSON → ~67KB base64 → **exceeds Firefox limit**.

**Fallback behavior:** If encoded size exceeds 48KB (conservative threshold), the `ExportMenu` shows a warning: "Play too large for a share link — use PNG export instead."

---

## SharedPlayRoute behavior

```
/share#<base64>
   ↓
SharedPlayRoute mounts
   ↓
window.location.hash decoded → Play object
   ↓
Play loaded into read-only boardSlice
   ↓
CourtCanvas renders (read-only)
   ↓
PlaybackControls shown if frames.length > 1
```

Error states:
- Invalid base64 → decode throws → render "Invalid share link" UI
- Valid base64 but invalid Play JSON schema → render "Incompatible play format" UI

---

## Consequences

**Positive:**
- No server infrastructure required
- Play data never transmitted to any server
- Link is self-contained and permanent (works forever at the same domain)
- Decode is instant — no network request

**Negative:**
- URL is long and not human-readable (not a concern for copy-paste sharing)
- Links larger than 48KB cannot be shared as links (mitigated by the size warning and PNG export fallback)
- If the app moves to a different domain, existing share links stop working (acceptable for Phase 1–3)
