/**
 * 2.5D cross-section of the whole machine (brief §6): stator with coils and their currents, net air-gap flux,
 * rotor with field winding and poles, shaft, and the space vectors B_R, B_S, B_net with the angle δ between
 * B_R and B_net (mechanical degrees). Reads only MachineSnapshot (time) — no physics is computed here.
 *
 * Poles are drawn salient for clarity; the model is a cylindrical rotor (the UI says so).
 */

import { sinusoidalGapField, wrapAngle, type PhaseId } from '../../physics';
import type { MachineSnapshot } from '../../animation/snapshot';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { Arrow, polarXY } from '../svg/Arrow';
import { COLORS } from '../theme';
import { CoilAxesLayer, STATOR, StatorCoreAndCoils } from './StatorDrawing';

const R_SHOE_OUT = 86;
const R_SHOE_IN = 62;
const R_BODY_IN = 24;
const R_HUB = 26;
const R_SHAFT = 12;
const R_GAP_MID = (R_SHOE_OUT + STATOR.rBore) / 2;
const FLUX_PX_PER_PU = 13;
const FLUX_SAMPLES = 72;
const VECTOR_PX_PER_PU = 50; // visual only
const R_DELTA_ARC = 32;

const ROTOR_STEEL = '#353d47';
const ROTOR_EDGE = '#4b5663';
const ALL_PHASES: Record<PhaseId, boolean> = { a: true, b: true, c: true };

export interface MachineShow {
  readonly bR: boolean;
  readonly bS: boolean;
  readonly bNet: boolean;
  readonly sum: boolean;
  readonly delta: boolean;
  readonly flux: boolean;
  readonly axes: boolean;
}

/** Local rotor coordinates (x along the pole axis) → SVG, rotated by φ (counterclockwise). */
const rot = (x: number, y: number, phi: number): [number, number] => [
  x * Math.cos(phi) - y * Math.sin(phi),
  -(x * Math.sin(phi) + y * Math.cos(phi)),
];

function RotorPole({ phi, kind, halfWidth, shoeHalfAngle }: { phi: number; kind: 'N' | 'S'; halfWidth: number; shoeHalfAngle: number }) {
  // Body (rectangle) + shoe (annular sector) as one outline.
  const steps = 14;
  const outline: Array<[number, number]> = [
    rot(R_BODY_IN, -halfWidth, phi),
    rot(R_SHOE_IN, -halfWidth, phi),
    rot(R_SHOE_IN * Math.cos(shoeHalfAngle), -R_SHOE_IN * Math.sin(shoeHalfAngle), phi),
  ];
  for (let k = 0; k <= steps; k++) {
    const a = -shoeHalfAngle + (2 * shoeHalfAngle * k) / steps;
    outline.push(rot(R_SHOE_OUT * Math.cos(a), R_SHOE_OUT * Math.sin(a), phi));
  }
  outline.push(
    rot(R_SHOE_IN * Math.cos(shoeHalfAngle), R_SHOE_IN * Math.sin(shoeHalfAngle), phi),
    rot(R_SHOE_IN, halfWidth, phi),
    rot(R_BODY_IN, halfWidth, phi),
  );
  const d = `M${outline.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L')} Z`;

  // Field-winding coil sides beside the pole body. Right-hand rule: for an N pole (flux outward along the
  // pole axis) the current comes out of the page on the counterclockwise side.
  const coilX = (R_BODY_IN + R_SHOE_IN) / 2;
  const coilY = halfWidth + 5.5;
  const [ox, oy] = rot(coilX, kind === 'N' ? coilY : -coilY, phi);
  const [ix, iy] = rot(coilX, kind === 'N' ? -coilY : coilY, phi);
  // Pole letter placed off the pole axis, so it never sits under the B_R arrow and its label.
  const labelAngle = shoeHalfAngle * 0.62;
  const rLabel = (R_SHOE_IN + R_SHOE_OUT) / 2;
  const [lx, ly] = rot(rLabel * Math.cos(labelAngle), -rLabel * Math.sin(labelAngle), phi);

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
      <text x={lx} y={ly} className="svg-pole" textAnchor="middle" dominantBaseline="central">
        {kind}
      </text>
    </g>
  );
}

