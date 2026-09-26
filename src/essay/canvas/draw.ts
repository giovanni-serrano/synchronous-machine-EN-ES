/**
 * Canvas drawing primitives for the essay figures. Angles are mathematical (counterclockwise, 0 = +x); the canvas
 * y axis points down, so points are (cx + r cos θ, cy − r sin θ). Glow = the same stroke drawn wider and faint with
 * additive blending underneath the core stroke (cheap enough for 60 fps on phones, unlike blur filters).
 */

import { INK, SERIF, alpha } from '../theme';

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

/**
 * Radial field across the air gap for a sinusoidally distributed field whose space vector has angle `axis` and
 * size `amplitude` (2 poles): B_r(θ) = amplitude · cos(θ − axis), outward positive (from `sinusoidalGapField`).
 * Drawn as a glowing band whose brightness follows |B_r| plus short arrows showing its direction.
 */
export function gapField(
  ctx: CanvasRenderingContext2D,
  g: StatorGeom,
  field: (theta: number) => number,
  color: string,
  maxAmplitude: number,
) {
  const rBand = g.rb - (g.ro - g.rb) * 0.2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // One stroke per pass with a conic gradient whose opacity follows |B_r(θ)| — smooth, no segment seams.
  // Conic stops run clockwise on screen from +x: stop f ↔ mathematical angle −2πf.
  const stops = 72;
  const band = (peak: number) => {
    if (typeof ctx.createConicGradient !== 'function') return alpha(color, peak * 0.5);
    const grad = ctx.createConicGradient(0, g.cx, g.cy);
    for (let k = 0; k <= stops; k++) {
      const f = k / stops;
      grad.addColorStop(f, alpha(color, peak * Math.abs(field(-2 * Math.PI * f)) / maxAmplitude));
    }
    return grad;
  };
  for (const [width, peak] of [
    [(g.ro - g.rb) * 0.95, 0.12],
    [(g.ro - g.rb) * 0.4, 0.28],
    [(g.ro - g.rb) * 0.12, 0.7],
  ] as const) {
    ctx.strokeStyle = band(peak);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, rBand, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  // direction arrows across the gap
  const m = 16;
  const len = (g.ro - g.rb) * 0.5;
  for (let k = 0; k < m; k++) {
    const th = (2 * Math.PI * k) / m;
    const b = field(th) / maxAmplitude;
    if (Math.abs(b) < 0.12) continue;
    const l = len * Math.abs(b);
    const [xa, ya] = pt(g.cx, g.cy, rBand - (b > 0 ? l / 2 : -l / 2), th);
    const [xb, yb] = pt(g.cx, g.cy, rBand + (b > 0 ? l / 2 : -l / 2), th);
    arrow(ctx, xa, ya, xb, yb, color, 1.8, { opacity: 0.25 + 0.5 * Math.abs(b), head: 2.6 });
  }
  ctx.restore();
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
