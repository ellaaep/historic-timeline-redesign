---
description: "Full redesign of the historic timelines app (\\\\\\\"Časovrstvy\\\\\\\") — clean, organized, non-generic-AI look, with landing, timeline explorer, and entry detail pages."
status: COMPLETED
created_at: "2026-07-12T17:19:08.390Z"
---

# Časovrstvy Redesign Plan

## User Request
Complete redesign of a historic-timelines website (reference: dense multi-track timeline app
with sidebar category filters, search, era bands, zoom). User wants it clean, functional,
organized, and not "AI-looking" / generic. Defaults applied (user skipped clarifying Qs):
- Palette: Ink & Parchment (museum editorial — parchment background, brick-red primary, brass accent)
- Content scope: general world history + one local/regional history track side by side
- Layout: horizontal layered tracks (refined version of reference image)
- Language: English
- Pages: Landing page + Timeline Explorer + Entry Detail page

## Related Files
- src/index.css (edit) — write Ink & Parchment palette tokens
- src/polymet/data/timeline-data.tsx (create) — mock eras, categories, entries
- src/polymet/components/timeline-header.tsx (create) — top nav/search/controls
- src/polymet/components/timeline-sidebar.tsx (create) — category toggles
- src/polymet/components/timeline-track.tsx (create) — one horizontal row of entries
- src/polymet/components/timeline-entry-card.tsx (create) — pill/card for a single entry
- src/polymet/components/era-band.tsx (create) — bottom era/period bands
- src/polymet/components/timeline-canvas.tsx (create) — composed scroll/zoom timeline area
- src/polymet/components/site-header.tsx (create) — marketing header for landing
- src/polymet/components/site-footer.tsx (create) — footer
- src/polymet/layouts/main-layout.tsx (create) — header+footer wrapper
- src/polymet/pages/landing.tsx (create)
- src/polymet/pages/timeline-explorer.tsx (create)
- src/polymet/pages/entry-detail.tsx (create)
- src/polymet/prototypes/casovrstvy-app.tsx (create) — routing

## TODO List
- [x] Write Ink & Parchment palette into index.css + tailwind.config.js font mapping
- [x] Build mock data file (src/polymet/data/timeline-data.tsx) + scale helper (src/polymet/lib/timeline-scale.ts)
- [x] Build timeline sub-components: timeline-entry-chip, timeline-ruler, era-band, timeline-track, timeline-sidebar, timeline-toolbar
- [x] Compose timeline-canvas (main multi-track body)
- [x] Build site-header, site-footer, main-layout
- [x] Build hero-section, landing-timeline-preview, feature-grid
- [x] Build landing.tsx page (hero + feature grid + closing CTA)
- [x] Build timeline-explorer.tsx page (search, layer toggles, zoom, empty states)
- [x] Build entry-detail.tsx page + related-entries component (with not-found fallback)
- [x] Create prototype src/polymet/prototypes/strata-app.tsx with routes "/", "/explorer", "/entry/:id", "*"
- [x] Verify all canvas bundles with no errors (18/18 bundled successfully)
- [x] Final visual pass — palette contrast checked across light/dark tokens

## Important Notes
- Reference image is very dense/cramped — redesign must add breathing room, clear typography
  hierarchy, and restraint vs. cramming every category into view by default.
- Use serif display font for headings for an "archival/editorial" feel distinct from generic AI SaaS look.
