/**
 * The recordable hook (?view=hook-clip): the hook loop on a square stage with captions synced to its stages —
 * the main clip for X. Captions are stacked and cross-faded, so nothing changes size while it plays.
 * Record with scripts/record.mjs (mode "hook") or OBS.
 */

import { useCallback, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { HookFigure } from './figures/HookFigure';
import type { HookFrame } from './figures/hookSequence';

/** @param still  freeze the loop at this time, s (review screenshots: ?view=hook-clip&t=12) */
export function HookClip({ still }: { still?: number }) {
  const { d } = useI18n();
  const [caption, setCaption] = useState(0);
  const onFrame = useCallback((f: HookFrame) => setCaption((c) => (c === f.caption ? c : f.caption)), []);
  const captions = [d.essay.clip.caption0, d.essay.clip.caption1, d.essay.clip.caption2, d.essay.clip.caption3];
  return (
    <div className="essay hook-clip">
      <div className="hook-clip__stage">
        <HookFigure onFrame={onFrame} still={still} />
        <div className="hook-clip__captions" aria-live="polite">
          {captions.map((text, k) => (
            <p key={k} className={k === caption ? 'is-on' : undefined} aria-hidden={k !== caption}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
