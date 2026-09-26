/**
 * 2.5D cross-section of the whole machine (brief §6): stator with coils and their currents, net air-gap flux,
 * rotor with field winding and poles, shaft, and the space vectors B_R, B_S, B_net with the angle δ between
 * B_R and B_net (mechanical degrees). Reads only MachineSnapshot; geometry and label positions come from
 * machineLayout (pure, tested for overlaps).
 *
 * Poles are drawn salient for clarity; the model is a cylindrical rotor (the UI says so).
 * The stator dots/crosses show the PHYSICAL current (snapshot.currents) — they never depend on the sign
 * convention used to present I_A.
 */

import { sinusoidalGapField, type PhaseId } from '../../physics';
import type { MachineSnapshot } from '../../animation/snapshot';
import { useI18n } from '../../i18n/I18nProvider';
import type { Box } from '../labelLayout';
import { SvgSymbolText } from '../SymbolText';
import { Arrow, polarXY } from '../svg/Arrow';
import { LinkedArc, type AngleLink } from '../svg/LinkedArc';
import { COLORS } from '../theme';
import { GAP_MID, ROTOR, arcGap, leaderLine, machineLayout, rotorXY, type Segment } from './machineLayout';
import { CoilAxesLayer, STATOR, StatorCoreAndCoils } from './StatorDrawing';

const FLUX_PX_PER_PU = 13;
const FLUX_SAMPLES = 72;
const ROTOR_STEEL = '#353d47';
const ROTOR_EDGE = '#4b5663';
const ALL_PHASES: Record<PhaseId, boolean> = { a: true, b: true, c: true };
/** Rough width of the δ label text at 12 px (used only to reserve room for it). */
const deltaLabelWidth = (text: string) => 12 + text.length * 7;

export interface MachineShow {
  readonly bR: boolean;
  readonly bS: boolean;
  readonly bNet: boolean;
  readonly sum: boolean;
  readonly delta: boolean;
  readonly flux: boolean;
  readonly axes: boolean;
}

const rot = rotorXY;

function RotorPole({
  phi,
  halfWidth,
  shoeHalfAngle,
  coilOut,
  coilIn,
}: {
  phi: number;
  halfWidth: number;
  shoeHalfAngle: number;
  coilOut: readonly [number, number];
  coilIn: readonly [number, number];
}) {
  const { shoeIn, shoeOut, bodyIn } = ROTOR;
  const steps = 14;
  // Body (rectangle) + shoe (annular sector) as one outline.
  const outline: Array<[number, number]> = [
    rot(bodyIn, -halfWidth, phi),
    rot(shoeIn, -halfWidth, phi),
    rot(shoeIn * Math.cos(shoeHalfAngle), -shoeIn * Math.sin(shoeHalfAngle), phi),
  ];
  for (let k = 0; k <= steps; k++) {
    const a = -shoeHalfAngle + (2 * shoeHalfAngle * k) / steps;
    outline.push(rot(shoeOut * Math.cos(a), shoeOut * Math.sin(a), phi));
  }
  outline.push(
    rot(shoeIn * Math.cos(shoeHalfAngle), shoeIn * Math.sin(shoeHalfAngle), phi),
    rot(shoeIn, halfWidth, phi),
    rot(bodyIn, halfWidth, phi),
  );
  const d = `M${outline.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L')} Z`;

  // Field-winding coil sides (positions from machineLayout, right-hand rule applied there).
  const [ox, oy] = coilOut;
  const [ix, iy] = coilIn;

  return (
    <g>
      <path d={d} fill={ROTOR_STEEL} stroke={ROTOR_EDGE} strokeWidth={1.2} />
      <circle cx={ox} cy={oy} r={4.2} fill={COLORS.surface} stroke={COLORS.eA} strokeWidth={1.2} />
      <circle cx={ox} cy={oy} r={1.5} fill={COLORS.ink} />
      <circle cx={ix} cy={iy} r={4.2} fill={COLORS.surface} stroke={COLORS.eA} strokeWidth={1.2} />
      <g stroke={COLORS.ink} strokeWidth={1.2} strokeLinecap="round">
        <line x1={ix - 2.2} y1={iy - 2.2} x2={ix + 2.2} y2={iy + 2.2} />
        <line x1={ix - 2.2} y1={iy + 2.2} x2={ix + 2.2} y2={iy - 2.2} />
      </g>
    </g>
  );
}

export function arcPath(r: number, from: number, to: number): string {
  const [x1, y1] = polarXY(r, from);
  const [x2, y2] = polarXY(r, to);
  const ccw = to > from; // counterclockwise in math terms = sweep-flag 0 in SVG (y down)
  const large = Math.abs(to - from) > Math.PI ? 1 : 0;
  return `M${x1},${y1} A${r},${r} 0 ${large} ${ccw ? 0 : 1} ${x2},${y2}`;
}

/** Thin leader from the nearest point of the arc to its label, drawn only when the label had to move away. */
export function DeltaLeader({ delta }: { delta: { r: number; from: number; to: number; label: Box } }) {
  const near = arcGap(delta, delta.label);
  const l = leaderLine(delta.label, near.x, near.y);
  return l ? <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={COLORS.accent} strokeWidth={1} strokeOpacity={0.7} /> : null;
}

export const LabelAt = ({ box, text, strong = true }: { box: Box | undefined; text: string; strong?: boolean }) =>
  box ? (
    <text x={box.x} y={box.y} className={strong ? 'svg-label svg-label--strong' : 'svg-label'} textAnchor="middle" dominantBaseline="central">
      <SvgSymbolText text={text} />
    </text>
  ) : null;

