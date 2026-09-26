/**
 * Stator core, slots, coil sides (dot = current out of the page, cross = into it) and the magnetic axis of each
 * coil (+a, +b, +c). Shared by the rotating-field lab and the machine view. Geometry comes from the physics layer
 * (windingConductors, coilAxes); the phase currents are passed in, normalised to [−1, 1].
 */

import { coilAxes, windingConductors, type PhaseId } from '../../physics';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { polarXY } from '../svg/Arrow';
import { COLORS, PHASE_COLORS } from '../theme';

export const STATOR = {
  rOut: 190,
  rBore: 118,
  slotDepth: 28,
} as const;

const R_CONDUCTOR = STATOR.rBore + STATOR.slotDepth / 2;
const R_LABEL = STATOR.rBore + STATOR.slotDepth + 14;
const R_AXIS_END = STATOR.rOut - 24;
const R_AXIS_LABEL = STATOR.rOut - 11;

export interface StatorDrawingProps {
  poles: number;
  /** Instantaneous phase currents, normalised (±1 = rated peak). */
  currents: Readonly<Record<PhaseId, number>>;
  visible: Readonly<Record<PhaseId, boolean>>;
  highlight: PhaseId | null;
  onHighlight(phase: PhaseId | null): void;
}

/** Coil-axis rays with +a/+b/+c labels (they fall between slots, so they can be drawn over the core). */
export function CoilAxesLayer({ poles, visible, highlight }: Pick<StatorDrawingProps, 'poles' | 'visible' | 'highlight'>) {
  return (
    <g pointerEvents="none">
      {coilAxes(poles).map((axis) => {
        if (!visible[axis.phase]) return null;
        const on = highlight === axis.phase;
        const dim = highlight !== null && !on;
        const [x, y] = polarXY(R_AXIS_END, axis.angle);
        const [lx, ly] = polarXY(R_AXIS_LABEL, axis.angle);
        return (
          <g key={`${axis.phase}${axis.coil}`} opacity={dim ? 0.3 : 1}>
            <line
              x1={0}
              y1={0}
              x2={x}
              y2={y}
              stroke={PHASE_COLORS[axis.phase]}
              strokeOpacity={on ? 0.95 : 0.4}
              strokeWidth={on ? 2.4 : 1.2}
              strokeDasharray={on ? undefined : '2 4'}
            />
            <text x={lx} y={ly} className={`svg-label${on ? ' svg-label--strong' : ''}`} textAnchor="middle" dominantBaseline="central">
              +{axis.phase}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function StatorCoreAndCoils({ poles, currents, visible, highlight, onHighlight }: StatorDrawingProps) {
  const { d } = useI18n();
  const pairs = poles / 2;
  const slotHalfAngle = Math.min(0.16, Math.PI / (6 * pairs) - 0.03);
  const { rOut, rBore, slotDepth } = STATOR;

  return (
    <g>
      <circle r={(rOut + rBore) / 2} fill="none" stroke={COLORS.steel} strokeWidth={rOut - rBore} />
      <circle r={rOut} fill="none" stroke={COLORS.steelEdge} strokeWidth={1.5} />
      <circle r={rBore} fill="none" stroke={COLORS.steelEdge} strokeWidth={1.5} />
      {windingConductors(poles).map((c, k) => {
        // Current through this coil side, counted positive out of the page.
        const current = currents[c.phase] * (c.side === 'go' ? 1 : -1);
        const on = visible[c.phase];
        const lit = highlight === c.phase;
        const [x0, y0] = polarXY(rBore - 1, c.angle - slotHalfAngle);
        const [x1, y1] = polarXY(rBore + slotDepth, c.angle - slotHalfAngle * 0.85);
        const [x2, y2] = polarXY(rBore + slotDepth, c.angle + slotHalfAngle * 0.85);
        const [x3, y3] = polarXY(rBore - 1, c.angle + slotHalfAngle);
        const [cx, cy] = polarXY(R_CONDUCTOR, c.angle);
        const [lx, ly] = polarXY(R_LABEL, c.angle);
        const color = PHASE_COLORS[c.phase];
        const mag = Math.min(1, Math.abs(current));
        const label = interpolate(d.fieldLab.phase, { phase: c.phase });
        return (
          <g
            key={k}
            className="coil"
            tabIndex={0}
            role="img"
            aria-label={label}
            onPointerEnter={() => onHighlight(c.phase)}
            onPointerLeave={() => onHighlight(null)}
            onFocus={() => onHighlight(c.phase)}
            onBlur={() => onHighlight(null)}
          >
            <path d={`M${x0},${y0} L${x1},${y1} L${x2},${y2} L${x3},${y3} Z`} fill={COLORS.surface} />
            <circle
              cx={cx}
              cy={cy}
              r={8.5}
              fill={on ? color : COLORS.muted}
              fillOpacity={on ? 0.2 + 0.8 * mag : 0.25}
              stroke={lit ? COLORS.ink : on ? color : COLORS.muted}
              strokeWidth={lit ? 2.5 : 1.5}
            />
            {on &&
              mag > 0.08 &&
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
            {/* generous invisible hit target */}
            <circle cx={cx} cy={cy} r={16} fill="transparent" />
          </g>
        );
      })}
    </g>
  );
}
