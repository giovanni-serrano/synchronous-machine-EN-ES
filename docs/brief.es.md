<!-- Original project brief, as provided by the author (Spanish, verbatim). Source of requirements for all phases. -->

# SYNCHRONOUS MACHINE
## Visual Physics of Synchronous Motors & Generators

Quiero que construyas una **experiencia educativa web interactiva** para comprender, de forma intuitiva y matemática, cómo funciona una máquina síncrona, tanto como MOTOR como GENERADOR.

No es una página web tradicional, ni una presentación, ni un modelo 3D decorativo. Es un **laboratorio visual**.

Tiene dos usos:

1. Laboratorio interactivo para estudiar.
2. Fuente de escenas para grabar después (con OBS) un video educativo.

Diseña primero la EXPERIENCIA INTERACTIVA. El video sale de ella; no generes MP4.

---

# 0. PRINCIPIO FUNDAMENTAL

Prioridad absoluta: **corrección física + claridad pedagógica + visualización intuitiva.**

- No sacrifiques física correcta por una animación espectacular.
- No inventes relaciones físicas.
- Toda simplificación de ingeniería debe estar declarada en `docs/physics-model.md` y, cuando sea relevante, indicada en la interfaz.
- Si una animación puede sugerir una idea físicamente falsa, corrígela o acláralo en pantalla.

---

# 1. OBJETIVOS DE APRENDIZAJE (lo que el usuario debe dominar al final)

Todo el proyecto se organiza alrededor de tres pilares. Cada escena, control y visualización debe servir a al menos uno.

## Pilar 1 — Cómo funciona la máquina

Al terminar, el usuario debe poder explicar:

- qué partes tiene (estator, devanados trifásicos, rotor, polos, excitación de campo, eje);
- qué gira realmente y a qué velocidad;
- por qué el rotor gira exactamente a velocidad síncrona en régimen permanente;
- por qué el motor síncrono no arranca solo (y que en la práctica se usan devanados amortiguadores o arranque auxiliar);
- que motor y generador son **la misma máquina** operando en sentidos energéticos opuestos;
- qué ocurre si se exige más potencia de la que la máquina puede transmitir (pérdida de sincronismo).

## Pilar 2 — Los principios físicos

Al terminar, el usuario debe poder explicar:

- cómo tres corrientes desfasadas 120° producen un campo magnético giratorio;
- por qué n_sinc = 120 f / P;
- que el rotor tiene su propio campo (excitación) y que el torque surge de la tendencia de dos campos a alinearse;
- qué es δ físicamente (ángulo entre campos dentro de la máquina) y cómo se relaciona con el torque y la potencia;
- cómo la inducción electromagnética genera E_A y de qué depende (E_A = K φ ω);
- qué representa un fasor y por qué el diagrama fasorial describe lo que ocurre dentro de la máquina.

## Pilar 3 — Las potencias

Al terminar, el usuario debe poder explicar con intuición, matemática y aplicación de ingeniería:

- **P (activa):** transferencia neta de energía útil. W, kW, MW.
- **Q (reactiva):** qué significa físicamente, de dónde sale y por qué la excitación la controla. var, kvar, Mvar.
- **S (aparente):** por qué dimensiona equipos (corriente y calentamiento). VA, kVA, MVA.
- **S = P + jQ:** qué significan la parte real y la imaginaria, sin asumir que "jQ" es intuitivo.
- **FP = cos θ:** qué significa atrasado/adelantado y por qué importa.
- por qué una máquina síncrona puede entregar o absorber Q, y esta idea unificadora:
  **una máquina sobreexcitada entrega Q a la red; una subexcitada la absorbe, sea motor o generador.**

Estas preguntas deben poder responderse observando y manipulando la simulación:

- ¿Por qué el rotor gira a velocidad síncrona?
- ¿Qué significa que el FP sea atrasado?
- ¿De dónde sale la potencia reactiva?
- ¿Qué diferencia física hay entre P, Q y S?
- ¿Por qué aumentar la excitación cambia Q?
- ¿Qué es δ físicamente?
- ¿Qué cambia cuando la misma máquina pasa de motor a generador?
- ¿Qué representan realmente los fasores?

Documenta estos objetivos en `docs/learning-objectives.md` y relaciona cada escena con los objetivos que cubre.

---

# 2. ROL

Trabaja simultáneamente como ingeniero eléctrico especializado en máquinas, profesor universitario de máquinas eléctricas, diseñador de visualizaciones científicas, desarrollador frontend y diseñador de experiencias educativas.