function arcPath(r: number, from: number, to: number): string {
  const [x1, y1] = polarXY(r, from);
  const [x2, y2] = polarXY(r, to);
  const ccw = to > from; // counterclockwise in math terms = sweep-flag 0 in SVG (y down)
  const large = Math.abs(to - from) > Math.PI ? 1 : 0;
  return `M${x1},${y1} A${r},${r} 0 ${large} ${ccw ? 0 : 1} ${x2},${y2}`;
}

export function MachineView({
  snap,
  poles,
  show,
  highlight,
  onHighlight,
}: {
  snap: MachineSnapshot;
  poles: number;
  show: MachineShow;
  highlight: PhaseId | null;
  onHighlight(phase: PhaseId | null): void;
}) {
  const { d } = useI18n();
  const pairs = poles / 2;
  const halfWidth = Math.min(13, 34 * Math.tan(Math.PI / (2 * poles)));
  const shoeHalfAngle = (0.62 * Math.PI) / poles;

  const vec = (angle: number, magnitude: number): [number, number] => polarXY(magnitude * VECTOR_PX_PER_PU, angle);
  const [rx, ry] = vec(snap.mech.bR, snap.magnitude.bR);
  const [nx, ny] = vec(snap.mech.bNet, snap.magnitude.bNet);
  const [sdx, sdy] = vec(snap.mech.bS, snap.magnitude.bS);
  const chainS = show.sum && poles === 2 && show.bR;
  const sOrigin: [number, number] = chainS ? [rx, ry] : [0, 0];

  const label = (x: number, y: number, text: string, strong = true) => (
    <text x={x} y={y} className={strong ? 'svg-label svg-label--strong' : 'svg-label'} textAnchor="middle" dominantBaseline="central">
      <SvgSymbolText text={text} />
    </text>
  );
  /**
   * Label beyond the tip, pushed sideways (side = +1 counterclockwise, −1 clockwise) so that labels of vectors
   * that are only a few degrees apart — and the rotor's N label on the B_R axis — do not collide.
   */
  const tipLabel = (x1: number, y1: number, x2: number, y2: number, text: string, side = 0) => {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    // counterclockwise normal in SVG coordinates (y down) is (uy, −ux)
    return label(x2 + ux * 11 + uy * 12 * side, y2 + uy * 11 - ux * 12 * side, text);
  };
  const rLeads = wrapAngle(snap.mech.bR - snap.mech.bNet) >= 0;

  // δ arc from B_net to B_R (mechanical)
  const deltaMid = snap.mech.bNet + snap.deltaMech / 2;
  const [dlx, dly] = polarXY(R_DELTA_ARC + 13, deltaMid);

  const [ra1x, ra1y] = polarXY(STATOR.rOut + 12, 0.84);
  const [rtx, rty] = polarXY(STATOR.rOut + 12, 0.97);

  return (
    <svg viewBox="-215 -215 430 430" className="machine" role="img" aria-label={d.machineLab.viewTitle}>
      <StatorCoreAndCoils
        poles={poles}
        currents={snap.currents}
        visible={ALL_PHASES}
        highlight={highlight}
        onHighlight={onHighlight}
      />
      {show.axes && <CoilAxesLayer poles={poles} visible={ALL_PHASES} highlight={highlight} />}

      {/* Net air-gap flux (outward = into the stator) */}
      {show.flux &&
        Array.from({ length: FLUX_SAMPLES }, (_, k) => {
          const theta = (2 * Math.PI * k) / FLUX_SAMPLES;
          const b = sinusoidalGapField(theta, snap.elec.bNet, poles, snap.magnitude.bNet);
          const len = b * FLUX_PX_PER_PU;
          const [xa, ya] = polarXY(R_GAP_MID - len / 2, theta);
          const [xb, yb] = polarXY(R_GAP_MID + len / 2, theta);
          return <Arrow key={k} x1={xa} y1={ya} x2={xb} y2={yb} color={COLORS.vPhi} width={1.5} head={4.5} opacity={0.3 + 0.6 * Math.min(1, Math.abs(b))} />;
        })}

      {/* Rotor */}
      <g>
        {Array.from({ length: poles }, (_, k) => (
          <RotorPole key={k} phi={(snap.elec.bR + Math.PI * k) / pairs} kind={k % 2 === 0 ? 'N' : 'S'} halfWidth={halfWidth} shoeHalfAngle={shoeHalfAngle} />
        ))}
        <circle r={R_HUB} fill={ROTOR_STEEL} stroke={ROTOR_EDGE} strokeWidth={1.2} />
        <circle r={R_SHAFT} fill="#1b2027" stroke={ROTOR_EDGE} />
        {/* keyway marks the shaft's rotation */}
        <line
          x1={polarXY(R_SHAFT - 6, snap.mech.bR + Math.PI / 2)[0]}
          y1={polarXY(R_SHAFT - 6, snap.mech.bR + Math.PI / 2)[1]}
          x2={polarXY(R_SHAFT, snap.mech.bR + Math.PI / 2)[0]}
          y2={polarXY(R_SHAFT, snap.mech.bR + Math.PI / 2)[1]}
          stroke={COLORS.inkDim}
          strokeWidth={2}
        />
      </g>

      {/* Space vectors */}
      {show.bNet && (
        <g>
          <Arrow x1={0} y1={0} x2={nx} y2={ny} color={COLORS.vPhi} width={4.2} head={13} />
          {tipLabel(0, 0, nx, ny, 'B_net', rLeads ? -1 : 1)}
        </g>
      )}
      {show.bR && (
        <g>
          <Arrow x1={0} y1={0} x2={rx} y2={ry} color={COLORS.eA} width={4.2} head={13} />
          {tipLabel(0, 0, rx, ry, 'B_R', rLeads ? 1 : -1)}
        </g>
      )}
      {show.bS && (
        <g>
          <Arrow
            x1={sOrigin[0]}
            y1={sOrigin[1]}
            x2={sOrigin[0] + sdx}
            y2={sOrigin[1] + sdy}
            color={COLORS.iA}
            width={3.4}
            head={11}
            dashed={chainS}
          />
          {chainS
            ? // chained: its tip coincides with B_net's, so label the middle, pushed away from the centre
              (() => {
                const mx = sOrigin[0] + sdx / 2;
                const my = sOrigin[1] + sdy / 2;
                const r = Math.hypot(mx, my) || 1;
                return label(mx + (mx / r) * 14, my + (my / r) * 14, 'B_S');
              })()
            : tipLabel(sOrigin[0], sOrigin[1], sOrigin[0] + sdx, sOrigin[1] + sdy, 'B_S')}
        </g>
      )}

      {/* δ between B_net and B_R, mechanical */}
      {show.delta && Math.abs(snap.deltaMech) > 0.005 && (
        <g>
          <path d={arcPath(R_DELTA_ARC, snap.mech.bNet, snap.mech.bR)} fill="none" stroke={COLORS.ink} strokeWidth={1.6} />
          {label(dlx, dly, 'δ', false)}
        </g>
      )}

      {/* Direction of rotation (explained in the notes) */}
      <g aria-hidden="true">
        <path d={arcPath(STATOR.rOut + 12, 0.3, 0.9)} fill="none" stroke={COLORS.inkDim} strokeWidth={1.5} />
        <Arrow x1={ra1x} y1={ra1y} x2={rtx} y2={rty} color={COLORS.inkDim} width={0} head={9} />
      </g>
    </svg>
  );
}
