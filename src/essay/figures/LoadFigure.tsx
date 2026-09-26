/**
 * §6 The load and §7 Motor or generator. The rotor sits δ behind (motor) or ahead of (generator) the turning net
 * field; the stretched field lines (star moment "the magnetic spring") pull harder as |sin δ| grows. The power comes
 * from the model — operatingPointAtDelta(): P = 3 V_φ E_A sin δ / X_S — and is drawn on a P–δ curve that can be dragged,
 * as can the rotor itself (the field pauses while you hold it).
 *
 *   variant 'load'      motor only, δ from 0 to 89° behind the field; curve 0…180° with its peak at 90°.
 *   variant 'motorGen'  signed δ from −89° to +89°; curve −120°…120°: below the axis the machine takes P from the grid
 *                       (motor), above it delivers P to the grid (generator).
 */

import { useRef, useState, type PointerEvent } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { label } from '../canvas/draw';
import { useCanvasFigure } from '../canvas/useCanvasFigure';
import { CONCEPT, INK, alpha } from '../theme';
import { FigureFrame, localPoint } from './FigureFrame';
import { ESSAY_PMAX, drawRotorScene, opAt } from './rotorScene';
import { layoutWithStrip, type SceneLayout } from './statorScene';
import { useScrubTime } from './useScrubTime';

const CYCLE_S = 10;
const DEG = Math.PI / 180;
const LIMIT = 89 * DEG;
const STEP = 2 * DEG;

type Variant = 'load' | 'motorGen';

const range = (v: Variant): [number, number] => (v === 'load' ? [0, Math.PI] : [-120 * DEG, 120 * DEG]);
/** Allowed internal δ for the variant ('load' is a motor: internal δ ≤ 0). */
const clampDelta = (v: Variant, delta: number) => (v === 'load' ? Math.min(0, Math.max(-LIMIT, delta)) : Math.min(LIMIT, Math.max(-LIMIT, delta)));

