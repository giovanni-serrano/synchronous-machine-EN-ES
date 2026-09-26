# Physics model

This document declares every equation, assumption and simplification used by the app.
If the app shows something that is not described here, that is a bug.

Reference text: S. J. Chapman, *Electric Machinery Fundamentals* (Spanish edition: *Máquinas eléctricas*).
Notation follows Chapman throughout. Sign conventions: see [sign-conventions.md](sign-conventions.md).

Code: [`src/physics/`](../src/physics). All functions are pure; tests live in [`tests/physics/`](../tests/physics).

---

## 1. Model assumptions (version 1)

| # | Assumption | Consequence | Shown in the UI |
|---|---|---|---|
| A1 | **Infinite bus**: the grid fixes V_T and f; neither changes with load or excitation. | V_φ is a fixed reference phasor; B_net is fixed by the grid. | "Infinite bus" note next to the grid parameters. |
| A2 | **Cylindrical (round) rotor**: a single synchronous reactance X_S, no reluctance torque. | P = 3 V_φ E_A sin δ / X_S exactly. | If poles are drawn salient for clarity: "Poles drawn salient for clarity; the math uses a cylindrical rotor." |
| A3 | **R_A = 0**, no core, friction or windage losses. | P_shaft = P_air-gap = P_electrical. | "Idealized machine: R_A = 0, no losses." A lossy mode may be added later (see progress.md). |
| A4 | **No saturation**: E_A ∝ I_F (air-gap line). | V curves are those of the linear model. | "No saturation" note; "linear model" label on V curves. |
| A5 | **Balanced three-phase**, Y connection for per-phase calculations. | I_L = I_A, V_φ = V_T/√3. | Formulas state whether values are per phase or line. |
| A6 | **Steady state**, except in explicitly transient scenes (synchronization, loss of synchronism). | Those scenes are **qualitative** (§11). | "Qualitative scene" tag. |

---

## 2. Reference machine

One coherent machine everywhere ([`machine.ts`](../src/physics/machine.ts)):

| Parameter | Value |
|---|---|
| Rated S | 100 kVA (three-phase) |
| Rated V_T | 480 V (line), Y connection |
| Rated f | 60 Hz |
| Poles | 4 (→ 1800 rpm) |
| X_S | 2.0 Ω per phase at 60 Hz |
| Rated PF (rating point) | 0.8 lagging (generator) |
| Field for rated V at no load | I_F = 5.0 A |
| Excitation slider range | 0 … 10 A |

Derived ratings (computed by `deriveRatings`, verified by tests):

| Quantity | Value |
|---|---|
| V_φ,rated = V_T / √3 | 277.13 V |
| I_rated = S / (√3 V_T) | 120.28 A |
| Z_base = V_T² / S | 2.304 Ω |
| X_S in pu | 0.868 pu |
| Air-gap line slope k_field | 55.43 V/A (at 60 Hz) |
| Field-heating limit (E_A for rated S at PF 0.8 lagging, generator) | E_A = 463.3 V → I_F,rated = 8.36 A |

**Sanity check (brief §3.7)**: generator at full load (100 kW), unity PF →
E_A = 277.13 + j(2.0)(120.28) = 277.13 + j240.56 = **366.97 V ∠ 40.96°**. δ ≈ 41°, as expected for X_S ≈ 0.87 pu.

---

## 3. Independent inputs and derived outputs

Avoiding an over-determined model is the single most important structural rule.

**Inputs** (`MachineInputs`, the only things the user controls):

| Input | Meaning |
|---|---|
| `mode` | MOTOR / GENERATOR selector: sets the **direction** of the shaft power. |
| `f` | Grid frequency (infinite bus). |
| `poles` | Number of poles (written out as "poles"; the letter P is reserved for active power). |
| `vT` | Grid line voltage V_T (infinite bus). |
| `load` | **Magnitude** of the shaft mechanical power, W (≥ 0): the motor's load or the generator's prime-mover power. |
| `iF` | Field current I_F (≥ 0). Determines E_A. |

**Outputs** (`MachineState`, computed by `solveMachine`, never set directly):
n_sync, ω, ω_m, X_S, V_φ, E_A, δ, I_A (phasor), θ, PF, P, Q, S, τ_ind, P_max, P/P_max, stability status,
operating mode (from the sign of P), active convention, rating warnings.

