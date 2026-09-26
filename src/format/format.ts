/**
 * Locale-aware number and unit formatting (brief §7.1). Units are not translated.
 * Powers pick an SI prefix automatically: W/kW/MW, var/kvar/Mvar, VA/kVA/MVA.
 */

import { NUMBER_LOCALE, UNITS, type Lang } from '../i18n';

export type PowerUnit = 'W' | 'var' | 'VA';

const MINUS = '−';

export interface Formatter {
  /** Plain number with a fixed number of decimals and a typographic minus sign. */
  number(value: number, decimals?: number): string;
  /** Power with automatic SI prefix, or in per unit when `puBase` is given. */
  power(value: number, unit: PowerUnit, puBase?: number): string;
  voltage(value: number, puBase?: number): string;
  current(value: number, puBase?: number): string;
  /** Angle given in radians, shown in degrees. */
  degrees(radians: number, decimals?: number): string;
  rpm(value: number): string;
  hertz(value: number): string;
  torque(value: number): string;
  ohms(value: number, puBase?: number): string;
  percent(ratio: number): string;
}

export function createFormatter(lang: Lang): Formatter {
  const locale = NUMBER_LOCALE[lang];
  const cache = new Map<number, Intl.NumberFormat>();
  const nf = (decimals: number): Intl.NumberFormat => {
    let f = cache.get(decimals);
    if (!f) {
      f = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      cache.set(decimals, f);
    }
    return f;
  };

  const number = (value: number, decimals = 1): string => {
    if (!Number.isFinite(value)) return '—';
    // Avoid "−0.0"
    const rounded = Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value;
    return nf(decimals).format(rounded).replace('-', MINUS);
  };

  const pu = (value: number, base: number): string => `${number(value / base, 3)} ${UNITS.perUnit}`;

  const power = (value: number, unit: PowerUnit, puBase?: number): string => {
    if (puBase !== undefined) return pu(value, puBase);
    const a = Math.abs(value);
    if (a >= 1e6) return `${number(value / 1e6, 2)} M${unit}`;
    if (a >= 1e3) return `${number(value / 1e3, 1)} k${unit}`;
    return `${number(value, 0)} ${unit}`;
  };

  return {
    number,
    power,
    voltage: (v, base) => (base !== undefined ? pu(v, base) : `${number(v, 1)} ${UNITS.volt}`),
    current: (i, base) => (base !== undefined ? pu(i, base) : `${number(i, 1)} ${UNITS.ampere}`),
    degrees: (rad, decimals = 1) => `${number((rad * 180) / Math.PI, decimals)}${UNITS.degree}`,
    rpm: (n) => `${number(n, 0)} ${UNITS.rpm}`,
    hertz: (f) => `${number(f, 0)} ${UNITS.hertz}`,
    torque: (t) => `${number(t, 1)} ${UNITS.newtonMetre}`,
    ohms: (x, base) => (base !== undefined ? pu(x, base) : `${number(x, 3)} ${UNITS.ohm}`),
    percent: (r) => `${number(r * 100, 0)} %`,
  };
}
