# Glossary — English / Español

Terminology aligned with Chapman, *Electric Machinery Fundamentals*, and its Spanish edition, *Máquinas eléctricas*
(McGraw-Hill). Symbols are the same in both languages except where noted.

| English | Español | Symbol | Notes |
|---|---|---|---|
| synchronous machine | máquina síncrona | | |
| synchronous motor / generator | motor / generador síncrono | | |
| stator | estator | | |
| rotor | rotor | | |
| cylindrical (round) rotor | rotor cilíndrico | | |
| salient pole | polo saliente | | |
| armature winding | devanado de armadura | | |
| field winding | devanado de campo | | |
| damper (amortisseur) winding | devanado de amortiguamiento | | |
| air gap | entrehierro | | |
| shaft | eje | | |
| prime mover | motor primario | | Drives the generator's shaft. |
| phase voltage | tensión de fase | V_φ | Chapman ES: *voltaje de fase*. |
| terminal (line) voltage | tensión en terminales (de línea) | V_T | |
| internal generated voltage | tensión interna generada | E_A | Chapman ES: *voltaje interno generado*. |
| armature current | corriente de armadura | I_A | |
| line current | corriente de línea | I_L | |
| field current | corriente de campo | I_F | |
| excitation | excitación | | |
| synchronous reactance | reactancia síncrona | X_S | |
| armature resistance | resistencia del inducido / de armadura | R_A | |
| armature reaction | reacción del inducido / de armadura | | |
| rotating magnetic field | campo magnético giratorio | | |
| rotor field / stator field / net field | campo del rotor / del estator / neto | B_R, B_S, B_net | |
| synchronous speed | velocidad síncrona | n_sync (EN) / n_sinc (ES) | The only symbol that differs; follows each edition. |
| shaft (mechanical) speed | velocidad mecánica (del eje) | n_m | |
| number of poles | número de polos | P | Same letter as active power, as in Chapman. |
| electrical / mechanical degrees | grados eléctricos / mecánicos | | |
| torque angle / power angle | ángulo de par / ángulo de potencia | δ | |
| power-factor angle | ángulo del factor de potencia | θ | Other texts use φ. |
| induced torque | par inducido | τ_ind | |
| pull-out torque | par máximo | | |
| static stability limit | límite de estabilidad estática | | |
| loss of synchronism / pull-out | pérdida de sincronismo | | |
| pole slipping | deslizamiento de polos | | |
| infinite bus | bus infinito | | |
| active power | potencia activa | P | W, kW, MW |
| reactive power | potencia reactiva | Q | var, kvar, Mvar |
| apparent power | potencia aparente | S | VA, kVA, MVA |
| complex power | potencia compleja | S = P + jQ | |
| power factor | factor de potencia | PF (EN) / FP (ES) | Abbreviation differs by language. |
| lagging / leading | en retraso / en adelanto | | |
| unity power factor | factor de potencia unitario | | |
| overexcited / underexcited | sobreexcitado / subexcitado | | |
| synchronous condenser | condensador síncrono | | Unloaded over-excited motor. |
| V curves | curvas V | | |
| capability curve | curva de capacidad | | Future feature. |
| open-circuit characteristic | característica de circuito abierto | | |
| air-gap line | línea del entrehierro | | |
| saturation | saturación | | |
| phasor / phasor diagram | fasor / diagrama fasorial | | |
| per unit | por unidad | pu | |
| rated (value) | nominal | | |
| instantaneous power | potencia instantánea | p(t) | |

## Language decisions

- **tensión vs voltaje.** The UI uses *tensión* (as requested in the brief). Chapman's Spanish edition says *voltaje*
  (e.g. *voltaje interno generado*); both are listed above so readers of either can map them.
- **Number format.** Spanish uses the `es-419` (Latin American) locale: decimal point and comma thousands separator
  (1,234.5), matching Chapman's Mexican edition and much of the target audience. Countries that use a decimal comma will
  still read it correctly; a switch could be added if needed.
- **Units** (W, var, VA, V, A, Hz, rpm, Ω, N·m, pu) are identical in both languages.
