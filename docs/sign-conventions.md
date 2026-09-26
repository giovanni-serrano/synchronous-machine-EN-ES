# Sign conventions

Chapman uses **different current directions for motors and generators**. That is natural for each chapter, but it makes
"the same machine in two modes" hard to see. The app solves this with **one internal convention** and **Chapman's
presentation** on screen, plus a convention-free **view from the grid**.

Code: [`src/physics/presentation.ts`](../src/physics/presentation.ts) — the only place where the conversion happens.

---

## 1. Internal convention (the model)

- **Generator convention for both modes**: I_A positive **leaving** the machine toward the grid.
- δ = ∠E_A − ∠V_φ, **signed**, electrical. V_φ is the reference (real axis).
- P and Q are powers **delivered to the grid**, signed.

| | δ | P (internal) | Mode |
|---|---|---|---|
| E_A leads V_φ | > 0 | > 0 | generator |
| E_A in phase | 0 | 0 | no load |
| E_A lags V_φ | < 0 | < 0 | motor |

E_A = V_φ + jX_S I_A and P = 3 V_φ E_A sin δ / X_S hold with sign in both modes.
The operating mode is **derived from the sign of P**. The MOTOR / GENERATOR selector sets the direction of the shaft
power; if a scene sweeps the shaft power continuously, the mode label changes when P crosses zero.

---

## 2. Presentation (Chapman)

### Generator

- I_A positive **leaving** the machine. Equation: **E_A = V_φ + jX_S I_A**.
- P > 0: active power **delivered** to the grid. Q > 0: reactive power **delivered** to the grid.
- Over-excited → **lagging** PF, delivers Q. Under-excited → leading PF, absorbs Q.
- δ > 0, E_A **leads** V_φ. B_R **leads** B_net.
- Indicator: *"Generator convention: I_A flows out of the machine"*.

### Motor

- I_A positive **entering** the machine: I_A,motor = −I_A,internal. Equation: **V_φ = E_A + jX_S I_A**.
- P > 0: active power **absorbed** from the grid. Q > 0: reactive power absorbed.
- Over-excited → **leading** PF: the motor behaves like a capacitor and **delivers Q to the grid** (its Q in the motor
  convention is then negative).
- Under-excited → lagging PF, absorbs Q.
- δ shown as a magnitude with the note **"E_A lags V_φ"**. B_net **leads** B_R.
- Indicator: *"Motor convention: I_A flows into the machine"*.

### Mapping table

| Quantity | Internal | Generator presentation | Motor presentation |
|---|---|---|---|
| V_φ, E_A | phasors | same | same |
| I_A | out of machine | same | **−I_A** (into machine) |
| jX_S I_A | with internal I_A | same | **negated** |
| δ | signed | \|δ\|, "E_A leads V_φ" | \|δ\|, "E_A lags V_φ" |
| P | delivered, signed | delivered (> 0 when generating) | **absorbed** = −P (> 0 when motoring) |
| Q | delivered, signed | delivered | **absorbed** = −Q |
| θ | ∠V_φ − ∠I_A | same | from the drawn (entering) I_A |
| PF | — | cos θ with lagging/leading | cos θ with lagging/leading |
| τ | on rotor, + = direction of rotation | "opposes the rotation" | "drives the rotor" |

---

## 3. Lagging / leading — one rule

In the convention of the active mode, **lagging ⇔ Q > 0 ⇔ I_A lags V_φ**. Equivalently, seen from the grid:
**lagging ⇔ P and Q flow in the same direction.**

| Mode | Excitation | Q seen from the grid | PF |
|---|---|---|---|
| Generator | over-excited | delivers | lagging |
| Generator | under-excited | absorbs | leading |
| Motor | over-excited | **delivers** | leading |
| Motor | under-excited | absorbs | lagging |

**The unifying idea: over-excited delivers Q, under-excited absorbs Q, motor or generator alike**
(Q_delivered = 3 V_φ (E_A cos δ − V_φ) / X_S, and cos δ does not care about the sign of δ).

PF and θ are always evaluated in the convention of the **active mode**, even if a scene locks the drawing convention.

---

## 4. View from the grid (convention-free)

Next to the phasor diagram the UI always shows:

- **P**: delivers / absorbs / none — from the sign of internal P.
- **Q**: delivers / absorbs / none — from the sign of internal Q.

This view does not depend on any convention; it is what connects motor and generator (`gridView()`).

---

## 5. Crossing P = 0 (motor ↔ generator)

At P = 0 the presentation convention switches, and the **drawn** I_A would flip by 180° if it is not zero — an
artefact of the convention, not physics. Two remedies, both available:

1. `presentOperatingPoint(op, modeConvention, drawingConvention)` accepts a **locked drawing convention** for continuous
   sweeps (scene 5, demo H). The indicator shows the locked convention; PF labels still follow the mode.
2. Run the sweep with E_A = V_φ: then I_A = 0 exactly at P = 0 and the switch is invisible.

The internal phasors are continuous through P = 0 (tested), and so is the drawn I_A with a locked convention (tested,
including a mutation check recorded in progress.md). In the machine lab, "Continuous motor ↔ generator" switches to a
signed shaft-power slider and locks the drawing convention (selectable); the indicator always names the convention in use.

**What never depends on the convention:** the stator dots/crosses (physical winding currents), the field vectors B_R,
B_S, B_net, the energy-flow arrows and the "seen from the grid" summary. Only the drawn I_A / jX_S I_A phasors and the
signed P, Q readouts of the presentation change with it.

---

## 6. δ and the fields

- δ is the electrical angle between **E_A and V_φ**. Inside the machine it is the angle between **B_R and B_net**.
- It is **not** the angle between B_R and B_S. The app never draws δ between the rotor field and the stator field.
- Generator: B_R leads B_net (the rotor is pushed ahead; the torque on it opposes the rotation).
- Motor: B_net leads B_R (the field pulls the rotor along; the torque drives it).

### Electrical vs mechanical degrees

δ and θ are **electrical** angles. The angle visible inside a machine with a given number of poles is

  **δ_mech = δ_elec / (poles/2)**

With 4 poles, the angle you see between the fields is **half** the δ of the phasor diagram. The UI states this every time
it shows δ inside the machine (e.g. "with 4 poles, 40° electrical = 20° mechanical").

---

## 7. Other conventions

- **Rotation**: fields and rotor rotate **counterclockwise** (positive angles) with phase sequence abc; phase axes a, b, c at
  0°, 120°, 240° electrical.
- **Phasors** are RMS and rotate counterclockwise at ω; V_φ is drawn on the positive real axis (horizontal, to the right).
- **Instantaneous power** p = v·i: p > 0 means energy flows in the reference direction of i, i.e. the drawing convention
  (out of the machine for the generator convention, into it for the motor convention).
- **Power-factor angle**: Chapman writes **θ**; many texts write φ. The UI says so once.
- **Torque** in the model: electromagnetic torque on the rotor, positive in the direction of rotation.
