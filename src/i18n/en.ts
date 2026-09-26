/**
 * English dictionary — SOURCE OF TRUTH for every visible string.
 *
 * Conventions:
 *  - Symbols with subscripts are written `E_A`, `V_φ`, `B_net`, `P_max` …; the UI renders the part
 *    after `_` as a subscript. Symbols must be identical in every language (checked by tests),
 *    except the `symbols` namespace, which holds the few symbols Chapman writes differently per edition.
 *  - Placeholders are `{name}` and must match across languages (checked by tests).
 *  - Units (W, var, VA, V, A, Hz, rpm, Ω, N·m) are not translated; see ./symbols.ts.
 */
export const en = {
  meta: {
    appTitle: 'Synchronous Machine',
    appSubtitle: 'Visual physics of synchronous motors & generators',
  },

  language: {
    label: 'Language',
    en: 'English',
    es: 'Español',
  },

  appModes: {
    label: 'View',
    explore: 'Explore',
    lesson: 'Guided lesson',
    presentation: 'Presentation',
  },

  machineMode: {
    label: 'Operating mode',
    motor: 'Motor',
    generator: 'Generator',
    noLoad: 'No load',
    derivedNote: 'The mode follows the sign of P: it changes when P crosses zero.',
  },

  controls: {
    frequency: 'Grid frequency',
    poles: 'Poles',
    lineVoltage: 'Grid line voltage',
    shaftLoad: 'Shaft load',
    primeMover: 'Prime-mover power',
    excitation: 'Rotor excitation',
    play: 'Play',
    pause: 'Pause',
    stepForward: 'Step forward',
    stepBack: 'Step back',
    animationSpeed: 'Animation speed',
    units: 'Units',
    unitsReal: 'SI units',
    unitsPu: 'Per unit',
    showVectors: 'Vectors',
    showLabels: 'Labels',
    showAngles: 'Angles',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset view',
    scenario: 'Scenario',
  },

  quantities: {
    vPhi: 'Phase voltage',
    vT: 'Line voltage',
    eA: 'Internal generated voltage',
    iA: 'Armature current',
    iL: 'Line current',
    xS: 'Synchronous reactance',
    rA: 'Armature resistance',
    iF: 'Field current',
    theta: 'Power-factor angle',
    delta: 'Torque angle',
    bR: 'Rotor field',
    bS: 'Stator field',
    bNet: 'Net air-gap field',
    nM: 'Shaft speed',
    nSync: 'Synchronous speed',
    p: 'Active power',
    q: 'Reactive power',
    s: 'Apparent power',
    pf: 'Power factor',
    torque: 'Induced torque',
    pMax: 'Maximum power',
    frequency: 'Frequency',
    poles: 'Number of poles',
  },

  /** Symbols Chapman writes differently in each edition. */
  symbols: {
    nSync: 'n_sync',
    pfAbbrev: 'PF',
  },

  powerFactor: {
    lagging: 'lagging',
    leading: 'leading',
    unity: 'unity',
    thetaNote: 'Chapman writes θ for the power-factor angle; some texts use φ.',
  },

  angles: {
    electrical: 'electrical',
    mechanical: 'mechanical',
    eALeads: 'E_A leads V_φ',
    eALags: 'E_A lags V_φ',
    eAInPhase: 'E_A in phase with V_φ',
    iALags: 'I_A lags V_φ',
    iALeads: 'I_A leads V_φ',
    iAInPhase: 'I_A in phase with V_φ',
    mechanicalNote:
      'Inside the machine you see δ/(poles/2): with {poles} poles, {deltaElec} electrical = {deltaMech} mechanical.',
    deltaBetweenFields: 'δ is the angle between B_R and B_net — not between B_R and B_S.',
  },

  convention: {
    generator: 'Generator convention: I_A flows out of the machine',
    motor: 'Motor convention: I_A flows into the machine',
    perPhase: 'per-phase values',
    line: 'line values',
    threePhase: 'three-phase total',
  },

  gridView: {
    title: 'Seen from the grid',
    pDelivers: 'Delivers P to the grid',
    pAbsorbs: 'Absorbs P from the grid',
    pNone: 'No net active power',
    qDelivers: 'Delivers Q to the grid',
    qAbsorbs: 'Absorbs Q from the grid',
    qNone: 'No reactive power',
    unifyingIdea: 'Over-excited: delivers Q. Under-excited: absorbs Q. Motor or generator alike.',
  },

  energyFlow: {
    grid: 'Grid',
    machine: 'Machine',
    shaft: 'Shaft',
    motorChain: 'Electrical energy → magnetic field → torque → mechanical energy',
    generatorChain: 'Mechanical energy → rotor motion → induction → electrical energy',
  },

  torque: {
    drives: 'drives the rotor',
    opposes: 'opposes the rotation',
    none: 'no torque',
  },

  excitationState: {
    under: 'Under-excited',
    unity: 'Unity power factor',
    over: 'Over-excited',
  },

  stability: {
    stable: 'In synchronism',
    nearLimit: 'Near the stability limit',
    lost: 'Loss of synchronism',
    margin: 'P / P_max',
    limitNote: 'Static stability limit: δ = 90°.',
    lostExplanation: 'The demand exceeds P_max: there is no steady state, and the rotor slips poles.',
    excitationNote: 'Less excitation lowers P_max: under-exciting can also cause loss of synchronism.',
  },

  warnings: {
    statorOvercurrent: 'I_A above rated current: the stator windings overheat.',
    fieldOverexcitation: 'I_F above its rating: the field winding overheats.',
  },

  assumptions: {
    infiniteBus: 'Infinite bus: the grid fixes V_T and f.',
    cylindricalRotor: 'Cylindrical-rotor model.',
    salientDrawing: 'Poles drawn salient for clarity; the math uses a cylindrical rotor.',
    lossless: 'Idealized machine: R_A = 0, no losses.',
    noSaturation: 'No saturation: E_A is proportional to I_F (air-gap line).',
    linearVCurves: 'V curves of the linear (unsaturated) model.',
    qualitative: 'Qualitative scene',
    slowMotion: 'Slow motion — the real machine turns at {rpm} rpm.',
    noSelfStart:
      'A synchronous motor cannot start on its own: damper windings or an auxiliary drive bring it close to synchronous speed first.',
    visualScale: 'Vector lengths are scaled for readability.',
  },

  scenarios: {
    A: { title: 'Motor at unity PF', description: 'Full load; I_A in phase with V_φ.' },
    B: { title: 'Generator at rated point', description: '100 kVA at PF 0.8 lagging.' },
    C: { title: 'Over-excited motor', description: 'Leading PF: the motor delivers Q to the grid.' },
    D: { title: 'Under-excited motor', description: 'Lagging PF: the motor absorbs Q from the grid.' },
    E: { title: 'Generator at unity PF', description: 'Full-load P delivered with no Q.' },
    F: {
      title: 'Generator, excitation sweep',
      description: 'Constant P while I_F changes: Q goes from absorbed to delivered.',
    },
    G: { title: 'Near the stability limit', description: 'Full-load motor with low excitation: δ ≈ 75°.' },
  },

  scenes: {
    s01: { title: 'What actually rotates?', question: 'Which parts turn — and how fast?' },
    s02: {
      title: 'The rotating magnetic field',
      question: 'How do three fixed coils make a field that turns?',
    },
    s03: { title: 'Synchronous speed', question: 'Why do more poles mean a slower machine?' },
    s04: {
      title: 'The rotor field locks in',
      question: 'Why does the rotor keep pace with the field — and why can’t it start by itself?',
    },
    s05: { title: 'Motor or generator?', question: 'One machine, energy flowing either way.' },
    s06: {
      title: 'Voltage, current, phase shift',
      question: 'What does it mean for the current to lag the voltage?',
    },
    s07: {
      title: 'Instantaneous power',
      question: 'Where does the energy go during each cycle?',
    },
    s08: { title: 'P, Q and S', question: 'Which power does work, and which one only heats the wires?' },
    s09: { title: 'Power factor', question: 'Why does a low power factor cost extra current?' },
    s10: { title: 'The torque angle δ', question: 'What is δ, physically?' },
    s11: {
      title: 'Stability limit',
      question: 'What happens when you ask for more than the machine can transmit?',
    },
    s12: {
      title: 'Excitation',
      question: 'How does one knob decide whether the machine gives or takes reactive power?',
    },
    s13: { title: 'The complete phasor diagram', question: 'What do the phasors really represent?' },
    s14: { title: 'V curves', question: 'Why is the current smallest at unity power factor?' },
    s15: { title: 'The whole system', question: 'Everything, together.' },
  },

  clips: {
    rotatingField: { hook: 'Three currents, one rotating magnet' },
    polesSpeed: { hook: 'Same grid, half the speed' },
    reactiveMyth: { hook: 'Where does reactive power actually go?' },
    excitationSweep: { hook: 'One knob decides if the machine gives or takes reactive power' },
    motorToGenerator: { hook: 'Same machine, energy flowing backwards' },
    pullOut: { hook: 'What happens when you ask for too much?' },
  },

  nav: {
    label: 'Sections',
    machine: 'The machine',
    field: 'Rotating field',
  },

  machineLab: {
    title: 'The machine',
    lead: 'Stator, rotor and three fields — B_R, B_S and B_net — turning together at synchronous speed.',
    viewTitle: 'Cross-section',
    operatingPoint: 'Operating point',
    rotorField: 'Rotor field B_R',
    statorField: 'Stator field B_S',
    netField: 'Net field B_net',
    vectorSum: 'B_net = B_R + B_S',
    deltaArc: 'Angle δ',
    gapFlux: 'Net air-gap flux',
    deltaInside: 'δ inside the machine',
    deltaPhasor: 'δ between E_A and V_φ',
    mechanicalShort: 'mech.',
    electricalShort: 'elec.',
    syncNote: 'Rotor and fields turn together at {nSync}: the angles between them stay fixed.',
    sumNoteTwoPoles: 'With 2 poles the arrows add as vectors: B_net = B_R + B_S.',
    sumNoteManyPoles:
      'With {poles} poles each arrow points at one N pole of its field; the vector sum B_net = B_R + B_S holds in electrical degrees.',
    rotorPolesNote: 'The rotor’s N pole sits on B_R; the field winding (I_F) makes it.',
    rotation: 'The curved arrow outside the stator shows the direction of rotation (counterclockwise).',
    fieldCurrentShort: 'field current I_F',
  },

  fieldLab: {
    title: 'The rotating magnetic field',
    lead: 'Three fixed coils carry three currents 120° apart. Together they make one field that turns.',
    currentsTitle: 'Stator currents',
    currentsAxis: 'i / I_max',
    angleAxis: 'ωt, electrical degrees',
    vectorsTitle: 'Field of each phase',
    vectorsNote: 'electrical degrees',
    airGapTitle: 'Cross-section: stator and air gap',
    captionPulsating: 'Each phase only pulses back and forth along its own axis.',
    captionResultant: 'Their sum keeps a constant length, 1.5 B_M, and turns at ω.',
    captionCoilAxis: 'The field of a coil is perpendicular to the plane of its conductors.',
    hoverHint: 'Hover over a coil (or focus it with Tab) to highlight its magnetic axis in both panels.',
    coilAxes: 'Coil axes',
    captionPoleFaces: 'N and S are stator pole faces: flux leaves the stator at N and enters it at S.',
    captionTwoPoles: 'With 2 poles, one electrical cycle turns the field once around the machine.',
    captionManyPoles:
      'With {poles} poles there are {pairs} N–S pairs around the air gap: one turn of the field takes {pairs} electrical cycles.',
    noRotor: 'No rotor yet: this is the stator field alone.',
    phase: 'Phase {phase}',
    resultant: 'Resultant',
    tipToTail: 'Tip-to-tail sum',
    airGapFlux: 'Air-gap flux',
    currentOut: 'current out of the page',
    currentIn: 'current into the page',
    electricalAngle: 'ωt (electrical)',
    fieldPosition: 'Field position (mechanical)',
    slowMotionFactor: '{factor}× slower than real time',
    keyboardHint: 'Space: play / pause · ← →: step 5°',
    scrubHint: 'Drag across the plot to move through the cycle.',
    show: 'Show',
    playback: 'Playback',
    grid: 'Grid',
  },
};

export type Dictionary = typeof en;
