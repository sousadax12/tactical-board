# ADR-007: No Backend for Phases 1–3 (localStorage + URL Fragment)

**Status:** Accepted  
**Date:** 2026-04-08  
**Deciders:** Initial architecture

---

## Context

The app needs to persist formation libraries and share plays between coaches. Options evaluated:

- **Backend API + database** — Express/FastAPI server with PostgreSQL, user accounts, REST or GraphQL
- **BaaS** — Supabase, Firebase, or PocketBase for database + auth without custom server code
- **Client-only** — `localStorage` for persistence, URL fragments for sharing

---

## Decision

**No backend for Phases 1–3.** Use `localStorage` for persistence and base64-encoded URL fragments for sharing.

---

## Rationale

### Target user is an individual coach

The primary use case is a solo coach preparing tactical sessions:
- No need to sync plays between multiple coaches in real time
- No need for user accounts or access control
- Sharing a single play with an assistant coach is satisfied by a URL

A backend adds infrastructure cost (hosting, database, auth, deployment, maintenance) that provides no benefit for this use case.

### localStorage is sufficient for Phase 1–3 scale

Storage estimates per coach:
- 20 saved plays × 30KB per play = 600KB
- 5MB `localStorage` limit per origin → headroom for 150+ plays
- When limits are approached (Phase 2+), `idb` (IndexedDB) provides ~250MB

### URL fragment sharing requires no infrastructure

A share link encodes the entire `Play` object as base64 JSON in the URL fragment (`#`). The fragment is:
- Never sent to any server (it's a client-side fragment)
- Immediately usable — no backend call to resolve it
- Permanent — the link works as long as the app is deployed at the same URL

Typical share link payload:
- 14 players + 5 frames + 10 drawings ≈ 25KB JSON → 33KB base64 → within URL limits

### Progressive upgrade path

If multi-user collaboration is needed later, the `Play` data model is already fully serializable JSON. Adding a backend would require:
1. `POST /plays` to store a play, receive an `id`
2. `GET /plays/:id` to load a shared play
3. Update `ShareLinkGenerator` to use `/share/:id` instead of `#fragment`

The domain models need no changes. The migration is additive.

---

## Storage Architecture

```
Phase 1–2:
  librarySlice → Zustand persist middleware → localStorage
  Key: "handball-tactical-board-library"
  Format: JSON-serialized FormationLibrary

Phase 2+ (when localStorage approaches limit):
  librarySlice → idb wrapper → IndexedDB
  Object store: "plays"
  Index: "updatedAt" (for sorted listing)
```

Auto-save (`usePersistence.ts`) debounces writes every 2 seconds to avoid excessive localStorage writes during rapid edits.

---

## Consequences

**Positive:**
- Zero infrastructure cost — app runs as a static site (GitHub Pages, Vercel, Netlify free tier)
- No auth system to build or secure
- No API latency — all operations are synchronous local reads/writes
- Share links work without any server

**Negative:**
- Library is device-local — plays are lost if the user clears browser storage or switches devices
- Share links larger than ~64KB cannot be expressed as a URL — very long plays require a different sharing mechanism
- No collaboration — two coaches cannot edit the same play simultaneously (out of scope for Phases 1–3)
- No backup — user is responsible for not clearing browser data (mitigated by export-to-file feature in Phase 3)