Usuario objetivo: estudiante de Ingeniería Eléctrica que conoce circuitos básicos y estudia con **Chapman, *Electric Machinery Fundamentals* / *Máquinas Eléctricas***. Audiencia principal de habla inglesa; audiencia secundaria en Latinoamérica. Quiere comprensión real, no memorizar ecuaciones.

---

# 3. MODELO FÍSICO (decisiones ya tomadas; no las cambies sin consultarme)

## 3.1 Referencia bibliográfica y notación

Usa las convenciones y la notación de **Chapman**:

| Símbolo | Significado |
|---|---|
| V_φ | tensión de fase en terminales |
| V_T | tensión de línea en terminales |
| E_A | tensión interna generada (por fase) |
| I_A | corriente de armadura (por fase) |
| I_L | corriente de línea |
| X_S | reactancia síncrona (por fase) |
| R_A | resistencia de armadura |
| I_F | corriente de campo (excitación) |
| θ | ángulo del factor de potencia (entre V_φ e I_A) |
| δ | ángulo de par / ángulo de carga (entre E_A y V_φ) |
| B_R, B_S, B_net | campo del rotor, del estator y neto del entrehierro |
| n_m | velocidad mecánica en rpm |

Chapman usa θ para el ángulo del FP (otros textos usan φ). Usa θ y aclara la equivalencia una sola vez en la interfaz.

## 3.2 Suposiciones del modelo (versión 1)

- Máquina conectada a un **bus infinito**: V_T y f los fija la red y no cambian con la carga ni con la excitación. Indicarlo en la interfaz.
- Rotor **cilíndrico** (polos no salientes). Si se dibujan polos salientes por claridad visual, aclarar que el modelo matemático es de rotor cilíndrico.
- **R_A = 0** en el modelo principal (idealizado, sin pérdidas). Las pérdidas pueden añadirse después como modo opcional.
- **Sin saturación**: E_A es proporcional a I_F (línea de entrehierro). En consecuencia, las curvas V serán las del modelo lineal; indicarlo.
- Sistema trifásico **balanceado**, conexión en Y para los cálculos por fase.
- Régimen permanente, salvo en escenas explícitamente transitorias (sincronización, pérdida de sincronismo), que son **cualitativas** y deben etiquetarse como tales.

## 3.3 Variables independientes y derivadas

Esto es crítico para evitar un modelo sobredeterminado.

**Entradas (el usuario las controla):**
- selector MOTOR / GENERADOR: fija el sentido de la potencia en el eje (ver 3.4.1)
- V_T y f (parámetros de la red)
- número de polos P
- carga: magnitud de la potencia mecánica en el eje (carga del motor o potencia de la turbina del generador)
- excitación: I_F (determina E_A)

**Salidas (se calculan, nunca se fijan directamente):**
- n_sinc, δ, I_A, θ, FP, P, Q, S

El FP **no** es un control independiente. Si un escenario predefinido pide "FP = 0.8 atrasado", el modelo debe **resolver** la excitación necesaria para lograrlo con la carga dada, y mover el slider de excitación a ese valor.

## 3.4 Ecuaciones (Chapman)

- Velocidad: n_sinc = 120 f / P
- Tensión interna: E_A = K φ ω, con φ ∝ I_F (sin saturación)
- **Generador** (I_A sale de la máquina): E_A = V_φ + jX_S I_A
- **Motor** (I_A entra a la máquina): V_φ = E_A + jX_S I_A
- Potencia (con R_A = 0): P = 3 V_φ E_A sen δ / X_S — **siempre con valores de fase**
- Par inducido: τ_ind = 3 V_φ E_A sen δ / (ω_m X_S)
- Potencias trifásicas: P = √3 V_T I_L cos θ = 3 V_φ I_A cos θ; Q = √3 V_T I_L sen θ; S = √3 V_T I_L
- |S|² = P² + Q²; S = P + jQ

Nunca mezcles valores de línea y de fase en una misma fórmula. Cuando se muestre una fórmula en pantalla, indica si los valores son de fase o de línea.

## 3.4.1 Una convención interna, dos presentaciones

Para que motor y generador sean realmente el mismo modelo y la transición entre ellos sea continua:

