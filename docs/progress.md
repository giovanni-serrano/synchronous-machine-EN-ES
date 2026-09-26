# Progress

Handoff log so another agent (or person) can continue. Requirements: [brief.es.md](brief.es.md) (original brief, Spanish).
Physics: [physics-model.md](physics-model.md). Conventions: [sign-conventions.md](sign-conventions.md).
Architecture: [architecture.md](architecture.md).

## Phase status

| Phase | Content | Status |
|---|---|---|
| 1 | Physics model, architecture, documentation, i18n infrastructure | Done — CP1 approved |
| 2 | Rotating magnetic field | Done (+ coil-axes enhancement) |
| 3 | Machine view (2.5D cross-section) | **Done** |
| 4 | Motor / generator | **Done** |
| 5 | P, Q, S and PF | **Done** |
| 6 | Phasors | **Done** — CP2: physics approved, experience rejected |
| 2b | **Explorable essay** (replaces 7–8): vertical slice hook + §2 + §3, scroll fix, layout test, publishing prepared | Done — CP2b reviewed |
| 2c | Review fixes: field as a magnet, readable components, hook loop, big desktop figures, own ending | Done — approved |
| E1 | Essay batch 1: §4 poles, §5 rotor, §6 load and δ, §7 motor or generator (+ hook opens on the magnet, bigger clip letters) | **Done — awaiting review** |
| E2 | Essay batch 2: §8–§11 (voltage and current, P and Q with energy particles, S and PF, excitation) | Not started |
| E3 | Essay batch 3: §12–§14 (stability limit, phasors, the complete machine restyled) | Not started |
| 7 | Excitation, δ, stability, V curves → essay §11–12 and the lab | Not started |
| 8 | Guided lesson → replaced by the essay (docs/experience-redesign.md) | Replaced |
| 9 | Presentation mode and social clips (built on the essay sections) | Not started |
| 10 | Polish and validation | Not started |

Checkpoints: **CP1** after Phase 1 (mandatory, wait for approval before building the interface).
**CP2** at the first functional milestone (machine running, motor/generator switch, load and excitation, readouts,
phasors and power triangle in sync, EN/ES) — stop and wait for feedback before Phases 8–10.

## Phase 1 — delivered

- Vite + React 19 + TypeScript 7 + Vitest 5 scaffold (`npm install`, `npm run dev`, `npm test`, `npm run build`).
- `src/physics/`: complete steady-state model (solver, single internal→Chapman conversion, grid view, PF→I_F solver,
  V curves, constant-power loci, P–δ curve, instantaneous power, rotating field, field space vectors, per unit,
  scenarios A–G).
- `src/i18n/`: typed EN (source of truth) and ES dictionaries, shared symbols/units, provider, `?lang=` support;
  `src/format/`: Intl formatting; `src/app/urlParams.ts`: all URL options of the brief.
- Placeholder page: scenario table read straight from the model, EN/ES switch.
- Tests: 97 passing (physics per brief §14, i18n key parity, URL/format, render smoke test in both languages).
- Docs: physics model, sign conventions, architecture, learning objectives, storyboard (draft), glossary, this file,
  README (EN) and README.es.md.

## Phase 2 — delivered

- Rotating-field lab (`src/ui/fieldLab/`), the page's current content (lesson scenes 2–3, demos A–B):
  - cross-section with the coil sides of a, b, c (dot/cross by the sign of the current, fill by its size), radial
    air-gap flux arrows, stator pole faces N/S, and the resultant B_S (2 poles);
  - electrical space-vector diagram: each phase's pulsating contribution on its axis, resultant on its 1.5 B_M locus,
    optional tip-to-tail sum;
  - i_a, i_b, i_c over one cycle with a moving cursor, hover values, and drag-to-scrub;
  - controls: play/pause, ±5° frame step (also Space / ← →), speed ×0.25–×2, 50/60 Hz, 2/4/6/8 poles, per-phase and
    resultant toggles; readouts n_sync, ωt, mechanical field position, slow-motion note.
