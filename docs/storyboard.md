# Storyboard

Status: **draft (Phase 1)**. Scene texts are refined in Phase 8, clips in Phase 9. The on-screen strings will live in the
dictionaries (`scenes.*`, `clips.*`); the beats below are the English source intent.

Rules for every scene: introduce only what is needed; direct attention with highlight and motion; follow
**intuition → maths → engineering**; short sentences, split around the animation ("Energy flows into the field…"
[animation] "…and returns to the grid."). Never a wall of text.

Objective IDs refer to [learning-objectives.md](learning-objectives.md).

---

## Guided lesson

### 1 · What actually rotates? — M1, M2
- **Screen**: machine cross-section, labelled parts appear one by one (stator, windings a/b/c and returns, rotor, poles,
  field winding, shaft).
- **Beats**: "The stator doesn't move." → "Its windings carry three currents." → "The rotor turns — and carries its own
  magnet." → "Two things rotate: the rotor… and a field you can't see yet."
- **Interaction**: hover a part to highlight it.

### 2 · The rotating magnetic field — F1 (demo A)
- **Screen**: three phase currents i_a, i_b, i_c (waveforms) + each phase's pulsating vector on its axis + their sum.
- **Beats**: "Each coil makes a field that only pulses back and forth." → "Shift the currents by a third of a cycle…" →
  "…and the sum turns — at constant strength." → maths: |B| = 1.5 B_M, angle = ωt.
- **Interaction**: pause, frame-by-frame, toggle individual contributions.

### 3 · Synchronous speed — F2, M2 (demo B)
- **Screen**: stator field N–S pattern; pole selector 2 → 4 → 6; rpm readout.
- **Beats**: "Twice the poles: the field needs twice as long to go around." → n_sync = 120 f / P → "60 Hz, 4 poles: 1800 rpm."
- **Note**: slow motion is declared on screen.

### 4 · The rotor field locks in — F3, M3, M4 (demo C)
- **Screen**: rotor with B_R; stator field B_net; qualitative approach to synchronism.
- **Beats**: "Two magnets try to line up." → "If the rotor were slower, the field would slip past it: pull, push, pull… zero on
  average." → "Only at the field's own speed does the pull stay steady." → "So it can't start by itself: damper windings do
  that job." (qualitative tag)

### 5 · Motor or generator? — M5, F4, W1 (demo H)
- **Screen**: machine + energy-flow arrows grid ↔ machine ↔ shaft (P and Q separate); signed shaft-power slider.
- **Beats**: "Motor: the field pulls the rotor." → "Push the shaft instead…" → "…the rotor moves ahead of the field, and energy
  flows back." → "Same machine, same equations: δ changed sign."
- **Note**: drawing convention locked during the sweep (sign-conventions.md §5).

### 6 · Voltage, current, phase shift — F6, W5 (demo E)
- **Screen**: one phase: v(t), i(t) waveforms linked to the rotating V_φ and I_A phasors.
- **Beats**: "A phasor is a snapshot of a wave." → "When the current peaks later, it lags." → "PF = 1: current in step with
  voltage."

### 7 · Instantaneous power — W1, W2 (demo F)
- **Screen**: p(t) = v·i for one phase, split into the one-way part and the back-and-forth part; then the three phases and
  their constant sum.
- **Beats**: "Energy flows into the field…" [negative stretch] "…and returns to the grid." → "One part always flows one way:
  its average is P." → "The other goes back and forth: its amplitude is Q." → "Add the three phases: the total is constant."
  → "No net sloshing in the total — but Q still needs current."
- **Physics guard**: never animate the three-phase total as oscillating.

### 8 · P, Q and S — W1–W4 (demo I)
- **Screen**: power triangle linked to the phasors and the machine; S = P + jQ on the complex plane.
- **Beats**: "P: energy delivered, on average." → "Q: energy exchanged with the fields." → "S: what the wires must carry." →
  "j is a 90° turn — nothing imaginary about it."

