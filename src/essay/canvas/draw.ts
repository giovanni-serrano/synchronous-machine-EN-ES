/**
 * Canvas drawing primitives for the essay figures. Angles are mathematical (counterclockwise, 0 = +x); the canvas
 * y axis points down, so points are (cx + r cos θ, cy − r sin θ). Glow = the same stroke drawn wider and faint with
 * additive blending underneath the core stroke (cheap enough for 60 fps on phones, unlike blur filters).
 */

import { CONCEPT, INK, SERIF, alpha } from '../theme';

export const pt = (cx: number, cy: number, r: number, theta: number): [number, number] => [
  cx + r * Math.cos(theta),
  cy - r * Math.sin(theta),
];

export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  { glow = 0, opacity = 1, head = 3.2 }: { glow?: number; opacity?: number; head?: number } = {},
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  const hl = Math.min(len * 0.55, width * head + 6);
  const hw = hl * 0.55;
  const bx = x2 - ux * hl;
  const by = y2 - uy * hl;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(bx + ux * 1, by + uy * 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(bx - uy * hw, by + ux * hw);
    ctx.lineTo(bx + uy * hw, by - ux * hw);
    ctx.closePath();
    ctx.fill();
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glow > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = alpha(color, 0.16 * glow * opacity);
    ctx.fillStyle = alpha(color, 0.12 * glow * opacity);
    ctx.lineWidth = width * 3.2;
    body();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.strokeStyle = alpha(color, opacity);
  ctx.fillStyle = alpha(color, opacity);
  ctx.lineWidth = width;
  body();
  ctx.restore();
}

/** Italic serif symbol with an optional subscript, e.g. B + "a". Drawn in a neutral ink with a dark halo. */
export function symbol(
  ctx: CanvasRenderingContext2D,
  base: string,
  sub: string,
  x: number,
  y: number,
  size: number,
  { color = INK.text, align = 'center' }: { color?: string; align?: 'center' | 'left' | 'right' } = {},
) {
  ctx.save();
  const baseFont = `italic 500 ${size}px ${SERIF}`;
  const subFont = `500 ${size * 0.68}px ${SERIF}`;
  ctx.font = baseFont;
  const wb = ctx.measureText(base).width;
  ctx.font = subFont;
  const ws = sub ? ctx.measureText(sub).width + 1 : 0;
  const total = wb + ws;
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK.bg;
  ctx.lineWidth = Math.max(3, size * 0.28);
  ctx.fillStyle = color;
  ctx.font = baseFont;
  ctx.strokeText(base, x0, y);
  ctx.fillText(base, x0, y);
  if (sub) {
    ctx.font = subFont;
    ctx.strokeText(sub, x0 + wb + 1, y + size * 0.28);
    ctx.fillText(sub, x0 + wb + 1, y + size * 0.28);
  }
  ctx.restore();
}

