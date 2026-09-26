# Experience redesign — an explorable essay

Status: **proposal + vertical slice (checkpoint 2b)**. Physics (`src/physics`), sign conventions and their tests are
unchanged; only the presentation layer changes.

## 1. Why

Checkpoint 2 approved the physics and rejected the experience: grey on grey, small text, many saturated colours
competing, a generic dashboard look (bordered cards, small-caps labels, chips, monospace readouts), no hook, everything
at once, and a scroll-jump bug. The product is meant to be **published and shared on X**, so most readers arrive on a
phone, with a few seconds of attention.

New form: an **explorable explanation** in the manner of Bartosz Ciechanowski's articles (ciechanow.ski — *Gears*,
*GPS*, *Internal Combustion Engine*). What we take from them:

- One long page read top to bottom; sections build on each other, each with one idea.
- A large figure right after the idea is introduced; short paragraphs around it.
- Minimal, direct controls: a slider or a drag on the figure itself, a play/pause in a corner.
- Formulas appear late, conversationally, after the reader has seen the behaviour.
- Calm, generous whitespace; colour only on the things being explained.

## 2. Principles

1. **One section, one idea, one figure, 2–4 short sentences.** Readable in under 30 seconds.
2. **Build the machine up piece by piece**: one coil → three coils → the rotating field → poles → the rotor → load →
   motor/generator → powers → excitation → the limit → phasors. Never many panels at once.
3. **Touch before text.** Each figure invites one manipulation that reveals the idea; the prose confirms it.
4. **Formulas after intuition, small.**
5. **The full lab closes the essay** ("The complete machine"), restyled; it is not the front page.
6. **Nothing moves the layout.** Figures and readouts have fixed boxes; numbers use tabular figures; changing texts keep
   their line count.

## 3. Visual direction

- **Background** `#0d0f12` (ink), no cards, no borders around content. Sections are separated by space and a hairline
  only where a figure needs a frame of reference.
- **Text** near-white `#f4f1ea` (17.0:1), secondary `#b9b4a8` (9.3:1), tertiary `#8e897f` (5.5:1, captions only).
- **Figures** are canvas-drawn: thick strokes (3–5 px at 390 px), large labels (≥ 15 px), a soft glow on active fields
  (additive layers, not blur filters, so it stays at 60 fps on phones). Phones: portrait figures (5 : 6) full width;
  desktop (≥ 960 px): wide figures (16 : 10) up to 900 px — machine large on the left, waves on the right — while the
  text column stays at ~65 characters.
- **The field is drawn as a magnet** (review 2b): two lobes hugging the bore, S where flux enters the stator and N where
  it leaves, labelled at their peaks, with flux lines crossing the bore from N to S. From the model's B_r(θ)
  (`statorGapField` = `airGapFluxDensity` with three coils, tested): lobe **thickness ∝ |B_r|** (the flux density, read
  as geometry) and **brightness ∝ B_r²** (the magnetic energy density). With brightness ∝ |B_r| the cosine distribution
  still read as a ring (at 45° from the pole B is 71 % of the peak); the energy mapping makes the neutral zones dark.
  **Visual choice approved at checkpoint 2c**: the glow shows the magnetic energy density B²/2μ₀, the thickness shows the
  flux density itself. Any number of poles: `poles/2` pairs of lobes; with 4+ poles the flux lines curve from each N to
  the S beside it.
- **Two fields, two colours**: §2–§4 draw the field of the stator coils (sky). From §5 on — rotor inside, machine on the
  grid — the lobes are the **net** air-gap field B_net (warm white), which the grid holds fixed; the rotor and B_R are
  orange. The air gap is drawn exaggerated (rotor at 80 % of the bore) so the stretched field lines can be seen.
- **Motion**: slow by default — one rotor turn ≥ 8 s in narrative sections; eased transitions (cubic in-out, 400–700 ms)
  when a figure changes state; nothing snaps. Every figure pauses when it leaves the viewport or the tab is hidden, and
  honours `prefers-reduced-motion` (static frame + manual scrub).

### Palette — one colour per concept

| Concept | Colour | Contrast on `#0d0f12` | Used for |
|---|---|---|---|
| Net field **B_net** ↔ grid voltage **V_φ** | warm white `#f4f1ea` | 17.0:1 | the reference: grid, V_φ, B_net |
| Rotor field **B_R** ↔ **E_A** | orange `#ff9a4a` | 9.1:1 | rotor, its field, E_A |
| Stator field **B_S** ↔ current **I_A** | sky `#40c4ff` | 9.6:1 | stator currents' field, I_A |
| Active power **P** | lime `#b5e35a` | 12.9:1 | energy that stays |
| Reactive power **Q** | pink `#ff6f9f` | 7.3:1 | energy that goes and comes back |
| Phases **a / b / c** (sections 3–4 and the lab only) | red `#ff6b6b` · yellow `#ffd24a` · green `#3ddc97` | 6.9 · 13.3 · 10.9 :1 | the three coils and their currents |

