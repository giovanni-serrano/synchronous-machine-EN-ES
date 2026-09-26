/**
 * Cross-section of the stator and air gap: slots with the coil sides of phases a, b, c (dot = current out of
 * the page, cross = into the page), the radial air-gap flux, and the stator pole faces N / S.
 * Reads physics only (windingConductors, airGapFluxDensity, statorPoleFaces, statorField).
 */

import {
  airGapFluxDensity,
  statorField,
  statorPoleFaces,
  windingConductors,
  type PhaseId,
} from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { Arrow, polarXY } from '../svg/Arrow';
import { COLORS, PHASE_COLORS, RESULTANT_COLOR } from '../theme';

const R_OUT = 190;
const R_BORE = 118;
const SLOT_DEPTH = 28;
const R_CONDUCTOR = R_BORE + SLOT_DEPTH / 2;
const R_LABEL = R_BORE + SLOT_DEPTH + 14;
const R_FLUX = 103;
const FLUX_MAX = 17;
const FLUX_SAMPLES = 72;
const R_POLE_LABEL = 78;

export interface AirGapShow {
  readonly phases: Readonly<Record<PhaseId, boolean>>;
  readonly resultant: boolean;
  readonly flux: boolean;
}

export function AirGapView({ wt, poles, show }: { wt: number; poles: number; show: AirGapShow }) {
  const { d } = useI18n();
  const conductors = windingConductors(poles);
  const pairs = poles / 2;
  const slotHalfAngle = Math.min(0.16, Math.PI / (6 * pairs) - 0.03);
  const field = statorField(wt);
  const net = field.net;
  const netAngle = Math.atan2(net.im, net.re);
  const [bsx, bsy] = polarXY(40, netAngle + 0.55);

  return (
    <svg viewBox="-200 -200 400 400" className="airgap" role="img" aria-label={d.fieldLab.airGapTitle}>
      {/* Stator core */}
      <circle r={(R_OUT + R_BORE) / 2} fill="none" stroke={COLORS.steel} strokeWidth={R_OUT - R_BORE} />
      <circle r={R_OUT} fill="none" stroke={COLORS.steelEdge} strokeWidth={1.5} />
      <circle r={R_BORE} fill="none" stroke={COLORS.steelEdge} strokeWidth={1.5} />

      {/* Slots and conductors */}
      {conductors.map((c, k) => {
        // Current through this coil side, counted positive out of the page.
        const current = field[c.phase].current * (c.side === 'go' ? 1 : -1);
        const on = show.phases[c.phase];
        const [x0, y0] = polarXY(R_BORE - 1, c.angle - slotHalfAngle);
        const [x1, y1] = polarXY(R_BORE + SLOT_DEPTH, c.angle - slotHalfAngle * 0.85);
        const [x2, y2] = polarXY(R_BORE + SLOT_DEPTH, c.angle + slotHalfAngle * 0.85);
        const [x3, y3] = polarXY(R_BORE - 1, c.angle + slotHalfAngle);
        const [cx, cy] = polarXY(R_CONDUCTOR, c.angle);
        const [lx, ly] = polarXY(R_LABEL, c.angle);
        const color = PHASE_COLORS[c.phase];
        const mag = Math.abs(current);
        return (
          <g key={k}>
            <path d={`M${x0},${y0} L${x1},${y1} L${x2},${y2} L${x3},${y3} Z`} fill={COLORS.surface} />
            <circle
              cx={cx}
              cy={cy}
              r={8.5}
              fill={on ? color : COLORS.muted}
              fillOpacity={on ? 0.2 + 0.8 * mag : 0.25}
              stroke={on ? color : COLORS.muted}
              strokeWidth={1.5}
            />
            {on && mag > 0.08 &&
              (current > 0 ? (
                <circle cx={cx} cy={cy} r={2.6} fill={COLORS.ink} />
              ) : (
                <g stroke={COLORS.ink} strokeWidth={1.8} strokeLinecap="round">
                  <line x1={cx - 3.6} y1={cy - 3.6} x2={cx + 3.6} y2={cy + 3.6} />
                  <line x1={cx - 3.6} y1={cy + 3.6} x2={cx + 3.6} y2={cy - 3.6} />
                </g>
              ))}
            <text x={lx} y={ly} className="svg-label" textAnchor="middle" dominantBaseline="central">
              {c.phase}
              {c.side === 'return' ? '′' : ''}
            </text>
          </g>
        );
      })}

      {/* Radial air-gap flux: outward = into the stator */}
      {show.flux &&
        Array.from({ length: FLUX_SAMPLES }, (_, k) => {
          const theta = (2 * Math.PI * k) / FLUX_SAMPLES;
          const b = airGapFluxDensity(theta, wt, poles);
          const len = (FLUX_MAX * b) / 1.5;
          const [xa, ya] = polarXY(R_FLUX - len / 2, theta);
          const [xb, yb] = polarXY(R_FLUX + len / 2, theta);
          return (
            <Arrow
              key={k}
              x1={xa}
              y1={ya}
              x2={xb}
              y2={yb}
              color={RESULTANT_COLOR}
              width={1.6}
              head={5}
              opacity={0.3 + (0.7 * Math.abs(b)) / 1.5}
            />
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
          <text
            x={bsx}
            y={bsy}
            className="svg-label svg-label--strong"
            textAnchor="middle"
            dominantBaseline="central"
          >
            <SvgSymbolText text="B_S" />
          </text>
        </g>
      )}
    </svg>
  );
}
