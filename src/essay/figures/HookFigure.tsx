/**
 * The hook: a large synchronous machine turning slowly, no controls. Three-phase currents glow in the stator slots,
 * the field they make travels around the air gap (the same renderer as §3), and a two-pole rotor follows it a little
 * behind — a motor at light load. One electrical cycle every 12 s.
 */

import { PHASES, statorField } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { arrow, gapField, pt, statorIron } from '../canvas/draw';
import { prefersReducedMotion, useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK, alpha } from '../theme';
import { FigureFrame } from './FigureFrame';
import { layoutSquare, winding } from './statorScene';
import { useRef } from 'react';

export const HOOK_CYCLE_S = 12;
/** Rotor lag behind the stator field (visual; a lightly loaded motor). */
const HOOK_LAG = 0.35;
const ALL_ON = { a: true, b: true, c: true } as const;

function rotor(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number) {
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
}

/** @param still  draw a single frame at this electrical angle (used for the Open Graph card) */
export function HookFigure({ still }: { still?: number } = {}) {
  const { d } = useI18n();
  const wt = useRef(still ?? 1.1);
  const animate = still === undefined && !prefersReducedMotion();

  const { boxRef, canvasRef } = useCanvasFigure(({ ctx, w, h, dt }) => {
    wt.current = (wt.current + (2 * Math.PI * dt) / HOOK_CYCLE_S) % (2 * Math.PI);
    const L = layoutSquare(w);
    const { g } = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);
    const f = statorField(wt.current);
    const ang = Math.atan2(f.net.im, f.net.re);
    statorIron(ctx, g);
    gapField(ctx, g, (th) => 1.5 * Math.cos(th - ang), CONCEPT.stator, 1.5);
    winding(ctx, L, PHASES, wt.current, ALL_ON, { letters: false, planes: false });
    const rr = g.rb - (g.ro - g.rb) * 0.16;
    rotor(ctx, g.cx, g.cy, rr, ang - HOOK_LAG);
    const [x2, y2] = pt(g.cx, g.cy, rr * 0.72, ang - HOOK_LAG);
    arrow(ctx, g.cx, g.cy, x2, y2, CONCEPT.rotor, Math.max(5, w * 0.014), { glow: 1 });
  }, animate);

  return <FigureFrame boxRef={boxRef} canvasRef={canvasRef} aspect={1} label={d.essay.hook.figureLabel} className="fig--hook" />;
}