- **Internamente**, el modelo usa **una sola convención con signo**: la de generador (I_A positiva saliendo de la máquina), con δ con signo. δ > 0: E_A adelanta a V_φ, la máquina genera, P > 0 entregada a la red. δ < 0: E_A atrasa a V_φ, la máquina funciona como motor, P < 0 (absorbe de la red). Así, P = 3 V_φ E_A sen δ / X_S vale con signo en ambos modos.
- **En pantalla**, las magnitudes se presentan según Chapman para el modo activo: en modo motor, I_A se muestra entrando a la máquina (I_A,motor = −I_A,interna), P se muestra positiva como potencia absorbida y δ se muestra como magnitud con la aclaración "E_A atrasa a V_φ".
- El modo (MOTOR / GENERADOR) se **deriva del signo de P**. El selector de modo fija el sentido de la potencia en el eje; si el usuario lleva la carga continuamente de un lado a otro, la etiqueta de modo cambia al cruzar P = 0.
- Una única función de conversión (interna → presentación) centraliza esto. Ningún componente visual reimplementa la conversión.

## 3.4.2 Potencia instantánea por fase

Para la explicación de Q (sección 5.7), usa la descomposición exacta por fase, con v = √2 V_φ cos ωt e i = √2 I_A cos(ωt − θ):

p(t) = P_φ [1 + cos 2ωt] + Q_φ sen 2ωt

donde P_φ = V_φ I_A cos θ y Q_φ = V_φ I_A sen θ. El primer término nunca es negativo (energía que fluye en un solo sentido, valor medio P_φ). El segundo tiene valor medio cero y amplitud Q_φ (energía que va y vuelve). Q_φ es exactamente la amplitud de ese intercambio; no es una analogía. Verifica la descomposición con una prueba y documenta el signo usado.

## 3.5 Frecuencia

X_S = ω L_S y E_A ∝ ω. Si el usuario cambia f, escala X_S y E_A de forma coherente. Alternativa aceptable: en las escenas de potencia fijar f = 60 Hz y dejar el control de frecuencia solo en las escenas de campo giratorio y velocidad. Documenta la decisión.

## 3.6 Límite de estabilidad

La potencia máxima (límite de estabilidad estática) se alcanza en δ = 90°. Si la carga supera P_max:

- no dejes que δ crezca indefinidamente como si nada;
- muestra la **pérdida de sincronismo** (el rotor se desliza respecto al campo), etiquetada como escena cualitativa;
- muestra el margen de estabilidad en la interfaz (por ejemplo, P / P_max).

P_max = 3 V_φ E_A / X_S depende de la excitación. Por eso **reducir la excitación también puede provocar pérdida de sincronismo** con la carga constante. La lección de excitación debe mostrarlo: subexcitar demasiado lleva δ hacia 90°.

## 3.6.1 Rango de los controles y límites nominales

- I_F (y E_A) nunca negativos; rango del slider limitado a valores físicamente razonables.
- Si I_A supera la corriente nominal, o E_A supera un límite de excitación razonable, la interfaz lo advierte (sobrecalentamiento del estator o del campo) sin bloquear la exploración.
- La curva de capacidad (P–Q) queda como mejora futura; anótala en `docs/progress.md`.

## 3.7 Máquina de referencia

Usa una máquina de referencia única y coherente, por ejemplo:

- 480 V (línea), conexión Y, 60 Hz, 4 polos, 100 kVA
- X_S ≈ 2.0 Ω por fase (≈ 0.87 pu)

Verifica que a plena carga y FP = 1 resulte δ razonable (del orden de 40°) y E_A coherente. Permite mostrar valores en unidades reales o en por unidad (pu).

---

# 4. CONVENCIONES DE SIGNO

Crea `docs/sign-conventions.md` siguiendo **Chapman**:

- **Generador:** I_A positiva saliendo de la máquina hacia la red. P > 0 = potencia entregada a la red. Q > 0 = reactiva entregada a la red. Sobreexcitado → FP atrasado, entrega Q. δ > 0 con E_A adelantada respecto a V_φ. B_R adelanta a B_net.
- **Motor:** I_A positiva entrando a la máquina desde la red. P > 0 = potencia absorbida de la red. Sobreexcitado → FP adelantado; la máquina se comporta como un capacitor y **entrega Q a la red**. E_A atrasada respecto a V_φ. B_net adelanta a B_R.
- **δ:** ángulo eléctrico entre E_A y V_φ. Físicamente corresponde al ángulo entre **B_R y B_net**, NO entre B_R y B_S. No dibujes δ entre el campo del rotor y el campo del estator.