No violet. Everything else is neutral (steel `#2a2f37`, hairlines `#3a3f47`).

Validation (dataviz validator, dark, surface `#0d0f12`, all pairs):
- Concept set {orange, sky, lime, pink}: normal-vision floor ΔE 16.2 (pass); worst CVD ΔE 7.3 lime↔orange (floor
  band — legal because every mark is directly labelled, and lime and orange never share a figure in the essay).
- Phase set {red, yellow, green} + sky resultant: CVD ΔE 8.1, normal ΔE 18.2 (pass).
- Warm white is a deliberate neutral (the reference), so it is outside the categorical checks.
- **Deliberate deviation**: all hues sit above the validator's dark *fill* lightness band (L 0.48–0.67). They are
  strokes, particles and glows on near-black, not area fills; brighter values give ≥ 6.9:1 contrast, which the author
  asked for. Labels never use these colours — text is always in the neutral inks.

### Typography

- Prose and headings: **Source Serif 4** (variable, self-hosted, latin + greek subsets ≈ 50 KB each).
  Body 19 px on phones / 21 px on desktop, line height 1.6, measure ≈ 65 characters (`max-width: 34em`).
  Headings semibold, sentence case — no small caps, no letter-spaced labels.
- Numbers only: **IBM Plex Mono** 500 with `font-variant-numeric: tabular-nums`, in fixed-width slots.
- Symbols (V_φ, B_R, δ) in the serif italic with real subscripts.

## 4. The scroll bug — cause and rule

Measured with Playwright on the old lab at 390 px: the document height never changed, yet `scrollY` drifted by up to
130 px per second without any input. Cause: **scroll anchoring**. The browser picks an element near the top of the
viewport as its anchor; it picked an SVG group of the rotating machine, whose bounding box changes every frame, so the
browser "corrected" the scroll position every frame.

Rules for every figure:
- `overflow-anchor: none` on figures (and animated SVG), fixed `aspect-ratio` boxes, canvas drawing (no DOM change per
  frame), readouts in fixed-width tabular slots, and text that changes keeps its line count.
- **Test** (`npm run test:layout`): Playwright + the installed Edge/Chrome loads the built page at 390 × 844 and
  1280 × 800, parks the scroll mid-page, and samples document height and `scrollY` for several seconds of animation;
  any change fails.

## 5. The hook (first screen)

A large machine fills the screen, no controls, playing a loop that shows the headline literally (review 2b):
**empty stator → the three currents fade in and a magnet (N and S lobes) turns inside the empty machine → a rotor
appears and locks onto it → they turn together → fade and restart** (22 s; `hookSequence.ts`, tested for continuity).
The same loop is the main clip for X: `?view=hook-clip` (square stage with captions synced to the stages) and
`scripts/record.mjs` (1080 × 1080). The stator field always comes from the model; the rotor's pull-in is a qualitative
damped approach. Three candidate lines:

1. **"Every generator on the grid turns in perfect step. How can the same machine be a motor or a generator without
   changing a single wire?"** (the author's example, tightened)
2. **"Three coils that never move make a magnet that spins."** (curiosity through paradox; leads straight into §2–3)
3. **"Push this machine and it lights a city. Pull on it and the city turns it."** (motor/generator symmetry, concrete)

The slice uses (2) as the headline and (1) as the standfirst, because (2) is answered by the very next two sections and
(1) promises the whole essay. Easy to swap.

Review 2c: in the essay the loop opens with the magnet already turning and never shows the empty stator (essay variant:
field → rotor appears → locks on → locked → only the rotor fades; tested). The empty-stator opening stays in
`?view=hook-clip`, whose N / S letters are enlarged (×1.7) to read inside X on a phone.

## 6. Essay map (with adjustments)

