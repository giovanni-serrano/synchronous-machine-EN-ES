/**
 * §3 Three coils (star moment "three pulses become one rotation"): each phase's field pulses along its own axis
 * (statorField() contributions); drawn tip to tail they add up to one field of constant size 1.5·B_max that turns at
 * ωt, its tip leaving a fading trail. Tapping a coil switches its current off: the trail collapses into an ellipse
 * (two coils) or a line (one coil).
 */

import { useRef, useState, type PointerEvent } from 'react';
import { PHASES, statorField, type PhaseId } from '../../physics';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { arrow, gapField, label, pt, statorIron } from '../canvas/draw';
import { useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK, PHASE_COLOR, alpha } from '../theme';
import { FigureFrame, localPoint } from './FigureFrame';
import { conductorPoints, inStrip, layoutWithStrip, stripAngle, waveStrip, winding, type SceneLayout } from './statorScene';
import { slowdown, useScrubTime } from './useScrubTime';

export const THREE_COILS_CYCLE_S = 10;
/** Samples of the tip locus over the last cycle. */
const TRAIL = 120;

type Enabled = Record<PhaseId, boolean>;

/** Resultant of the enabled phases' contributions (electrical frame, per-unit of B_max). */
export function resultant(wt: number, enabled: Readonly<Enabled>) {
  const f = statorField(wt);
  let re = 0;
  let im = 0;
  const parts = PHASES.map((ph) => {
    const v = enabled[ph] ? f[ph].vector : { re: 0, im: 0 };
    const from = { re, im };
    re += v.re;
    im += v.im;
    return { phase: ph, from, to: { re, im } };
  });
  return { parts, sum: { re, im } };
}

export function ThreeCoilsFigure() {
  const { d } = useI18n();
  const t = useScrubTime(THREE_COILS_CYCLE_S, 0.35);
  const [enabled, setEnabled] = useState<Enabled>({ a: true, b: true, c: true });
  const [announce, setAnnounce] = useState('');
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const layout = useRef<SceneLayout | null>(null);
  const tapStart = useRef<[number, number] | null>(null);

  const { boxRef, canvasRef, invalidate } = useCanvasFigure(({ ctx, w, h, dt }) => {
    const wt = t.advance(dt);
    const on = enabledRef.current;
    const L = layoutWithStrip(w);
    layout.current = L;
    const { g } = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);

    const { parts, sum } = resultant(wt, on);
    const mag = Math.hypot(sum.re, sum.im);
    const ang = Math.atan2(sum.im, sum.re);
    statorIron(ctx, g);
    gapField(ctx, g, (th) => mag * Math.cos(th - ang), CONCEPT.stator, 1.5);
    winding(ctx, L, PHASES, wt, on);

    // Where the tip of the sum has been over the last cycle (exact locus from the model, fading with age):
    // a circle with three coils, an ellipse with two, a line with one.
    const tipX = g.cx + L.unit * sum.re;
    const tipY = g.cy - L.unit * sum.im;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2.5, w * 0.007);
    let prev: [number, number] | null = null;
    for (let k = 0; k <= TRAIL; k++) {
      const past = resultant(wt - 2 * Math.PI * 0.96 * (1 - k / TRAIL), on).sum;
      const p: [number, number] = [g.cx + L.unit * past.re, g.cy - L.unit * past.im];
      if (prev) {
        ctx.strokeStyle = alpha(CONCEPT.stator, 0.06 + 0.6 * (k / TRAIL) ** 1.6);
        ctx.beginPath();
        ctx.moveTo(prev[0], prev[1]);
        ctx.lineTo(p[0], p[1]);
        ctx.stroke();
      }
      prev = p;
    }
    ctx.restore();

    // Each phase's pulsing contribution, tip to tail, then the sum.
    const wPart = Math.max(3.5, w * 0.011);
    for (const p of parts) {
      if (!on[p.phase]) continue;
      arrow(
        ctx,
        g.cx + L.unit * p.from.re,
        g.cy - L.unit * p.from.im,
        g.cx + L.unit * p.to.re,
        g.cy - L.unit * p.to.im,
        PHASE_COLOR[p.phase],
        wPart,
        { opacity: 0.9 },
      );
    }
    arrow(ctx, g.cx, g.cy, tipX, tipY, CONCEPT.stator, Math.max(6, w * 0.019), { glow: 1.2 });
    ctx.fillStyle = INK.textFaint;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, 3, 0, 2 * Math.PI);
    ctx.fill();
    if (mag > 0.35) {
      // beside the middle of the sum arrow, on its counterclockwise side (away from the tip-to-tail chain)
      const [mx, my] = pt(g.cx, g.cy, L.unit * mag * 0.55, ang);
      const [lx, ly] = [mx - Math.sin(ang) * 26, my - Math.cos(ang) * 26];
      label(ctx, d.essay.threeCoils.sum, lx, ly, Math.max(15, w * 0.04), { color: INK.text, italic: true });
    }

    waveStrip(ctx, L, PHASES, wt, on, d.essay.oneCoil.current, null);
  }, t.playing);

  const toggle = (ph: PhaseId) => {
    const next = !enabledRef.current[ph];
    setEnabled((e) => ({ ...e, [ph]: next }));
    setAnnounce(interpolate(next ? d.essay.threeCoils.coilOn : d.essay.threeCoils.coilOff, { phase: ph }));
    invalidate();
  };

  const scrub = (e: PointerEvent<HTMLCanvasElement>) => {
    const L = layout.current;
    if (!L) return;
    t.wt.current = stripAngle(L, localPoint(e)[0]);
    invalidate();
  };

  return (
    <FigureFrame
      boxRef={boxRef}
      canvasRef={canvasRef}
      aspect={5 / 6}
      label={d.essay.threeCoils.figureLabel}
      instruction={
        <>
          {d.essay.threeCoils.instruction}{' '}
          <span className="fig__note">{interpolate(d.essay.threeCoils.speedNote, { factor: slowdown(THREE_COILS_CYCLE_S) })}</span>
        </>
      }
      keysHint={`${d.essay.figure.keysTime} ${d.essay.figure.keysCoils}`}
      playing={t.playing}
      onTogglePlay={() => t.setPlaying((p) => !p)}
      onKeyDown={(e) =>
        t.onKey(e, invalidate, (key) => {
          const ph = ({ '1': 'a', '2': 'b', '3': 'c' } as const)[key as '1' | '2' | '3'];
          if (!ph) return false;
          toggle(ph);
          return true;
        })
      }
      onPointerDown={(e) => {
        const L = layout.current;
        const [x, y] = localPoint(e);
        if (!L) return;
        if (inStrip(L, x, y)) {
          e.currentTarget.setPointerCapture(e.pointerId);
          t.dragging.current = true;
          t.setPlaying(false);
          scrub(e);
        } else tapStart.current = [x, y];
      }}
      onPointerMove={(e) => {
        if (t.dragging.current) scrub(e);
      }}
      onPointerUp={(e) => {
        if (t.dragging.current) {
          t.dragging.current = false;
          return;
        }
        const L = layout.current;
        const start = tapStart.current;
        tapStart.current = null;
        if (!L || !start || e.type === 'pointercancel') return;
        const [x, y] = localPoint(e);
        if (Math.hypot(x - start[0], y - start[1]) > 12) return;
        for (const ph of PHASES)
          if (conductorPoints(L, ph).some(([cx, cy]) => Math.hypot(x - cx, y - cy) < L.rc * 2.4)) {
            toggle(ph);
            return;
          }
      }}
    >
      <span className="visually-hidden" aria-live="polite">
        {announce}
      </span>
    </FigureFrame>
  );
}
