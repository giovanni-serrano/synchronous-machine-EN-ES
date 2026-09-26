/**
 * §2 One coil: a single phase winding (phase a) with an alternating current. Its field is a magnet — an N and an S lobe
 * in the gap, from the model's B_r(θ) — that grows, shrinks and flips on the coil's axis but never turns (B ∝ i(t)),
 * which the reader discovers by dragging along the current wave.
 */

import { useRef, type PointerEvent } from 'react';
import { PHASE_AXES, type PhaseId } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { arrow, magnetField, pt, statorIron, symbol } from '../canvas/draw';
import { useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK } from '../theme';
import { statorGapField } from './fieldModel';
import { FigureFrame, localPoint } from './FigureFrame';
import { inStrip, layoutWithStrip, phaseCurrent, stripAngle, waveStrip, winding, type SceneLayout } from './statorScene';
import { useScrubTime } from './useScrubTime';

export const ONE_COIL_CYCLE_S = 9;
const ONLY_A: readonly PhaseId[] = ['a'];
const ENABLED = { a: true, b: false, c: false } as const;

export function OneCoilFigure() {
  const { d } = useI18n();
  const t = useScrubTime(ONE_COIL_CYCLE_S, 0.5);
  const layout = useRef<SceneLayout | null>(null);

  const { boxRef, canvasRef, invalidate } = useCanvasFigure(({ ctx, w, h, dt }) => {
    const wt = t.advance(dt);
    const L = layoutWithStrip(w, h);
    layout.current = L;
    const { g } = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);

    const i = phaseCurrent('a', wt);
    statorIron(ctx, g);
    magnetField(ctx, g, statorGapField(wt, ENABLED), CONCEPT.stator, 1.5, { letterSize: Math.max(16, g.ro * 0.1) });
    winding(ctx, L, ONLY_A, wt, ENABLED, { letterSize: Math.max(15, g.ro * 0.085) });

    // Field along the coil's axis: length and sign follow the current.
    const [x2, y2] = pt(g.cx, g.cy, L.unit * i, PHASE_AXES.a);
    arrow(ctx, g.cx, g.cy, x2, y2, CONCEPT.stator, Math.max(6, g.ro * 0.045), { glow: 1 });
    ctx.fillStyle = INK.textFaint;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, 3, 0, 2 * Math.PI);
    ctx.fill();
    if (Math.abs(i) > 0.15) {
      const tip = pt(g.cx, g.cy, L.unit * i + (i >= 0 ? 22 : -22), PHASE_AXES.a);
      symbol(ctx, 'B', '', tip[0], tip[1] - 22, Math.max(20, g.ro * 0.12));
    }

    waveStrip(ctx, L, ONLY_A, wt, ENABLED, d.essay.oneCoil.current, 'a');
  }, t.playing);

  const scrub = (e: PointerEvent<HTMLCanvasElement>) => {
    const L = layout.current;
    if (!L) return;
    const [x] = localPoint(e);
    t.wt.current = stripAngle(L, x);
    invalidate();
  };

  return (
    <FigureFrame
      boxRef={boxRef}
      canvasRef={canvasRef}
      className="fig--scene"
      label={d.essay.oneCoil.figureLabel}
      instruction={d.essay.oneCoil.instruction}
      keysHint={d.essay.figure.keysTime}
      playing={t.playing}
      onTogglePlay={() => t.setPlaying((p) => !p)}
      onKeyDown={(e) => t.onKey(e, invalidate)}
      onPointerDown={(e) => {
        const L = layout.current;
        const [x, y] = localPoint(e);
        if (!L || !inStrip(L, x, y)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        t.dragging.current = true;
        t.setPlaying(false);
        scrub(e);
      }}
      onPointerMove={(e) => {
        if (t.dragging.current) scrub(e);
      }}
      onPointerUp={() => {
        t.dragging.current = false;
      }}
    />
  );
}
