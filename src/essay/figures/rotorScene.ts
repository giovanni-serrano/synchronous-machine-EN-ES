/**
 * Shared scene for §5–§7 (two poles): the net air-gap field B_net drawn as a magnet in white (the grid holds it),
 * a salient rotor whose N pole carries B_R (orange), their arrows, the angle δ between them and the "magnetic spring"
 * (star moment 3): field lines stretched between the rotor's poles and the field's opposite faces, whose tension follows
 * |sin δ| — the torque. Vectors come from the model: operatingPointAtDelta() → fieldVectors().
 */

import {
  REFERENCE_MACHINE,
  deriveRatings,
  fieldVectors,
  operatingPointAtDelta,
  scenarioById,
  scenarioInputs,
  solveMachine,
  synchronousReactance,
  type OperatingPoint,
} from '../../physics';
import { arrow, label, magnetField, poleLetters, pt, salientRotor, statorIron, type StatorGeom } from '../canvas/draw';
import { CONCEPT, INK, alpha } from '../theme';
import type { SceneLayout } from './statorScene';

const M = REFERENCE_MACHINE;
const R = deriveRatings(M);
/** The essay's operating excitation: scenario A (full load at unity PF) — E_A = 367 V. */
export const ESSAY_EA = solveMachine(M, scenarioInputs(M, scenarioById('A'))).eA;
export const ESSAY_VPHI = R.vPhiRated;
export const ESSAY_XS = synchronousReactance(M, M.ratedF);
export const ESSAY_PMAX = (3 * ESSAY_VPHI * ESSAY_EA) / ESSAY_XS;

/** Operating point at a signed torque angle δ (internal convention: > 0 generator, < 0 motor). */
export const opAt = (delta: number): OperatingPoint =>
  operatingPointAtDelta(ESSAY_VPHI, ESSAY_EA, ESSAY_XS, delta, (2 * Math.PI * 1800) / 60);

export interface RotorSceneState {
  /** Electrical angle ωt of the rotating frame. */
  readonly wt: number;
  /** Signed torque angle, internal convention (δ > 0: rotor ahead of the field). */
  readonly delta: number;
  /** Show the B_net / B_R arrows and the δ arc. */
  readonly vectors: boolean;
  /** Draw the stretched field lines between rotor and field. */
  readonly springs: boolean;
}

export interface RotorGeometry {
  /** Mechanical = electrical angles (two poles). */
  readonly netAngle: number;
  readonly rotorAngle: number;
  readonly rotorRadius: number;
}

export function rotorGeometry(g: StatorGeom, s: Pick<RotorSceneState, 'wt' | 'delta'>): RotorGeometry & { bR: number; bNet: number } {
  const fv = fieldVectors(opAt(s.delta), ESSAY_VPHI, 1);
  const netAngle = Math.atan2(fv.bNet.im, fv.bNet.re) + s.wt;
  const rotorAngle = Math.atan2(fv.bR.im, fv.bR.re) + s.wt;
  return {
    netAngle,
    rotorAngle,
    // the air gap is exaggerated (rotor at 80 % of the bore) so the stretched field lines can be seen
    rotorRadius: g.rb * 0.8,
    bR: Math.hypot(fv.bR.re, fv.bR.im),
    bNet: Math.hypot(fv.bNet.re, fv.bNet.im),
  };
}

/** Field lines from the rotor's pole faces to the field's opposite faces; tension ∝ |sin δ|. */
function springs(ctx: CanvasRenderingContext2D, g: StatorGeom, rg: RotorGeometry, delta: number) {
  const tension = Math.abs(Math.sin(delta));
  ctx.save();
  ctx.lineCap = 'round';
  for (const flip of [0, Math.PI]) {
    for (const o of [-0.34, -0.12, 0.12, 0.34]) {
      const [x0, y0] = pt(g.cx, g.cy, rg.rotorRadius * 0.99, rg.rotorAngle + flip + o);
      const [x1, y1] = pt(g.cx, g.cy, g.rb * 0.99, rg.netAngle + flip + o * 0.8);
      const mid = (rg.rotorAngle + rg.netAngle) / 2 + flip + o * 0.9;
      const [qx, qy] = pt(g.cx, g.cy, (rg.rotorRadius + g.rb) / 2, mid);
      const width = 1.8 + 2.4 * tension;
      // dark underlay so the white line reads over the white field glow
      ctx.strokeStyle = alpha(INK.bg, 0.75);
      ctx.lineWidth = width + 3;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(qx, qy, x1, y1);
      ctx.stroke();
      ctx.strokeStyle = alpha(CONCEPT.net, 0.35 + 0.6 * tension);
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawRotorScene(ctx: CanvasRenderingContext2D, L: SceneLayout, s: RotorSceneState, deltaLabel: string) {
  const { g } = L;
  const rg = rotorGeometry(g, s);
  statorIron(ctx, g);
  const letterSize = Math.max(16, g.ro * 0.1);
  const net = { amp: rg.bNet, axis: rg.netAngle, at: (th: number) => rg.bNet * Math.cos(th - rg.netAngle) };
  magnetField(ctx, g, net, CONCEPT.net, 1.0, { letters: false, lines: false, strength: 0.6 });
  salientRotor(ctx, g.cx, g.cy, rg.rotorRadius, rg.rotorAngle, { letters: true, letterSize: letterSize * 0.9 });
  // the field's N and S on the stator iron, just outside the bore (the rotor would hide them inside)
  poleLetters(ctx, g, net, 1.0, { radius: g.rb + (g.ro - g.rb) * 0.3, size: letterSize });
  if (s.springs) springs(ctx, g, rg, s.delta);
  if (s.vectors) {
    const k = g.rb * 0.42;
    const w = Math.max(5, g.ro * 0.035);
    const [nx, ny] = pt(g.cx, g.cy, k * rg.bNet, rg.netAngle);
    const [rx, ry] = pt(g.cx, g.cy, k * rg.bR, rg.rotorAngle);
    // δ arc between B_R and B_net
    if (Math.abs(s.delta) > 0.02) {
      const r = g.rb * 0.64; // beyond both arrow tips
      ctx.save();
      ctx.strokeStyle = '#e8b04a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, r, -rg.rotorAngle, -rg.netAngle, rg.netAngle > rg.rotorAngle);
      ctx.stroke();
      ctx.restore();
      if (Math.abs(s.delta) > 0.21) {
        const [lx, ly] = pt(g.cx, g.cy, r - Math.max(15, g.ro * 0.085), (rg.rotorAngle + rg.netAngle) / 2);
        label(ctx, deltaLabel, lx, ly, Math.max(16, g.ro * 0.1), { color: '#e8b04a', italic: true });
      }
    }
    arrow(ctx, g.cx, g.cy, nx, ny, CONCEPT.net, w, { glow: 0.7 });
    arrow(ctx, g.cx, g.cy, rx, ry, CONCEPT.rotor, w, { glow: 0.9 });
  }
  ctx.fillStyle = INK.textFaint;
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, 3.5, 0, 2 * Math.PI);
  ctx.fill();
  return rg;
}
