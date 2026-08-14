# BeTacora — DESIGN.md

> Stitch-compatible design system guided by the Ultra-Neutral Premium mockups
> (landing, Mis Viajes, Explorar sensaciones, Cuestionario inteligente).
>
> Brand hex (replacing Stitch defaults): coral `#E8634A` (was `#FF7F50`),
> teal `#2D7B7B` (was `#008080`).

---

## 1. Visual Theme & Atmosphere

Calm, airy travel UI. White and cool grays own almost all surface area. Brand
voltage is rare (**1% rule**). Depth comes from 1px hairlines and tonal steps,
not heavy shadows. Photography (when present) is full-bleed and high-key.

---

## 2. Color roles (from mockups)

| Token | Value | Role |
|-------|-------|------|
| `primary` | `#2D7B7B` | **Teal** — Plan Trip / filled CTAs, selected options, active nav underline, progress, icons at emphasis, focus |
| `on-primary` | `#FFFFFF` | Text on teal |
| `primary-container` | `#E8F2F2` | Soft teal fill for selected chips/cards |
| `on-primary-container` | `#2D7B7B` | Text/icons on soft teal |
| `accent` | `#E8634A` | **Coral** — rare: category labels (e.g. LOGÍSTICA), outline Exit/Salir, soft tint callout fills (`accent` @ ~8–12% opacity) |
| `on-accent` | `#FFFFFF` | Text on solid coral (almost never needed) |
| `ink-cta` | `#111827` | Questionnaire **Continuar** filled button (mockup: black CTA) |
| `on-ink-cta` | `#FFFFFF` | Text on ink CTA |
| `surface` | `#F9FAFB` | Page floor |
| `surface-container-lowest` | `#FFFFFF` | Cards, inputs, chrome |
| `surface-container` | `#F3F4F6` | Nested bands |
| `surface-container-high` | `#E5E7EB` | Tracks / disabled washes |
| `on-surface` | `#111827` | Primary text |
| `on-surface-variant` | `#6B7280` | Hints, captions |
| `outline` | `#E5E7EB` | Default 1px borders |
| `outline-variant` | `#D1D5DB` | Hover / dashed empty cards |
| `surface-inverse` | `#111827` | Dark archetype band |
| `on-surface-inverse` | `#F9FAFB` | Text on dark band |

### Legacy aliases (`questionnaire.html`)

`--teal` = `primary`, `--coral` = `accent`, `--bg` = `surface`, `--ink` = `on-surface`,
`--muted` = `on-surface-variant`, `--border` = `outline`, `--white` = `surface-container-lowest`.

### 1% discipline

**Teal:** primary filled buttons, selected borders + soft fill, active underlines, progress, emphasis icons, input focus.

**Coral:** at most one label per section, outline Exit, soft suggestion tint — never page washes or default CTAs.

**Ink CTA:** questionnaire Continuar / Siguiente primary action.

**Do not** flood teal/coral across icon rows at rest, large card fills, or decorative gradients.

---

## 3. Typography

DM Sans (Inter fallback). No Syne / display serif on product surfaces.

| Role | Weight | Notes |
|------|--------|-------|
| Display / hero | 600–700 | tracking `-0.02em` |
| Question title | 500–600 | `clamp(1.5rem, 4vw, 1.875rem)` |
| Section / card title | 500–600 | |
| Body | 400 | 0.875–0.9375rem, lh ~1.55 |
| Eyebrow / chip | 500 | uppercase, wide tracking |
| Question label (mockup) | 500 | small caps / uppercase |

---

## 4. Spacing

Base **4px**. Scale: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`.

| Context | Value |
|---------|-------|
| Page pad | 16–24px mobile, 32–48px desktop |
| Card pad | 14–20px |
| Option gap | 8–12px |
| Conversational max-width | 560px |
| Results / archives | 720–1024px |

---

## 5. Components

### Buttons

- **Primary (marketing / Plan Trip / LoginPrompt / sidebar +):** teal fill, white text, radius 8–999 (pill OK on marketing nav only).
- **Ink CTA (questionnaire Continuar):** `ink-cta` fill, white text, radius 8px.
- **Secondary / ghost:** white + 1px `outline`.
- **Exit / Salir:** transparent + 1px **coral** outline, coral text.
- No heavy shadow.
- **Nav active (sidebar / bottom):** teal text (not coral).

### Option chips & cards (questionnaire)

- Rest: white + 1px `outline`.
- Selected: 1px **teal** border + `primary-container` fill.
- Icons: muted at rest; teal when selected / section emphasis.

### Inputs

- White, 1px outline, radius 8px.
- Focus: teal border. No glow.

### Progress

- Track: `surface-container-high`.
- Fill: **teal**.

### DNA / profile result

- White card on `surface`, 1px outline.
- Share CTA: teal (or ink) — not coral floods.

### Mis Viajes archive

- Featured latest trip + memory grid + dashed Nueva Bitácora.
- Soft coral-tint callout only for real product prompts (not invented companions).
- No fake wishlist/stats/photos.

### Landing

- Full-bleed atmospheric hero, one primary teal CTA + ghost secondary.
- Prep cards with rare coral/teal category labels.
- Optional dark archetype band with teal CTA.
- Keep real product links only.

---

## 6. Depth

Elevation = **border, not shadow**. Sticky chrome: white + 1px outline (± light blur).

---

## 7. Flow constraints

- Questionnaire stays **one question at a time** (conversational). Mockup “Sección 1 de 8” is visual reference for type/spacing/cards, not grouped multi-question layout.
- Do not change `generate-itinerary`, payloads, or persistence for visual work.

---

## 8. Agent prompt guide

- Teal `#2D7B7B` = interactive primary; coral `#E8634A` = rare accent; Continuar = ink.
- Surfaces `#F9FAFB` / white; borders `#E5E7EB` 1px.
- Selected options = teal border + `#E8F2F2` fill.
