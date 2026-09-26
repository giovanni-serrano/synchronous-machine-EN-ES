/**
 * Cross-section of the stator and air gap (no rotor): coil sides and their magnetic axes, the radial air-gap flux,
 * the stator pole faces N / S, and the resultant B_S for 2 poles.
 * Reads physics only (statorField, airGapFluxDensity, statorPoleFaces; geometry via StatorDrawing).
 */

import { airGapFluxDensity, statorField, statorPoleFaces, type PhaseId } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { Arrow, polarXY } from '../svg/Arrow';
import { CoilAxesLayer, StatorCoreAndCoils } from '../machine/StatorDrawing';
import { COLORS, RESULTANT_COLOR } from '../theme';

const R_FLUX = 103;
const FLUX_MAX = 17;
const FLUX_SAMPLES = 72;
const R_POLE_LABEL = 78;

export interface AirGapShow {
  readonly phases: Readonly<Record<PhaseId, boolean>>;
  readonly resultant: boolean;
  readonly flux: boolean;
  readonly axes: boolean;
}

export function AirGapView({
  wt,
  poles,
  show,
  highlight,
  onHighlight,
}: {
  wt: number;
  poles: number;
  show: AirGapShow;
  highlight: PhaseId | null;
  onHighlight(phase: PhaseId | null): void;
}) {
  const { d } = useI18n();
  const field = statorField(wt);
  const net = field.net;
  const [bsx, bsy] = polarXY(40, Math.atan2(net.im, net.re) + 0.55);
  const currents = { a: field.a.current, b: field.b.current, c: field.c.current };

  return (
    <svg viewBox="-200 -200 400 400" className="airgap" role="img" aria-label={d.fieldLab.airGapTitle}>
      <StatorCoreAndCoils
        poles={poles}
        currents={currents}
        visible={show.phases}
        highlight={highlight}
        onHighlight={onHighlight}
      />
      {/* Coil axes lie between slots, so drawing them over the core never hides a conductor */}
      {show.axes && <CoilAxesLayer poles={poles} visible={show.phases} highlight={highlight} />}

      {/* Radial air-gap flux: outward = into the stator */}
      {show.flux &&
        Array.from({ length: FLUX_SAMPLES }, (_, k) => {
          const theta = (2 * Math.PI * k) / FLUX_SAMPLES;
          const b = airGapFluxDensity(theta, wt, poles);
          const len = (FLUX_MAX * b) / 1.5;
          const [xa, ya] = polarXY(R_FLUX - len / 2, theta);
          const [xb, yb] = polarXY(R_FLUX + len / 2, theta);
          return (
            <Arrow key={k} x1={xa} y1={ya} x2={xb} y2={yb} color={RESULTANT_COLOR} width={1.6} head={5} opacity={0.3 + (0.7 * Math.abs(b)) / 1.5} />
          );
        })}

      {/* Stator pole faces */}
      {statorPoleFaces(wt, poles).map((f, k) => {
        const [x, y] = polarXY(R_POLE_LABEL, f.angle);
        return (
          <g key={k}>
            <circle cx={x} cy={y} r={11} fill={COLORS.surface} stroke={COLORS.steelEdge} />
            <text x={x} y={y} className="svg-pole" textAnchor="middle" dominantBaseline="central">
              {f.kind}
            </text>
          </g>
        );
      })}

      {/* Resultant space vector: a single vector across the bore only exists for 2 poles */}
      {show.resultant && poles === 2 && (
        <g>
          <Arrow x1={0} y1={0} x2={net.re * 38} y2={-net.im * 38} color={RESULTANT_COLOR} width={4} head={12} />
          <text x={bsx} y={bsy} className="svg-label svg-label--strong" textAnchor="middle" dominantBaseline="central">
            <SvgSymbolText text="B_S" />
          </text>
        </g>
      )}
    </svg>
  );
}
