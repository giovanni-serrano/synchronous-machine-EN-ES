import { describe, expect, it } from 'vitest';
import { machineSnapshot } from '../src/animation/snapshot';
import { SCENARIOS, scenarioInputs, solveMachine } from '../src/physics';
import { overlapArea, segmentObstacles, type Box } from '../src/ui/labelLayout';
import { STATOR } from '../src/ui/machine/StatorDrawing';
import { INSET_FRAME, ROTOR, arcGap, insetScale, leaderLine, machineLayout, sumInsetLayout } from '../src/ui/machine/machineLayout';
import { M } from './helpers';

const SHOW = { bR: true, bS: true, bNet: true, sum: true, delta: true };
const DELTA_LABEL_WIDTH = 80; // wider than "δ = 74.7°" (12 + 9 × 7 = 75); "mech." goes on a second line

function* configurations() {
  for (const def of SCENARIOS)
    for (const poles of [2, 4, 6, 8]) {
      const state = solveMachine(M, { ...scenarioInputs(M, def), poles });
      const period = 1 / state.inputs.f; // one electrical cycle covers every relative position
      for (let k = 0; k < 24; k++) {
        const snap = machineSnapshot(M, state, (period * k) / 24)!;
        yield { id: `${def.id}/${poles}p/t${k}`, snap, poles };
      }
    }
}

describe('machine cross-section layout (legibility)', () => {
  it('no label touches another label, a rotor pole letter or a field-winding conductor', () => {
    for (const { id, snap, poles } of configurations()) {
      const layout = machineLayout(snap, poles, SHOW, DELTA_LABEL_WIDTH);
      const labels: Array<[string, Box]> = Object.entries(layout.labels).filter((e): e is [string, Box] => !!e[1]);
      if (layout.delta) labels.push(['delta', layout.delta.label]);
      for (let a = 0; a < labels.length; a++) {
        for (let b = a + 1; b < labels.length; b++)
          expect(overlapArea(labels[a]![1], labels[b]![1]), `${id}: ${labels[a]![0]} × ${labels[b]![0]}`).toBe(0);
        for (const p of layout.poles) {
          expect(overlapArea(labels[a]![1], p.letter), `${id}: ${labels[a]![0]} × pole ${p.kind}`).toBe(0);
          for (const c of [p.coilOut, p.coilIn])
            expect(overlapArea(labels[a]![1], { x: c[0], y: c[1], w: 10, h: 10 }), `${id}: ${labels[a]![0]} × field coil`).toBe(0);
        }
      }
    }
  });

  it('labels also keep clear of the arrow shafts', () => {
    for (const { id, snap, poles } of configurations()) {
      const layout = machineLayout(snap, poles, SHOW, DELTA_LABEL_WIDTH);
      const shafts = Object.values(layout.vectors)
        .filter((v): v is { x1: number; y1: number; x2: number; y2: number } => typeof v === 'object')
        .flatMap((s) => segmentObstacles(s.x1, s.y1, s.x2, s.y2));
      const labels = [...Object.values(layout.labels), layout.delta?.label].filter((b): b is Box => !!b);
      for (const l of labels) for (const s of shafts) expect(overlapArea(l, s), id).toBe(0);
    }
  });

  it('B_net reaches the pole shoes, true ratios are kept, and no arrow passes the stator bore', () => {
    const len = (v: { x1: number; y1: number; x2: number; y2: number }) => Math.hypot(v.x2 - v.x1, v.y2 - v.y1);
    for (const { snap, poles } of configurations()) {
      const { bR, bS, bNet } = machineLayout(snap, poles, SHOW, DELTA_LABEL_WIDTH).vectors;
      expect(len(bNet)).toBeGreaterThan(ROTOR.shoeIn - 10);
      expect(len(bR) / len(bNet)).toBeCloseTo(snap.magnitude.bR / snap.magnitude.bNet, 9);
      expect(len(bS) / len(bNet)).toBeCloseTo(snap.magnitude.bS / snap.magnitude.bNet, 9);
      for (const v of [bR, bNet]) expect(len(v)).toBeLessThan(STATOR.rBore);
    }
  });

  it('even at the top of the excitation range (E_A = 2 pu) B_R stays inside the bore', () => {
    const state = solveMachine(M, { ...scenarioInputs(M, SCENARIOS[4]!), iF: M.ifMax });
    const snap = machineSnapshot(M, state, 0)!;
    const { bR } = machineLayout(snap, 4, SHOW, DELTA_LABEL_WIDTH).vectors;
    expect(Math.hypot(bR.x2, bR.y2)).toBeLessThan(STATOR.rBore);
  });

  it('the δ label stays near its arc, and a leader line joins them whenever it had to move away', () => {
    // With 6–8 poles B_net, B_R and B_S form a narrow fan around the arc, so the nearest spot that covers no arrow
    // can be ~50 px away; the leader line keeps the label attached to its arc.
    for (const { id, snap, poles } of configurations()) {
      const d = machineLayout(snap, poles, SHOW, DELTA_LABEL_WIDTH).delta;
      if (!d) continue;
      const near = arcGap(d, d.label); // distance to the nearest point of the arc
      expect(near.gap, id).toBeLessThanOrEqual(60);
      if (near.gap > 20) expect(leaderLine(d.label, near.x, near.y), id).not.toBeNull();
    }
  });

  it('the δ arc is large enough to see', () => {
    for (const { snap, poles } of configurations()) {
      const d = machineLayout(snap, poles, SHOW, DELTA_LABEL_WIDTH).delta;
      if (d) expect(d.r).toBeGreaterThanOrEqual(36);
    }
  });
});