**The power factor is never an input.** When a scenario asks for "PF = 0.8 lagging", the model *solves*
the field current that produces it (`solveFieldForPowerFactor`, §8.1) and moves the excitation slider there.

---

## 4. Equations

All from Chapman. **Per-phase formulas use phase values; line formulas use line values; they are never mixed.**

| Relation | Formula | Values |
|---|---|---|
| Synchronous speed | n_sync = 120 f / poles | — |
| Mechanical speed | ω_m = 2π n_sync / 60 = ω / (poles/2) | — |
| Internal voltage | E_A = K φ ω, φ ∝ I_F ⇒ E_A = k_field · I_F · (f / f_rated) | per phase |
| Generator equation | E_A = V_φ + jX_S I_A (I_A leaving the machine) | per phase |
| Motor equation | V_φ = E_A + jX_S I_A (I_A entering the machine) | per phase |
| Power (R_A = 0) | P = 3 V_φ E_A sin δ / X_S | per phase values, three-phase P |
| Induced torque | τ_ind = 3 V_φ E_A sin δ / (ω_m X_S) | per phase values |
| Active power | P = √3 V_T I_L cos θ = 3 V_φ I_A cos θ | line / phase |
| Reactive power | Q = √3 V_T I_L sin θ = 3 V_φ I_A sin θ | line / phase |
| Apparent power | S = √3 V_T I_L = 3 V_φ I_A | line / phase |
| Complex power | S = P + jQ, \|S\|² = P² + Q² | three-phase |
| Static stability limit | P_max = 3 V_φ E_A / X_S, reached at δ = 90° | per phase values |

---

## 5. One internal convention, two presentations

The model computes everything in **one signed convention** — Chapman's generator convention, I_A positive
**out of** the machine, δ signed:

- δ > 0: E_A leads V_φ, the machine generates, P > 0 (delivered to the grid);
- δ < 0: E_A lags V_φ, the machine motors, P < 0 (absorbed from the grid).

So E_A = V_φ + jX_S I_A and P = 3 V_φ E_A sin δ / X_S hold **with sign in both modes**, and the transition
motor ↔ generator is a continuous change of the sign of δ (tested: `conventions.test.ts › continuity`).

The screen shows Chapman's convention for the active mode. **One function**, `presentOperatingPoint`
([`presentation.ts`](../src/physics/presentation.ts)), performs that conversion; no visual component
re-implements any part of it. Details and the full mapping table are in [sign-conventions.md](sign-conventions.md).

---

## 6. Solving an operating point (`solveMachine`)

1. n_sync = 120 f / poles; ω = 2πf; ω_m = 2π n_sync / 60.
2. X_S = X_S,rated · f / f_rated; V_φ = V_T / √3; E_A = k_field · I_F · f / f_rated.
3. Requested electrical power, internal sign: P = +load (generator) or −load (motor). (Lossless: |P_elec| = P_shaft.)
4. P_max = 3 V_φ E_A / X_S; load ratio = |P| / P_max.
5. If |P| > P_max: **no synchronous steady state** → `stability = 'lostSynchronism'`, `op = null` (§7).
6. Otherwise δ = asin(P / P_max) on the **stable branch** |δ| ≤ 90°, and with V_φ = V_φ∠0, E_A = E_A∠δ:
   - I_A = (E_A − V_φ) / (jX_S)
   - S = 3 V_φ I_A\* → P = 3 V_φ E_A sin δ / X_S, **Q = 3 V_φ (E_A cos δ − V_φ) / X_S**
   - θ = ∠V_φ − ∠I_A (θ > 0 ⇔ I_A lags V_φ in the generator convention)
   - τ (electromagnetic torque on the rotor, positive in the direction of rotation) = −P / ω_m
7. Operating mode from the sign of P (motor / generator / no load). Chapman convention = that mode; the selector decides at P = 0.

The expression for Q contains the unifying idea of the whole app: **Q > 0 (delivered to the grid) ⇔ E_A cos δ > V_φ
(over-excited), whatever the sign of δ, i.e. whether motor or generator.**

When I_A = 0 (E_A = V_φ, P = 0) θ is undefined; the model reports θ = 0 and PF = 1 and the UI shows "—".

---

## 7. Stability

