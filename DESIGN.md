# Design — DESTPEC Bâtiment

Seeded from the client brief (reference mockup DNA). Re-run
`/impeccable document` later to capture tokens from shipping code.

## Visual Theme

Cinematic craftsman. Near-black warmth drenched over full-bleed photography,
alternating with calm bone-light sections. Terracotta is the single committed
accent (roughly 10% of surface). Physical reference: charcoal workshop walls,
kraft paper plans, a hot terracotta brand mark.

## Color Palette

Client-committed hexes (identity-preservation; OKLCH equivalents in code):

| Token | Hex | Role |
|---|---|---|
| `--ink` | #1C1B19 | Primary dark surface, body text on light |
| `--ink-2` | #2D2A26 | Raised dark surface, footer, alt dark sections |
| `--bone` | #EFEAE1 | Light surface, text on dark |
| `--terra` | #B5502E | Accent: primary buttons, marks, key numbers |
| `--sand` | #D9C8B2 | Secondary tint: borders, muted panels on dark, kicker text |

Derived: `--terra-strong` (darkened terracotta for small text on bone, ≥4.5:1),
`--bone-70` / `--bone-50` (muted text on dark, verified ≥4.5:1 for body use),
hairlines as sand at 18-30% alpha.

## Typography

Client-committed pairing (identity-preservation):

- Display: **Playfair Display** (400/500/600 + italic). Hero clamp
  `2.6rem → 5.2rem`, section heads `2rem → 3.4rem`, letter-spacing ≥ -0.02em,
  `text-wrap: balance`. Italic reserved for one accent phrase per headline.
- Body/UI: **Montserrat** (400/500/600/700). Body 1rem/1.65, max 68ch.
  Uppercase only for short labels, nav, buttons (11-13px, +0.12em tracking).
- Scale ratio ≈ 1.3. Google Fonts, `display=swap`, preconnected.

## Components

- Buttons: solid `--terra-strong` (primary), 1px sand outline on dark / ink
  outline on light (secondary). Uppercase 12px Montserrat 600, pill-adjacent
  radius 2px, magnetic hover pull on desktop, terracotta deepens on hover.
  **Any bone text on a terracotta surface uses `--terra-strong`, not `--terra`:
  raw terracotta gives 4.22:1, below AA for label-sized text.** Applies to
  buttons, the skip link, confirm badge, checked boxes and before/after tags.
- Cards: used sparingly (prestations categories, reviews). Bone or ink-2
  surface, 1px sand hairline, hover tilt (rotateX/Y ≤ 4deg) + image zoom.
- Icons: 1.5px stroke line icons, round caps, terracotta or sand stroke
  (matches reference mockup icon style), custom inline SVG set.
- Stats band: **asymmetric, never an equal-column metric grid** (that shape is
  the SaaS stat-band template). The lead figure runs ~3x the supporting ones
  (clamp to 8rem) and spans two rows; the other two sit in a narrower column
  above a sand hairline. Playfair numerals in terracotta on ink, count-up on
  scroll-into-view.
- Before/after slider: draggable handle, `clip-path` reveal, keyboard
  accessible (range input).
- Signature: scroll-scrubbed SVG house assembling foundation → frame →
  walls → roof → lit windows, sticky beside the 5 service categories.
- Devis flow: 5 steps, progress rail, illustrated project-type cards,
  adaptive questions, sticky live estimate, aid calculator, photo upload,
  callback slot chips, confirmation with reference number.

## Layout

Asymmetric 12-col grid, `clamp()` fluid spacing, sections alternate
ink/bone. Off-grid overlaps: images pulled across grid lines, headline
breaking over image edges, stats band overlapping section seams. Max content
width 1320px. Breakpoints: 1080px, 860px, 640px. Single-purpose folds,
long-scroll pacing on home.

## Motion

Ease-out-quart `cubic-bezier(0.25,1,0.5,1)` default; 250-450ms UI,
900ms entrances. Hero Ken Burns (24s scale loop) + parallax translateY scrub,
scroll-revealed craftsman detail card straddling the hero/intro seam,
build-sequence scroll scrub with the active numeral scaling 1.55x, magnetic
buttons, card tilt, count-up stats, reveal-on-scroll.

**Reveal-on-scroll uses a geometric sweep (scroll listener + a 250ms
self-cancelling interval), not an IntersectionObserver threshold.** rAF and IO
callbacks are suspended in background tabs and headless renderers, which left
sections permanently blank; timers keep firing. Motion must never gate whether
content is visible. All motion disabled under `prefers-reduced-motion`.
