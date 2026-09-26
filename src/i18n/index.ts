/** Framework-free i18n core: languages, dictionaries, interpolation. */

import { en, type Dictionary } from './en';
import { es } from './es';

export type { Dictionary } from './en';
export { SYMBOLS, UNITS } from './symbols';

export const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export const DICTIONARIES: Readonly<Record<Lang, Dictionary>> = { en, es };

/**
 * Locale used for number formatting. 'es-419' (Latin American Spanish) uses a decimal point,
 * like the Mexican edition of Chapman; see docs/glossary.md.
 */
export const NUMBER_LOCALE: Readonly<Record<Lang, string>> = { en: 'en-US', es: 'es-419' };

export const isLang = (x: unknown): x is Lang => typeof x === 'string' && (LANGS as readonly string[]).includes(x);

/** Replace `{name}` placeholders. Unknown placeholders are left untouched. */
export function interpolate(template: string, params: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}