- P(δ) = P_max sin δ is a sinusoid; its maximum P_max = 3 V_φ E_A / X_S is the **static stability limit**, at δ = 90°.
- The UI shows the margin **P / P_max** (= |sin δ|).
- `nearLimit` when P / P_max ≥ 0.9 (δ ≳ 64°). This threshold is a pedagogical choice, not a standard.
- If the demanded |P| exceeds P_max, δ is **not** allowed to grow as if nothing happened: no steady state exists and the
  app switches to the qualitative loss-of-synchronism scene (§11).
- **P_max depends on the excitation.** Lowering I_F at constant load lowers P_max, pushes δ toward 90° and can itself cause
  loss of synchronism (tested). The excitation lesson shows this explicitly.
- Note for this machine: near δ = 90°, |I_A| ≥ V_φ / X_S = 1.15 pu, so operating close to the stability limit also
  overloads the stator (scenario G shows both warnings at once). This is physics, not a model artefact.

### Why the rotor runs at exactly synchronous speed

The torque is τ_ind = k B_R × B_net ∝ sin δ. If the rotor turned at any speed other than n_sync, the angle between
B_R and B_net would sweep continuously through 360°, and sin δ would average to **zero** over each slip cycle:
no average torque, so no sustained power transfer. Only at n_sync is δ constant, giving a constant average torque.
This is also why the motor **cannot start by itself**: at standstill the stator field sweeps past the rotor at n_sync and
the average torque is zero. Real machines use damper (amortisseur) windings — induction-motor action — or an auxiliary
drive to get close to n_sync first. v1 shows this qualitatively; damper windings are not modelled.

---

## 8. Excitation

### 8.1 Solving I_F for a target power factor

Given mode, load and a target PF:

1. Q_internal from Chapman's lagging/leading meaning for the mode: lagging ⇔ P and Q flow in the **same** direction relative
   to the grid (generator delivers both; motor absorbs both). Q = ±|P| tan θ accordingly.
2. I_A = (P − jQ) / (3 V_φ) (V_φ real), E_A = V_φ + jX_S I_A, I_F = |E_A| / (k_field · f / f_rated).
3. Flagged infeasible if outside [0, I_F,max]; the slider is then clamped.

### 8.2 Constant P while the excitation changes

With P fixed, E_A sin δ = P X_S / (3 V_φ) is constant: the **tip of E_A moves on a horizontal line** of the phasor diagram
(V_φ on the real axis). Likewise I_A cos θ = P / (3 V_φ) is constant: the **tip of I_A moves on a vertical line**.
Both loci are provided by `constantPowerLoci` and tested.

### 8.3 V curves

At constant P, with c = E_A sin δ = P X_S / (3 V_φ):

  |I_A|² X_S² = |E_A∠δ − V_φ|² = c² + (E_A cos δ − V_φ)²

This is minimum exactly when E_A cos δ = V_φ, i.e. **Q = 0 (unity PF)**, where |I_A|_min = |P| / (3 V_φ).
The left end of each curve is the stability limit E_A = c (δ = 90°). Left of the minimum: under-excited (Q absorbed);
right: over-excited (Q delivered). In the generator convention that is leading / lagging; in the motor convention,
lagging / leading. Curves are those of the **linear (unsaturated) model**.

---

## 9. Frequency (decision for brief §3.5)

**Decision: the model scales coherently with f.** X_S = ω L_S ∝ f and E_A = K φ ω ∝ f at constant I_F.
Consequences, all tested:

- At fixed V_T and I_F, E_A / X_S does not depend on f, so **P_max and δ at a given P do not change with f**; the
  torque for a given power does (τ = P / ω_m).
- The frequency control is exposed in the rotating-field and synchronous-speed scenes. Power scenes default to
  60 Hz; they remain correct at 50 Hz, but the lesson does not dwell on it.
- Not modelled: the change of stator flux with V/f (it would matter only with saturation, which is excluded, A4).

---

## 10. Ratings and control ranges (brief §3.6.1)

- I_F ∈ [0, 10] A (E_A ∈ [0, 2] pu at 60 Hz). I_F and E_A are never negative.
- **Stator warning** when |I_A| > I_rated (120.28 A): stator heating.
- **Field warning** when I_F > I_F,rated (8.36 A): field heating. I_F,rated is defined as the excitation for rated kVA at
  rated PF 0.8 lagging (generator), Chapman's usual rating point.
- Warnings never block exploration.
- The P–Q capability curve is a future improvement (progress.md).

---

## 11. Instantaneous power (brief §3.4.2)

