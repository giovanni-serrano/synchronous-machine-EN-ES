/**
 * The hook (checkpoint 2b review): a loop that shows the headline literally — an empty stator, three currents that
 * make a magnet (N and S lobes from the model's B_r(θ)) turning inside the empty machine, and only then a rotor that
 * appears and locks onto it. Timeline: hookSequence.ts. No controls; it pauses off-screen.
 */

import { PHASES } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { arrow, magnetField, pt, statorIron } from '../canvas/draw';
import { prefersReducedMotion, useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK, alpha } from '../theme';
import { statorGapField } from './fieldModel';
import { FigureFrame } from './FigureFrame';
import { HOOK_CYCLE_S, HOOK_STAGES, hookFrame, type HookFrame } from './hookSequence';
import { layoutSquare, winding } from './statorScene';
import { useRef } from 'react';

/** A loop time in the middle of the "locked" stage (reduced motion). */
export const LOCKED_FRAME_TIME = HOOK_STAGES.slice(0, 5).reduce((s, [, d]) => s + d, 0) + 3;
/** A loop time in the "field" stage: the magnet alone in the empty machine (Open Graph card). */
export const FIELD_FRAME_TIME = HOOK_STAGES.slice(0, 2).reduce((s, [, d]) => s + d, 0) + 2;
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

/**
 * @param still     draw a single frame at this loop time, s (the Open Graph card)
 * @param onFrame   called with each drawn frame (the clip view syncs its captions to it)
 */
export function HookFigure({ still, onFrame }: { still?: number; onFrame?: (frame: HookFrame) => void } = {}) {
  const { d } = useI18n();
  const reduced = prefersReducedMotion();
  // reduced motion: a still frame with the rotor locked on
  const loop = useRef(still ?? (reduced ? LOCKED_FRAME_TIME : 0));
  const wt = useRef(1.1);
  const animate = still === undefined && !reduced;

  const { boxRef, canvasRef } = useCanvasFigure(({ ctx, w, h, dt }) => {
    loop.current += dt;
    wt.current = (wt.current + (2 * Math.PI * dt) / HOOK_CYCLE_S) % (2 * Math.PI);
    const frame = hookFrame(loop.current);
    onFrame?.(frame);
    const L = layoutSquare(w);
    const { g } = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);
    const field = statorGapField(wt.current, ALL_ON, frame.envelope);
    statorIron(ctx, g);
    magnetField(ctx, g, field, CONCEPT.stator, 1.5, { letterSize: Math.max(18, g.ro * 0.11), lines: true });
    winding(ctx, L, PHASES, wt.current, ALL_ON, { letters: false, planes: false, envelope: frame.envelope });
    if (frame.rotor > 0.01) {
      const rr = g.rb - (g.ro - g.rb) * 0.16;
      const angle = field.axis - frame.lag;
      ctx.save();
      ctx.globalAlpha = frame.rotor;
      rotor(ctx, g.cx, g.cy, rr, angle);
      ctx.restore();
      const [x2, y2] = pt(g.cx, g.cy, rr * 0.72, angle);
      arrow(ctx, g.cx, g.cy, x2, y2, CONCEPT.rotor, Math.max(6, g.ro * 0.04), { glow: 1, opacity: frame.rotor });
    }
  }, animate);

  return <FigureFrame boxRef={boxRef} canvasRef={canvasRef} aspect={1} label={d.essay.hook.figureLabel} className="fig--hook" />;
}