- Physics: `airGapFluxDensity`, `statorPoleFaces`, `windingConductors` (Biot–Savart consistency test).
- Animation clock module (physical time + slow-motion scale), tested.
- Palette in `src/ui/theme.ts`, validated with the dataviz validator.
- Placeholder scenario table removed (D12); `phase1` dictionary keys removed.
- Checked in a real browser (Edge headless screenshots): desktop 1440 px EN/ES, 2 and 4 poles, and a true 390 px layout
  (iframe probe: no horizontal overflow). Note: headless Edge does not shrink its window below ~496 px, so phone widths
  must be tested through an iframe.
- Tests: 110 passing.
- Enhancement (requested after Phase 2): coil magnetic axes +a/+b/+c drawn in the cross-section with the same colours and
  labels as the vector diagram; hovering or focusing a coil highlights its axis in both panels; note "the field of a coil
  is perpendicular to the plane of its conductors". Physics: `coilAxes` (tested against the conductor positions).

## Phase 3 — delivered

- Section tabs: **The machine** (default) and **Rotating field**.
- `src/ui/machine/MachineView.tsx`: full cross-section — stator (shared `StatorDrawing`, now with the real instantaneous
  phase currents of the operating point), net air-gap flux, rotor with salient poles drawn (note: cylindrical-rotor
  model), field winding with its current direction, shaft with keyway, B_R / B_S / B_net arrows (tip-to-tail sum for
  2 poles), δ arc between B_net and B_R in mechanical degrees, direction of rotation.
- `src/ui/machine/MachineLab.tsx`: operating point from scenarios A–G, poles 2/4/6/8, readouts (δ mechanical and
  electrical with "E_A leads/lags V_φ", mode, n_sync, I_F, E_A, I_A, P/P_max), toggles doubling as legend, notes
  (δ between B_R and B_net, δ/(poles/2) with live values, vector sum, salient drawing, rotation, slow motion).
- `src/animation/snapshot.ts`: time-dependent picture of the steady state (tested, see physics-model.md §13.1).
- Shared `TransportControls` / `useTransportKeys`.
- Checked in Edge: scenario A (motor, 4 poles) and B (generator, 2 poles) in EN/ES; label collisions fixed.
- Tests: 124 passing.
- **Legibility revision (requested after Phase 3 review):**
  - B_R, B_S, B_net lengthened (58 px per flux pu: B_net reaches the pole shoes, the rating-point B_R the air gap;
    true ratios kept; never past the bore, even at I_F = 10 A).
  - All geometry moved to `src/ui/machine/machineLayout.ts` (pure) with a greedy label placer
    (`src/ui/labelLayout.ts`). Tests sweep scenarios A–G × 2/4/6/8 poles × 24 instants: no label touches another label,
    a rotor pole letter, a field-winding conductor or an arrow shaft.
  - Rotor pole letters moved to the pole tips (off the pole axis, so never under B_R).
  - δ arc larger (r 50–64 px, outside the field-coil ring), gold, with a two-line value label "δ = 20.5° / mech."
    placed as close to the arc as the arrows allow; a thin leader line joins them when the label had to move more than
    20 px away (tested: always ≤ 60 px from the arc, leader present beyond 20 px).
  - New inset for 4+ poles: B_R + B_S = B_net tip-to-tail in electrical degrees at the same instant, with δ electrical;
    fixed frame, zoom constant while rotating; note bridging to the phasor diagram (voltage = field turned −90°).
  - Dark halo on SVG labels.
  - Verified in Edge: 2 and 4 poles, EN and ES, and 390 px (iframe probe, no horizontal overflow).
- New test (for Phase 4): stator dots/crosses show the physical (internal) current and never depend on the convention
  used to present I_A (`tests/snapshot.test.ts`).

## Phase 4 — delivered

- Machine controls: prominent MOTOR / GENERATOR selector, shaft-load slider (label "Shaft load" / "Prime-mover power"
  by mode, 0–150 kW), rotor excitation I_F (0–10 A, shows E_A), poles, presets A–G (highlighted when the controls match).
