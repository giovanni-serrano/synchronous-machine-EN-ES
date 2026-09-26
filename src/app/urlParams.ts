/**
 * URL parameters (brief §7.1, §10, §10.1):
 *   ?lang=en|es  &presentation=true  &scene=<1..15>  &aspect=16x9|1x1|9x16  &clip=<id>
 * Unknown or malformed values fall back to defaults.
 */

import { DEFAULT_LANG, isLang, type Lang } from '../i18n';

export const ASPECTS = ['16x9', '1x1', '9x16'] as const;
export type Aspect = (typeof ASPECTS)[number];

export const CLIP_IDS = [
  'rotating-field',
  'poles-speed',
  'reactive-myth',
  'excitation-sweep',
  'motor-to-generator',
  'pull-out',
] as const;
export type ClipId = (typeof CLIP_IDS)[number];

export const SCENE_COUNT = 15;

export interface UrlOptions {
  readonly lang: Lang;
  readonly presentation: boolean;
  /** 1-based scene index, or null. */
  readonly scene: number | null;
  readonly aspect: Aspect;
  readonly clip: ClipId | null;
}

export function parseUrlOptions(search: string): UrlOptions {
  const q = new URLSearchParams(search);
  const lang = q.get('lang');
  const aspect = q.get('aspect');
  const clip = q.get('clip');
  const sceneRaw = Number.parseInt(q.get('scene') ?? '', 10);
  return {
    lang: isLang(lang) ? lang : DEFAULT_LANG,
    presentation: q.get('presentation') === 'true',
    scene: Number.isInteger(sceneRaw) && sceneRaw >= 1 && sceneRaw <= SCENE_COUNT ? sceneRaw : null,
    aspect: (ASPECTS as readonly string[]).includes(aspect ?? '') ? (aspect as Aspect) : '16x9',
    clip: (CLIP_IDS as readonly string[]).includes(clip ?? '') ? (clip as ClipId) : null,
  };
}

/** Return `search` with `lang` replaced, keeping every other parameter. */
export function withLang(search: string, lang: Lang): string {
  const q = new URLSearchParams(search);
  q.set('lang', lang);
  return `?${q.toString()}`;
}
