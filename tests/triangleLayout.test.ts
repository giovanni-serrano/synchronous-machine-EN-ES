import { describe, expect, it } from 'vitest';
import { createFormatter } from '../src/format/format';
import { DICTIONARIES, LANGS } from '../src/i18n';
import { SCENARIOS, powerTriangle, scenarioInputs, solveMachine, withSignedPower, type PowerTriangle } from '../src/physics';
import { overlapArea, type Box } from '../src/ui/labelLayout';
import { triangleTexts } from '../src/ui/power/PowerTriangle';
import { TRI_H, TRI_W, triangleLayout } from '../src/ui/power/triangleLayout';
import { M, inputs } from './helpers';

/** Every stable operating point reachable with the lab's sliders (coarse grid) plus scenarios A–G. */
function* triangles(): Generator<{ id: string; tri: PowerTriangle }> {
  for (let p = -150_000; p <= 150_000; p += 10_000)
    for (let iF = 0; iF <= 10; iF += 0.5) {
      const s = solveMachine(M, withSignedPower(inputs({ iF }), p));
      if (s.op) yield { id: `P=${p}/IF=${iF}`, tri: powerTriangle(s.op, s.convention) };
    }
  for (const def of SCENARIOS) {
    const s = solveMachine(M, scenarioInputs(M, def));
    if (s.op) yield { id: def.id, tri: powerTriangle(s.op, s.convention) };
  }
}

describe('power triangle layout (legibility)', () => {
  for (const lang of LANGS)
    it(`${lang}: labels never overlap each other or the drawn segments, and stay inside the plot`, () => {
      const fmt = createFormatter(lang);
      let n = 0;
      for (const { id, tri } of triangles()) {
        n++;
        const text = triangleTexts(tri, M.ratedS, fmt, DICTIONARIES[lang].powers.rated);
        const l = triangleLayout(tri.p / M.ratedS, tri.q / M.ratedS, text);
        const boxes = [...l.labels.entries()] as Array<[string, Box]>;
        expect(boxes.length, id).toBe(l.theta ? 5 : 4);
        for (let a = 0; a < boxes.length; a++) {
          const [na, ba] = boxes[a]!;
          expect(ba.x - ba.w / 2, `${id}: ${na} left`).toBeGreaterThanOrEqual(0);
          expect(ba.x + ba.w / 2, `${id}: ${na} right`).toBeLessThanOrEqual(TRI_W);
          expect(ba.y - ba.h / 2, `${id}: ${na} top`).toBeGreaterThanOrEqual(0);
          expect(ba.y + ba.h / 2, `${id}: ${na} bottom`).toBeLessThanOrEqual(TRI_H);
          for (let b = a + 1; b < boxes.length; b++) expect(overlapArea(ba, boxes[b]![1]), `${id}: ${na} × ${boxes[b]![0]}`).toBe(0);
          for (const o of l.obstacles) expect(overlapArea(ba, o), `${id}: ${na} × segment/axis`).toBe(0);
        }
      }
      expect(n).toBeGreaterThan(300);
    });

  it('fixed scale while the triangle fits; zooms out ×½ only when it would leave the plot', () => {
    const t = (p: number, q: number) => triangleLayout(p, q, { p: 'P', q: 'Q', s: 'S', theta: 'θ', rated: 'S' });
    expect(t(1, 0.5).zoomedOut).toBe(false);
    expect(t(1, -1.5).zoomedOut).toBe(false);
    expect(t(1, 1.7).zoomedOut).toBe(true);
    expect(t(1, 0.5).scale).toBe(2 * t(1, 1.7).scale);
  });
});
