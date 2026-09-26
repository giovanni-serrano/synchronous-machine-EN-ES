# Máquina síncrona — Física visual de motores y generadores síncronos

Un **laboratorio** web interactivo para entender, con intuición y con matemática, cómo funciona una máquina síncrona como
**motor** y como **generador**: el campo giratorio, la velocidad síncrona, el ángulo de par δ y las potencias P, Q, S y el
factor de potencia. También sirve como fuente de escenas para grabar un video educativo (modo presentación y clips cortos
para redes).

Bilingüe: **inglés** (predeterminado) y **español** (`?lang=es`). La notación y las convenciones siguen a
S. J. Chapman, *Máquinas eléctricas*.

> **Estado: Fase 1 de 10.** El modelo físico, la arquitectura, la documentación y los idiomas están listos y probados. La
> interfaz todavía no existe: la página muestra una tabla de escenarios predefinidos calculada directamente por el modelo.

## Cómo ejecutarlo

```bash
npm install
npm run dev        # http://localhost:5173/?lang=es
npm test           # pruebas del modelo físico, idiomas e infraestructura
```

## Modelo en breve

- Bus infinito, rotor cilíndrico, R_A = 0, sin saturación, sistema trifásico balanceado en Y.
- Máquina de referencia: 480 V, 60 Hz, 4 polos, 100 kVA, X_S = 2.0 Ω (0.87 pu).
- El usuario controla: motor/generador, f, polos, V_T, carga en el eje y corriente de campo I_F. Todo lo demás (δ, I_A, θ,
  FP, P, Q, S, par, P_max, estabilidad) se calcula. El FP nunca es una entrada.
- Idea central: **sobreexcitada, la máquina entrega Q a la red; subexcitada, la absorbe, sea motor o generador.**

La documentación técnica está en inglés, en la carpeta [docs/](docs/). El glosario [docs/glossary.md](docs/glossary.md)
relaciona los términos en inglés y en español.
