/**
 * §2 One coil: a single phase winding (phase a) with an alternating current. Its field points along the coil's axis
 * and only pulses — B ∝ i(t) — which the reader discovers by dragging along the current wave.
 */

import { useRef, type PointerEvent } from 'react';
import { PHASE_AXES, sinusoidalGapField, type PhaseId } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { arrow, gapField, pt, statorIron, symbol } from '../canvas/draw';
import { useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK } from '../theme';
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
    const L = layoutWithStrip(w);
    layout.current = L;
    const { g } = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);

    const i = phaseCurrent('a', wt);
    statorIron(ctx, g);
    gapField(ctx, g, (th) => sinusoidalGapField(th, PHASE_AXES.a, 2, i), CONCEPT.stator, 1.5);
    winding(ctx, L, ONLY_A, wt, ENABLED);

    // Field along the coil's axis: length and sign follow the current.
    const [x2, y2] = pt(g.cx, g.cy, L.unit * i, PHASE_AXES.a);
    arrow(ctx, g.cx, g.cy, x2, y2, CONCEPT.stator, Math.max(5, w * 0.016), { glow: 1 });
    ctx.fillStyle = INK.textFaint;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, 3, 0, 2 * Math.PI);
    ctx.fill();
    const tip = Math.abs(i) > 0.15 ? pt(g.cx, g.cy, L.unit * i + (i >= 0 ? 22 : -22), PHASE_AXES.a) : pt(g.cx, g.cy, 22, PHASE_AXES.a);
    symbol(ctx, 'B', '', tip[0], tip[1] - 20, Math.max(18, w * 0.05));

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
      aspect={5 / 6}
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