Estas son las convenciones **de presentación**. Internamente el modelo usa una sola convención con signo (sección 3.4.1).

Como Chapman usa sentidos de corriente distintos para motor y generador, la interfaz debe:

- mostrar siempre, junto al diagrama fasorial, qué convención está activa (por ejemplo, un indicador "Convención generador: I_A sale de la máquina");
- mostrar además una vista unificada "desde la red": ¿la máquina entrega o absorbe P? ¿entrega o absorbe Q? Esta vista no depende de la convención y es la que conecta motor y generador.

## Grados eléctricos vs mecánicos

δ y θ son ángulos **eléctricos**. En la vista física de la máquina, el ángulo mecánico visible es δ_mec = δ_elec / (P/2). Con 4 polos, el ángulo que se ve entre los campos es la mitad del δ del diagrama fasorial. La interfaz debe indicarlo cuando se muestre δ dentro de la máquina, porque es una fuente común de confusión.

---

# 5. CONTENIDO: CONCEPTOS A ENSEÑAR

## 5.1 Campo magnético giratorio trifásico (Pilar 2)

- Tres corrientes i_a, i_b, i_c desfasadas 120°.
- Contribución de cada fase como vector pulsante en su eje, y su suma como vector de magnitud constante que gira.
- Permitir pausar, avanzar cuadro a cuadro y ver contribuciones individuales.

## 5.2 Velocidad síncrona (Pilares 1 y 2)

- n_sinc = 120 f / P con controles de f y P.
- Pasar de 2 a 4 polos debe mostrar de inmediato la mitad de velocidad y el cambio en la distribución de polos N-S-N-S del campo.

## 5.3 Rotor y excitación (Pilares 1 y 2)

- El rotor tiene su propio campo B_R por la corriente de campo I_F.
- Mostrar polos, eje magnético del rotor, B_S, B_net.
- Explicar por qué en régimen permanente el rotor gira exactamente a n_sinc: si fuera más rápido o más lento, el par medio sería cero y no podría sostener la carga.
- Aclarar que el motor síncrono no arranca solo.

## 5.4 Motor vs generador (Pilar 1)

Selector muy visible: [MOTOR] [GENERADOR]. Mismo modelo, mismo dibujo.

- Motor: energía eléctrica → campo electromagnético → par → energía mecánica.
- Generador: energía mecánica → movimiento del rotor → inducción → energía eléctrica.
- Flechas de flujo energético (P y Q por separado) entre red, máquina y eje.
- La transición motor ↔ generador debe mostrarse como un cambio continuo del signo de δ y del sentido del flujo de P, no como dos modelos distintos.

## 5.5 Ángulo δ (Pilares 1 y 2)

- Mostrarlo físicamente dentro de la máquina (entre B_R y B_net, en grados mecánicos, con la aclaración correspondiente) y en el diagrama fasorial (entre E_A y V_φ, en grados eléctricos).
- Al aumentar la carga, δ crece; al llegar a 90°, límite de estabilidad.
- Mostrar la curva P–δ (sinusoide) con el punto de operación moviéndose.

## 5.6 Potencia activa (Pilar 3)

- P = √3 V_T I_L cos θ, unidades W, kW, MW.
- Motor: P eléctrica → P mecánica (+ pérdidas, si el modo con pérdidas está activo).
- Generador: P mecánica → P eléctrica (+ pérdidas).
- Modo idealizado sin pérdidas por defecto, indicado en la interfaz.

## 5.7 Potencia reactiva (Pilar 3) — concepto central

No empieces con la ecuación. Construye la intuición en este orden:

1. **Una sola fase:** v(t), i(t) y p(t) = v·i. Mostrar que con desfase, p(t) tiene tramos negativos: la energía entra al campo y regresa a la red. Separar p(t) en sus dos componentes (sección 3.4.2): la que siempre fluye en un sentido (valor medio P_φ) y la que va y vuelve (amplitud Q_φ). Animar las dos curvas por separado y su suma.
2. **Las tres fases:** mostrar que en un sistema balanceado la **suma** p_a + p_b + p_c es constante. Aclarar explícitamente que el intercambio "de ida y vuelta" ocurre por fase, pero en el total trifásico no hay oscilación neta en los terminales. No animar la energía total "yendo y viniendo": sería físicamente incorrecto.
3. **Consecuencia práctica:** aunque Q no transfiere energía neta, exige corriente adicional; esa corriente calienta conductores y ocupa capacidad (por eso importa S).
4. **Conexión con la máquina síncrona:** la excitación decide si la máquina aporta el campo magnético que necesita (sobreexcitada, entrega Q) o si lo toma de la red (subexcitada, absorbe Q).
5. Recién entonces: Q = √3 V_T I_L sen θ, unidades var, kvar, Mvar.

