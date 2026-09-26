/**
 * §5 The rotor: a two-pole rotor in the turning net field (white). At no load it sits under the field's S face.
 * Dragged away (the field pauses while you hold it) and released, it springs back with a damped swing and rides
 * along in step. A qualitative swing equation — δ'' = −K sin δ − D δ' — drives the return (labelled qualitative in
 * docs); pushed past 180° it slips a pole pair and locks on again. Steady-state vectors come from the model (rotorScene).
 */

import { useRef, type PointerEvent } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useCanvasFigure } from '../canvas/useCanvasFigure';
import { INK } from '../theme';
import { FigureFrame, localPoint } from './FigureFrame';
import { drawRotorScene } from './rotorScene';
import { layoutSquare, type SceneLayout } from './statorScene';
import { useScrubTime } from './useScrubTime';

const CYCLE_S = 10;
/** Swing: natural period ≈ 1.4 s, damping ratio ≈ 0.22 (visual). */
const K = (2 * Math.PI / 1.4) ** 2;
const D = 2 * 0.22 * Math.sqrt(K);

export function RotorFigure() {
  const { d } = useI18n();
  const t = useScrubTime(CYCLE_S, 0.9);
  const delta = useRef(0);
  const rate = useRef(0);
  const grab = useRef<{ offset: number; lastAngle: number } | null>(null);
  const layout = useRef<SceneLayout | null>(null);

  const { boxRef, canvasRef, invalidate } = useCanvasFigure(({ ctx, w, h, dt }) => {
    const wt = t.advance(dt);
    if (!grab.current && dt > 0) {
      // integrate the swing in small steps
      const n = 4;
      for (let k = 0; k < n; k++) {
        const acc = -K * Math.sin(delta.current) - D * rate.current;
        rate.current += (acc * dt) / n;
        delta.current += (rate.current * dt) / n;
      }
      if (Math.abs(rate.current) < 1e-3 && Math.abs(delta.current) > Math.PI)
        delta.current -= 2 * Math.PI * Math.round(delta.current / (2 * Math.PI)); // settled after a slip
    }
    const L = layoutSquare(w);
    layout.current = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);
    drawRotorScene(ctx, L, { wt, delta: delta.current, vectors: true, springs: true }, 'δ');
  }, true);

  const pointerAngle = (e: PointerEvent<HTMLCanvasElement>) => {
    const L = layout.current!;
    const [x, y] = localPoint(e);
    return Math.atan2(-(y - L.g.cy), x - L.g.cx);
  };

  return (
    <FigureFrame
      boxRef={boxRef}
      canvasRef={canvasRef}
      aspect={1}
      className="fig--square"
      label={d.essay.rotor.figureLabel}
      instruction={d.essay.rotor.instruction}
      keysHint={`${d.essay.figure.keysTime} ${d.essay.figure.keysPush}`}
      playing={t.playing}
      onTogglePlay={() => t.setPlaying((p) => !p)}
      onKeyDown={(e) =>
        t.onKey(e, invalidate, (key) => {
          if (key !== 'Enter') return false;
          rate.current -= 6; // a push backwards
          return true;
        })
      }
      onPointerDown={(e) => {
        const L = layout.current;
        if (!L) return;
        const [x, y] = localPoint(e);
        if (Math.hypot(x - L.g.cx, y - L.g.cy) > L.g.rb) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        t.dragging.current = true;
        const a = pointerAngle(e);
        grab.current = { offset: a - delta.current, lastAngle: a };
        rate.current = 0;
      }}
      onPointerMove={(e) => {
        const g = grab.current;
        if (!g) return;
        let a = pointerAngle(e);
        // unwrap so dragging all the way round keeps counting
        while (a - g.lastAngle > Math.PI) a -= 2 * Math.PI;
        while (a - g.lastAngle < -Math.PI) a += 2 * Math.PI;
        g.lastAngle = a;
        delta.current = a - g.offset;
        invalidate();
      }}
      onPointerUp={() => {
        grab.current = null;
        t.dragging.current = false;
      }}
    />
  );
}
