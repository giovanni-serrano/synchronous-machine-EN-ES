# Synchronous Machine — Visual Physics of Synchronous Motors & Generators

An **interactive essay** — an explorable explanation — on how a synchronous machine works as a **motor** and as a
**generator**: the rotating field, synchronous speed, the torque angle δ, and the powers P, Q, S and the power factor.
The machine is built up piece by piece, one idea and one figure per section; the complete interactive lab closes the
essay. Designed mobile-first, for sharing.

Bilingual: **English** (default) and **Spanish** (`?lang=es`). Notation and conventions follow
S. J. Chapman, *Electric Machinery Fundamentals* / *Máquinas eléctricas*.

> **Status: checkpoint 2b** — physics model and the Phase 2–6 lab are done and tested; the presentation is being rebuilt
> as an essay ([docs/experience-redesign.md](docs/experience-redesign.md)). The vertical slice (hook, *One coil*,
> *Three coils*) is the default page; the lab is at `?view=lab`. See [docs/progress.md](docs/progress.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (add ?lang=es for Spanish)
npm test           # Vitest: physics, i18n, layouts, render smoke tests
npm run build      # typecheck + production build
npm run test:layout  # no animation may move the page (Playwright + installed Edge; phone and desktop)
npm run perf       # mobile load budget (slow 4G, CPU ×4): LCP < 3 s
npm run capture -- http://localhost:5173/ captures   # review screenshots (390 px and desktop, EN/ES)
npm run og         # regenerate the Open Graph image public/og.png
```

Requires Node 22.12+ (Vitest 5); developed on Node 24.

## Physics model (summary)

- Machine on an **infinite bus** (grid fixes V_T and f), **cylindrical rotor**, **R_A = 0**, **no saturation**, balanced Y.
- Reference machine: 480 V, 60 Hz, 4 poles, 100 kVA, X_S = 2.0 Ω (0.87 pu). Full load at unity PF: δ ≈ 41°, E_A ≈ 367 V.
- Inputs: motor/generator, f, poles, V_T, shaft load, field current I_F. Everything else — δ, I_A, θ, PF, P, Q, S, τ, P_max,
  stability — is **derived**. The power factor is never an input; scenarios that name a PF solve the excitation.
- One **internal signed convention** (generator convention, δ signed) and one function that converts to Chapman's motor or
  generator presentation, plus a convention-free "seen from the grid" view.
- Loss of synchronism beyond P_max = 3 V_φ E_A / X_S (δ = 90°); transient scenes are qualitative and labelled so.

Details: [docs/physics-model.md](docs/physics-model.md) · [docs/sign-conventions.md](docs/sign-conventions.md)

## Architecture (summary)

```text
MachineInputs ──solveMachine()──► MachineState ──presentOperatingPoint() / gridView() / fieldVectors()──► visuals
                                                   animation clock (separate) ─────────────────────────► visuals
```

Pure physics in `src/physics/`, typed dictionaries in `src/i18n/` (English is the source of truth; TypeScript and tests
enforce that Spanish has the same keys), Intl formatting in `src/format/`, URL options in `src/app/urlParams.ts`.
Details: [docs/architecture.md](docs/architecture.md)

## URL options

| Parameter | Values | Purpose |
|---|---|---|
| `lang` | `en` (default), `es` | Language |
| `view` | `lab` | The complete lab instead of the essay (`og` renders the social card) |
| `presentation` | `true` | Cinematic mode for recording (Phase 9) |
| `scene` | `1`–`15` | Start at a given lesson scene (Phase 8–9) |
| `aspect` | `16x9` (default), `1x1`, `9x16` | Recording aspect ratio (Phase 9) |
| `clip` | `rotating-field`, `poles-speed`, `reactive-myth`, `excitation-sweep`, `motor-to-generator`, `pull-out` | Social clip (Phase 9) |

## Controls (planned)

Motor / generator selector, grid frequency, poles, grid voltage, shaft load, rotor excitation I_F, play / pause / step,
animation speed, SI units / per unit, vector and label toggles. Modes: **Explore**, **Guided lesson**, **Presentation**.

## Limitations (v1)

No losses, no saturation, cylindrical rotor only, infinite bus, balanced steady state; synchronisation and pull-out are
qualitative. Not modelled: damper-winding dynamics, salient-pole reluctance torque, AVR/governor, capability curve (future).

## Documentation

- [docs/physics-model.md](docs/physics-model.md) — equations, assumptions, verified numbers, physical vs visual variables
- [docs/sign-conventions.md](docs/sign-conventions.md) — Chapman conventions, internal convention, grid view, δ and fields
- [docs/architecture.md](docs/architecture.md) — structure and data flow
- [docs/learning-objectives.md](docs/learning-objectives.md) — objectives and scene mapping
- [docs/storyboard.md](docs/storyboard.md) — lesson scenes, cinematic demos, social clips with EN/ES subtitles
- [docs/glossary.md](docs/glossary.md) — EN/ES terminology
- [docs/progress.md](docs/progress.md) — phase status, decisions, pending work
- [docs/brief.es.md](docs/brief.es.md) — original project brief (Spanish)
- [README.es.md](README.es.md) — resumen en español

## References

- S. J. Chapman, *Electric Machinery Fundamentals*, 5th ed., McGraw-Hill, 2012.
- S. J. Chapman, *Máquinas eléctricas*, 5.ª ed., McGraw-Hill Interamericana, 2012.

Chapman is cited as the reference for notation and conventions only. **No text or figures from the book are reproduced**
in this project; all explanations, drawings and animations are original.

## License

- **Code** (src/, tests/, configuration): [MIT](LICENSE).
- **Texts and documentation** (docs/, README files, and the prose of the dictionaries in src/i18n/):
  [CC BY 4.0](LICENSE-CC-BY-4.0.txt).

© 2026 Luis Giovanni Serrano Bello.