- Continuous motor ↔ generator: one signed shaft-power slider (−150…+150 kW, tick at zero) with the drawing convention
  locked (user-selectable, default generator) so I_A never jumps; "Auto sweep" drives it smoothly through zero (demo H).
  The mode label changes when P crosses zero; δ and P change sign continuously.
- Energy-flow panel Grid ↔ Machine ↔ Shaft: P (solid) and P_mech arrows, Q (dashed, moving dashes) with values; thickness
  ∝ magnitude; directions from the convention-free `energyFlow()` (physics, tested); energy chain sentence per mode;
  note that no net energy travels with Q; lossless note.
- Status banners: near the stability limit (with "less excitation lowers P_max"), stator overcurrent, field
  over-excitation, loss of synchronism (no steady state; hint to lower the load or raise I_F). The qualitative pull-out
  animation remains Phase 7.
- Operating-point readouts add τ_ind with "drives the rotor / opposes the rotation" and the active convention indicator.
- Stator dots/crosses follow the physical current and never flip with the convention (test added before this phase).
- Verified in Edge: motor (EN), generator (ES), loss of synchronism, continuous mode (ES), 390 px EN/ES without overflow.
- Tests: 141 passing.
- Polish backlog (Phase 10): energy-flow labels are small at phone width.

## Phase 4 review — layout adjustments

- Desktop: the energy-flow panel moved under the cross-section (left column), so fields and energy arrows are visible
  together when the mode changes. Measured column bottoms at 1400 px: left 1357 px, right 1376 px (EN 1396 / 1399);
  balanced from 1200 px up. Between 901 and 1180 px the 4-pole inset becomes a horizontal strip under the cross-section
  (diagram | note) — the left column is still ~300 px longer there, accepted.
- One column (≤ 900 px): both columns are flattened (`display: contents`) so the order is cross-section, controls,
  energy flow, operating point, playback — controls stay close to the machine on phones. No horizontal overflow at 390 px.
- The torque action is part of the torque row: "530.5 N·m · drives the rotor" / "· opposes the rotation".
- Energy-flow viewBox trimmed to its content (less empty band above and below).
- Smoke test checks the column placement and the merged torque row.

## Phase 5 — delivered

- `powerTriangle(op, modeConvention)` in `presentation.ts`: S = P + jQ in the convention of the **active mode** (the
  one that decides lagging / leading), so "up" always means lagging, motor or generator; independent of a locked drawing
  convention (tested against `presentOperatingPoint` for both locked conventions).
- `armatureCurrentAtPf(|P|, V_φ, PF)` in `excitation.ts`: I_A = |P| / (3 V_φ PF).
- **Power panel** (right column, below the controls):
  - Triangle on the complex plane — P along Re (violet, solid), jQ vertical (red, dashed as in the energy flow), S from
    the origin (neutral), θ arc, dashed rated-S circle. Fixed scale (1 pu = 80 px), zooms out ×½ only if the triangle
    would leave the plot. θ is labelled "θ" at its arc; its value is in the PF line next to the plot.
  - PF line, what "Q > 0" means in the active convention, "seen from the grid" and the unifying idea.
  - S = P + jQ explained: real part = energy delivered on average; imaginary part = energy exchanged with the fields;
    j = a 90° rotation; |S| = 3 V_φ I_A sizes the machine.
  - **PF targets** 1.00 / 0.90 lagging / 0.90 leading / 0.70 lagging: the model solves I_F at the present P (the
    excitation slider moves by itself); disabled at P = 0; a warning shows the required I_F if it is beyond the field
    limit.
  - **Same P, lower PF → more current**: I_A bars for "now", PF 1.00, 0.90, 0.70 against the rated current.
- **Layout**: operating-point readouts are now a full-width strip under both columns (brief §8), with P, Q (magnitude +
  delivers/absorbs, convention-free), S, PF (lagging/leading), θ (I_A lags/leads V_φ), δ inside and between E_A and V_φ,
  n_sync, I_A, τ_ind, P/P_max. Playback moved under the cross-section, next to what it animates.
  At 1400 px the left column ends ~165 px above the right one; to be rebalanced in Phase 6 with the phasor diagram.