## 5.8 Potencia aparente y compleja (Pilar 3)

- S = √3 V_T I_L; |S|² = P² + Q².
- Representarla a la vez con números, triángulo de potencia, fasores y el comportamiento de la máquina. El triángulo nunca aparece aislado: está vinculado dinámicamente a la simulación.
- S = P + jQ: explicar visualmente que el eje real es energía neta transferida y el eje imaginario es el intercambio asociado a los campos. Explicar que "j" indica una rotación de 90° (desfase), no algo "imaginario" en sentido físico.

## 5.9 Factor de potencia (Pilar 3)

- FP = cos θ. Visualizar a la vez V_φ, I_A, θ, P, Q, S.
- Escenarios: FP = 1.00, 0.90 atrasado, 0.90 adelantado, 0.70 atrasado. Para cada uno, el modelo calcula la excitación necesaria (ver 3.3).
- Hacer visible que con la misma P, un FP menor exige más corriente.

## 5.10 Excitación (Pilares 1 y 3) — demostración principal

Slider EXCITACIÓN DEL ROTOR (I_F), manteniendo P constante:

- subexcitación, excitación con FP ≈ 1, sobreexcitación;
- cambios dinámicos en E_A, I_A, Q, FP, θ, δ y la posición de los fasores;
- explicación específica para MOTOR y para GENERADOR, sin mezclar convenciones, más la vista unificada "desde la red".

Hacer visible que, a P constante, la punta de E_A se desplaza sobre una recta de potencia constante (E_A sen δ = constante) y la proyección de I_A sobre V_φ (I_A cos θ) también es constante.

## 5.11 Curvas V (Pilares 1 y 3)

- I_A vs I_F para varias cargas P constantes (modelo lineal sin saturación, indicado).
- El punto de operación se mueve con los sliders y se ve simultáneamente en la máquina y en los fasores.
- Marcar la región de FP atrasado, FP = 1 (mínimo de cada curva) y FP adelantado, y el límite de estabilidad.

## 5.12 Diagrama fasorial dinámico

- Mostrar V_φ, I_A, E_A, jX_S I_A, y los ángulos θ y δ.
- Calculado en cada cuadro a partir del estado; nada pre-renderizado.
- Pausa, zoom, mostrar/ocultar vectores, nombres y ángulos.
- Indicador visible de la convención activa.
- Enlace visual entre el diagrama fasorial y la vista física (por ejemplo, al resaltar δ en uno se resalta en el otro).

---

# 6. VISUALIZACIÓN DE LA MÁQUINA

- Vista principal: **corte transversal 2.5D** (SVG o Canvas) de la máquina, que es donde mejor se ven los campos, los polos y δ.
- Mostrar estator, devanados trifásicos (a, b, c y sus retornos), rotor, eje, polos, B_R, B_S, B_net y sentido de rotación.
- 3D (React Three Fiber) solo si aporta comprensión, por ejemplo una toma de introducción en corte tipo cutaway. No es obligatorio para la primera versión.
- Estilizada pero técnicamente reconocible; prioriza claridad sobre realismo.

---

# 7. DISEÑO VISUAL

Inspiración: visualizaciones de física, instrumentación moderna, documentales técnicos, laboratorios virtuales.

No quiero: tarjetas genéricas tipo SaaS, degradados morado/azul, exceso de glassmorphism, emojis, estética infantil, dashboards corporativos ni interfaces llenas de texto.

- La máquina es la protagonista visual.
- Fondo oscuro o neutro si mejora la lectura de campos y fasores.
- Colores fijos y consistentes en toda la app para cada magnitud (fase a/b/c, V_φ, I_A, E_A, P, Q, S).
- Tipografía clara y técnica; animaciones suaves.
- No dependas solo del color para distinguir magnitudes: acompaña cada vector y curva con su etiqueta (accesible para daltonismo).

---

# 7.1 IDIOMAS

La experiencia es **bilingüe: inglés como idioma principal y predeterminado, español como opción.**

