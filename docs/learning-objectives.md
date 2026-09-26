# Learning objectives

Target learner: an electrical-engineering student who knows basic circuits and studies with Chapman. Goal: real
understanding, not memorised equations. Every scene, control and visual must serve at least one objective below.

## Pillar 1 — How the machine works (M)

| ID | By the end, the learner can explain… |
|---|---|
| M1 | the parts: stator, three-phase windings, rotor, poles, field excitation, shaft. |
| M2 | what actually rotates, and at what speed. |
| M3 | why the rotor turns at exactly synchronous speed in steady state. |
| M4 | why a synchronous motor does not start by itself (damper windings or auxiliary start in practice). |
| M5 | that motor and generator are **the same machine** with energy flowing in opposite directions. |
| M6 | what happens when more power is demanded than the machine can transmit (loss of synchronism). |

## Pillar 2 — The physical principles (F)

| ID | By the end, the learner can explain… |
|---|---|
| F1 | how three currents 120° apart produce a rotating magnetic field. |
| F2 | why n_sync = 120 f / P. |
| F3 | that the rotor has its own field (excitation) and that torque comes from two fields trying to align. |
| F4 | what δ is physically (angle between fields inside the machine) and how it relates to torque and power. |
| F5 | how electromagnetic induction produces E_A, and what it depends on (E_A = K φ ω). |
| F6 | what a phasor represents and why the phasor diagram describes what happens inside the machine. |

## Pillar 3 — The powers (W)

| ID | By the end, the learner can explain, with intuition, maths and engineering use… |
|---|---|
| W1 | **P** (active): net transfer of useful energy. W, kW, MW. |
| W2 | **Q** (reactive): what it means physically, where it comes from, why excitation controls it. var, kvar, Mvar. |
| W3 | **S** (apparent): why it sizes equipment (current and heating). VA, kVA, MVA. |
| W4 | **S = P + jQ**: real part = net energy transfer; imaginary part = exchange tied to the fields; j = a 90° rotation. |
| W5 | **PF = cos θ**: lagging vs leading and why it matters. |
| W6 | why a synchronous machine can deliver or absorb Q: **over-excited delivers Q, under-excited absorbs Q, motor or generator.** |

## Key questions

Each must be answerable by observing and manipulating the simulation.

| # | Question | Objectives | Where it is answered |
|---|---|---|---|
| K1 | Why does the rotor turn at synchronous speed? | M3, F3 | Scene 4 |
| K2 | What does a lagging PF mean? | W5, F6 | Scenes 6, 9 |
| K3 | Where does reactive power come from? | W2, W6 | Scenes 7, 12 |
| K4 | What is the physical difference between P, Q and S? | W1–W3 | Scenes 7, 8 |
| K5 | Why does more excitation change Q? | W6, F5 | Scene 12 |
| K6 | What is δ physically? | F4 | Scene 10 |
| K7 | What changes when the same machine goes from motor to generator? | M5, F4 | Scene 5 |
| K8 | What do the phasors really represent? | F6 | Scene 13 |

## Scene ↔ objective matrix

| Scene | M1 | M2 | M3 | M4 | M5 | M6 | F1 | F2 | F3 | F4 | F5 | F6 | W1 | W2 | W3 | W4 | W5 | W6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 What actually rotates? | ● | ● | | | | | | | | | | | | | | | | |
| 2 Rotating magnetic field | | ○ | | | | | ● | | | | | | | | | | | |
| 3 Synchronous speed | | ● | | | | | ○ | ● | | | | | | | | | | |
| 4 Rotor field locks in | | | ● | ● | | | | | ● | ○ | | | | | | | | |
| 5 Motor or generator? | | | | | ● | | | | ○ | ● | | | ● | | | | | |
| 6 Voltage, current, phase shift | | | | | | | | | | | | ● | | | | | ● | |
| 7 Instantaneous power | | | | | | | | | | | | | ● | ● | ○ | | | |
| 8 P, Q and S | | | | | | | | | | | | ○ | ● | ● | ● | ● | | |
| 9 Power factor | | | | | | | | | | | | ○ | ○ | | ● | | ● | |
| 10 Torque angle δ | | | | | ○ | | | | ● | ● | | ○ | ● | | | | | |
| 11 Stability limit | | | | | | ● | | | | ● | | | ○ | | | | | ○ |
| 12 Excitation | | | | | | ○ | | | | ○ | ● | ○ | | ● | | | ● | ● |
| 13 Complete phasor diagram | | | | | | | | | | ● | ● | ● | | | | | ○ | |
| 14 V curves | | | | | | ● | | | | | | | | | ● | | ● | ● |
| 15 The whole system | ● | ● | ● | | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |

● = main objective of the scene, ○ = reinforced.
