# Progress

Handoff log so another agent (or person) can continue. Requirements: [brief.es.md](brief.es.md) (original brief, Spanish).
Physics: [physics-model.md](physics-model.md). Conventions: [sign-conventions.md](sign-conventions.md).
Architecture: [architecture.md](architecture.md).

## Phase status

| Phase | Content | Status |
|---|---|---|
| 1 | Physics model, architecture, documentation, i18n infrastructure | **Done — awaiting checkpoint 1 approval** |
| 2 | Rotating magnetic field | Not started |
| 3 | Machine view (2.5D cross-section) | Not started |
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
| D8 | UI Spanish uses "tensión"; glossary maps Chapman ES "voltaje". | glossary.md |
| D9 | n_sync (EN) / n_sinc (ES) and PF / FP are the only per-language symbols (`d.symbols`). | glossary.md |
| D10 | Clip hook "…gives or takes Q" rewritten with "reactive power" (no symbols in the first line). | storyboard.md |
| D11 | Transients (synchronisation, pull-out) via a per-unit swing equation with illustrative H, D — qualitative. | physics-model.md §14 |
| D12 | Placeholder page is temporary; replaced by the Explore view from Phase 2 on. | App.tsx |

## Open questions for the author (checkpoint 1)

- "tensión" (brief) vs "voltaje" (Chapman ES) in the Spanish UI.
- `es-419` decimal point vs decimal comma.
- Scenario A/B mode assignment (D5).

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