- Selector de idioma discreto (EN / ES), visible en todos los modos salvo en PRESENTACIÓN.
- Idioma también por URL: `?lang=en` / `?lang=es`, combinable con `?presentation=true`, para grabar el video en cualquiera de los dos idiomas.
- Implementación sencilla, sin librería pesada de i18n: un diccionario tipado por idioma (`src/i18n/en.ts`, `src/i18n/es.ts`) con la versión en inglés como fuente de verdad. TypeScript debe fallar si al español le falta una clave. Añade una prueba que verifique que ambos diccionarios tienen exactamente las mismas claves.
- **Todo** texto visible pasa por el diccionario: etiquetas, textos de escenas, tooltips, advertencias, indicadores de convención, nombres de escenarios. Nada de texto fijo dentro de los componentes.
- Los textos de la lección se escriben de forma natural en cada idioma, no como traducción literal. Primero en inglés; luego adaptados al español.
- Los **símbolos son los mismos en ambos idiomas** (E_A, V_φ, I_A, X_S, I_F, θ, δ), porque Chapman los usa igual en ambas ediciones. Cambian solo las palabras.
- Crea `docs/glossary.md` con la terminología técnica en ambos idiomas, alineada con Chapman en inglés y con su edición en español. Por ejemplo:

| English | Español |
|---|---|
| internal generated voltage | tensión interna generada |
| synchronous reactance | reactancia síncrona |
| torque angle / power angle | ángulo de par / ángulo de potencia |
| infinite bus | bus infinito |
| field current | corriente de campo |
| lagging / leading | en retraso / en adelanto |
| overexcited / underexcited | sobreexcitado / subexcitado |
| pull-out / loss of synchronism | pérdida de sincronismo |
| active, reactive, apparent power | potencia activa, reactiva, aparente |
| V curves | curvas V |

- Formato numérico con `Intl.NumberFormat` según el idioma. Las unidades (W, var, VA, Hz, rpm, Ω) son iguales en ambos idiomas.
- El diseño debe tolerar que el español ocupa aproximadamente un 20–30 % más de espacio: nada de textos cortados ni de diseños que solo funcionen con las palabras en inglés.
- La documentación del repositorio (`README.md` y `docs/`) va en inglés. Añade un `README.es.md` breve en español.

---

# 8. INTERFAZ

Distribución sugerida (puedes proponer una mejor):

- Centro/izquierda: máquina.
- Derecha: diagrama fasorial y triángulo de potencia.
- Abajo: P, Q, S, FP, θ, δ, n_sinc, con unidades y con indicación de si entrega o absorbe.

Controles: modo motor/generador, frecuencia, polos, tensión, carga, excitación, pausa, velocidad de animación, unidades reales / pu.

Modos:

- **EXPLORE / EXPLORAR:** laboratorio libre.
- **GUIDED LESSON / LECCIÓN GUIADA:** secuencia de escenas (sección 9).
- **PRESENTATION / PRESENTACIÓN:** modo cinemático (sección 10).

---

# 9. LECCIÓN GUIADA

Cada escena introduce solo lo necesario, usa resaltado y animación para dirigir la atención, y sigue el orden **intuición → matemática → ingeniería**. Textos breves ("La energía entra al campo…" [animación] "…y regresa a la red."), nunca paredes de texto.

1. ¿Qué gira realmente? — partes de la máquina.
2. Campo magnético giratorio trifásico.
3. Velocidad síncrona (cambio de polos).
4. El campo del rotor y por qué se sincroniza (y por qué no arranca solo).
5. Motor vs generador: la misma máquina, dos sentidos de energía.
6. Tensión, corriente y desfase en una fase.
7. Potencia instantánea: por fase y en el total trifásico.
8. P, Q y S.
9. Factor de potencia.
10. Ángulo δ: en la máquina y en el diagrama; curva P–δ.
11. Límite de estabilidad y pérdida de sincronismo.
12. Excitación: subexcitada, FP = 1, sobreexcitada.
13. Diagrama fasorial completo.
14. Curvas V.
15. Sistema completo.

Cada escena indica en `docs/storyboard.md` qué objetivos de la sección 1 cubre.

---

# 10. MODO PRESENTACIÓN

Para grabar después con OBS:

- activable con `?presentation=true` (y `&lang=es` para la versión en español);
- opción para arrancar en una escena concreta (por ejemplo `&scene=7`), para grabar escenas sueltas y repetir tomas;
- oculta controles innecesarios, relación 16:9, pantalla completa;
- avance automático de escenas con tiempos configurables;
- transiciones y movimientos de cámara suaves (zoom/paneo en 2.5D);
- elementos interactivos mínimos.