### 9 · Power factor — W5, W3
- **Screen**: scenarios PF 1.00, 0.90 lag, 0.90 lead, 0.70 lag at the same P; I_A readout.
- **Beats**: "Same P, lower PF… more current." → "Lagging or leading: who supplies the magnetism."
- **Note**: each scenario solves I_F (the excitation slider moves by itself).

### 10 · The torque angle δ — F4, F3, W1 (demo D)
- **Screen**: δ inside the machine (between B_R and B_net, mechanical degrees) and in the phasor diagram (between E_A and V_φ,
  electrical degrees), linked highlights; P–δ curve with moving operating point.
- **Beats**: "More load: the rotor falls further behind the field." → "The angle between the fields is δ." → P = 3 V_φ E_A sin δ / X_S
  → "With 4 poles, what you see is half of δ."

### 11 · Stability limit — M6, F4 (demo K)
- **Screen**: P–δ curve up to 90°, margin P / P_max; then pull-out (qualitative).
- **Beats**: "The magnetic pull has a maximum: δ = 90°." → "Ask for more, and the rotor slips a pole." → "Less excitation lowers the
  limit too."

### 12 · Excitation — W6, W2, W5, F5 (demo G)
- **Screen**: I_F slider at constant P; E_A tip on the constant-power line, I_A tip on its line; Q readout; grid view.
- **Beats**: "Turn the field down: the machine borrows its magnetism from the grid." → "Just right: unity PF." → "Turn it up: the
  machine supplies magnetism and hands Q back." → "Motor or generator: over-excited delivers Q."

### 13 · The complete phasor diagram — F6, F5, F4 (demo J)
- **Screen**: V_φ, I_A, E_A, jX_S I_A, θ, δ; convention indicator; toggles; zoom.
- **Beats**: "Each arrow is a wave inside the machine." → "E_A: induced by the rotor field." → "jX_S I_A: the armature's own
  reaction."

### 14 · V curves — W6, W3, M6
- **Screen**: I_A vs I_F for several P; operating point moving; regions lagging / unity / leading; stability limit.
- **Beats**: "Minimum current: unity PF." → "Left: under-excited. Right: over-excited." → "Too far left: loss of synchronism."

### 15 · The whole system — all
- **Screen**: everything linked; free exploration with the scenarios A–G.

---

## Cinematic demonstrations (presentation mode)

| Demo | Content | Scene |
|---|---|---|
| A | Three currents → rotating field | 2 |
| B | Change of poles → visible change of speed | 3 |
| C | Rotor locking in with the field (qualitative) | 4 |
| D | Load increases → δ grows; P–δ curve | 10 |
| E | PF = 1 → I_A aligned with V_φ | 6 |
| F | p(t) per phase vs constant three-phase total | 7 |
| G | Excitation sweep → lagging / unity / leading | 12 |
| H | Motor → generator, continuously | 5 |
| I | P–Q–S triangle transforming | 8 |
| J | E_A, V_φ, I_A phasors changing with the machine | 13 |
| K | Loss of synchronism beyond P_max (qualitative) | 11 |

---

## Social clips (`&clip=<id>`, brief §10.1)

Common rules: no UI; one idea; 15–45 s; starts **already moving** (eye-catching within 2 s, no title card, no fade from black);
**seamless loop**; large burned-in subtitles in a reserved band that never covers the machine or the phasors; the hook is a
plain question or statement — **no symbols in the first line**. Recording at a fixed size (1080×1080, 1080×1920, or
1920×1080) and 60 fps.

Visual-only exaggerations (declared, see physics-model.md §16): thicker strokes, subtle glow on the active vectors and fields,
vector length scaling. No magnitude is exaggerated relative to another of the same kind.

