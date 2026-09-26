import { describe, expect, it } from 'vitest';
import { deriveRatings, presentOperatingPoint, solveMachine, withSignedPower, type Convention } from '../src/physics';
import { overlapArea, type Box } from '../src/ui/labelLayout';
import { PH_H, PH_ORIGIN, PH_W, phasorLayout, type AngleArc } from '../src/ui/phasor/phasorLayout';
import { M, inputs } from './helpers';

const R = deriveRatings(M);
const TEXT = { vPhi: 'V_φ', eA: 'E_A', iA: 'I_A', jx: 'jX_S I_A', delta: 'δ', theta: 'θ' };
const SHOW = { vPhi: true, eA: true, iA: true, jx: true, names: true, angles: true };

/** Stable operating points over the slider range, with automatic and both locked drawing conventions. */
function* cases() {
  for (const lock of [null, 'generator', 'motor'] as const)
    for (let p = -150_000; p <= 150_000; p += 10_000)
      for (let iF = 0; iF <= 10; iF += 0.5) {
        const s = solveMachine(M, withSignedPower(inputs({ iF }), p));
        if (!s.op) continue;
        const drawing: Convention = lock ?? s.convention;
        yield { id: `${lock ?? 'auto'} P=${p} IF=${iF}`, s, pr: presentOperatingPoint(s.op, s.convention, drawing) };
      }
}

const arcDistance = (arc: AngleArc, b: Box) => {
  let best = Infinity;
  for (let k = 0; k <= 24; k++) {
    const a = arc.from + ((arc.to - arc.from) * k) / 24;
    best = Math.min(best, Math.hypot(PH_ORIGIN.x + arc.r * Math.cos(a) - b.x, PH_ORIGIN.y + arc.r * Math.sin(a) - b.y));
  }
  return best;
};

describe('phasor diagram geometry (brief §5.12)', () => {
  it('V_φ horizontal; the jX_S I_A arrow closes the Chapman equation tip-to-tail and is perpendicular to I_A', () => {
    let n = 0;
    for (const { id, pr } of cases()) {
      n++;
      const l = phasorLayout(pr, R.vPhiRated, R.iRated, pr.modeConvention, SHOW, TEXT);
      const { vPhi, eA, iA, jx } = l.vectors;
      expect(vPhi.to.y, id).toBeCloseTo(PH_ORIGIN.y, 9);
      expect(vPhi.to.x, id).toBeGreaterThan(PH_ORIGIN.x);
      const [tail, head] = pr.drawingConvention === 'generator' ? [vPhi.to, eA.to] : [eA.to, vPhi.to];
      expect(jx.from.x, id).toBeCloseTo(tail.x, 6);
      expect(jx.from.y, id).toBeCloseTo(tail.y, 6);
      expect(jx.to.x, id).toBeCloseTo(head.x, 6);
      expect(jx.to.y, id).toBeCloseTo(head.y, 6);
      const ix = iA.to.x - iA.from.x;
      const iy = iA.to.y - iA.from.y;
      const jxx = jx.to.x - jx.from.x;
      const jxy = jx.to.y - jx.from.y;
      const norm = Math.hypot(ix, iy) * Math.hypot(jxx, jxy);
      if (norm > 1) expect(Math.abs(ix * jxx + iy * jxy) / norm, id).toBeLessThan(1e-9);
    }
    expect(n).toBeGreaterThan(1000);
  });

  it('labels never overlap each other or any arrow, stay inside the plot, and θ / δ sit next to their arcs', () => {
    for (const { id, pr } of cases()) {
      const l = phasorLayout(pr, R.vPhiRated, R.iRated, pr.modeConvention, SHOW, TEXT);
      const boxes = [...l.labels.entries()] as Array<[string, Box]>;
      expect(boxes.length, id).toBe(4 + (l.delta ? 1 : 0) + (l.theta ? 1 : 0));
      for (let a = 0; a < boxes.length; a++) {
        const [na, ba] = boxes[a]!;
        expect(ba.x - ba.w / 2 >= 0 && ba.x + ba.w / 2 <= PH_W && ba.y - ba.h / 2 >= 0 && ba.y + ba.h / 2 <= PH_H, `${id}: ${na} inside`).toBe(true);
        for (let b = a + 1; b < boxes.length; b++) expect(overlapArea(ba, boxes[b]![1]), `${id}: ${na} × ${boxes[b]![0]}`).toBe(0);
        for (const o of l.obstacles) expect(overlapArea(ba, o), `${id}: ${na} × arrow/axis`).toBe(0);
      }
      if (l.delta) expect(arcDistance(l.delta, l.labels.get('delta')!), `${id}: δ near its arc`).toBeLessThanOrEqual(50);
      if (l.theta) expect(arcDistance(l.theta, l.labels.get('theta')!), `${id}: θ near its arc`).toBeLessThanOrEqual(50);
    }
  }, 20_000); // large sweep: ~3,800 layouts

  it('θ is drawn only in the convention of the active mode (PF is defined there)', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 60_000, iF: 7 }));
    const own = phasorLayout(presentOperatingPoint(s.op!, 'motor'), R.vPhiRated, R.iRated, 'motor', SHOW, TEXT);
    const locked = phasorLayout(presentOperatingPoint(s.op!, 'motor', 'generator'), R.vPhiRated, R.iRated, 'motor', SHOW, TEXT);
    expect(own.theta).not.toBeNull();
    expect(locked.theta).toBeNull();
  });

  it('the scale only steps down when a phasor would leave the plot', () => {
    const small = solveMachine(M, inputs({ mode: 'generator', load: 30_000, iF: 5 }));
    const big = solveMachine(M, inputs({ mode: 'generator', load: 150_000, iF: 10 }));
    const lSmall = phasorLayout(presentOperatingPoint(small.op!, 'generator'), R.vPhiRated, R.iRated, 'generator', SHOW, TEXT);
    const lBig = phasorLayout(presentOperatingPoint(big.op!, 'generator'), R.vPhiRated, R.iRated, 'generator', SHOW, TEXT);
    expect(lSmall.step).toBe(1);
    expect(lBig.step).toBeLessThan(1);
  });
});
