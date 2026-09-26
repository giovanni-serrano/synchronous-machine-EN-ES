# Máquina síncrona — Física visual de motores y generadores síncronos

Un **ensayo interactivo** (una explicación explorable) sobre cómo funciona una máquina síncrona como **motor** y como
**generador**: el campo giratorio, la velocidad síncrona, el ángulo de par δ y las potencias P, Q, S y el factor de
potencia. La máquina se construye pieza por pieza, con una idea y una figura por sección; el laboratorio interactivo
completo cierra el ensayo. Diseñado primero para el teléfono, para compartirse.

Bilingüe: **inglés** (predeterminado) y **español** (`?lang=es`). La notación y las convenciones siguen a
S. J. Chapman, *Máquinas eléctricas*.

> **Estado: punto de control 2b.** El modelo físico y el laboratorio de las Fases 2–6 están listos y probados; la
> presentación se está reconstruyendo como ensayo ([docs/experience-redesign.md](docs/experience-redesign.md)). El corte
> vertical (gancho, *Una bobina*, *Tres bobinas*) es la página principal; el laboratorio está en `?view=lab`.

## Cómo ejecutarlo

```bash
npm install
npm run dev        # http://localhost:5173/?lang=es
npm test           # pruebas del modelo físico, idiomas, disposición y renderizado
npm run test:layout  # ninguna animación puede mover la página (Playwright + Edge instalado)
npm run perf       # presupuesto de carga en móvil: LCP < 3 s
```

## Modelo en breve

- Bus infinito, rotor cilíndrico, R_A = 0, sin saturación, sistema trifásico balanceado en Y.
- Máquina de referencia: 480 V, 60 Hz, 4 polos, 100 kVA, X_S = 2.0 Ω (0.87 pu).
- El usuario controla: motor/generador, f, polos, V_T, carga en el eje y corriente de campo I_F. Todo lo demás (δ, I_A, θ,
  FP, P, Q, S, par, P_max, estabilidad) se calcula. El FP nunca es una entrada.
- Idea central: **sobreexcitada, la máquina entrega Q a la red; subexcitada, la absorbe, sea motor o generador.**

La documentación técnica está en inglés, en la carpeta [docs/](docs/). El glosario [docs/glossary.md](docs/glossary.md)
relaciona los términos en inglés y en español.

## Referencias y licencia

Chapman (*Máquinas eléctricas* / *Electric Machinery Fundamentals*, McGraw-Hill) se cita solo como referencia de notación
y convenciones; no se reproduce texto ni figuras del libro.

- Código: licencia [MIT](LICENSE).
- Textos y documentación: [CC BY 4.0](LICENSE-CC-BY-4.0.txt).