| id | Idea | Duration | Recommended format | Loop |
|---|---|---|---|---|
| `rotating-field` | Three currents → rotating field | 20 s | 1:1, 9:16 | whole electrical cycles |
| `poles-speed` | More poles → lower speed | 20 s | 9:16 | 2 → 4 → 2 poles |
| `reactive-myth` | p(t) per phase oscillates; three-phase total constant | 35 s | 9:16 | whole cycles of 2ωt |
| `excitation-sweep` | Lagging → unity → leading with phasors and P–Q–S | 30 s | 1:1 | ping-pong sweep |
| `motor-to-generator` | Same machine crosses from motor to generator | 30 s | 16:9, 1:1 | ping-pong sweep |
| `pull-out` | Loss of synchronism past P_max (qualitative) | 25 s | 9:16 | overload → slip → load removed → re-lock |

### Subtitles (draft)

**rotating-field**

| EN | ES |
|---|---|
| Three currents, one rotating magnet | Tres corrientes, un imán que gira |
| Each coil only pulses back and forth. | Cada bobina solo pulsa, adelante y atrás. |
| Shift them by a third of a cycle… | Desfásalas un tercio de ciclo… |
| …and their sum spins at constant strength. | …y su suma gira con intensidad constante. |
| The rotating field behind every AC motor. | El campo giratorio de todo motor de CA. |

**poles-speed**

| EN | ES |
|---|---|
| Same grid, half the speed | La misma red, la mitad de velocidad |
| 2 poles at 60 Hz: 3600 rpm. | 2 polos a 60 Hz: 3600 rpm. |
| 4 poles: the field has twice as far to go. | 4 polos: el campo tiene el doble de camino. |
| 1800 rpm. n_sync = 120 f / P | 1800 rpm. n_sinc = 120 f / P |

**reactive-myth**

| EN | ES |
|---|---|
| Where does reactive power actually go? | ¿A dónde va realmente la potencia reactiva? |
| In one phase, energy flows in… | En una fase, la energía entra… |
| …and part of it flows back. | …y una parte regresa. |
| That back-and-forth averages zero. Its size is Q. | Ese ir y venir promedia cero. Su tamaño es Q. |
| Add all three phases: the total is steady. | Suma las tres fases: el total es constante. |
| No net sloshing — but Q still costs current. | No hay vaivén neto, pero Q igual exige corriente. |

**excitation-sweep**

| EN | ES |
|---|---|
| One knob decides if the machine gives or takes reactive power | Una perilla decide si la máquina da o toma potencia reactiva |
| Field down: it borrows magnetism from the grid. | Campo bajo: toma su magnetismo de la red. |
| Just right: current in step with voltage. | En el punto justo: corriente en fase con la tensión. |
| Field up: it supplies magnetism and gives Q back. | Campo alto: aporta el magnetismo y entrega Q. |
| Same active power the whole time. | La potencia activa nunca cambia. |

(The brief's suggested hook "…gives or takes Q" was changed to "reactive power" to keep symbols out of the first line.)

**motor-to-generator**

| EN | ES |
|---|---|
| Same machine, energy flowing backwards | La misma máquina, la energía al revés |
| As a motor, the field pulls the rotor. | Como motor, el campo arrastra al rotor. |
| Now push the shaft… | Ahora empuja el eje… |
| …the rotor moves ahead of the field. | …el rotor se adelanta al campo. |
| Energy flows back to the grid. Only δ changed sign. | La energía vuelve a la red. Solo δ cambió de signo. |

**pull-out**

| EN | ES |
|---|---|
| What happens when you ask for too much? | ¿Qué pasa si le pides demasiado? |
| More load: the rotor falls further behind the field. | Más carga: el rotor se atrasa más respecto al campo. |
| The magnetic pull peaks at 90°. | La atracción magnética llega a su máximo en 90°. |
| Past that, the rotor slips a pole. | Más allá, el rotor se desliza un polo. |
| Loss of synchronism. (Qualitative) | Pérdida de sincronismo. (Cualitativo) |
