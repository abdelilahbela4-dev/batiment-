# DESTPEC — Design System (v3, "Papier & Plomb")

**Concept**: An architect's plan set, printed on cotton paper. Graphite rules, red-conté marks, blueprint-blue tints, drafting-typewriter numerals. Zero rounded corners, zero drop shadows. Depth comes from ink weight, hairline rules, and physical overlap.

---
## Color

All defined in OKLCH; hex verified against the sRGB gamut. **90% paper + 10% marks.**

| Token            | Hex       | Role                                                          |
|------------------|-----------|---------------------------------------------------------------|
| `--papier`       | #E8DFC9   | Body ground. Warm ivory with green undertone, escapes the AI-cream band. |
| `--papier-fold`  | #DED3B9   | Same paper, faint tint (page-fold effect on alternating panels). |
| `--plomb`        | #16181C   | Graphite ink. Body text on paper; primary dark surface.       |
| `--plomb-encre`  | #0A0C10   | Deepest ink (footer, quote-doc field).                        |
| `--sanguine`     | #A63B22   | Red-conté chalk / iron-oxide construction stamp. Marks, links, sanguine underline, buttons. |
| `--sanguine-lo`  | #7D2914   | Darker sanguine (small text on paper, ≥ 5:1).                 |
| `--bleu-plan`    | #26436B   | Blueprint ink. Rules on paper, 6% wash for grid overlays.     |
| `--vert-atelier` | #4D5540   | Workshop olive. Only ever as a hairline or 12% shadow tint.   |

**Ratios (verified against composited backgrounds):**
- plomb on papier: **14.8 : 1**
- plomb 78% on papier: **9.5 : 1** (body copy)
- sanguine on papier: **5.6 : 1** (marks, links)
- sanguine-lo on papier: **7.3 : 1** (small-caps labels)
- papier on plomb-encre: **14.1 : 1** (dark-surface text)
- bleu-plan on papier: **8.2 : 1**

---
## Typography

Three families, three distinct roles, no overlap.

- **Bricolage Grotesque** (display) — variable, grade + weight axes. French wordplay ("bricolage" is the amateur work DESTPEC replaces with professional). Weight 400/500/700, grade -25 → 25.
- **Public Sans** (body) — humanist warm sans, USWDS-drawn. Weight 300/400/500/600. Body 15.5/1.65 max 68ch.
- **Courier Prime** (technical) — drafting-typewriter DNA. Reserved for measurements, dimensions, reference numbers, coordinates. Never for prose.

Scale (fluid, 1.28 ratio):
- `--type-3xl` clamp(3.4rem, 1.5rem + 6.2vw, 6rem) — hero
- `--type-2xl` clamp(2.4rem, 1.2rem + 3.6vw, 4rem) — section titles
- `--type-xl`  clamp(1.8rem, 1.1rem + 2.2vw, 2.6rem) — subtitles
- `--type-lg`  1.28rem — pull quotes
- `--type-md`  1rem (16px) — body
- `--type-sm`  0.9rem — captions
- `--type-xs`  0.78rem — technical marks (Courier Prime, tracked +0.06em)

Letter-spacing: display -0.03em, body 0, mono/xs +0.06em.

---
## Spacing scale (Modulor-adjacent)

`--sp-1: 4px · --sp-2: 8px · --sp-3: 14px · --sp-4: 22px · --sp-5: 36px · --sp-6: 58px · --sp-7: 94px · --sp-8: 152px`

Section vertical rhythm is deliberately non-uniform: **hero → sp-8, price → sp-7, projects → sp-6, method → sp-5, cta → sp-7** so no two adjacent sections share the same padding. Kills the metronome.

---
## Radius

**0px everywhere.** Paper does not have rounded corners. One exception: the sanguine "stamp" component (a real circle, 50%).

---
## Shadows

**None.** Depth comes from:
- Ink weight (heavier weights advance)
- Hairline rules (1px `--plomb` at 24% or `--sanguine` at 40%)
- Physical overlap (an element visibly overlaps the one behind it, `translateY(-1rem)` + full opaque paper background)
- **Crop marks** in image corners (small L-shaped ticks in `--plomb` 40%, like a printer's proof)

---
## Motion

Precise, technical. Not "smooth ease-out".

- Micro-interactions: 120ms **ease-in-out** (crisp, not sluggish)
- Reveals: 800ms with a `cubic-bezier(0.16, 1, 0.3, 1)` (a pencil-line reveal, not a fade)
- Hero scroll-scrub: continues frame-accurate; no easing on scroll
- Buttons: no scale, no translate. On hover the button gets a **1px inset ring** in `--sanguine` (like a stamp pressed harder).
- Reduced motion: everything instant, no crossfade needed.

---
## Component treatment (structure preserved)

- **Buttons**: 0px radius, filled `--sanguine` (primary) / 1px `--plomb` outline (secondary). Uppercase Courier Prime 11.5px, tracked +0.14em. Inset ring on hover.
- **Cards**: eliminated as visual containers. Content sits directly on paper. Where separation is needed → **cut marks** (L-shapes) at the corners.
- **Dividers**: **dimension marks** — 1px `--plomb` rule with 4px vertical ticks at each end.
- **Images**: full-bleed. Corners get 12px L-tick crop marks in `--plomb` 40%.
- **Section headers**: get a right-margin section mark in Courier Prime (`§ 02`, `§ 03`).
- **Numerals** (prices, measurements, phone): Courier Prime, tabular. This is the "drafting-office DNA" that carries the concept.
- **Focus ring**: 2px `--sanguine`, 3px offset, no blur.

---
## Hero mobile fix

Landscape source (1920×1080) over-crops in 9:16 portrait viewports. Fix: art-direct with a **portrait-oriented sequence** at ≤860px, cropped from the source at 3:4 aspect (810×1080 → downscaled to 720×960 for delivery). The scrubber picks the correct directory based on `matchMedia('(max-width: 860px)')`.
