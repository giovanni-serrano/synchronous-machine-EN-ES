/**
 * Dynamic phasor diagram (brief §5.12), recomputed from the presented operating point on every render: V_φ on the real
 * axis, E_A, I_A and jX_S I_A with the same colours as the machine and the power triangle; δ and θ arcs are linked to
 * the machine view (δ) and the triangle (θ). Geometry: phasorLayout().
 */

import type { Convention, PresentedOperatingPoint } from '../../physics';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { Arrow } from '../svg/Arrow';
import { LinkedArc, type AngleLink } from '../svg/LinkedArc';
import { COLORS } from '../theme';
import type { Box } from '../labelLayout';
import { PH_H, PH_ORIGIN, PH_W, phasorLayout, type AngleArc, type PhasorId, type PhasorShow } from './phasorLayout';

export const PHASOR_TEXT = { vPhi: 'V_φ', eA: 'E_A', iA: 'I_A', jx: 'jX_S I_A', delta: 'δ', theta: 'θ' } as const;

const STYLE: Record<PhasorId, { color: string; width: number; dashed: boolean }> = {
  vPhi: { color: COLORS.vPhi, width: 3.6, dashed: false },
  eA: { color: COLORS.eA, width: 3.6, dashed: false },
  iA: { color: COLORS.iA, width: 3.2, dashed: false },
  jx: { color: COLORS.jXsIA, width: 2.8, dashed: true },
};
// I_A after V_φ: at unity PF it lies on V_φ and must stay visible (it is thinner and shorter).
const ORDER: PhasorId[] = ['jx', 'vPhi', 'iA', 'eA'];

const arcD = (a: AngleArc) => {
  const o = PH_ORIGIN;
  const large = Math.abs(a.to - a.from) > Math.PI ? 1 : 0;
  const sweep = a.to > a.from ? 1 : 0;
  return `M ${o.x + a.r * Math.cos(a.from)} ${o.y + a.r * Math.sin(a.from)} A ${a.r} ${a.r} 0 ${large} ${sweep} ${o.x + a.r * Math.cos(a.to)} ${o.y + a.r * Math.sin(a.to)}`;
};

function Label({ box, text, className }: { box: Box | undefined; text: string; className: string }) {
  return box ? (
    <text x={box.x} y={box.y} className={className} textAnchor="middle" dominantBaseline="central">
      <SvgSymbolText text={text} />
    </text>
  ) : null;
}

export function PhasorDiagram({
  pr,
  modeConvention,
  vPhiRated,
  iRated,
  show,
  zoom,
  link,
  onLink,
}: {
  pr: PresentedOperatingPoint;
  modeConvention: Convention;
  vPhiRated: number;
  iRated: number;
  show: PhasorShow;
  zoom: number;
  link: AngleLink;
  onLink(link: AngleLink): void;
}) {
  const { d, fmt } = useI18n();
  const l = phasorLayout(pr, vPhiRated, iRated, modeConvention, show, PHASOR_TEXT, zoom);
  const o = PH_ORIGIN;

  return (
    <svg viewBox={`0 0 ${PH_W} ${PH_H}`} className="phasors" role="img" aria-label={d.phasors.planeLabel}>
      <defs>
        <clipPath id="phasor-clip">
          <rect x={0} y={0} width={PH_W} height={PH_H} />
        </clipPath>
      </defs>
      {/* Real axis (reference) and origin */}
      <line x1={8} y1={o.y} x2={PH_W - 8} y2={o.y} stroke="var(--line-strong)" strokeDasharray="2 5" />
      <line x1={o.x} y1={10} x2={o.x} y2={PH_H - 10} stroke="var(--line)" strokeDasharray="2 5" />
      {l.step !== 1 && (
        <text x={PH_W - 8} y={PH_H - 10} className="svg-label svg-label--dim svg-label--small" textAnchor="end" dominantBaseline="central">
          {interpolate(d.phasors.scaleStep, { value: fmt.number(l.step, 2) })}
        </text>
      )}

      <g clipPath="url(#phasor-clip)">
        {ORDER.filter((id) => show[id]).map((id) => {
          const s = l.vectors[id];
          const st = STYLE[id];
          return <Arrow key={id} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} color={st.color} width={st.width} head={11} dashed={st.dashed} />;
        })}
        <circle cx={o.x} cy={o.y} r={3} fill={COLORS.ink} />
      </g>

      {l.delta && (
        <LinkedArc d={arcD(l.delta)} id="delta" link={link} onLink={onLink} label={d.phasors.angleAria.delta}>
          <Label box={l.labels.get('delta')} text="δ" className="svg-label svg-label--delta" />
        </LinkedArc>
      )}
      {l.theta && (
        <LinkedArc d={arcD(l.theta)} id="theta" link={link} onLink={onLink} label={d.phasors.angleAria.theta} width={2}>
          <Label box={l.labels.get('theta')} text="θ" className="svg-label svg-label--delta" />
        </LinkedArc>
      )}

      {show.names &&
        ORDER.filter((id) => show[id]).map((id) => (
          <Label key={id} box={l.labels.get(id)} text={PHASOR_TEXT[id]} className="svg-label svg-label--em" />
        ))}
    </svg>
  );
}
