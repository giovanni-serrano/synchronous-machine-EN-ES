/**
 * Shared scene for the stator figures (hook, §2 one coil, §3 three coils). All physics comes from
 * src/physics/rotatingField.ts: phase axes, winding conductor positions (dot = current out of the page for a positive
 * current on the "go" side), phase currents cos(ωt − axis) and the sinusoidal air-gap field.
 */

import { PHASE_AXES, windingConductors, type PhaseId } from '../../physics';
import { INK, PHASE_COLOR, alpha } from '../theme';
import { conductor, coilPlane, label, pt, type StatorGeom } from '../canvas/draw';

export interface SceneLayout {
  readonly g: StatorGeom;
  /** Conductor radius and the radius of the circle they sit on. */
  readonly rc: number;
  readonly rCond: number;
  /** Length of one phase's peak field arrow. */
  readonly unit: number;
  /** Wave strip (null when the figure has none). */
  readonly strip: { readonly x0: number; readonly x1: number; readonly y0: number; readonly y1: number } | null;
}

/** Figure with a wave strip under the machine: box aspect 5 : 6. */
export function layoutWithStrip(w: number): SceneLayout {
  const ro = 0.4 * w;
  const cy = 0.055 * w + ro;
  const rb = 0.285 * w;
  const y0 = cy + ro + 0.085 * w;
  return {
    g: { cx: w / 2, cy, ro, rb },
    rc: 0.034 * w,
    rCond: rb + (ro - rb) * 0.36,
    unit: 0.5 * rb,
    strip: { x0: 0.1 * w, x1: 0.92 * w, y0, y1: y0 + 0.19 * w },
  };
}

/** Square figure, machine only (the hook). */
export function layoutSquare(w: number): SceneLayout {
  const ro = 0.46 * w;
  const rb = 0.33 * w;
  return { g: { cx: w / 2, cy: w / 2, ro, rb }, rc: 0.032 * w, rCond: rb + (ro - rb) * 0.36, unit: 0.46 * rb, strip: null };
}

export const phaseCurrent = (phase: PhaseId, wt: number): number => Math.cos(wt - PHASE_AXES[phase]);

const CONDUCTORS_2P = windingConductors(2);

/** Slot conductors and each coil's plane for the given phases. */
export function winding(
  ctx: CanvasRenderingContext2D,
  L: SceneLayout,
  phases: readonly PhaseId[],
  wt: number,
  enabled: Readonly<Record<PhaseId, boolean>>,
  { planes = true, letters = true, letterSize = 15 }: { planes?: boolean; letters?: boolean; letterSize?: number } = {},
) {
  const { g } = L;
  for (const phase of phases) {
    const on = enabled[phase];
    const color = PHASE_COLOR[phase];
    const cs = CONDUCTORS_2P.filter((c) => c.phase === phase);
    if (planes) {
      const go = cs.find((c) => c.side === 'go')!;
      const ret = cs.find((c) => c.side === 'return')!;
      const [x1, y1] = pt(g.cx, g.cy, L.rCond, go.angle);
      const [x2, y2] = pt(g.cx, g.cy, L.rCond, ret.angle);
      coilPlane(ctx, x1, y1, x2, y2, color, on ? 0.35 : 0.15);
    }
    const i = on ? phaseCurrent(phase, wt) : 0;
    for (const c of cs) {
      const [x, y] = pt(g.cx, g.cy, L.rCond, c.angle);
      conductor(ctx, x, y, L.rc, color, c.side === 'go' ? i : -i, on);
      if (letters) {
        const [lx, ly] = pt(g.cx, g.cy, g.ro + letterSize * 0.95, c.angle);
        label(ctx, c.side === 'go' ? phase : `${phase}′`, lx, ly, letterSize, { color: on ? INK.textDim : INK.textFaint, italic: true });
      }
    }
  }
}

/** Positions of a phase's conductors (for tap hit-testing). */
export function conductorPoints(L: SceneLayout, phase: PhaseId): Array<[number, number]> {
  return CONDUCTORS_2P.filter((c) => c.phase === phase).map((c) => pt(L.g.cx, L.g.cy, L.rCond, c.angle));
}

/** Current waves over one cycle, a cursor at ωt and (optionally) a dot riding one wave. */
export function waveStrip(
  ctx: CanvasRenderingContext2D,
  L: SceneLayout,
  phases: readonly PhaseId[],
  wt: number,
  enabled: Readonly<Record<PhaseId, boolean>>,
  caption: string,
  dotPhase: PhaseId | null,
) {
  const s = L.strip;
  if (!s) return;
  const mid = (s.y0 + s.y1) / 2;
  const amp = (s.y1 - s.y0) / 2 - 4;
  const X = (a: number) => s.x0 + ((s.x1 - s.x0) * a) / (2 * Math.PI);
  ctx.save();
  // zero line
  ctx.strokeStyle = INK.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s.x0, mid);
  ctx.lineTo(s.x1, mid);
  ctx.stroke();
  for (const phase of phases) {
    const on = enabled[phase];
    ctx.strokeStyle = alpha(PHASE_COLOR[phase], on ? 0.95 : 0.3);
    ctx.lineWidth = on ? 3 : 1.5;
    ctx.setLineDash(on ? [] : [4, 5]);
    ctx.beginPath();
    for (let k = 0; k <= 96; k++) {
      const a = (2 * Math.PI * k) / 96;
      const y = mid - amp * phaseCurrent(phase, a);
      if (k === 0) ctx.moveTo(X(a), y);
      else ctx.lineTo(X(a), y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const wrapped = ((wt % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const cx = X(wrapped);
  ctx.strokeStyle = alpha(INK.text, 0.55);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, s.y0 - 6);
  ctx.lineTo(cx, s.y1 + 6);
  ctx.stroke();
  for (const phase of phases) {
    if (!enabled[phase]) continue;
    const y = mid - amp * phaseCurrent(phase, wrapped);
    const r = dotPhase === phase ? 9 : 5;
    if (dotPhase === phase) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = alpha(PHASE_COLOR[phase], 0.25);
      ctx.beginPath();
      ctx.arc(cx, y, r * 2.2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = PHASE_COLOR[phase];
    ctx.strokeStyle = INK.bg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  label(ctx, caption, s.x0, s.y0 - 14, 14, { align: 'left', color: INK.textFaint, italic: true });
}

/** ωt from a pointer x over the strip (clamped to one cycle). */
export function stripAngle(L: SceneLayout, x: number): number {
  const s = L.strip!;
  const f = Math.min(1, Math.max(0, (x - s.x0) / (s.x1 - s.x0)));
  return f * 2 * Math.PI * 0.9999;
}

export const inStrip = (L: SceneLayout, x: number, y: number) =>
  !!L.strip && x >= L.strip.x0 - 24 && x <= L.strip.x1 + 24 && y >= L.strip.y0 - 30 && y <= L.strip.y1 + 30;
