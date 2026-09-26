/** Straight arrow with a computed head (no SVG markers, so colour and width follow the props). */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 3,
  head = 10,
  dashed = false,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
  head?: number;
  dashed?: boolean;
  opacity?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len;
  const uy = dy / len;
  const h = Math.min(head, len * 0.6);
  const hw = h * 0.5;
  // Shaft stops at the base of the head so thick lines do not poke through the tip.
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const points = `${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`;
  return (
    <g opacity={opacity}>
      <line
        x1={x1}
        y1={y1}
        x2={bx}
        y2={by}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? `${width * 2.5} ${width * 2}` : undefined}
      />
      <polygon points={points} fill={color} />
    </g>
  );
}

/** Polar → SVG coordinates (y axis points down in SVG; angles are counterclockwise-positive). */
export const polarXY = (r: number, angle: number): [number, number] => [r * Math.cos(angle), -r * Math.sin(angle)];
