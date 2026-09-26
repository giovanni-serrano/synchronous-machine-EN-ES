import { Fragment } from 'react';

/**
 * Renders dictionary text, turning symbol tokens like `E_A`, `V_φ`, `B_net`, `n_sync`
 * into base + subscript. Everything else is plain text.
 */
const SYMBOL_TOKEN = /([A-Za-zτδθφ])_([A-Za-zφ0-9]+)/g;

type Part = string | { base: string; sub: string };

function tokenize(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const m of text.matchAll(SYMBOL_TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push({ base: m[1] ?? '', sub: m[2] ?? '' });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** HTML version. */
export function SymbolText({ text }: { text: string }) {
  return (
    <>
      {tokenize(text).map((p, k) =>
        typeof p === 'string' ? (
          <Fragment key={k}>{p}</Fragment>
        ) : (
          <Fragment key={k}>
            <i>{p.base}</i>
            <sub>{p.sub}</sub>
          </Fragment>
        ),
      )}
    </>
  );
}

const SUB_SHIFT = 0.3; // parent em
const SUB_SCALE = 0.72;

/** SVG version: returns <tspan>s to place inside a <text>. Subscripts use dy (portable across browsers). */
export function SvgSymbolText({ text }: { text: string }) {
  let pendingReturn = false;
  return (
    <>
      {tokenize(text).map((p, k) => {
        const back = pendingReturn ? `${-SUB_SHIFT}em` : undefined;
        if (typeof p === 'string') {
          pendingReturn = false;
          return (
            <tspan key={k} dy={back}>
              {p}
            </tspan>
          );
        }
        pendingReturn = true;
        return (
          <Fragment key={k}>
            <tspan dy={back} fontStyle="italic">
              {p.base}
            </tspan>
            {/* dy in the subscript's own (smaller) em, so the shift equals SUB_SHIFT parent em */}
            <tspan dy={`${SUB_SHIFT / SUB_SCALE}em`} fontSize={`${SUB_SCALE}em`}>
              {p.sub}
            </tspan>
          </Fragment>
        );
      })}
    </>
  );
}
