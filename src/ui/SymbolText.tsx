import { Fragment } from 'react';

/**
 * Renders dictionary text, turning symbol tokens like `E_A`, `V_φ`, `B_net`, `n_sync`
 * into base + subscript. Everything else is plain text.
 */
const SYMBOL_TOKEN = /([A-Za-zτδθφ])_([A-Za-zφ0-9]+)/g;

export function SymbolText({ text }: { text: string }) {
  const parts: Array<string | { base: string; sub: string }> = [];
  let last = 0;
  for (const m of text.matchAll(SYMBOL_TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push({ base: m[1] ?? '', sub: m[2] ?? '' });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, k) =>
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