Per phase, with v = √2 V_φ cos ωt and i = √2 I_A cos(ωt − θ):

  p(t) = v·i = 2 V_φ I_A cos ωt cos(ωt − θ) = V_φ I_A [cos θ + cos(2ωt − θ)]
       = **P_φ [1 + cos 2ωt] + Q_φ sin 2ωt**,  P_φ = V_φ I_A cos θ, Q_φ = V_φ I_A sin θ.

- The first term is never negative (for P_φ > 0) and averages P_φ: energy flowing **one way**.
- The second averages zero and has amplitude **Q_φ exactly**: energy going **back and forth**. This is not an analogy.
- **Sign**: θ > 0 means i lags v; p > 0 means energy flows in the reference direction chosen for i, i.e. the drawing
  convention (out of the machine in the generator convention, into it in the motor convention).
- Three phases (offsets 0, −120°, +120°): the 2ωt terms cancel and **p_a + p_b + p_c = 3 P_φ = P, constant**.
  The back-and-forth exchange exists per phase, but there is no net oscillation of the three-phase total at the
  terminals; the phases trade that energy among themselves. The app must **not** animate the total energy "sloshing".
- Q still matters: it requires current, which heats conductors and uses capacity. That is why S sizes equipment.

Tests: decomposition = sampled v·i; means and amplitude; three-phase sum constant and equal to the machine's P.

---

## 12. Rotating magnetic field (brief §5.1)

Phase magnetic axes at 0°, 120°, 240° (electrical); currents i_a = I cos ωt, i_b = I cos(ωt − 120°),
i_c = I cos(ωt − 240°). Each phase gives a **pulsating** vector along its own axis; their sum has **constant magnitude
1.5 B_M** and rotates **counterclockwise** at ω (tested). With a given number of poles the N–S pattern repeats poles/2 times, so the
field turns at ω / (poles/2) mechanically — n_sync.

---

## 13. Field space vectors and phasors (brief §4, §5.5)

Following Chapman, each voltage lags the field that produces it by 90°:
B_R ↔ E_A, B_net ↔ V_φ, B_S ↔ E_stat = −jX_S I_A. The app therefore computes
B = j·(voltage) / (V_φ,rated · f / f_rated), a single common factor, so that:

- the angle between **B_R and B_net** equals δ (**not** B_R and B_S);
- B_net = B_R + B_S (↔ V_φ = E_A + E_stat);
- |B_net| is set by the grid (1.0 pu at rated V and f): the infinite bus fixes the net air-gap flux;
- B_S is aligned with the internal (generator-convention) I_A;
- generator: B_R leads B_net; motor: B_net leads B_R. The torque on the rotor, k B_R × B_net, then opposes the rotation
  in the generator and drives it in the motor.

Magnitudes are flux in per unit. At time t the whole set rotates by ωt (electrical).
**Mechanical angles**: the angle you can see inside the machine is δ_mech = δ_elec / (poles/2). With 4 poles it is half the δ of
the phasor diagram; the UI says so whenever it shows δ inside the machine.

---

## 14. Transient scenes (qualitative; planned for Phase 7)

Synchronization and loss of synchronism have no steady-state solution to show. They will be driven by the per-unit swing
equation with illustrative constants:

  (2H / ω_s) d²δ/dt² = P_mech − P_max sin δ − D dδ/dt

It reproduces the right qualitative behaviour (δ oscillates about the operating point; past P_max it grows without bound
and the rotor slips poles; with damping and reduced load it can pull back in). Inertia H and damping D are **visual
choices**, not properties of the reference machine; the scenes carry the "Qualitative scene" tag. During these scenes the
instantaneous phasors are computed with `operatingPointAtDelta` for the current δ(t) (a quasi-static picture, also labelled
qualitative).

---

## 15. Predefined scenarios (brief §11)

60 Hz, 4 poles, 480 V. Values are hand-calculated and verified in `tests/physics/scenarios.test.ts`.