function curve(ctx: CanvasRenderingContext2D, L: SceneLayout, v: Variant, delta: number, text: { power: string; peak: string; motor: string; generator: string }) {
  const s = L.strip!;
  const [a0, a1] = range(v);
  // 'load' plots the motor's power as a positive magnitude against the lag; 'motorGen' plots P delivered (signed)
  const xOf = (a: number) => s.x0 + ((s.x1 - s.x0) * (a - a0)) / (a1 - a0);
  const baseY = v === 'load' ? s.y1 : (s.y0 + s.y1) / 2;
  const amp = v === 'load' ? s.y1 - s.y0 - 6 : (s.y1 - s.y0) / 2 - 4;
  const yOf = (p: number) => baseY - (amp * p) / ESSAY_PMAX;
  const pOf = (a: number) => (v === 'load' ? ESSAY_PMAX * Math.sin(a) : opAt(a).p);
  ctx.save();
  ctx.strokeStyle = INK.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s.x0, baseY);
  ctx.lineTo(s.x1, baseY);
  if (v === 'motorGen') {
    ctx.moveTo(xOf(0), s.y0 - 4);
    ctx.lineTo(xOf(0), s.y1 + 4);
  }
  ctx.stroke();
  // the curve: stable part solid, beyond ±90° dashed
  for (const [from, to, dashed] of v === 'load'
    ? ([
        [0, Math.PI / 2, false],
        [Math.PI / 2, Math.PI, true],
      ] as const)
    : ([
        [a0, -Math.PI / 2, true],
        [-Math.PI / 2, Math.PI / 2, false],
        [Math.PI / 2, a1, true],
      ] as const)) {
    ctx.setLineDash(dashed ? [4, 6] : []);
    ctx.strokeStyle = alpha(CONCEPT.p, dashed ? 0.45 : 0.95);
    ctx.lineWidth = dashed ? 2 : 3;
    ctx.beginPath();
    for (let k = 0; k <= 60; k++) {
      const a = from + ((to - from) * k) / 60;
      if (k === 0) ctx.moveTo(xOf(a), yOf(pOf(a)));
      else ctx.lineTo(xOf(a), yOf(pOf(a)));
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // operating point
  const a = v === 'load' ? -delta : delta;
  const x = xOf(a);
  const y = yOf(pOf(a));
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = alpha(CONCEPT.p, 0.25);
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = CONCEPT.p;
  ctx.strokeStyle = INK.bg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  const size = 14;
  label(ctx, text.power, s.x0, s.y0 - 14, size, { align: 'left', color: INK.textFaint, italic: true });
  if (v === 'load') {
    label(ctx, `${text.peak} · 90°`, xOf(Math.PI / 2), yOf(ESSAY_PMAX) - 14, size, { color: INK.textDim, italic: true });
    label(ctx, '0°', s.x0, s.y1 + 14, size, { color: INK.textFaint });
    label(ctx, '180°', s.x1, s.y1 + 14, size, { color: INK.textFaint });
  } else {
    label(ctx, text.generator, xOf(60 * DEG), s.y0 - 14, size, { color: INK.textDim, italic: true });
    label(ctx, text.motor, xOf(-60 * DEG), s.y1 + 14, size, { color: INK.textDim, italic: true });
  }
  return { xOf, a0, a1 };
}

export function LoadFigure({ variant }: { variant: Variant }) {
  const { d, fmt } = useI18n();
  const e = variant === 'load' ? d.essay.load : d.essay.motorGen;
  const t = useScrubTime(CYCLE_S, 0.6);
  const [delta, setDelta] = useState(variant === 'load' ? -41 * DEG : -41 * DEG);
  const deltaRef = useRef(delta);
  deltaRef.current = delta;
  const layout = useRef<SceneLayout | null>(null);
  const axis = useRef<{ xOf: (a: number) => number; a0: number; a1: number } | null>(null);
  const drag = useRef<'rotor' | 'curve' | null>(null);

  const { boxRef, canvasRef, invalidate } = useCanvasFigure(({ ctx, w, h, dt }) => {
    const wt = t.advance(dt);
    const L = layoutWithStrip(w, h);
    layout.current = L;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, w, h);
    drawRotorScene(ctx, L, { wt, delta: deltaRef.current, vectors: true, springs: true }, 'δ');
    axis.current = curve(ctx, L, variant, deltaRef.current, {
      power: d.essay.load.power,
      peak: d.essay.load.peak,
      motor: d.essay.motorGen.motor,
      generator: d.essay.motorGen.generator,
    });
  }, t.playing);

  const set = (next: number) => {
    setDelta(clampDelta(variant, next));
    invalidate();
  };

  const fromPointer = (ev: PointerEvent<HTMLCanvasElement>) => {
    const L = layout.current!;
    const [x, y] = localPoint(ev);
    if (drag.current === 'curve') {
      const ax = axis.current!;
      const s = L.strip!;
      const a = ax.a0 + ((ax.a1 - ax.a0) * (x - s.x0)) / (s.x1 - s.x0);
      set(variant === 'load' ? -a : a);
    } else {
      // rotor: δ = angle of the pointer relative to the net field's axis at this instant (field paused)
      const wt = t.wt.current;
      const netAngle = Math.PI / 2 + wt;
      let a = Math.atan2(-(y - L.g.cy), x - L.g.cx) - netAngle;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      set(a);
    }
  };

  const op = opAt(delta);
  const mode = Math.abs(op.p) < 1 ? 'none' : op.p > 0 ? 'generator' : 'motor';
  const flow = mode === 'generator' ? `${d.essay.motorGen.shaft} → ${d.essay.motorGen.grid}` : `${d.essay.motorGen.grid} → ${d.essay.motorGen.shaft}`;

  return (
    <FigureFrame
      boxRef={boxRef}
      canvasRef={canvasRef}
      className="fig--scene"
      label={e.figureLabel}
      instruction={e.instruction}
      keysHint={`${d.essay.figure.keysTime} ${d.essay.figure.keysDelta}`}
      playing={t.playing}
      onTogglePlay={() => t.setPlaying((p) => !p)}
      onKeyDown={(ev) =>
        t.onKey(ev, invalidate, (key) => {
          if (key === 'ArrowUp') set(deltaRef.current + STEP);
          else if (key === 'ArrowDown') set(deltaRef.current - STEP);
          else return false;
          return true;
        })
      }
      onPointerDown={(ev) => {
        const L = layout.current;
        if (!L) return;
        const [x, y] = localPoint(ev);
        const s = L.strip!;
        if (x >= s.x0 - 20 && x <= s.x1 + 20 && y >= s.y0 - 30 && y <= s.y1 + 30) drag.current = 'curve';
        else if (Math.hypot(x - L.g.cx, y - L.g.cy) <= L.g.rb) {
          drag.current = 'rotor';
          t.dragging.current = true; // hold the field still while the rotor is held
        } else return;
        ev.currentTarget.setPointerCapture(ev.pointerId);
        fromPointer(ev);
      }}
      onPointerMove={(ev) => {
        if (drag.current) fromPointer(ev);
      }}
      onPointerUp={() => {
        drag.current = null;
        t.dragging.current = false;
      }}
      bar={
        <span className="fig__readout" aria-live="polite">
          <span>
            δ = {fmt.degrees(variant === 'load' ? Math.abs(delta) : delta)} · P = {fmt.power(Math.abs(op.p), 'W')}
          </span>
          <span className="dim">
            {variant === 'motorGen'
              ? mode === 'none'
                ? d.essay.motorGen.none
                : `${mode === 'motor' ? d.essay.motorGen.motor : d.essay.motorGen.generator} · ${flow}`
              : d.essay.motorGen.motor + ' · ' + flow}
          </span>
        </span>
      }
    />
  );
}