- Tests: power triangle physics (|S|² = P² + Q², over/under-excited orientation in both modes, PF targets round trip,
  hand-calculated currents 120.28 / 133.64 / 171.83 A at 100 kW), triangle label layout (no overlaps, inside the plot,
  over the whole slider range, EN and ES). Mutation check: forcing the generator convention in `powerTriangle` makes 8
  of 15 power tests fail. 160 tests passing.
- Verified in Edge: motor 0.70 lagging (EN), motor 0.90 leading (ES), desktop 1400 px and 390 px without overflow.
- Polish backlog (Phase 10): the PF bar labels are also small at phone width.

## Phase 6 — delivered

- **Phasor diagram** (right column, between the controls and the powers panel), recomputed from
  `presentOperatingPoint()` on every change: V_φ on the positive real axis; E_A, I_A, jX_S I_A in the machine /
  triangle colours (V_φ light, E_A orange, I_A aqua, jX_S I_A grey dashed). The jX_S I_A arrow closes Chapman's equation
  tip-to-tail in the drawing convention (generator: V_φ → E_A; motor: E_A → V_φ). Voltages share one scale, I_A has its
  own; the scale steps down (×0.75, …) only if a phasor would leave the plot; user zoom ×1 / ×1.5 / ×2.
- Beside it: the active equation, the convention indicator, magnitudes (V_φ, E_A, I_A, X_S I_A) and δ / θ with
  leads / lags. Toggles: each vector, names, angles.
- θ is drawn only in the active mode's convention (PF is defined there); with a locked drawing convention a note says so.
- Note on the conjugate: a lagging I_A is below V_φ while lagging Q is up in the triangle (S = 3 V_φ I_A*).
- **Linked angles** (`LinkedArc`, shared `AngleLink` state in MachineLab): hovering or focusing θ lights θ in the
  phasor diagram and the triangle; δ lights δ in the phasor diagram, the cross-section and the 4-pole inset. Works both
  ways, with the keyboard too (arcs are focusable buttons with accessible names).
- **Layout**: right column = controls, phasors, powers; left column = cross-section, energy flow, "same P, lower PF"
  bars; full-width readouts strip below. Column bottoms at 1400 px: 1882 / 1901 px; 1920 px: 1918 / 1907; 1280 px: 138 px
  apart. Phone order: cross-section, controls, energy flow, phasors, powers, current bars, readouts; no overflow at 390 px.
- **Performance fix**: the steady state (`solveMachine`, presentation, triangle, energy flow) is memoised on the inputs
  and the phasor / power / current / energy-flow panels are `memo` components, so animation frames only redraw the
  cross-section. Found while screenshotting: with Q ≠ 0 every frame re-ran every label placer (5 s of virtual time took
  27 s in headless Edge; now 1.3 s).
- Tests: phasor geometry over the slider range with automatic and both locked conventions (V_φ horizontal, tip-to-tail
  closure, jX_S I_A ⟂ I_A, labels without overlaps and θ / δ within 50 px of their arcs, θ only in the mode convention,
  scale steps); linked highlights per view. 167 tests passing.
