/**
 * Power triangle on the complex plane (brief §5.8), driven by powerTriangle() of the live operating point:
 * P along the real axis, jQ vertical (up = lagging in the active mode's convention), S = P + jQ from the origin,
 * θ between P and S, and the rated-S circle (S sizes the machine). Geometry: triangleLayout().
 */

import type { PowerTriangle as Triangle } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { Arrow } from '../svg/Arrow';
import { LinkedArc, type AngleLink } from '../svg/LinkedArc';
import { COLORS } from '../theme';
import type { Box } from '../labelLayout';
import { ORIGIN, TRI_H, TRI_W, triangleLayout, type TriangleLabels } from './triangleLayout';

export function triangleTexts(
  tri: Triangle,
  ratedS: number,
  fmt: ReturnType<typeof useI18n>['fmt'],
  ratedWord: string,
): TriangleLabels {
  return {
    p: `P = ${fmt.power(tri.p, 'W')}`,
    q: `Q = ${fmt.power(tri.q, 'var')}`,
    s: `S = ${fmt.power(tri.s, 'VA')}`,
    theta: 'θ',
    rated: `${ratedWord} = ${fmt.power(ratedS, 'VA')}`,
  };
}

function Label({ box, text, className = 'svg-label' }: { box: Box | undefined; text: string; className?: string }) {
  if (!box) return null;
  return (
    <text x={box.x} y={box.y} className={className} textAnchor="middle" dominantBaseline="central">
      <SvgSymbolText text={text} />
    </text>
  );
}

export function PowerTriangle({
  tri,
  ratedS,
  link = null,
  onLink = () => {},
}: {
  tri: Triangle;
  ratedS: number;
  link?: AngleLink;
  onLink?(link: AngleLink): void;
}) {
  const { d, fmt } = useI18n();
  const text = triangleTexts(tri, ratedS, fmt, d.powers.rated);
  const l = triangleLayout(tri.p / ratedS, tri.q / ratedS, text);
  const { o, pTip, sTip } = l;
  const arc = (r: number, a0: number, a1: number) => {
    const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
    const sweep = a1 > a0 ? 1 : 0;
    return `M ${o.x + r * Math.cos(a0)} ${o.y + r * Math.sin(a0)} A ${r} ${r} 0 ${large} ${sweep} ${o.x + r * Math.cos(a1)} ${o.y + r * Math.sin(a1)}`;
  };

  return (
    <svg viewBox={`0 0 ${TRI_W} ${TRI_H}`} className="triangle" role="img" aria-label={d.powers.planeLabel}>
      {/* Rated-S circle (right half: P ≥ 0 in the mode convention) */}
      <path d={arc(l.ratedR, -Math.PI / 2, Math.PI / 2)} fill="none" stroke={COLORS.s} strokeOpacity={0.45} strokeDasharray="4 5" />
      <Label box={l.labels.get('rated')} text={text.rated} className="svg-label svg-label--dim svg-label--small" />

      {/* Axes */}
      <line x1={12} y1={o.y} x2={TRI_W - 8} y2={o.y} stroke="var(--line-strong)" />
      <line x1={o.x} y1={8} x2={o.x} y2={TRI_H - 8} stroke="var(--line-strong)" />
      <text x={TRI_W - 8} y={o.y + 14} className="svg-label svg-label--dim svg-label--small" textAnchor="end" dominantBaseline="central">
        {d.powers.reAxis}
      </text>
      <text x={o.x + 8} y={14} className="svg-label svg-label--dim svg-label--small" dominantBaseline="central">
        {d.powers.imAxis}
      </text>
      <text x={o.x + 8} y={30} className="svg-label svg-label--dim svg-label--small" dominantBaseline="central">
        {d.powers.up}
      </text>
      <text x={o.x + 8} y={TRI_H - 12} className="svg-label svg-label--dim svg-label--small" dominantBaseline="central">
        {d.powers.down}
      </text>
      {l.zoomedOut && (
        <text x={TRI_W - 8} y={TRI_H - 12} className="svg-label svg-label--dim svg-label--small" textAnchor="end" dominantBaseline="central">
          {d.powers.zoomNote}
        </text>
      )}

      {/* Triangle */}
      <polygon points={`${o.x},${o.y} ${pTip.x},${pTip.y} ${sTip.x},${sTip.y}`} fill={COLORS.s} fillOpacity={0.07} />
      <Arrow x1={o.x} y1={o.y} x2={pTip.x} y2={pTip.y} color={COLORS.p} width={3.5} />
      <Arrow x1={pTip.x} y1={pTip.y} x2={sTip.x} y2={sTip.y} color={COLORS.q} width={3} dashed />
      <Arrow x1={o.x} y1={o.y} x2={sTip.x} y2={sTip.y} color={COLORS.s} width={3} />
      <circle cx={ORIGIN.x} cy={ORIGIN.y} r={3} fill={COLORS.s} />

      <Label box={l.labels.get('p')} text={text.p} />
      <Label box={l.labels.get('q')} text={text.q} />
      <Label box={l.labels.get('s')} text={text.s} className="svg-label svg-label--em" />
      {l.theta && (
        <LinkedArc d={arc(l.theta.r, l.theta.from, l.theta.to)} id="theta" link={link} onLink={onLink} label={d.powers.thetaAria} width={2}>
          <Label box={l.labels.get('theta')} text={text.theta} className="svg-label svg-label--delta" />
        </LinkedArc>
      )}
    </svg>
  );
}