describe('electrical-sum inset (4+ poles)', () => {
  it('B_R + B_S ends exactly at the tip of B_net (tip-to-tail, electrical degrees)', () => {
    for (const { snap } of configurations()) {
      const l = sumInsetLayout(snap, DELTA_LABEL_WIDTH);
      expect(l.bS.x2).toBeCloseTo(l.bNet.x2, 9);
      expect(l.bS.y2).toBeCloseTo(l.bNet.y2, 9);
    }
  });

  it('its labels do not touch each other nor the arrows', () => {
    for (const { id, snap } of configurations()) {
      const l = sumInsetLayout(snap, DELTA_LABEL_WIDTH);
      const labels = [l.labels.bR, l.labels.bS, l.labels.bNet, ...(l.delta ? [l.delta.label] : [])];
      const shafts = [l.bR, l.bS, l.bNet].flatMap((s) => segmentObstacles(s.x1, s.y1, s.x2, s.y2));
      for (let a = 0; a < labels.length; a++) {
        for (let b = a + 1; b < labels.length; b++) expect(overlapArea(labels[a]!, labels[b]!), id).toBe(0);
        for (const s of shafts) expect(overlapArea(labels[a]!, s), id).toBe(0);
      }
    }
  });
});

describe('electrical-sum inset frame', () => {
  it('the figure fills a good part of the frame and never leaves it', () => {
    for (const { snap } of configurations()) {
      const l = sumInsetLayout(snap, DELTA_LABEL_WIDTH);
      const reach = Math.max(Math.hypot(l.bR.x2, l.bR.y2), Math.hypot(l.bNet.x2, l.bNet.y2));
      expect(reach).toBeGreaterThan(0.6 * INSET_FRAME);
      expect(reach).toBeLessThan(INSET_FRAME);
      expect(insetScale(snap)).toBeGreaterThan(0);
    }
  });

  it('every label lies fully inside the frame', () => {
    for (const { id, snap } of configurations()) {
      const l = sumInsetLayout(snap, DELTA_LABEL_WIDTH);
      const r = INSET_FRAME;
      for (const b of [l.labels.bR, l.labels.bS, l.labels.bNet, ...(l.delta ? [l.delta.label] : [])]) {
        expect(Math.abs(b.x) + b.w / 2, id).toBeLessThanOrEqual(r);
        expect(Math.abs(b.y) + b.h / 2, id).toBeLessThanOrEqual(r);
      }
    }
  });
});