/** Plain label in the serif (neutral ink, dark halo). */
export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  { color = INK.textDim, align = 'center', italic = false }: { color?: string; align?: CanvasTextAlign; italic?: boolean } = {},
) {
  ctx.save();
  ctx.font = `${italic ? 'italic ' : ''}400 ${size}px ${SERIF}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK.bg;
  ctx.lineWidth = Math.max(3, size * 0.3);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export interface StatorGeom {
  readonly cx: number;
  readonly cy: number;
  /** Outer radius of the iron. */
  readonly ro: number;
  /** Bore radius. */
  readonly rb: number;
}

/** Stator iron ring with evenly spaced slot openings. */
export function statorIron(ctx: CanvasRenderingContext2D, g: StatorGeom, slots = 12) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, g.ro, 0, 2 * Math.PI);
  ctx.arc(g.cx, g.cy, g.rb, 0, 2 * Math.PI, true);
  ctx.fillStyle = INK.steel;
  ctx.fill('evenodd');
  ctx.strokeStyle = INK.steelEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, g.ro, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, g.rb, 0, 2 * Math.PI);
  ctx.stroke();
  // slot openings (dark notches at the bore)
  const depth = (g.ro - g.rb) * 0.42;
  const halfW = (g.ro - g.rb) * 0.13;
  ctx.fillStyle = INK.bg;
  for (let k = 0; k < slots; k++) {
    const th = (2 * Math.PI * (k + 0.5)) / slots + Math.PI / 2;
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(-th);
    ctx.beginPath();
    ctx.roundRect(g.rb - 1, -halfW, depth, 2 * halfW, halfW * 0.6);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * A slot conductor seen end-on. `flow` > 0: current out of the page (dot); < 0: into the page (cross).
 * Brightness follows |flow| (0 … 1); `enabled` false draws a hollow, dimmed conductor.
 */
export function conductor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  flow: number,
  enabled = true,
) {
  const m = Math.min(1, Math.abs(flow));
  ctx.save();
  if (enabled && m > 0.02) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = alpha(color, 0.22 * m);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = enabled ? alpha(color, 0.25 + 0.75 * m) : INK.steelLight;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = enabled ? color : INK.steelEdge;
  ctx.stroke();
  if (enabled && m > 0.06) {
    ctx.strokeStyle = INK.bg;
    ctx.fillStyle = INK.bg;
    ctx.lineWidth = Math.max(2, r * 0.2);
    if (flow > 0) {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.24, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      const s = r * 0.42;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x - s, y + s);
      ctx.lineTo(x + s, y - s);
      ctx.stroke();
    }
  }
  ctx.restore();
}

const LAYERS = new WeakMap<CanvasRenderingContext2D, HTMLCanvasElement>();

/** A cleared offscreen layer the size of ctx's canvas, with the same transform. */
function lobeLayer(ctx: CanvasRenderingContext2D) {
  let layer = LAYERS.get(ctx);
  if (!layer) {
    layer = document.createElement('canvas');
    LAYERS.set(ctx, layer);
  }
  if (layer.width !== ctx.canvas.width || layer.height !== ctx.canvas.height) {
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;
  }
  const lc = layer.getContext('2d')!;
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.clearRect(0, 0, layer.width, layer.height);
  lc.setTransform(ctx.getTransform());
  return { layer, lc };
}

/**
 * The stator field drawn as a magnet (checkpoint 2b review): two luminous lobes hugging the bore — S where flux
 * enters the stator (B_r > 0), N where it leaves (B_r < 0) — thickness ∝ |B_r(θ)| and brightness ∝ B_r² (energy
 * density), from the
 * model, labelled N and S at their peaks, plus flux lines crossing the bore from the N lobe to the S lobe.
 * `field.at` is the model's B_r(θ); `maxAmp` is the value drawn at full strength.
 */
export function magnetField(
  ctx: CanvasRenderingContext2D,
  g: StatorGeom,
  field: { readonly amp: number; readonly axis: number; at(theta: number): number; readonly poles?: number },
  color: string,
  maxAmp: number,
  { lines = true, letters = true, letterSize = 18, strength = 1 }: { lines?: boolean; letters?: boolean; letterSize?: number; strength?: number } = {},
) {
  const rel = Math.min(1, field.amp / maxAmp) * strength;
  if (rel < 0.01) return;
  const pairs = (field.poles ?? 2) / 2;
  const pitch = Math.PI / pairs; // mechanical angle between a pole and the next (N → S)
  const depth = g.rb * (pairs === 1 ? 0.4 : 0.3); // thickness of a lobe at full strength
  const n = Math.round(90 / pairs);
  // S lobes at axis + 2πk/pairs (flux enters the stator), N lobes half a pitch away (flux leaves it)
  const lobes = Array.from({ length: 2 * pairs }, (_, j) => ({ centre: field.axis + j * pitch, sign: j % 2 === 0 ? 1 : -1 }));

  if (lines) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.2;
    const chevron = (mx: number, my: number, ux: number, uy: number, a: number) => {
      const s = 6;
      ctx.strokeStyle = alpha(color, a);
      ctx.beginPath();
      ctx.moveTo(mx - ux * s - uy * s * 0.8, my - uy * s + ux * s * 0.8);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx - ux * s + uy * s * 0.8, my - uy * s - ux * s * 0.8);
      ctx.stroke();
    };
    if (pairs === 1) {
      // two poles: straight lines across the bore, parallel to the field, from the N face to the S face
      const ux = Math.cos(field.axis);
      const uy = -Math.sin(field.axis);
      const R = g.rb * 0.985;
      for (let k = -2; k <= 2; k++) {
        const o = k * g.rb * 0.3;
        const half = Math.sqrt(Math.max(0, R * R - o * o));
        const mx = g.cx - uy * o;
        const my = g.cy + ux * o;
        const a = (0.1 + 0.26 * (1 - Math.abs(k) / 3)) * rel;
        ctx.strokeStyle = alpha(color, a);
        ctx.beginPath();
        ctx.moveTo(mx - ux * half, my - uy * half);
        ctx.lineTo(mx + ux * half, my + uy * half);
        ctx.stroke();
        chevron(mx + ux * 8, my + uy * 8, ux, uy, a);
      }
    } else {
      // more poles: nested curves from each N face to the S faces beside it
      for (const lobe of lobes) {
        if (lobe.sign > 0) continue;
        for (const dir of [1, -1] as const) {
          for (const q of [0.06, 0.2, 0.34]) {
            const a0 = lobe.centre + dir * pitch * q;
            const a1 = lobe.centre + dir * pitch * (1 - q);
            const half = (pitch * (1 - 2 * q)) / 2;
            const [x0, y0] = pt(g.cx, g.cy, g.rb * 0.97, a0);
            const [x1, y1] = pt(g.cx, g.cy, g.rb * 0.97, a1);
            const [qx, qy] = pt(g.cx, g.cy, g.rb * (1 - 1.25 * Math.sin(half)), (a0 + a1) / 2);
            const a = (0.12 + 0.3 * (q / 0.34)) * rel;
            ctx.strokeStyle = alpha(color, a);
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo(qx, qy, x1, y1);
            ctx.stroke();
            // midpoint and direction of the curve (t = ½)
            const mx = 0.25 * x0 + 0.5 * qx + 0.25 * x1;
            const my = 0.25 * y0 + 0.5 * qy + 0.25 * y1;
            const len = Math.hypot(x1 - x0, y1 - y0) || 1;
            chevron(mx, my, (x1 - x0) / len, (y1 - y0) / len, a);
          }
        }
      }
    }
    ctx.restore();
  }

  // Lobes: region between the bore and r(θ) = rb − depth·|B_r(θ)|/maxAmp around each pole (thickness ∝ flux density),
  // filled with an opacity ∝ B_r² — the magnetic energy density, a visual choice approved at checkpoint 2c — through a
  // conic gradient, faded towards the centre (radial mask) in an offscreen layer and added onto the figure.
  const { layer, lc } = lobeLayer(ctx);
  const path = new Path2D();
  for (const lobe of lobes) {
    const from = lobe.centre - pitch / 2;
    for (let k = 0; k <= n; k++) {
      const th = from + (pitch * k) / n;
      const b = Math.max(0, lobe.sign * field.at(th)) / maxAmp;
      const [x, y] = pt(g.cx, g.cy, g.rb - depth * b * strength, th);
      if (k === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    for (let k = n; k >= 0; k--) {
      const [x, y] = pt(g.cx, g.cy, g.rb, from + (pitch * k) / n);
      path.lineTo(x, y);
    }
    path.closePath();
  }
  let fillStyle: string | CanvasGradient = alpha(color, 0.6 * rel);
  if (typeof lc.createConicGradient === 'function') {
    // conic stop f ↔ mathematical angle −2πf
    const stops = 36 * Math.max(2, pairs);
    const grad = lc.createConicGradient(0, g.cx, g.cy);
    for (let k = 0; k <= stops; k++) {
      const bk = Math.abs(field.at(-2 * Math.PI * (k / stops))) / maxAmp;
      grad.addColorStop(k / stops, alpha(color, 0.72 * bk * bk * strength));
    }
    fillStyle = grad;
  }
  lc.fillStyle = fillStyle;
  lc.fill(path);
  const fade = lc.createRadialGradient(g.cx, g.cy, g.rb - depth * 1.05, g.cx, g.cy, g.rb);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(0.55, 'rgba(0,0,0,0.55)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  lc.globalCompositeOperation = 'destination-in';
  lc.fillStyle = fade;
  lc.fillRect(g.cx - g.ro, g.cy - g.ro, 2 * g.ro, 2 * g.ro);
  lc.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const scale = ctx.getTransform().a || 1;
  ctx.drawImage(layer, 0, 0, layer.width / scale, layer.height / scale);
  // second pass: bloom where the field is strongest (the layer is already ∝ B², so it concentrates at the poles)
  ctx.globalAlpha = 0.3;
  ctx.drawImage(layer, 0, 0, layer.width / scale, layer.height / scale);
  ctx.restore();

  // inside the lobe, next to the bore: clear of the field arrows in the middle
  if (letters) poleLetters(ctx, g, field, maxAmp, { radius: g.rb - letterSize * 0.8, size: letterSize, strength });
}

/** N and S at the field's poles (S where flux enters the stator), at a chosen radius. */
export function poleLetters(
  ctx: CanvasRenderingContext2D,
  g: StatorGeom,
  field: { readonly amp: number; readonly axis: number; readonly poles?: number },
  maxAmp: number,
  { radius, size, strength = 1 }: { radius: number; size: number; strength?: number },
) {
  const rel = Math.min(1, field.amp / maxAmp) * strength;
  if (rel <= 0.18) return;
  const pairs = (field.poles ?? 2) / 2;
  for (let j = 0; j < 2 * pairs; j++) {
    const [lx, ly] = pt(g.cx, g.cy, radius, field.axis + (j * Math.PI) / pairs);
    ctx.save();
    ctx.globalAlpha = Math.min(1, (rel - 0.18) / 0.3);
    ctx.font = `650 ${size}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK.bg;
    ctx.lineWidth = size * 0.3;
    const letter = j % 2 === 0 ? 'S' : 'N';
    ctx.strokeText(letter, lx, ly);
    ctx.fillStyle = INK.text;
    ctx.fillText(letter, lx, ly);
    ctx.restore();
  }
}