| | Scenario | Excitation | I_F | E_A | δ | I_A | P | Q (grid view) | PF | P/P_max |
|---|---|---|---|---|---|---|---|---|---|---|
| A | Motor, 100 kW | solved for PF 1 | 6.62 A | 367.0 V | 41.0°, E_A lags | 120.3 A | 100 kW absorbed | 0 | 1.00 | 0.66 |
| B | Generator, rating point 100 kVA | solved for PF 0.8 lag | 8.36 A | 463.3 V | 24.5°, E_A leads | 120.3 A | 80 kW delivered | 60 kvar delivered | 0.80 lag | 0.42 |
| C | Over-excited motor, 80 kW | solved for PF 0.8 lead | 8.36 A | 463.3 V | 24.5°, lags | 120.3 A | 80 kW absorbed | 60 kvar **delivered** | 0.80 lead | 0.42 |
| D | Under-excited motor, 80 kW | solved for PF 0.8 lag | 4.22 A | 233.8 V | 55.4°, lags | 120.3 A | 80 kW absorbed | 60 kvar absorbed | 0.80 lag | 0.82 |
| E | Generator, 100 kW | solved for PF 1 | 6.62 A | 367.0 V | 41.0°, leads | 120.3 A | 100 kW delivered | 0 | 1.00 | 0.66 |
| F | Generator, 80 kW, sweep I_F 4 → 8 A | starts at PF 1 | 6.09 A | 337.4 V | 34.8°, leads | 96.2 A | 80 kW delivered | absorbed → delivered | lead → 1 → lag | 0.57 |
| G | Motor, 100 kW, low excitation | I_F fixed | 4.50 A | 249.4 V | 74.7°, lags | **160.1 A** | 100 kW absorbed | 87.8 kvar absorbed | 0.75 lag | **0.96** |

Scenario G trips the "near the stability limit" status and the stator-overcurrent warning (see §7).
Scenario A and B were chosen as motor and generator respectively; the brief left their mode open.

---

## 16. Physical vs visual-only variables (data model, brief §13)

**Physical** (in `MachineInputs` / `MachineState`, SI units, computed only by `src/physics`):
all inputs of §3 and all outputs of §3, field space vectors (flux pu), instantaneous v, i, p.

**Visual only** (never feed back into physics; listed so nobody mistakes them for data):

| Variable | Why it exists |
|---|---|
| Animation time scale (slow motion) | 1800 rpm = 30 rev/s is invisible. The UI states "Slow motion — the real machine turns at N rpm"; the displayed n_sync is always the physical value, and relative speeds (2 vs 4 poles) are preserved. |
| Phasor-diagram scales (V/px, A/px) | Voltages and currents have different units; I_A has its own scale and its length is not comparable to the voltages. |
| Field-vector length scale | Flux pu → px. |
| Vector exaggeration / glow (social clips) | Readability on phones. Declared per clip in storyboard.md. |
| Colours, zoom, pan, camera moves | Presentation only. |
| Salient pole shapes, number of drawn slots/coils | Recognisability; the math is cylindrical-rotor (A2). |
| Swing-equation constants H, D | Qualitative transient scenes only (§14). |

Rule: visual components **read** `MachineState` (and the animation clock); they never compute physics.

---

## 17. Not modelled (declared limitations)

Armature resistance and losses (optional mode later), saturation, salient-pole reluctance torque and d/q reactances,
damper-winding dynamics, AVR/governor control, finite (non-infinite) grids, unbalanced operation, harmonics,
the P–Q capability curve (future).

---

## 18. Test coverage of brief §14

| Requirement | Test |
|---|---|
| n_sync = 120 f / poles | `machine.test.ts` |
| \|S\|² = P² + Q² | `powers.test.ts` |
| P = √3 V_T I_L cos θ, Q = √3 V_T I_L sin θ | `powers.test.ts` |
| Chapman generator and motor phasor equations | `conventions.test.ts`, `powers.test.ts` |
| P from phasors = 3 V_φ E_A sin δ / X_S | `powers.test.ts` |
| Over-excited → delivers Q (generator lagging, motor leading) | `conventions.test.ts` |
| Constant P ⇒ E_A sin δ constant | `excitation.test.ts` |
| V-curve minimum at unity PF | `excitation.test.ts` |
| P_max at δ = 90° | `excitation.test.ts` |
| P_max decreases with lower excitation | `excitation.test.ts` |
| Internal → Chapman presentation conversion | `conventions.test.ts` |
| Continuity motor ↔ generator | `conventions.test.ts` |
| p(t) decomposition = sampled v·i | `instantaneous.test.ts` |
| p_a + p_b + p_c constant = P | `instantaneous.test.ts` |
| Predefined scenarios | `scenarios.test.ts` |
| EN / ES dictionaries have the same keys | `i18n.test.ts` |
| Extra: rotating field, frequency scaling, rating warnings, field vectors, PF solver, URL options, formatting | various |