Demostraciones cinemáticas mínimas:

- A. Tres corrientes → campo giratorio.
- B. Cambio de polos → cambio de velocidad visible.
- C. Rotor sincronizándose con el campo.
- D. Aumento de carga → δ crece; curva P–δ.
- E. FP = 1 → I_A alineada con V_φ.
- F. p(t) por fase vs total trifásico constante.
- G. Cambio de excitación → atrasado / unitario / adelantado.
- H. Motor → generador de forma continua.
- I. Triángulo P-Q-S transformándose.
- J. Fasores E_A, V_φ, I_A cambiando junto con la máquina.
- K. Pérdida de sincronismo al superar P_max.

## 10.1 Clips para redes sociales (X y similares)

Además del video largo en 16:9, el modo presentación debe permitir grabar clips cortos para redes, que se ven sobre todo en el móvil y sin sonido.

**Formatos:**
- Relación de aspecto seleccionable por URL: `&aspect=16x9` (predeterminado), `&aspect=1x1`, `&aspect=9x16`.
- La composición se adapta de verdad a cada formato (por ejemplo, en 9:16 la máquina arriba y los fasores abajo); no basta con recortar el 16:9.
- Resolución de grabación fija y nítida (por ejemplo 1080×1080 y 1080×1920), y animación estable a 60 fps.

**Modo clip:** `&clip=<id>`
- Sin interfaz: ni controles, ni selector de idioma, ni menús.
- **Una sola idea por clip**, de 15 a 45 segundos.
- **Arranca ya en movimiento**: nada de pantallas de título ni fundidos desde negro. Los primeros 2 segundos deben mostrar algo que llame la atención.
- **Bucle limpio**: el último cuadro empalma con el primero para que el clip se repita sin corte visible.
- **Subtítulos grandes integrados** (vía diccionario, en EN y ES), en una zona reservada que no tape la máquina ni los fasores, con frases muy cortas.
- Una pregunta como gancho al inicio, que cualquiera entienda sin conocer la notación. Por ejemplo: "Why can't this motor spin faster than the grid?" / "¿Por qué este motor no puede girar más rápido que la red?". Los símbolos (δ, X_S, E_A) aparecen después, nunca en la primera frase.

**Clips mínimos:**

| id | Idea | Gancho sugerido |
|---|---|---|
| `rotating-field` | Tres corrientes → campo giratorio | Three currents, one rotating magnet |
| `poles-speed` | Más polos → menos velocidad | Same grid, half the speed |
| `reactive-myth` | p(t) por fase oscila; la suma trifásica es constante | Where does reactive power actually go? |
| `excitation-sweep` | Excitación: atrasado → unitario → adelantado, con fasores y triángulo P-Q-S | One knob decides if the machine gives or takes Q |
| `motor-to-generator` | La misma máquina cruza de motor a generador | Same machine, energy flowing backwards |
| `pull-out` | Pérdida de sincronismo al superar P_max | What happens when you ask for too much? |

Registra estos clips en `docs/storyboard.md`, con su duración, formato recomendado y el texto de los subtítulos en ambos idiomas.

**Estética para redes:**
- Alto contraste sobre fondo oscuro; líneas y vectores con grosor suficiente para leerse en una pantalla de móvil.
- Un brillo sutil en los campos y vectores activos está permitido si ayuda a dirigir la atención, sin ocultar la información ni exagerar magnitudes.
- Todo lo exagerado por estética (tamaño de vectores, brillo) debe figurar como "solo visual" en la documentación del modelo de datos.

Esta sección se implementa en la Fase 9. Los ajustes estéticos finos van en la Fase 10.

---

# 11. ESCENARIOS PREDEFINIDOS

Con la máquina de referencia (sección 3.7), valores verificados por las pruebas:

- A. 60 Hz, 4 polos, FP = 1.
- B. 60 Hz, 4 polos, FP = 0.8 atrasado.
- C. Motor sobreexcitado (FP adelantado, entrega Q).
- D. Motor subexcitado (FP atrasado, absorbe Q).
- E. Generador entregando P a FP = 1.
- F. Generador a P constante variando la excitación (intercambio de Q).
- G. Carga cerca del límite de estabilidad.

---

# 12. TECNOLOGÍA