/** Thin dashed chord: the plane of a coil (its field is perpendicular to it). */
export function coilPlane(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, opacity: number) {
  ctx.save();
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = alpha(color, opacity);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Arrow drawn as a translucent body with a bright outline, so arrows drawn over it stay readable
 * (the §3 sum sits under its three components).
 */
export function hollowArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  { fill = 0.22, opacity = 1, glow = 1 }: { fill?: number; opacity?: number; glow?: number } = {},
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2 || opacity <= 0) return;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const hl = Math.min(len * 0.45, width * 2.4);
  const hw = width * 1.25;
  const sw = width / 2;
  const bx = x2 - ux * hl;
  const by = y2 - uy * hl;
  const path = new Path2D();
  path.moveTo(x1 + nx * sw, y1 + ny * sw);
  path.lineTo(bx + nx * sw, by + ny * sw);
  path.lineTo(bx + nx * hw, by + ny * hw);
  path.lineTo(x2, y2);
  path.lineTo(bx - nx * hw, by - ny * hw);
  path.lineTo(bx - nx * sw, by - ny * sw);
  path.lineTo(x1 - nx * sw, y1 - ny * sw);
  path.closePath();
  ctx.save();
  ctx.lineJoin = 'round';
  if (glow > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = alpha(color, 0.7 * opacity * glow);
    ctx.shadowBlur = 18;
    ctx.fillStyle = alpha(color, fill * opacity);
    ctx.fill(path);
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  } else {
    ctx.fillStyle = alpha(color, fill * opacity);
    ctx.fill(path);
  }
  ctx.strokeStyle = alpha(color, 0.95 * opacity);
  ctx.lineWidth = 2;
  ctx.stroke(path);
  ctx.restore();
}

