import { describe, expect, it } from 'vitest';
import { DICTIONARIES, interpolate } from '../src/i18n';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';

type Tree = { readonly [k: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.set(path, v);
    else for (const [p, s] of leaves(v, path)) out.set(p, s);
  }
  return out;
}

const enLeaves = leaves(en);
const esLeaves = leaves(es);

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const symbols = (s: string) => [...s.matchAll(/[A-Za-zτδθφ]_[A-Za-zφ0-9]+/g)].map((m) => m[0]).sort();

describe('dictionaries (brief §7.1)', () => {
  it('EN and ES have exactly the same keys', () => {
    expect([...esLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
  });

  it('no empty strings', () => {
    for (const [k, v] of [...enLeaves, ...esLeaves]) expect(v.trim(), k).not.toBe('');
  });

  it('placeholders match between languages', () => {
    for (const [k, v] of enLeaves) expect(placeholders(esLeaves.get(k)!), k).toEqual(placeholders(v));
  });

  it('symbols are identical in both languages (except the `symbols` namespace)', () => {
    for (const [k, v] of enLeaves) {
      if (k.startsWith('symbols.')) continue;
      expect(symbols(esLeaves.get(k)!), k).toEqual(symbols(v));
    }
  });

  it('both languages are registered', () => {
    expect(DICTIONARIES.en).toBe(en);
    expect(DICTIONARIES.es).toBe(es);
  });
});

describe('interpolate', () => {
  it('replaces known placeholders and leaves unknown ones', () => {
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});
