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
| 4 | Motor / generator | Not started |
| 5 | P, Q, S and PF | Not started |
| 6 | Phasors | Not started |
| 7 | Excitation, δ, stability, V curves (+ qualitative transients) | Not started |
| 8 | Guided lesson | Not started |
| 9 | Presentation mode and social clips | Not started |
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
- Next (Phase 4): MOTOR / GENERATOR selector, load and excitation sliders, energy-flow arrows, continuous motor ↔ generator
  sweep with a locked drawing convention.

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