- Noted for Phase 7 (author's request): the 0.70-lagging case at 100 kW (P / P_max = 99 %) becomes an explicit lesson
  moment on the under-excitation limit — see storyboard.md, scene 12.
- Polish backlog (Phase 10): the phasor labels are small at phone width too.

## Checkpoint 2 — outcome

Physics approved; experience rejected (low contrast, dashboard look, no hook, everything at once, scroll jumping). New
direction: a Ciechanowski-style explorable essay, mobile first, for sharing on X — see
[experience-redesign.md](experience-redesign.md). `src/physics`, the conventions and all physics tests are unchanged.

## Checkpoint 2b — vertical slice delivered

- **Essay shell** (`src/essay/`): hook, §2 *One coil*, §3 *Three coils*, "Next: the rotor" with a link to the lab
  (`?view=lab`, lazy-loaded chunk). EN written natively, ES adapted; all copy in the typed dictionaries (`essay`
  namespace, parity tests).
- **Figures in canvas** (`useCanvasFigure`): fixed-aspect boxes, one rAF loop per figure, paused off-screen and in hidden
  tabs, DPR ≤ 2, reduced motion = paused + scrub. Pointer drag on the wave strip (`touch-action: pan-y` keeps page
  scroll), tap on a coil, keyboard (space, ← →, 1 2 3), play/pause button.
- **Physics reused**: `PHASE_AXES`, `windingConductors`, `statorField`, `sinusoidalGapField`. The three-coil trail is the
  exact locus of the sum over the last cycle (circle / ellipse / line), not a frame history.
- **Star moment in the slice**: "three pulses become one rotation" (§3).
- **Scroll bug**: cause found with Playwright — scroll anchoring picked a rotating SVG element and re-scrolled every
  frame (up to 130 px/s on phones) while the page height never changed. Fixed with `overflow-anchor: none` on figures
  (essay) and on SVG (lab). `npm run test:layout` checks height and scrollY while animating, phone and desktop, EN/ES
  and the lab; mutation check: removing the lab fix makes it fail (scrollY 366 → 499 → 375 px).
- **Performance** (`npm run perf`, slow 4G, CPU ×4): FCP 1.2 s, LCP 1.2 s, 112 KB transferred.
- **Publishing prepared** (not published): Pages base path, OG image 1200 × 630, meta tags, manual workflow —
  [publishing.md](publishing.md).
- Scripts: `capture.mjs` (review screenshots), `record.mjs` (phone video of a star moment), `make-og.mjs`, `perf.mjs`,
  `check-layout-stability.mjs` — all with `playwright-core` and the installed Edge.
- Tests: 170 (physics unchanged; smoke tests now cover the essay and the lab).

## Checkpoint 2b — review and fixes (2c)

Kept: typography, contrast, column, tone. Fixed:
1. **Field as a magnet** — N and S lobes from the model's B_r(θ) (`fieldModel.ts`, tested equal to
   `airGapFluxDensity`), thickness ∝ |B_r|, brightness ∝ B_r² (see experience-redesign.md §3), flux lines N → S, letters at
   the peaks. Hook and §3 turn; §2 pulses on the coil axis.
2. **§3 components readable** — thicker, each pulsing on its own (dotted) axis first; after 5 s they slide tip to tail
   (eased) and the sum appears translucent with an outline, drawn under them; a button switches views. Vector scale
   reduced (sum = 0.66 r_bore) so arrows never touch the N/S letters.
3. **Hook no longer contradicts itself** — loop: empty stator → magnet turning alone → rotor appears and locks on
   (`hookSequence.ts`, continuity test). `?view=hook-clip` + `record.mjs` produce the 1080 × 1080 clip for X.