const VectorArrow = ({ s, color, width, dashed = false }: { s: Segment; color: string; width: number; dashed?: boolean }) => (
  <Arrow x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} color={color} width={width} head={13} dashed={dashed} />
);

export function MachineView({
  snap,
  poles,
  show,
  highlight,
  onHighlight,
  link = null,
  onLink = () => {},
}: {
  snap: MachineSnapshot;
  poles: number;
  show: MachineShow;
  highlight: PhaseId | null;
  onHighlight(phase: PhaseId | null): void;
  link?: AngleLink;
  onLink?(link: AngleLink): void;
}) {
  const { d, fmt } = useI18n();
  const deltaValue = `δ = ${fmt.degrees(Math.abs(snap.deltaMech))}`;
  const layout = machineLayout(snap, poles, show, deltaLabelWidth(deltaValue));
  const { bR, bS, bNet, sChained } = layout.vectors;

  const [ra0x, ra0y] = polarXY(STATOR.rOut + 12, 0.84);
  const [rtx, rty] = polarXY(STATOR.rOut + 12, 0.97);

  return (
    <svg viewBox="-215 -215 430 430" className="machine" role="img" aria-label={d.machineLab.viewTitle}>
      <StatorCoreAndCoils poles={poles} currents={snap.currents} visible={ALL_PHASES} highlight={highlight} onHighlight={onHighlight} />
      {show.axes && <CoilAxesLayer poles={poles} visible={ALL_PHASES} highlight={highlight} />}

      {/* Net air-gap flux (outward = into the stator) */}
      {show.flux &&
        Array.from({ length: FLUX_SAMPLES }, (_, k) => {
          const theta = (2 * Math.PI * k) / FLUX_SAMPLES;
          const b = sinusoidalGapField(theta, snap.elec.bNet, poles, snap.magnitude.bNet);
          const len = b * FLUX_PX_PER_PU;
          const [xa, ya] = polarXY(GAP_MID - len / 2, theta);
          const [xb, yb] = polarXY(GAP_MID + len / 2, theta);
          return <Arrow key={k} x1={xa} y1={ya} x2={xb} y2={yb} color={COLORS.vPhi} width={1.5} head={4.5} opacity={0.25 + 0.5 * Math.min(1, Math.abs(b))} />;
        })}

      {/* Rotor */}
      {layout.poles.map((p, k) => (
        <RotorPole key={k} phi={p.phi} halfWidth={layout.halfWidth} shoeHalfAngle={layout.shoeHalfAngle} coilOut={p.coilOut} coilIn={p.coilIn} />
      ))}
      <circle r={ROTOR.hub} fill={ROTOR_STEEL} stroke={ROTOR_EDGE} strokeWidth={1.2} />
      <circle r={ROTOR.shaft} fill="#1b2027" stroke={ROTOR_EDGE} />
      {/* keyway marks the shaft's rotation */}
      <line
        x1={polarXY(ROTOR.shaft - 6, snap.mech.bR + Math.PI / 2)[0]}
        y1={polarXY(ROTOR.shaft - 6, snap.mech.bR + Math.PI / 2)[1]}
        x2={polarXY(ROTOR.shaft, snap.mech.bR + Math.PI / 2)[0]}
        y2={polarXY(ROTOR.shaft, snap.mech.bR + Math.PI / 2)[1]}
        stroke={COLORS.inkDim}
        strokeWidth={2}
      />

      {/* δ between B_net and B_R, mechanical: arc under the vectors, label placed clear of everything */}
      {show.delta && layout.delta && (
        <LinkedArc d={arcPath(layout.delta.r, layout.delta.from, layout.delta.to)} id="delta" link={link} onLink={onLink} label={d.machineLab.deltaAria} width={2.6}>
          <DeltaLeader delta={layout.delta} />
          <text x={layout.delta.label.x} y={layout.delta.label.y - 6} className="svg-label svg-label--delta" textAnchor="middle" dominantBaseline="central">
            {deltaValue}
          </text>
          <text x={layout.delta.label.x} y={layout.delta.label.y + 8} className="svg-tick svg-tick--delta" textAnchor="middle" dominantBaseline="central">
            {d.machineLab.mechanicalShort}
          </text>
        </LinkedArc>
      )}

      {/* Space vectors */}
      {show.bNet && <VectorArrow s={bNet} color={COLORS.vPhi} width={4.4} />}
      {show.bR && <VectorArrow s={bR} color={COLORS.eA} width={4.4} />}
      {show.bS && <VectorArrow s={bS} color={COLORS.iA} width={3.6} dashed={sChained} />}

      {/* Rotor pole letters at the pole tips, then vector labels (positions guaranteed not to overlap) */}
      {layout.poles.map((p, k) => (
        <text key={k} x={p.letter.x} y={p.letter.y} className="svg-pole" textAnchor="middle" dominantBaseline="central">
          {p.kind}
        </text>
      ))}
      {show.bNet && <LabelAt box={layout.labels.bNet} text="B_net" />}
      {show.bR && <LabelAt box={layout.labels.bR} text="B_R" />}
      {show.bS && <LabelAt box={layout.labels.bS} text="B_S" />}

      {/* Direction of rotation (explained in the notes) */}
      <g aria-hidden="true">
        <path d={arcPath(STATOR.rOut + 12, 0.3, 0.9)} fill="none" stroke={COLORS.inkDim} strokeWidth={1.5} />
        <Arrow x1={ra0x} y1={ra0y} x2={rtx} y2={rty} color={COLORS.inkDim} width={0} head={9} />
      </g>
    </svg>
  );
}
