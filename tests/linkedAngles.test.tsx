import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { machineSnapshot } from '../src/animation/snapshot';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { deriveRatings, powerTriangle, presentOperatingPoint, solveMachine } from '../src/physics';
import { ElectricalSumInset } from '../src/ui/machine/ElectricalSumInset';
import { MachineView } from '../src/ui/machine/MachineView';
import { PhasorDiagram } from '../src/ui/phasor/PhasorDiagram';
import { PowerTriangle } from '../src/ui/power/PowerTriangle';
import type { AngleLink } from '../src/ui/svg/LinkedArc';
import { M, inputs } from './helpers';

const R = deriveRatings(M);
// Over-excited motor: θ ≠ 0 and δ ≠ 0, so every arc is drawn.
const state = solveMachine(M, inputs({ mode: 'motor', load: 80_000, iF: 8 }));
const pr = presentOperatingPoint(state.op!, state.convention);
const tri = powerTriangle(state.op!, state.convention);
const snap = machineSnapshot(M, state, 0)!;
const SHOW = { bR: true, bS: true, bNet: true, sum: true, delta: true, flux: false, axes: false };
const PSHOW = { vPhi: true, eA: true, iA: true, jx: true, names: true, angles: true };

const html = (el: ReactElement) => renderToString(<I18nProvider initialLang="en">{el}</I18nProvider>);
const hot = (s: string) => (s.match(/linked-arc is-hot/g) ?? []).length;
const arcs = (s: string) => (s.match(/class="linked-arc/g) ?? []).length;

const views = (link: AngleLink) => ({
  phasor: html(<PhasorDiagram pr={pr} modeConvention={state.convention} vPhiRated={R.vPhiRated} iRated={R.iRated} show={PSHOW} zoom={1} link={link} onLink={() => {}} />),
  triangle: html(<PowerTriangle tri={tri} ratedS={M.ratedS} link={link} onLink={() => {}} />),
  machine: html(<MachineView snap={snap} poles={4} show={SHOW} highlight={null} onHighlight={() => {}} link={link} onLink={() => {}} />),
  inset: html(<ElectricalSumInset snap={snap} link={link} onLink={() => {}} />),
});

describe('linked angle highlights (brief §5.12)', () => {
  it('every view draws its linkable arcs: phasors θ and δ, triangle θ, machine δ, inset δ', () => {
    const v = views(null);
    expect(arcs(v.phasor)).toBe(2);
    expect(arcs(v.triangle)).toBe(1);
    expect(arcs(v.machine)).toBe(1);
    expect(arcs(v.inset)).toBe(1);
    expect(hot(v.phasor + v.triangle + v.machine + v.inset)).toBe(0);
  });

  it('θ lights up in the phasor diagram and the triangle, and nowhere else', () => {
    const v = views('theta');
    expect(hot(v.phasor)).toBe(1);
    expect(hot(v.triangle)).toBe(1);
    expect(hot(v.machine) + hot(v.inset)).toBe(0);
  });

  it('δ lights up in the phasor diagram, the cross-section and the electrical inset, not in the triangle', () => {
    const v = views('delta');
    expect(hot(v.phasor)).toBe(1);
    expect(hot(v.machine)).toBe(1);
    expect(hot(v.inset)).toBe(1);
    expect(hot(v.triangle)).toBe(0);
  });
});