| # | Title (EN) | Idea | Figure & manipulation |
|---|---|---|---|
| 1 | Hook | Three fixed coils make a spinning magnet; the same machine can motor or generate | Big machine, slow, no UI |
| 2 | One coil | A current makes a field along the coil's axis; alternating current makes it **pulse**, not turn | Coil cross-section, field arrow + air-gap glow; drag the current dot along its wave (or let it play) |
| 3 | Three coils | Three pulses 120° apart **add into one field that turns** at constant strength | First each component pulses on its own axis; after 5 s they slide (eased) tip to tail and the sum appears — translucent with an outline, under the components — with the exact locus of its tip; a button toggles the two views; tap coils on/off; scrub time ★ |
| 4 | More poles, slower | n_sync = 120 f / poles: same frequency, more poles, slower turn | − / + poles (2–8) under the figure, readout "6 poles · 1,200 rpm at 60 Hz"; the field cross-fades; the three currents never change ✔ |
| 5 | The rotor | A magnet in the (white) net field locks on at exactly synchronous speed | Drag the rotor off (the field pauses while held), release: a damped swing (qualitative swing equation) brings it back; past 180° it slips a pole and locks on again ✔ |
| 6 | Load | A load makes the rotor fall back by δ; the "magnetic spring" stretches ★ | Drag the rotor or along the P–δ curve (0–89°, peak at 90°, dashed beyond); readout δ, P from operatingPointAtDelta ✔ |
| 7 | Motor or generator | Push δ the other way and energy reverses — same machine, same wires | Same figure, signed δ (−89° … 89°), curve −120° … 120°; readout "generator · shaft → grid" ✔ |
| 8 | One phase | Voltage and current waves; their product is instantaneous power | Scrub; phase-shift slider |
| 9 | P and Q | Part of the energy stays (P), part goes and comes back (Q); the three-phase total is constant ★★ **energy particles** | Particle flow grid ↔ machine ↔ shaft, per phase; excitation / PF slider |
| 10 | S and power factor | Q costs current; same P, lower PF → more current | Current bar + triangle |
| 11 | The excitation knob | Over-excited delivers Q, under-excited absorbs it — motor or generator | I_F slider at constant P; particles show who supplies Q |
| 12 | The limit | Beyond δ = 90° the spring breaks: loss of synchronism. **Explicit moment: 0.70 lagging at 100 kW → P/P_max = 99 %** (under-excitation limit) | Push until the rotor slips (qualitative transient) |
| 13 | Phasors | The same story in one drawing; δ and θ linked to the machine and triangle | Phasor diagram with the linked arcs |
| 14 | The complete machine | Everything together | The lab, restyled |

Adjustments to the author's map: §5 gets the "snap back" interaction (it is the clearest way to feel synchronism);
§7 keeps δ as the single control so motor/generator is literally the same gesture; §12 hosts the requested
under-excitation moment; the old Phase 7 content (V curves, stability) is split between §11, §12 and the lab.

## 7. Star moments

1. **Energy as particles (§9).** Particles stream between grid, machine and shaft. Their density and direction follow
   the model's instantaneous power: per phase, `p(t) = P_φ(1 + cos 2ωt) + Q_φ sin 2ωt` (from `instantaneous.ts`).
   With pure P they flow one way and stay; with Q, each phase's particles surge back and forth twice per cycle; the
   three-phase total — drawn as the shaft stream — stays perfectly steady. Physically faithful: the emitted particle
   rate is proportional to p(t) sampled every frame, never a canned animation.
2. **Three pulses become one rotation (§3).** Each coil's field pulses along its own axis in its own colour; faint
   copies slide tip-to-tail and their sum — a single sky-blue arrow of constant length — turns, its tip leaving a fading
   circular trail. Tap a coil off and the circle collapses into an ellipse or a line.
3. **The magnetic spring (§6, §12).** Between the rotor pole and the net field, curved field lines stretch as you drag
   δ; the torque needle rises like a spring force — sin δ — peaks at 90°, and past it the lines snap and the rotor slips a
   pole.

The hook uses the same renderer as (2), so the first thing a reader sees is already the signature look.

## 8. Mobile first

- Designed at 390 px, then widened: figures are full-bleed on phones (max 720 px on desktop), prose column 34em.
- Pointer events for drag; `touch-action: pan-y` on figures so vertical page scroll still works, and horizontal drags go
  to the figure. Targets ≥ 44 px.
- No hover-only information; linked highlights also respond to taps.

## 9. Performance budget

- Essay initial JS ≤ 120 KB gzip; the full lab (§14) is **lazy-loaded** when the reader approaches it.
- Two font files preloaded (serif latin, mono latin); greek subset loads on demand via `unicode-range`.
- Canvas at devicePixelRatio ≤ 2; one requestAnimationFrame loop per visible figure; figures off-screen or in a hidden
  tab do no work.
- Target: first render < 3 s on a mid-range phone on 4G (checked with Lighthouse mobile before publishing).

## 10. Publishing (prepared, not published)

- GitHub Pages at `https://giovanni-serrano.github.io/synchronous-machine-EN-ES/`; Vite `base` set for the Pages build.
- Workflow `.github/workflows/deploy.yml` runs **only on manual dispatch** until the author approves publishing.
- Open Graph image 1200 × 630 (`public/og.png`), title and English meta description in `index.html`.
- See `docs/publishing.md`.

## 11. Presentation mode and clips

Built later on top of the essay sections: each section's figure can render on a fixed stage (16:9, 1:1, 9:16) driven by
a scripted timeline, reusing the same renderers.

## 12. Plan

1. **Checkpoint 2b — vertical slice**: hook + §2 + §3 in the final style, EN and ES, the scroll fix and the layout test,
   publishing prepared. *Stop for review.*
2. Sections 4–7 (machine and δ).
3. Sections 8–11 (powers, star moment 1).
4. Sections 12–13, the restyled lab (§14).
5. Presentation mode and clips; polish; publish on approval.
