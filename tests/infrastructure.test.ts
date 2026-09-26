import { describe, expect, it } from 'vitest';
import { parseUrlOptions, withLang } from '../src/app/urlParams';
import { createFormatter } from '../src/format/format';

describe('URL options (brief §7.1, §10, §10.1)', () => {
  it('defaults: English, not presentation, 16:9', () => {
    expect(parseUrlOptions('')).toEqual({
      lang: 'en',
      presentation: false,
      scene: null,
      aspect: '16x9',
      clip: null,
    });
  });

  it('parses a full recording URL', () => {
    expect(parseUrlOptions('?presentation=true&lang=es&scene=7&aspect=9x16&clip=pull-out')).toEqual({
      lang: 'es',
      presentation: true,
      scene: 7,
      aspect: '9x16',
      clip: 'pull-out',
    });
  });

  it('rejects malformed values', () => {
    const o = parseUrlOptions('?lang=fr&scene=99&aspect=4x3&clip=nope');
    expect(o.lang).toBe('en');
    expect(o.scene).toBeNull();
    expect(o.aspect).toBe('16x9');
    expect(o.clip).toBeNull();
  });

  it('switching language keeps the other parameters', () => {
    const s = withLang('?presentation=true&lang=en&scene=3', 'es');
    expect(parseUrlOptions(s)).toMatchObject({ lang: 'es', presentation: true, scene: 3 });
  });
});

describe('number formatting', () => {
  it('English and Latin-American Spanish use a decimal point and SI prefixes', () => {
    const en = createFormatter('en');
    const es = createFormatter('es');
    expect(en.power(80_000, 'W')).toBe('80.0 kW');
    expect(es.power(80_000, 'W')).toBe('80.0 kW');
    expect(en.power(-60_000, 'var')).toBe('−60.0 kvar');
    expect(en.power(1_234_567, 'VA')).toBe('1.23 MVA');
    expect(en.power(100_000, 'VA', 100_000)).toBe('1.000 pu');
  });

  it('never prints a negative zero', () => {
    expect(createFormatter('en').number(-0.00001, 1)).toBe('0.0');
  });

  it('formats degrees from radians', () => {
    expect(createFormatter('en').degrees(Math.PI / 4)).toBe('45.0°');
  });
});
