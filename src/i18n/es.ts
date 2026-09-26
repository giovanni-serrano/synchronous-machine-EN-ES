import type { Dictionary } from './en';

/**
 * Diccionario en español. Debe tener exactamente las mismas claves que `en`
 * (TypeScript falla si falta o sobra alguna; tests/i18n.test.ts lo verifica también).
 * Los textos se adaptan con naturalidad; los símbolos no cambian.
 */
export const es: Dictionary = {
  meta: {
    appTitle: 'Máquina síncrona',
    appSubtitle: 'Física visual de motores y generadores síncronos',
  },

  language: {
    label: 'Idioma',
    en: 'English',
    es: 'Español',
  },

  appModes: {
    label: 'Vista',
    explore: 'Explorar',
    lesson: 'Lección guiada',
    presentation: 'Presentación',
  },

  machineMode: {
    label: 'Modo de operación',
    motor: 'Motor',
    generator: 'Generador',
    noLoad: 'En vacío',
    derivedNote: 'El modo lo decide el signo de P: cambia cuando P pasa por cero.',
  },

  controls: {
    frequency: 'Frecuencia de la red',
    poles: 'Polos',
    lineVoltage: 'Voltaje de línea de la red',
    shaftLoad: 'Carga en el eje',
    primeMover: 'Potencia del motor primario',
    excitation: 'Excitación del rotor',
    play: 'Reproducir',
    pause: 'Pausa',
    stepForward: 'Avanzar un cuadro',
    stepBack: 'Retroceder un cuadro',
    animationSpeed: 'Velocidad de animación',
    units: 'Unidades',
    unitsReal: 'Unidades SI',
    unitsPu: 'Por unidad',
    showVectors: 'Vectores',
    showLabels: 'Etiquetas',
    showAngles: 'Ángulos',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    resetView: 'Restablecer vista',
    scenario: 'Escenario',
  },

  quantities: {
    vPhi: 'Voltaje de fase',
    vT: 'Voltaje de línea',
    eA: 'Voltaje interno generado',
    iA: 'Corriente de armadura',
    iL: 'Corriente de línea',
    xS: 'Reactancia síncrona',
    rA: 'Resistencia de armadura',
    iF: 'Corriente de campo',
    theta: 'Ángulo del factor de potencia',
    delta: 'Ángulo de par',
    bR: 'Campo del rotor',
    bS: 'Campo del estator',
    bNet: 'Campo neto en el entrehierro',
    nM: 'Velocidad del eje',
    nSync: 'Velocidad síncrona',
    p: 'Potencia activa',
    q: 'Potencia reactiva',
    s: 'Potencia aparente',
    pf: 'Factor de potencia',
    torque: 'Par inducido',
    pMax: 'Potencia máxima',
    frequency: 'Frecuencia',
    poles: 'Número de polos',
  },

  symbols: {
    nSync: 'n_sinc',
    pfAbbrev: 'FP',
  },

  powerFactor: {
    lagging: 'en retraso',
    leading: 'en adelanto',
    unity: 'unitario',
    thetaNote: 'Chapman usa θ para el ángulo del factor de potencia; otros textos usan φ.',
  },

  angles: {
    electrical: 'eléctricos',
    mechanical: 'mecánicos',
    eALeads: 'E_A adelanta a V_φ',
    eALags: 'E_A está en retraso respecto a V_φ',
    eAInPhase: 'E_A en fase con V_φ',
    iALags: 'I_A está en retraso respecto a V_φ',
    iALeads: 'I_A adelanta a V_φ',
    iAInPhase: 'I_A en fase con V_φ',
    mechanicalNote:
      'Dentro de la máquina se ve δ/(polos/2): con {poles} polos, {deltaElec} eléctricos = {deltaMech} mecánicos.',
    deltaBetweenFields: 'δ es el ángulo entre B_R y B_net, no entre B_R y B_S.',
  },

  convention: {
    generator: 'Convención de generador: I_A sale de la máquina',
    motor: 'Convención de motor: I_A entra a la máquina',
    perPhase: 'valores por fase',
    line: 'valores de línea',
    threePhase: 'total trifásico',
  },

  gridView: {
    title: 'Visto desde la red',
    pDelivers: 'Entrega P a la red',
    pAbsorbs: 'Absorbe P de la red',
    pNone: 'Sin potencia activa neta',
    qDelivers: 'Entrega Q a la red',
    qAbsorbs: 'Absorbe Q de la red',
    qNone: 'Sin potencia reactiva',
    unifyingIdea: 'Sobreexcitada, entrega Q. Subexcitada, absorbe Q. Sea motor o generador.',
  },

  energyFlow: {
    grid: 'Red',
    machine: 'Máquina',
    shaft: 'Eje',
    motorChain: 'Energía eléctrica → campo magnético → par → energía mecánica',
    generatorChain: 'Energía mecánica → giro del rotor → inducción → energía eléctrica',
  },

  torque: {
    drives: 'impulsa al rotor',
    opposes: 'se opone al giro',
    none: 'sin par',
  },

  excitationState: {
    under: 'Subexcitada',
    unity: 'Factor de potencia unitario',
    over: 'Sobreexcitada',
  },

  stability: {
    stable: 'En sincronismo',
    nearLimit: 'Cerca del límite de estabilidad',
    lost: 'Pérdida de sincronismo',
    margin: 'P / P_max',
    limitNote: 'Límite de estabilidad estática: δ = 90°.',
    lostExplanation:
      'La demanda supera P_max: no existe régimen permanente y el rotor se desliza respecto al campo.',
    excitationNote:
      'Menos excitación reduce P_max: subexcitar también puede provocar la pérdida de sincronismo.',
  },

  warnings: {
    statorOvercurrent: 'I_A supera la corriente nominal: los devanados del estator se sobrecalientan.',
    fieldOverexcitation: 'I_F supera su valor nominal: el devanado de campo se sobrecalienta.',
  },

  assumptions: {
    infiniteBus: 'Bus infinito: la red fija V_T y f.',
    cylindricalRotor: 'Modelo de rotor cilíndrico.',
    salientDrawing: 'Polos dibujados salientes por claridad; el modelo matemático es de rotor cilíndrico.',
    lossless: 'Máquina ideal: R_A = 0, sin pérdidas.',
    noSaturation: 'Sin saturación: E_A es proporcional a I_F (línea de entrehierro).',
    linearVCurves: 'Curvas V del modelo lineal (sin saturación).',
    qualitative: 'Escena cualitativa',
    slowMotion: 'Cámara lenta: la máquina real gira a {rpm} rpm.',
    noSelfStart:
      'Un motor síncrono no arranca solo: los devanados de amortiguamiento o un accionamiento auxiliar lo llevan antes cerca de la velocidad síncrona.',
    visualScale: 'Las longitudes de los vectores están escaladas para que se lean mejor.',
  },

  scenarios: {
    A: { title: 'Motor con FP unitario', description: 'Plena carga; I_A en fase con V_φ.' },
    B: { title: 'Generador en su punto nominal', description: '100 kVA con FP 0.8 en retraso.' },
    C: {
      title: 'Motor sobreexcitado',
      description: 'FP en adelanto: el motor entrega Q a la red.',
    },
    D: {
      title: 'Motor subexcitado',
      description: 'FP en retraso: el motor absorbe Q de la red.',
    },
    E: { title: 'Generador con FP unitario', description: 'Entrega P de plena carga sin Q.' },
    F: {
      title: 'Generador: barrido de excitación',
      description: 'P constante mientras cambia I_F: Q pasa de absorbida a entregada.',
    },
    G: {
      title: 'Cerca del límite de estabilidad',
      description: 'Motor a plena carga con poca excitación: δ ≈ 75°.',
    },
  },

  scenes: {
    s01: { title: '¿Qué gira realmente?', question: '¿Qué partes giran y a qué velocidad?' },
    s02: {
      title: 'El campo magnético giratorio',
      question: '¿Cómo logran tres bobinas fijas un campo que gira?',
    },
    s03: { title: 'Velocidad síncrona', question: '¿Por qué más polos significan menos velocidad?' },
    s04: {
      title: 'El campo del rotor se engancha',
      question: '¿Por qué el rotor sigue el paso del campo, y por qué no puede arrancar solo?',
    },
    s05: {
      title: '¿Motor o generador?',
      question: 'Una sola máquina; la energía puede fluir en cualquier sentido.',
    },
    s06: {
      title: 'Voltaje, corriente y desfase',
      question: '¿Qué significa que la corriente esté en retraso respecto al voltaje?',
    },
    s07: {
      title: 'Potencia instantánea',
      question: '¿A dónde va la energía en cada ciclo?',
    },
    s08: {
      title: 'P, Q y S',
      question: '¿Qué potencia hace trabajo y cuál solo calienta los conductores?',
    },
    s09: {
      title: 'Factor de potencia',
      question: '¿Por qué un factor de potencia bajo exige más corriente?',
    },
    s10: { title: 'El ángulo de par δ', question: '¿Qué es δ, físicamente?' },
    s11: {
      title: 'Límite de estabilidad',
      question: '¿Qué pasa si le pides más de lo que la máquina puede transmitir?',
    },
    s12: {
      title: 'Excitación',
      question: '¿Cómo decide una sola perilla si la máquina da o toma potencia reactiva?',
    },
    s13: {
      title: 'El diagrama fasorial completo',
      question: '¿Qué representan realmente los fasores?',
    },
    s14: {
      title: 'Curvas V',
      question: '¿Por qué la corriente es mínima con factor de potencia unitario?',
    },
    s15: { title: 'El sistema completo', question: 'Todo junto.' },
  },

  clips: {
    rotatingField: { hook: 'Tres corrientes, un imán que gira' },
    polesSpeed: { hook: 'La misma red, la mitad de velocidad' },
    reactiveMyth: { hook: '¿A dónde va realmente la potencia reactiva?' },
    excitationSweep: { hook: 'Una perilla decide si la máquina da o toma potencia reactiva' },
    motorToGenerator: { hook: 'La misma máquina, la energía al revés' },
    pullOut: { hook: '¿Qué pasa si le pides demasiado?' },
  },

  fieldLab: {
    title: 'El campo magnético giratorio',
    lead: 'Tres bobinas fijas llevan tres corrientes desfasadas 120°. Juntas forman un solo campo que gira.',
    currentsTitle: 'Corrientes del estator',
    currentsAxis: 'i / I_max',
    angleAxis: 'ωt, grados eléctricos',
    vectorsTitle: 'Campo de cada fase',
    vectorsNote: 'grados eléctricos',
    airGapTitle: 'Corte transversal: estator y entrehierro',
    captionPulsating: 'Cada fase solo pulsa, adelante y atrás, sobre su propio eje.',
    captionResultant: 'Su suma mantiene una longitud constante, 1.5 B_M, y gira a ω.',
    captionCoilAxis: 'El campo de una bobina es perpendicular al plano de sus conductores.',
    hoverHint: 'Pasa el mouse sobre una bobina (o selecciónala con Tab) para resaltar su eje magnético en ambos paneles.',
    coilAxes: 'Ejes de las bobinas',
    captionPoleFaces: 'N y S son caras polares del estator: el flujo sale del estator por N y entra por S.',
    captionTwoPoles: 'Con 2 polos, un ciclo eléctrico hace que el campo dé una vuelta completa a la máquina.',
    captionManyPoles:
      'Con {poles} polos hay {pairs} pares N–S alrededor del entrehierro: una vuelta del campo toma {pairs} ciclos eléctricos.',
    noRotor: 'Todavía sin rotor: este es solo el campo del estator.',
    phase: 'Fase {phase}',
    resultant: 'Resultante',
    tipToTail: 'Suma punta con cola',
    airGapFlux: 'Flujo en el entrehierro',
    currentOut: 'corriente saliendo de la página',
    currentIn: 'corriente entrando a la página',
    electricalAngle: 'ωt (eléctrico)',
    fieldPosition: 'Posición del campo (mecánica)',
    slowMotionFactor: '{factor} veces más lento que en tiempo real',
    keyboardHint: 'Espacio: reproducir / pausa · ← →: avanzar 5°',
    scrubHint: 'Arrastra sobre la gráfica para recorrer el ciclo.',
    show: 'Mostrar',
    playback: 'Reproducción',
    grid: 'Red',
  },
};