4. **Desktop** — figures 16 : 10 up to 900 px (machine left, waves right); hook figure up to 88 % of the viewport height.
5. **Ending** — "Next: the rotor — coming soon", no link to the old lab (still reachable with `?view=lab` for development).
- OG image now shows the magnet alone in the empty machine (the headline's claim).
- Checks: 175 tests; layout stability OK (phone + desktop, EN/ES, lab); perf LCP 1.18 s, 114 KB (slow 4G, CPU ×4).

## Essay batch 1 — delivered (§4–§7)

- Review 2c items: the essay hook opens with the magnet already turning (essay variant of the loop, tested: never the
  empty stator, field always on); the clip's N / S letters are 1.7× larger; B² brightness documented as an approved
  visual choice.
- **§4 More poles, slower field** (`PolesFigure`): windingConductors(poles) and airGapFluxDensity(θ, ωt, poles), 2–8
  poles with − / + buttons in a fixed-height bar (readout "6 poles / 1,200 rpm at 60 Hz"), cross-fade on change, same
  current waves. Tested: S peaks every 360°/(poles/2), rotation ω/(poles/2), n_sync = 7200 / poles at 60 Hz.
- **§5 The rotor** (`RotorFigure`): salient rotor with N/S letters in the net field (white), drag to pull it off (field
  paused while held), release → damped swing (qualitative: δ'' = −K sin δ − D δ'), slipping a pole if pushed past 180°.
- **§6 The load** and **§7 Motor or generator** (`LoadFigure` variants): the model's operatingPointAtDelta with E_A of
  scenario A (367 V), fieldVectors for B_R / B_net, δ arc, "magnetic spring" lines whose tension follows |sin δ|, a
  draggable P–δ curve (dashed past ±90°), readouts δ, P and energy direction. Tested: P_max ≈ 152.6 kW, δ = 41° → 100 kW,
  B_R behind B_net for a motor and ahead for a generator.
- `magnetField` generalised to any number of poles; `salientRotor` and `poleLetters` shared in draw.ts.
- Recordings (`scripts/record.mjs` modes poles, rotor, load, motor-gen, hook) — phone-sized WebM.
- Checks: 185 tests; layout stability OK; perf LCP 1.27 s, JS 99 KB gzip.

## Decisions log

| # | Decision | Where |
|---|---|---|
| D1 | Internal convention = Chapman generator convention with signed δ; one conversion function. | sign-conventions.md |
| D2 | Frequency: coherent scaling X_S ∝ f, E_A ∝ f (P_max independent of f at fixed V_T, I_F). f exposed mainly in field/speed scenes. | physics-model.md §9 |
| D3 | Field constant: I_F = 5 A gives rated V_φ at no load; slider 0–10 A; field limit = rated kVA at PF 0.8 lagging → 8.36 A. | physics-model.md §2, §10 |
| D4 | "Near limit" status at P/P_max ≥ 0.9 (pedagogical threshold). | physics-model.md §7 |
| D5 | Scenario A = motor, B = generator at its rating point (brief left the mode open). | physics-model.md §15 |
| D6 | Crossing P = 0: optional locked drawing convention, or sweep with E_A = V_φ. | sign-conventions.md §5 |
| D7 | Spanish number locale `es-419` (decimal point). | glossary.md |
| D8 | Spanish UI and glossary use "voltaje" (Chapman ES), not "tensión" — approved at CP1. | glossary.md |
| D9 | n_sync (EN) / n_sinc (ES) and PF / FP are the only per-language symbols (`d.symbols`). | glossary.md |
| D10 | Clip hook "…gives or takes Q" rewritten with "reactive power" (no symbols in the first line). | storyboard.md |
| D11 | Transients (synchronisation, pull-out) via a per-unit swing equation with illustrative H, D — qualitative. | physics-model.md §14 |
| D12 | Placeholder page is temporary; replaced by the Explore view from Phase 2 on. | App.tsx |
| D13 | P means active power only. The number of poles is always written out ("Poles / Polos" in the UI, `poles` in code, "poles" in formulas: n_sync = 120 f / poles). | glossary.md |
| D15 | Dark theme only; per-quantity palette validated per panel; labels always carry identity. | src/ui/theme.ts |
| D16 | Stator pole faces: N where flux leaves the stator, S where it enters; the resultant points at an S face. | physics-model.md §12 |
| D17 | Slow motion ×1 = 120× slower than real time (one 60 Hz cycle per 2 s); the clock keeps physical time. | physics-model.md §16 |
| D18 | Field lab opens with 2 poles (single resultant across the bore); the machine views will default to the reference 4 poles. | RotatingFieldLab.tsx |
| D19 | "The machine" is the default tab (the machine is the visual protagonist, brief §7); the field lab stays one click away. | App.tsx |
| D20 | Until Phase 4 the machine view is driven by scenarios A–G; it defaults to scenario A at the reference 4 poles. | MachineLab.tsx |
| D21 | The power triangle is drawn in the active mode's convention (P ≥ 0, up = Q > 0 = lagging), like PF; the readouts strip shows P and Q as magnitudes with delivers/absorbs (grid view). | presentation.ts, PowerPanel.tsx |
| D22 | Operating-point readouts form a full-width strip under both columns; playback sits under the cross-section. | MachineLab.tsx |
| D23 | In the triangle θ is labelled by its letter only; its value is in the PF line (labels would otherwise be as large as the triangle). | PowerTriangle.tsx |
| D24 | Phasor diagram in the right column between controls and powers: δ is then on screen with the cross-section, and θ with the triangle. The PF current bars moved under the energy flow to balance the columns. | MachineLab.tsx |
| D25 | Both θ and δ arcs use the accent colour in every view; the letter label, not the colour, tells them apart. | LinkedArc.tsx |
| D26 | Essay figures are canvas, not SVG: no DOM change per frame (layout can't move), cheap glow, 60 fps on phones. | src/essay/canvas |
| D27 | Palette per concept (experience-redesign.md §3); hues deliberately brighter than the validator's dark fill band — they are strokes and glows on near-black, labels stay neutral. | src/essay/theme.ts |
| D28 | Hook headline "Three coils that never move make a magnet that spins." (alternatives in experience-redesign.md §5). | en.ts |
| D29 | Field lobes: thickness ∝ |B_r|, brightness ∝ B_r² (energy density) so N and S read as separate poles. | draw.ts magnetField |
| D30 | Hook loop timeline is a pure function of loop time (hookSequence.ts): essay, clip view, recordings and stills agree. | hookSequence.ts |
| D31 | From §5 on the lobes show the net field B_net (white) — the grid holds it — and the rotor field B_R is orange; the air gap is drawn exaggerated. | rotorScene.ts |
| D32 | §5–§7 figures use two poles (mechanical = electrical angles); the reference machine's 4 poles return in the lab. Torque is not shown there (it depends on the pole count); P is. | rotorScene.ts |
| D33 | The rotor's return in §5 is a qualitative swing equation, like the transients planned for §12. | RotorFigure.tsx |
| D14 | Licensing: code MIT (LICENSE); texts and docs CC BY 4.0 (LICENSE-CC-BY-4.0.txt). Chapman is cited, never reproduced. | README.md |

## Checkpoint 1 — outcome (approved)

Approved with adjustments: "voltaje" in Spanish (D8), `es-419` kept (D7), decisions D5, D9, D10 approved, poles notation
(D13), licenses (D14), remote `origin` = <https://github.com/giovanni-serrano/synchronous-machine-EN-ES>.

**Mutation check of the continuity test** (requested at CP1). A 180° jump of I_A at P = 0 was injected temporarily,
the suite was run, and the change was reverted with `git checkout` (files verified identical to HEAD afterwards):

| Mutation | Injected in | Result |
|---|---|---|
| A: internal I_A negated for P < 0 (a "two internal conventions" bug) | `solve.ts` | **Fails** `continuity › δ, P and I_A change sign smoothly`: step of 55.43 A vs chord ≤ arc bound 0.60 A. Also fails the locked-convention drawn-I_A test. |
| B: locked drawing convention ignored (drawn I_A follows the mode) | `presentation.ts` | **Fails** `continuity › the DRAWN I_A is continuous when the drawing convention is locked`: step of 54.83 A vs bound 0. |

Before this check only the internal I_A was covered, so mutation B would have gone unnoticed; three tests were added for
the drawn I_A (locked convention; E_A = V_φ sweep with automatic convention; and a test documenting that the automatic
convention flips the drawn I_A when I_A ≠ 0 at P = 0). After reverting, all 100 tests pass.

## Future improvements (not in v1)

- **P–Q capability curve** (brief §3.6.1).
- Optional lossy mode (R_A ≠ 0, mechanical losses).
- Salient-pole model (d/q reactances, reluctance torque).
- Saturation (OCC) and saturated V curves.
- Finite grid / AVR / governor.

## How to continue

1. `npm install && npm test` — everything must be green.
2. Read `docs/architecture.md`, then `src/physics/index.ts` (public API).
3. New UI code reads `MachineState` via the public API; never compute physics in components.
4. Every visible string goes into `src/i18n/en.ts` first, then `es.ts` (TypeScript will insist).
5. Commit at the end of each phase with a descriptive message; no pushes or remotes unless the author asks.
