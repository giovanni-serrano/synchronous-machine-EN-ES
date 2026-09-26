import { describe, it } from 'vitest';
import { PHASE_AXES, airGapFluxDensity, sinusoidalGapField, statorField } from '../src/physics';
import { statorGapField } from '../src/essay/figures/fieldModel';
import { expectRel } from './helpers';

const ALL = { a: true, b: true, c: true } as const;

describe('essay figures draw the model’s air-gap field', () => {
  it('three coils on: B_r(θ) is exactly airGapFluxDensity, peak 1.5 at angle ωt (a turning two-pole magnet)', () => {
    for (let k = 0; k < 24; k++) {
      const wt = (2 * Math.PI * k) / 24;
      const f = statorGapField(wt, ALL);
      expectRel(f.amp, 1.5, 1e-12);
      expectRel(Math.cos(f.axis - wt), 1, 1e-12);
      for (let j = 0; j < 36; j++) {
        const th = (2 * Math.PI * j) / 36;
        expectRel(f.at(th), airGapFluxDensity(th, wt, 2), 1e-12, 1e-12);
      }
      // the S face (peak outward flux) is where the stator field vector points
      const net = statorField(wt).net;
      expectRel(Math.cos(f.axis - Math.atan2(net.im, net.re)), 1, 1e-12);
    }
  });

  it('one coil: the lobes pulse on the coil axis without turning; size = |i|', () => {
    for (let k = 0; k < 24; k++) {
      const wt = (2 * Math.PI * k) / 24 + 0.01;
      const i = Math.cos(wt);
      const f = statorGapField(wt, { a: true, b: false, c: false });
      expectRel(f.amp, Math.abs(i), 1e-12, 1e-12);
      expectRel(Math.abs(Math.sin(f.axis - PHASE_AXES.a)), 0, 0, 1e-9); // on the axis (either direction)
      expectRel(f.at(0.3), sinusoidalGapField(0.3, PHASE_AXES.a, 2, i), 1e-12, 1e-12);
    }
  });

  it('the fade-in envelope scales the field linearly', () => {
    expectRel(statorGapField(0.7, ALL, 0.4).amp, 0.6, 1e-12);
  });
});