/** Dotted line through the centre along an axis (a coil's own axis). */
export function axisLine(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, theta: number, color: string, opacity: number) {
  if (opacity <= 0.01) return;
  const [x1, y1] = pt(cx, cy, r, theta);
  const [x2, y2] = pt(cx, cy, -r, theta);
  ctx.save();
  ctx.setLineDash([2, 7]);
  ctx.lineCap = 'round';
  ctx.strokeStyle = alpha(color, opacity);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Two-pole salient rotor seen end-on, N pole at `angle` (mathematical). The N pole face glows orange (the rotor's own
 * field leaves there); `letters` marks the poles N and S. Everything stays inside the bore.
 */
export function salientRotor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  { letters = false, letterSize = 16 }: { letters?: boolean; letterSize?: number } = {},
) {
  const coreHalf = r * 0.34;
  ctx.save();
  // everything rotor-related stays inside the bore (its glow must not spill onto the stator or the canvas edge)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.06, 0, 2 * Math.PI);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-angle);
  // pole body + shoes (N at +x, S at −x)
  const shoe = 0.62; // half-angle of a pole shoe, rad
  ctx.beginPath();
  ctx.moveTo(-r * Math.cos(shoe), -r * Math.sin(shoe));
  ctx.arc(0, 0, r, Math.PI + shoe, Math.PI - shoe, true);
  ctx.lineTo(-coreHalf * 1.6, coreHalf);
  ctx.lineTo(coreHalf * 1.6, coreHalf);
  ctx.lineTo(r * Math.cos(shoe), r * Math.sin(shoe));
  ctx.arc(0, 0, r, shoe, -shoe, true);
  ctx.lineTo(coreHalf * 1.6, -coreHalf);
  ctx.lineTo(-coreHalf * 1.6, -coreHalf);
  ctx.closePath();
  ctx.fillStyle = INK.steelLight;
  ctx.fill();
  ctx.strokeStyle = INK.steelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // warm glow on the N pole face (the rotor's own field leaves here)
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(r * 0.95, 0, 0, r * 0.95, 0, r * 0.8);
  grad.addColorStop(0, alpha(CONCEPT.rotor, 0.45));
  grad.addColorStop(1, alpha(CONCEPT.rotor, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(r * 0.95, 0, r * 0.8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
  // hub
  ctx.fillStyle = INK.steel;
  ctx.strokeStyle = INK.steelEdge;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  if (letters) {
    for (const [letter, a] of [
      ['N', angle],
      ['S', angle + Math.PI],
    ] as const) {
      const [lx, ly] = pt(cx, cy, r * 0.86, a);
      ctx.save();
      ctx.font = `650 ${letterSize}px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK.bg;
      ctx.lineWidth = letterSize * 0.3;
      ctx.strokeText(letter, lx, ly);
      ctx.fillStyle = INK.text;
      ctx.fillText(letter, lx, ly);
      ctx.restore();
    }
  }
}
