/**
 * The hook (checkpoint 2b review): a loop that shows the headline literally — an empty stator, three currents that
 * make a magnet (N and S lobes from the model's B_r(θ)) turning inside the empty machine, and only then a rotor that
 * appears and locks onto it. Timeline: hookSequence.ts. No controls; it pauses off-screen.
 */

import { PHASES } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { arrow, magnetField, pt, salientRotor, statorIron } from '../canvas/draw';
import { prefersReducedMotion, useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK } from '../theme';
import { statorGapField } from './fieldModel';
import { FigureFrame } from './FigureFrame';
import { HOOK_CYCLE_S, HOOK_ESSAY_STAGES, HOOK_STAGES, hookFrame, type HookFrame, type HookVariant } from './hookSequence';
import { layoutSquare, winding } from './statorScene';
import { useRef } from 'react';

/** A loop time in the middle of the essay variant's "locked" stage (reduced motion). */
export const LOCKED_FRAME_TIME = HOOK_ESSAY_STAGES.slice(0, 3).reduce((s, [, d]) => s + d, 0) + 3;
/** A loop time in the "field" stage: the magnet alone in the empty machine (Open Graph card). */
export const FIELD_FRAME_TIME = HOOK_STAGES.slice(0, 2).reduce((s, [, d]) => s + d, 0) + 2;
const ALL_ON = { a: true, b: true, c: true } as const;


/**
 * @param still     draw a single frame at this loop time, s (the Open Graph card)
 * @param onFrame   called with each drawn frame (the clip view syncs its captions to it)
 */
export function HookFigure({
  still,
  onFrame,
  variant = 'essay',
  letterScale = 1,
}: {
  still?: number;
  onFrame?: (frame: HookFrame) => void;
  /** 'essay' starts with the magnet already turning; 'clip' starts from the empty stator (review 2c). */
  variant?: HookVariant;
  /** Enlarges the N / S letters (the clip is watched small, inside X on a phone). */
  letterScale?: number;
} = {}) {
  const { d } = useI18n();
  const reduced = prefersReducedMotion();
  // reduced motion: a still frame with the rotor locked on
  const loop = useRef(still ?? (reduced ? LOCKED_FRAME_TIME : 0));
  const wt = useRef(1.1);
  const animate = still === undefined && !reduced;

  const { boxRef, canvasRef } = useCanvasFigure(({ ctx, w, h, dt }) => {
    loop.current += dt;
    wt.current = (wt.current + (2 * Math.PI * dt) / HOOK_CYCLE_S) % (2 * Math.PI);
    const frame = hookFrame(loop.current, variant);
    onFrame?.(frame);
    const L = layoutSquare(w);
    const { g } = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);
    const field = statorGapField(wt.current, ALL_ON, frame.envelope);
    statorIron(ctx, g);
    magnetField(ctx, g, field, CONCEPT.stator, 1.5, { letterSize: Math.max(18, g.ro * 0.11) * letterScale, lines: true });
    winding(ctx, L, PHASES, wt.current, ALL_ON, { letters: false, planes: false, envelope: frame.envelope });
    if (frame.rotor > 0.01) {
      const rr = g.rb - (g.ro - g.rb) * 0.16;
      const angle = field.axis - frame.lag;
      ctx.save();
      ctx.globalAlpha = frame.rotor;
      salientRotor(ctx, g.cx, g.cy, rr, angle);
      ctx.restore();
      const [x2, y2] = pt(g.cx, g.cy, rr * 0.72, angle);
      arrow(ctx, g.cx, g.cy, x2, y2, CONCEPT.rotor, Math.max(6, g.ro * 0.04), { glow: 1, opacity: frame.rotor });
    }
  }, animate);

  return <FigureFrame boxRef={boxRef} canvasRef={canvasRef} aspect={1} label={d.essay.hook.figureLabel} className="fig--hook" />;
}
