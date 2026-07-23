# Overnight E2E Quality Pass — Report
**Date:** 2026-07-22 (local overnight)
**Scope:** Full end-to-end verification of today's parallel features

## Verdict
Core product chain works end-to-end. Production build succeeds with zero TypeScript errors. One real localization bug was found and fixed (Spanish section labels leaking into EN/FR AI HTML). Post-trip **authenticated** DB write still needs a manual login tomorrow.

---

## 1) Real itinerary generation (short trip) — PASSED

Generated real Claude itineraries locally:

| Lang | Destination | Days | HTTP | HTML len | Places |
|------|-------------|------|------|----------|--------|
| ES | Lisboa | 4 | 200 | ~14k | 18–21 |
| EN | Porto | 3 | 200 | ~12–13k | 17 |
| FR | Lisbonne | 3 | 200 | ~12k | 16 |

### Feature chain (ES Lisboa)
- **Instant archetype profile card** — appears via client `generateProfile()` then AI `.profile-result` ✓
- **Museum types** (`arte`, `historia`) reflected in content ✓
- **Sport this-trip** (`surf: yes`) → Caparica/Ericeira surf day ✓
- **Activity this-trip** (`cocina_c: yes`) → cooking class ✓
- **Accom filters** (`fuera` + `precio`) → hotel reasoning mentions outside-center / price ✓
- **Budget currency** EUR (€) ranges ✓ / EN GBP (£) ✓ / FR EUR ✓
- **Leaflet map** above itinerary — height 260px @375, OSM tiles + markers ✓
- **Compartir viaje** → `POST /api/share-trip` → `/viaje/{slug}` read-only ✓ (archetype shown from UI path)
- **Post-trip feedback UI** — prompt/form chips/submit ✓; unauthenticated → login CTA ✓
- **Instagram shareable card** — captures 1080×1350 PNG ✓

Artifacts: `tmp/overnight-e2e/`

---

## 2) EN / FR translations — PASSED (with fix)

### Questionnaire UI (DOM)
All today's feature strings translate correctly:
- Museum types, accom location/priority, sport/activity this-trip, budget currency, post-trip, share trip, map day

### Shared trip page chrome
- EN: Shared trip / Create mine / Duration / Highlights / Map / CTA ✓
- FR: Voyage partagé / Créer le mien / … ✓
- (Eyebrow appears uppercase via CSS; HTML source is correctly translated.)

### AI output
- EN/FR narrative content is in the target language ✓
- **BUG FOUND & FIXED:** System prompt HTML skeleton hardcoded Spanish labels (`💡 Tip local:`, etc.), so EN/FR kept Spanish tip/section chrome.
  - Fix: `lib/itinerary-labels.ts` + localized `SYSTEM_PROMPT_TEMPLATE` + profile labels in `buildArchetypeProfilePrompt(…, uiLang)`
  - Re-verified EN regen: `Tip local=0`, `Local tip=3`, `Your superpower` present, `Tu superpoder` absent

### Intentional brand retention
- FR UI still uses "Bitácora" in a few brand eyebrows (`Votre Bitácora Voyageuse`) — product naming, not untranslated UI chrome.

---

## 3) Console errors — PASSED

Clean on: landing, auth, `/questionnaire`, `/questionnaire.html`, itinerary UI render, shared trip (ES/EN/FR).
Next.js DevTools "1 Issue" badge is route-info chrome in dev, not a runtime console error.

---

## 4) Mobile 375px — PASSED

No horizontal overflow on:
- Shared trip view (ES/EN/FR)
- Itinerary result (map, post-trip, shareable card, trip share card)

Screenshots: `tmp/overnight-e2e/*-375.png`

Minor visual note: Leaflet screenshot sometimes shows a light tile gap at bottom-right while tiles settle; runtime check confirmed markers/tiles present.

---

## 5) `npm run build` — PASSED

```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (11/11)
exit_code: 0
```

Verified twice (before and after overnight fixes).

---

## Fixes applied this overnight

1. **`app/viaje/[slug]/page.tsx`** — `generateMetadata` was hardcoding Spanish OG/description regardless of trip `lang`. Now localized es/en/fr.
2. **`lib/itinerary-labels.ts`** (new) + **`app/api/generate-itinerary/route.ts`** + **`lib/archetypes.ts`** — itinerary/profile HTML skeleton labels now follow `ui_lang` (fixes EN/FR `Tip local` leak).
3. **`scripts/overnight-e2e.mjs`** — Chrome launch fallback; share payload uses `archetype.nombre`.

---

## Caveats / manual attention tomorrow

1. **Post-trip Supabase write with a real logged-in user** — columns exist (`post_trip_liked`, `post_trip_avoid`, `post_trip_would_return` select returns 200). UI + `savePostTripFeedback` path verified. Autonomous signup/write was blocked by safety review; please log in once and submit feedback to confirm the update row.
2. **Archetype catalog names** (`El Aventurero`, etc.) remain Spanish in API `archetype.nombre` even for EN/FR; AI profile titles localize, but the typed catalog name does not.
3. Do **not** push until you've reviewed the local commit/diff.
4. Apply `supabase/migrations/20260722_post_trip_feedback.sql` on any environment that doesn't already have the columns (prod probe already has them).

