/**
 * Grid ↔ Machine ↔ Shaft energy-flow picture (brief §5.4). P and Q are drawn separately; directions come from the
 * convention-free energyFlow() — nothing here depends on the motor/generator sign convention.
 * Arrow thickness ∝ magnitude (visual only). P arrows are solid; the Q arrow is dashed, with dashes moving in its
 * direction of flow (off with reduced motion), and a note says no net energy travels with it.
 */

import type { EnergyFlow, FlowDirection } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { COLORS } from '../theme';

const GRID_X = 118;
const MACHINE_X = 280;
const MACHINE_R = 40;
const SHAFT_X = 442;

function FlowArrow({
  x1,
  x2,
  y,
  towardRight,
  magnitude,
  ratedS,
  color,
  dashed = false,
}: {
  x1: number;
  x2: number;
  y: number;
  /** true: flow from x1 to x2. */
  towardRight: boolean;
  magnitude: number;
  ratedS: number;
  color: string;
  dashed?: boolean;
}) {
  const w = Math.min(12, 2 + (8 * magnitude) / ratedS);
  const head = 8 + w;
  const [from, to] = towardRight ? [x1, x2] : [x2, x1];
  const dir = towardRight ? 1 : -1;
  const shaftEnd = to - dir * head;
  return (
    <g>
      <line
        x1={from}
        y1={y}
        x2={shaftEnd}
        y2={y}
        stroke={color}
        strokeWidth={w}
        strokeDasharray={dashed ? `${w * 1.6} ${w * 1.2}` : undefined}
        className={dashed ? 'flow-dash' : undefined}
      />
      <polygon points={`${to},${y} ${shaftEnd},${y - head * 0.6} ${shaftEnd},${y + head * 0.6}`} fill={color} />
    </g>
  );
}

export function EnergyFlowDiagram({ flow, ratedS }: { flow: EnergyFlow | null; ratedS: number }) {
  const { d, fmt } = useI18n();
  // "delivers" (to the grid) means the arrow points from the machine toward the grid, i.e. to the left.
  const gridArrow = (dir: FlowDirection) => (dir === 'delivers' ? false : true);

  return (
    <svg viewBox="0 0 560 180" className="energy" role="img" aria-label={d.energyFlow.title}>
      {/* Blocks */}
      <rect x={14} y={48} width={GRID_X - 14} height={84} rx={4} fill={COLORS.steel} stroke={COLORS.steelEdge} />
      <text x={(14 + GRID_X) / 2} y={94} className="svg-label svg-label--strong" textAnchor="middle">
        {d.energyFlow.grid}
      </text>
      <circle cx={MACHINE_X} cy={90} r={MACHINE_R} fill={COLORS.steel} stroke={COLORS.steelEdge} />
      <text x={MACHINE_X} y={94} className="svg-label svg-label--strong" textAnchor="middle">
        {d.energyFlow.machine}
      </text>
      <rect x={SHAFT_X} y={48} width={546 - SHAFT_X} height={84} rx={4} fill={COLORS.steel} stroke={COLORS.steelEdge} />
      <text x={(SHAFT_X + 546) / 2} y={94} className="svg-label svg-label--strong" textAnchor="middle">
        {d.energyFlow.shaft}
      </text>

      {flow && (
        <g>
          {/* P between grid and machine */}
          {flow.grid.p.direction !== 'none' && (
            <FlowArrow
              x1={GRID_X + 6}
              x2={MACHINE_X - MACHINE_R - 6}
              y={70}
              towardRight={gridArrow(flow.grid.p.direction)}
              magnitude={flow.grid.p.magnitude}
              ratedS={ratedS}
              color={COLORS.p}
            />
          )}
          <text x={(GRID_X + MACHINE_X - MACHINE_R) / 2} y={44} className="svg-label" textAnchor="middle">
            <SvgSymbolText text={`P = ${fmt.power(flow.grid.p.magnitude, 'W')}`} />
          </text>

          {/* Q between grid and machine (dashed: a direction of reactive flow, not net energy) */}
          {flow.grid.q.direction !== 'none' && (
            <FlowArrow
              x1={GRID_X + 6}
              x2={MACHINE_X - MACHINE_R - 6}
              y={112}
              towardRight={gridArrow(flow.grid.q.direction)}
              magnitude={flow.grid.q.magnitude}
              ratedS={ratedS}
              color={COLORS.q}
              dashed
            />
          )}
          <text x={(GRID_X + MACHINE_X - MACHINE_R) / 2} y={148} className="svg-label" textAnchor="middle">
            <SvgSymbolText text={`Q = ${fmt.power(flow.grid.q.magnitude, 'var')}`} />
          </text>

          {/* Mechanical power between machine and shaft */}
          {flow.shaft.direction !== 'none' && (
            <FlowArrow
              x1={MACHINE_X + MACHINE_R + 6}
              x2={SHAFT_X - 6}
              y={90}
              towardRight={flow.shaft.direction === 'outOfMachine'}
              magnitude={flow.shaft.magnitude}
              ratedS={ratedS}
              color={COLORS.p}
            />
          )}
          <text x={(MACHINE_X + MACHINE_R + SHAFT_X) / 2} y={62} className="svg-label" textAnchor="middle">
            <SvgSymbolText text={`P_mech = ${fmt.power(flow.shaft.magnitude, 'W')}`} />
          </text>
        </g>
      )}
    </svg>
  );
}
