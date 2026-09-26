# Architecture

Stack: TypeScript, React 19, Vite 8, Vitest 5. SVG/Canvas for all drawing (React Three Fiber only if a scene clearly
benefits; not planned for v1). No state-management or i18n libraries.

## Principles

1. **One physical state.** `MachineInputs` → `solveMachine()` → `MachineState`. Pure functions, no React.
2. **Visuals only read.** Components never compute physics; they read `MachineState` and the animation clock.
3. **One conversion.** Internal convention → Chapman presentation happens only in `presentOperatingPoint()`.
4. **Time is separate.** Steady-state physics has no time. A separate animation module owns ωt, the rotor angle and
   slow-motion scaling, and the qualitative transients.
5. **No hard-coded text.** Every visible string comes from the dictionaries; symbols and units from `symbols.ts`.

## Data flow

```
 URL (?lang, presentation, scene, aspect, clip)          user controls / scene script
            │                                                     │
            ▼                                                     ▼
      UrlOptions ──► I18nProvider (lang, d, fmt)            MachineInputs
                                                                  │  solveMachine()          (pure)
                                                                  ▼
                                                            MachineState ──────────────┐
                        presentOperatingPoint() / gridView() │ fieldVectors()          │ vCurve(), powerAngleCurve(),
                                                              ▼                         │ constantPowerLoci()
                                            PresentedOperatingPoint, GridView,          │
                                            FieldVectors                                │
                                                              │                         │
   AnimationClock (ωt, slow-motion, transient δ(t)) ──────────┤                         │
                                                              ▼                         ▼
                                    Machine view · Phasor diagram · Power triangle · P–δ · V curves · Readouts
```

## Directory layout

```
src/
  physics/            Pure model. No DOM, no React. Public API: physics/index.ts
    complex.ts        Complex arithmetic for phasors
    machine.ts        Reference machine, ratings, n_sync, E_A(I_F, f), X_S(f), elec → mech angles
    types.ts          MachineInputs, OperatingPoint, MachineState
    solve.ts          solveMachine, operatingPointAtDelta, signed-power helpers
    presentation.ts   THE internal → Chapman conversion; gridView
    excitation.ts     PF → I_F solver, V curves, constant-power loci, P–δ curve
    instantaneous.ts  v(t), i(t), p(t) decomposition, three-phase sum
    rotatingField.ts  Phase contributions and resultant stator field
    spaceVectors.ts   B_R, B_S, B_net from the operating point
    perUnit.ts        Per-unit bases
    scenarios.ts      Predefined scenarios A–G
  animation/          (Phase 2) clock, slow-motion factor, rotor angle, qualitative swing equation
  i18n/
    en.ts             Source-of-truth dictionary (type Dictionary = typeof en)
    es.ts             Must match en exactly (TypeScript + tests)
    symbols.ts        Symbols and units shared by both languages
    index.ts          Lang, DICTIONARIES, NUMBER_LOCALE, interpolate()
    I18nProvider.tsx  React context: { lang, d, fmt, setLang }
  format/format.ts    Intl-based number/unit formatting, SI prefixes, per unit
  app/urlParams.ts    URL options parsing
  ui/                 Components (SymbolText now; machine view, phasors, charts in later phases)
  App.tsx, main.tsx
tests/                Vitest: physics, i18n, infrastructure, render smoke test
docs/                 Documentation (English)
```

## i18n design

- `en.ts` is a plain object literal; `Dictionary = typeof en`. `es.ts` is declared `const es: Dictionary = {...}`, so
  TypeScript reports **missing and extra keys** (verified). `tests/i18n.test.ts` checks keys, empty strings, matching
  `{placeholders}` and that **symbols are identical** in both languages.
- Components use `const { d, fmt } = useI18n()` and read `d.section.key` — typed, no string keys.
- Symbols in text are written `E_A`, `V_φ`, `B_net`; `<SymbolText>` renders the subscript.
  The few symbols Chapman writes differently per edition (n_sync / n_sinc, PF / FP) live under `d.symbols`.
- Numbers: `Intl.NumberFormat` with `en-US` / `es-419` (decimal point in both; see glossary.md). Typographic minus sign.
- Language from `?lang=en|es` (default en); switching updates the URL without reloading, keeping other parameters.

## URL options

`?lang=en|es`, `presentation=true`, `scene=1..15`, `aspect=16x9|1x1|9x16`, `clip=<id>` — parsed by
`parseUrlOptions()`; malformed values fall back to defaults (tested).

## Planned UI (Phases 2–9)

- **Explore**: machine cross-section (SVG, centre-left), phasor diagram + power triangle (right), readouts strip
  (bottom: P, Q, S, PF, θ, δ, n_sync with units and delivers/absorbs), control panel.
- **Guided lesson**: scene engine = ordered list of scene descriptors (which panels are visible, highlights, scripted
  input timelines, dictionary keys for text beats). Scenes drive `MachineInputs`; they never bypass the model.
- **Presentation / clips**: same scene engine with a fixed-size stage (1920×1080, 1080×1080, 1080×1920), per-aspect
  layouts, auto-advance, camera (zoom/pan) and subtitle band.
- Per-quantity colour tokens in `src/ui/theme.ts` (phases a/b/c, V_φ, I_A, E_A, P, Q, S), always paired with labels.

## Testing

`npm test` runs Vitest. Physics tests encode brief §14; expected numbers are hand-calculated in the test comments.
Tests are never edited to make them pass; a failing test means the model (or the test's arithmetic) is reviewed.
