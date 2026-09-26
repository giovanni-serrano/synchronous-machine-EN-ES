/**
 * §3 Three coils (star moment "three pulses become one rotation").
 *
 * Stage 0: each phase's field pulses on its own axis (statorField() contributions, drawn from the centre).
 * Then the components slide, eased, until they sit tip to tail, and the sum appears — translucent with an outline,
 * UNDER the components so they stay readable — together with the exact locus of its tip over the last cycle
 * (circle with three coils, ellipse with two, line with one). The air-gap field is drawn as a magnet (N and S lobes
 * from the model's B_r(θ)) that turns with the sum. The slide happens once by itself after a few seconds; a text button
 * toggles it. Tapping a coil switches its current off.
 */

import { useRef, useState, type PointerEvent } from 'react';
import { PHASES, PHASE_AXES, statorField, type PhaseId } from '../../physics';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { arrow, axisLine, hollowArrow, label, magnetField, pt, statorIron } from '../canvas/draw';
import { CONCEPT, INK, PHASE_COLOR, alpha } from '../theme';
import { useCanvasFigure } from '../canvas/useCanvasFigure';
import { statorGapField } from './fieldModel';
import { FigureFrame, localPoint } from './FigureFrame';
import { conductorPoints, inStrip, layoutWithStrip, stripAngle, waveStrip, winding, type SceneLayout } from './statorScene';
import { slowdown, useScrubTime } from './useScrubTime';

export const THREE_COILS_CYCLE_S = 10;
/** Samples of the tip locus over the last cycle. */
const TRAIL = 120;
/** Seconds of watching the separate components before they slide tip to tail by themselves. */
const AUTO_SLIDE_AFTER_S = 5;
/** Duration of the slide, s. */
const SLIDE_S = 1.6;

type Enabled = Record<PhaseId, boolean>;

/** Enabled phases' contributions and their tip-to-tail partial sums (electrical frame, per-unit of B_max). */
export function resultant(wt: number, enabled: Readonly<Enabled>) {
  const f = statorField(wt);
  let re = 0;
  let im = 0;
  const parts = PHASES.map((ph) => {
    const v = enabled[ph] ? f[ph].vector : { re: 0, im: 0 };
    const from = { re, im };
    re += v.re;
    im += v.im;
    return { phase: ph, v, from };
  });
  return { parts, sum: { re, im } };
}

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function ThreeCoilsFigure() {
  const { d } = useI18n();
  const t = useScrubTime(THREE_COILS_CYCLE_S, 0.35);
  const [enabled, setEnabled] = useState<Enabled>({ a: true, b: true, c: true });
  const [tipToTail, setTipToTail] = useState(false);
  const [announce, setAnnounce] = useState('');
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const target = useRef(0);
  target.current = tipToTail ? 1 : 0;
  const progress = useRef(0);
  const watched = useRef(0);
  const autoDone = useRef(false);
  const layout = useRef<SceneLayout | null>(null);
  const tapStart = useRef<[number, number] | null>(null);

  const { boxRef, canvasRef, invalidate } = useCanvasFigure(({ ctx, w, h, dt }) => {
    const wt = t.advance(dt);
    // the one automatic slide, after the reader has watched the separate pulses for a while
    if (!autoDone.current && dt > 0) {
      watched.current += dt;
      if (watched.current > AUTO_SLIDE_AFTER_S) {
        autoDone.current = true;
        setTipToTail(true);
      }
    }
    const step = dt > 0 ? dt / SLIDE_S : 1; // a paused, invalidated frame jumps to the target
    progress.current += Math.sign(target.current - progress.current) * Math.min(step, Math.abs(target.current - progress.current));
    const s = ease(progress.current);
    const sumVis = smooth(0.55, 1, s);

    const on = enabledRef.current;
    const L = layoutWithStrip(w, h);
    layout.current = L;
    const { g } = L;
    const k = L.unit;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);

    const { parts, sum } = resultant(wt, on);
    statorIron(ctx, g);
    magnetField(ctx, g, statorGapField(wt, on), CONCEPT.stator, 1.5, { letterSize: Math.max(16, g.ro * 0.1) });
    winding(ctx, L, PHASES, wt, on, { letterSize: Math.max(15, g.ro * 0.085) });
    for (const ph of PHASES) if (on[ph]) axisLine(ctx, g.cx, g.cy, g.rb * 0.92, PHASE_AXES[ph], PHASE_COLOR[ph], 0.55 * (1 - s));

    const tipX = g.cx + k * sum.re;
    const tipY = g.cy - k * sum.im;
    if (sumVis > 0) {
      // where the tip of the sum has been over the last cycle (exact locus from the model)
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(2.5, g.ro * 0.018);
      let prev: [number, number] | null = null;
      for (let j = 0; j <= TRAIL; j++) {
        const past = resultant(wt - 2 * Math.PI * 0.96 * (1 - j / TRAIL), on).sum;
        const p: [number, number] = [g.cx + k * past.re, g.cy - k * past.im];
        if (prev) {
          ctx.strokeStyle = alpha(CONCEPT.stator, sumVis * (0.06 + 0.6 * (j / TRAIL) ** 1.6));
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(p[0], p[1]);
          ctx.stroke();
        }
        prev = p;
      }
      ctx.restore();
      hollowArrow(ctx, g.cx, g.cy, tipX, tipY, CONCEPT.stator, Math.max(12, g.ro * 0.085), { opacity: sumVis });
    }

    // the three components on top: from the centre (s = 0) sliding to tip-to-tail (s = 1)
    const wPart = Math.max(6, g.ro * 0.042);
    for (const p of parts) {
      if (!on[p.phase]) continue;
      const x1 = g.cx + k * s * p.from.re;
      const y1 = g.cy - k * s * p.from.im;
      arrow(ctx, x1, y1, x1 + k * p.v.re, y1 - k * p.v.im, PHASE_COLOR[p.phase], wPart, { glow: 0.6 });
    }
    ctx.fillStyle = INK.textFaint;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, 3.5, 0, 2 * Math.PI);
    ctx.fill();

    const mag = Math.hypot(sum.re, sum.im);
    if (sumVis > 0.4 && mag > 0.35) {
      const ang = Math.atan2(sum.im, sum.re);
      const [mx, my] = pt(g.cx, g.cy, k * mag * 0.55, ang);
      const off = Math.max(28, g.ro * 0.17);
      label(ctx, d.essay.threeCoils.sum, mx - Math.sin(ang) * off, my - Math.cos(ang) * off, Math.max(16, g.ro * 0.1), {
        color: alpha(INK.text, sumVis),
        italic: true,
      });
    }

    waveStrip(ctx, L, PHASES, wt, on, d.essay.oneCoil.current, null);
  }, t.playing);

  const toggleCoil = (ph: PhaseId) => {
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
      className="fig--scene"
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
          toggleCoil(ph);
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
            toggleCoil(ph);
            return;
          }
      }}
    >
      <button
        type="button"
        className="fig__textbtn"
        aria-pressed={tipToTail}
        onClick={() => {
          autoDone.current = true;
          setTipToTail((v) => !v);
          invalidate();
        }}
      >
        {tipToTail ? d.essay.threeCoils.showParts : d.essay.threeCoils.showSum}
      </button>
      <span className="visually-hidden" aria-live="polite">
        {announce}
      </span>
    </FigureFrame>
  );
}
