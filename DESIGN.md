# BeTacora — DESIGN.md

> Stitch-compatible design system for Explorar (cuestionario + perfil DNA).
> Brand overrides on the original Stitch coral/teal: `#FF7F50` → `#E8634A`, `#008080` → `#2D7B7B`.
> Philosophy: **Ultra-Neutral Premium** with the **1% accent rule**.

---

## 1. Visual Theme & Atmosphere

Calm, airy travel UI. White and cool grays carry almost all surface area. Brand voltage (coral / teal) is reserved for the few moments that must pull attention — primary CTA, selected/active states, and input focus. Depth comes from 1px hairline borders and tonal steps, not heavy shadows.

---

## 2. Color Palette & Roles

### Brand primitives (1% rule)

| Token | Value | Role |
|-------|-------|------|
| `primary` | `#E8634A` | Coral — primary CTA fill, progress fill, selected border, lang underline |
| `on-primary` | `#FFFFFF` | Text/icons on coral |
| `secondary` | `#2D7B7B` | Teal — input focus, secondary active accents, soft chips |
| `on-secondary` | `#FFFFFF` | Text/icons on teal |
| `secondary-container` | `#E8F2F2` | Soft teal chip/badge fill (max options, hints) |
| `on-secondary-container` | `#2D7B7B` | Text on soft teal chips |

### Surfaces (dominate the UI)

| Token | Value | Role |
|-------|-------|------|
| `background` / `surface` | `#F9FAFB` | Page floor |
| `surface-container-lowest` | `#FFFFFF` | Cards, inputs, option tiles |
| `surface-container` | `#F3F4F6` | Subtle nested bands (profile footer, toolbars) |
| `surface-container-high` | `#E5E7EB` | Track fills, disabled washes |
| `on-surface` | `#111827` | Primary text (near-ink, not pure black) |
| `on-surface-variant` | `#6B7280` | Hints, captions, secondary copy |
| `outline` | `#E5E7EB` | Default 1px borders |
| `outline-variant` | `#D1D5DB` | Hover border |

### Legacy aliases (questionnaire.html)

`--coral` = `primary`, `--teal` = `secondary`, `--bg` = `surface`, `--ink` = `on-surface`, `--muted` = `on-surface-variant`, `--border` = `outline`, `--white` = `surface-container-lowest`.

### 1% accent discipline

**Do use coral/teal for:** primary buttons, selected option borders, progress fill, active language underline, input `:focus` / `:focus-within` border, soft teal max-chips.

**Do not use coral/teal for:** page washes, large card fills, decorative gradients, icon rows at rest, body text, section backgrounds.

---

## 3. Typography

| Role | Family | Weight | Notes |
|------|--------|--------|-------|
| Display / question | **DM Sans** (Inter fallback) | 500–600 | `clamp(1.5rem, 4vw, 1.875rem)`, tracking `-0.02em` |
| Title / section | DM Sans | 500 | ~1.05–1.25rem |
| Body | DM Sans / Inter | 400 | 0.875–0.9375rem, line-height ~1.55 |
| Caption / chip | DM Sans | 400–500 | 0.68–0.75rem |
| Eyebrow | DM Sans | 400–500 | 0.65–0.72rem, uppercase, wide tracking |

Do not introduce Syne (or other display faces) on Explorar surfaces — keep a single calm sans voice.

---

## 4. Spacing

Base unit **4px**. Preferred scale: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`.

| Context | Value |
|---------|-------|
| Page horizontal padding | 16–24px (mobile), 32px (desktop) |
| Question block gap | 24–32px |
| Option gap (grid/list) | 8–12px |
| Card / option padding | 14–16px |
| Section header → question | 16–20px |
| Bottom nav safe area | `0.85rem + env(safe-area-inset-bottom)` |

Container max-width conversational: **560px**. Results / DNA: **720px**.

---

## 5. Components

### Buttons

- **Primary:** `primary` fill, `on-primary` text, radius **8px**, no shadow. Hover: opacity `0.92`.
- **Secondary / ghost:** white fill, `outline` 1px border, `on-surface` text.
- **Disabled:** opacity `0.4`, no color wash.

### Cards / option tiles

- Fill: `surface-container-lowest`
- Border: **1px** `outline` (never heavy drop shadow)
- Radius: **8–10px**
- Selected: **1px** `primary` border (coral). Optional icon tint → `secondary`.
- Hover: border → `outline-variant`, still flat.

### Chips / badges

- **Max / multi hint:** `secondary-container` fill, `on-secondary-container` text, radius **6px**, no emoji required.
- **Profile tags:** transparent / white + `outline` 1px, `on-surface-variant` text.
- **Section index:** square, coral `primary` 1px border, coral number, transparent fill.

### Inputs

- White fill, 1px `outline`, radius 8px.
- Focus: border `secondary` (teal). No glow ring, no shadow.
- Placeholder: muted gray.

### Progress

- Track: `outline` / `surface-container-high`, height 2px.
- Fill: `primary` (coral).

### DNA / profile result

- Single white card on `surface` floor.
- 1px `outline`, radius 10px, no colored hero blocks.
- Eyebrow muted; archetype title in `on-surface`.
- Stats row on subtle `surface` band with top hairline.
- Share CTA: primary coral button only.

---

## 6. Depth & Elevation

Default elevation = **border, not shadow**.

| Level | Treatment |
|-------|-----------|
| Flat page | `surface` |
| Raised card | white + 1px `outline` |
| Sticky chrome | white/surface + bottom/top 1px `outline` (+ optional light blur) |
| Modal overlay | `rgba(17,24,39,0.28)` scrim |

Avoid multi-layer shadows and brand-tinted radial washes on Explorar.

---

## 7. Motion

- Question enter: opacity + `translateY(8–10px)`, ~280ms ease.
- Progress width: 400ms ease.
- Prefer transform/opacity only.

---

## 8. Do's and Don'ts

**Do**

- Let `#F9FAFB` / `#FFFFFF` / `#E5E7EB` own the canvas.
- Keep conversational flow: one question at a time (not grouped “Sección 1 de 8” layout).
- Use mockup only for typography, spacing, and card language.

**Don't**

- Flood coral/teal across icons, backgrounds, or gradients.
- Reintroduce the long multi-section form layout.
- Add heavy shadows, glow, or purple AI defaults.
- Change itinerary generation payloads or persistence logic for visual work.

---

## 9. Surfaces covered

- Explorar: conversational questionnaire + DNA result (`public/questionnaire.html`)
- Mis Viajes: archive layout (`app/(app)/viajes`) — featured latest trip, memory grid, new-logbook CTA. No invented stats/wishlist/photos; adapt mockup structure to real itinerary rows.

## 10. Agent prompt guide

- “Redesign Explorar using this DESIGN.md; keep one-question conversational behavior.”
- “Primary CTA and selected borders = coral `#E8634A`; focus rings = teal `#2D7B7B`.”
- “Surfaces stay `#F9FAFB` / white with `#E5E7EB` 1px borders.”
- “Mis Viajes follows the archive mockup structure but only with real saved itineraries.”