- TypeScript, React, Vite.
- SVG o Canvas para la máquina, fasores y gráficas.
- React Three Fiber solo si se justifica.
- Vitest para las pruebas.
- Sin frameworks innecesarios; evita overengineering.
- Debe ejecutarse con `npm install` y `npm run dev`.

---

# 13. MODELO DE DATOS

Un único estado físico. Las visualizaciones solo **leen** de él; nunca calculan física por su cuenta.

- `MachineInputs`: modo, f, polos, V_T, carga, I_F (o E_A).
- `MachineState` (derivado, calculado por funciones puras a partir de las entradas): n_sinc, V_φ, E_A, I_A (fasor), θ, FP, δ, P, Q, S, τ_ind, P_max, estado de estabilidad, convención activa.
- Un módulo aparte para el tiempo de animación (ángulo del rotor, fase instantánea), separado de la física de régimen permanente.

Documenta qué variables son físicas y cuáles son solo visuales (escalas, colores, exageraciones de tamaño de vectores).

---

# 14. VALIDACIÓN

Pruebas automáticas de, al menos:

- n_sinc = 120 f / P
- |S|² ≈ P² + Q²
- P = √3 V_T I_L cos θ y Q = √3 V_T I_L sen θ
- ecuación fasorial de generador y de motor de Chapman
- P calculada por fasores = 3 V_φ E_A sen δ / X_S
- sobreexcitado → entrega Q (generador: FP atrasado; motor: FP adelantado)
- a P constante, E_A sen δ constante al variar la excitación
- el mínimo de cada curva V ocurre en FP = 1
- P_max en δ = 90°
- P_max disminuye al reducir la excitación
- la conversión convención interna → presentación de Chapman (motor y generador) produce los signos y sentidos documentados
- continuidad al pasar de motor a generador (δ y P cambian de signo sin saltos)
- la descomposición de p(t) por fase (sección 3.4.2) coincide con v(t)·i(t) muestreada
- la suma trifásica p_a + p_b + p_c es constante e igual a P
- coherencia de los escenarios predefinidos
- ambos diccionarios de idioma tienen exactamente las mismas claves

No modifiques las pruebas para que pasen. Si una prueba revela un error conceptual, corrige el modelo.

---

# 15. DOCUMENTACIÓN

- `README.md`: objetivo, arquitectura, cómo ejecutar, controles, modelo físico, limitaciones.
- `docs/physics-model.md`
- `docs/sign-conventions.md`
- `docs/learning-objectives.md`
- `docs/storyboard.md`
- `docs/glossary.md`: terminología EN / ES.
- `docs/progress.md`: estado de cada fase, decisiones y pendientes, para que otro agente pueda continuar.

Toda la documentación en inglés, más `README.es.md` en español.

---

# 16. FASES Y PUNTOS DE CONTROL

1. Modelo físico + arquitectura + documentación + infraestructura de idiomas (diccionarios EN/ES desde el inicio, para no tener que extraer textos después).
2. Campo magnético giratorio.
3. Máquina visual.
4. Motor / generador.
5. P, Q, S y FP.
6. Fasores.
7. Excitación, δ, estabilidad y curvas V.
8. Lección guiada.
9. Modo presentación y clips para redes (sección 10.1).
10. Pulido y validación.

**PUNTO DE CONTROL 1 (obligatorio):** al terminar la Fase 1, **detente**. Muéstrame un resumen de `docs/physics-model.md`, `docs/sign-conventions.md` y la arquitectura, y espera mi aprobación antes de programar la interfaz.

**PUNTO DE CONTROL 2:** al lograr el primer milestone funcional (abajo), detente, dime cómo ejecutarlo y qué verificar, y espera mis comentarios antes de seguir con las fases 8 a 10.

## Primer milestone funcional

Debe permitir:

- ver la máquina operando;
- cambiar MOTOR / GENERADOR;
- modificar carga y excitación;
- observar P, Q, S, FP, θ, δ y n_sinc;
- observar el diagrama fasorial y el triángulo de potencia sincronizados con la máquina;
- entender visualmente qué cambió;
- cambiar entre inglés y español.

No priorices funciones secundarias hasta que esto funcione correctamente.

---

# 17. GIT

- Nombre del proyecto y del repositorio: `synchronous-machine-EN-ES`.
- Inicializa un repositorio git local y haz commits locales al cerrar cada fase, con mensajes descriptivos.
- No hagas push, no publiques y no crees repositorios remotos sin que yo lo pida.

---

Empieza inspeccionando el directorio actual y ejecutando la Fase 1.
