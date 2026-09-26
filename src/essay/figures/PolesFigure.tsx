/**
 * §4 More poles, slower field. The same three currents feed a winding with 2, 4, 6 or 8 poles
 * (windingConductors(poles)); the air-gap field is airGapFluxDensity(θ, ωt, poles) — as many N and S lobes as poles —
 * and turns at ω / (poles/2), so n_sync = 120 f / poles (synchronousSpeed). Changing the pole count cross-fades the
 * field; the currents in the wave strip never change.
 */

import { useRef, useState, type PointerEvent } from 'react';
import { PHASES, airGapFluxDensity, synchronousSpeed } from '../../physics';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { magnetField, statorIron } from '../canvas/draw';
import { useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK } from '../theme';
import { FigureFrame, localPoint } from './FigureFrame';
import { inStrip, layoutWithStrip, stripAngle, waveStrip, winding, type SceneLayout } from './statorScene';
import { useScrubTime } from './useScrubTime';

export const POLE_OPTIONS = [2, 4, 6, 8] as const;
const CYCLE_S = 10;
const FADE_S = 0.7;
const ALL_ON = { a: true, b: true, c: true } as const;

/** The rotating stator field for a pole count, in the shape magnetField() draws. */
export function polesField(wt: number, poles: number) {
  return {
    amp: 1.5,
    poles,
    axis: wt / (poles / 2), // mechanical angle of the first S peak
    at: (theta: number) => airGapFluxDensity(theta, wt, poles),
  };
}

export function PolesFigure() {
  const { d, fmt } = useI18n();
  const t = useScrubTime(CYCLE_S, 0.4);
  const [poles, setPoles] = useState(2);
  const polesRef = useRef(poles);
  polesRef.current = poles;
  const previous = useRef<{ poles: number; fade: number }>({ poles: 2, fade: 0 });
  const layout = useRef<SceneLayout | null>(null);

  const { boxRef, canvasRef, invalidate } = useCanvasFigure(({ ctx, w, h, dt }) => {
    const wt = t.advance(dt);
    const L = layoutWithStrip(w, h);
    layout.current = L;
    const { g } = L;
    const prev = previous.current;
    prev.fade = dt > 0 ? Math.max(0, prev.fade - dt / FADE_S) : 0;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);
    statorIron(ctx, g, 24);
    const letterSize = Math.max(14, g.ro * 0.075);
    if (prev.fade > 0) magnetField(ctx, g, polesField(wt, prev.poles), CONCEPT.stator, 1.5, { strength: prev.fade, letterSize });
    magnetField(ctx, g, polesField(wt, polesRef.current), CONCEPT.stator, 1.5, { strength: 1 - prev.fade, letterSize });
    winding(ctx, L, PHASES, wt, ALL_ON, { poles: polesRef.current, letterSize: Math.max(15, g.ro * 0.085) });
    waveStrip(ctx, L, PHASES, wt, ALL_ON, d.essay.oneCoil.current, null);
  }, t.playing);

  const change = (next: number) => {
    if (next === poles) return;
    previous.current = { poles, fade: 1 };
    setPoles(next);
    invalidate();
  };
  const idx = POLE_OPTIONS.indexOf(poles as (typeof POLE_OPTIONS)[number]);

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
      label={d.essay.poles.figureLabel}
      instruction={d.essay.poles.instruction}
      keysHint={`${d.essay.figure.keysTime} + −`}
      playing={t.playing}
      onTogglePlay={() => t.setPlaying((p) => !p)}
      onKeyDown={(e) =>
        t.onKey(e, invalidate, (key) => {
          if (key === '+' || key === '=') change(POLE_OPTIONS[Math.min(POLE_OPTIONS.length - 1, idx + 1)]!);
          else if (key === '-') change(POLE_OPTIONS[Math.max(0, idx - 1)]!);
          else return false;
          return true;
        })
      }
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
      bar={
        <>
          <button type="button" className="fig__round" aria-label={d.essay.poles.fewer} disabled={idx <= 0} onClick={() => change(POLE_OPTIONS[idx - 1]!)}>
            −
          </button>
          <button
            type="button"
            className="fig__round"
            aria-label={d.essay.poles.more}
            disabled={idx >= POLE_OPTIONS.length - 1}
            onClick={() => change(POLE_OPTIONS[idx + 1]!)}
          >
            +
          </button>
          <span className="fig__readout" aria-live="polite">
            <span>{interpolate(d.essay.poles.readoutPoles, { poles })}</span>
            <span className="dim">{interpolate(d.essay.poles.readoutSpeed, { rpm: fmt.rpm(synchronousSpeed(60, poles)) })}</span>
          </span>
        </>
      }
    />
  );
}
