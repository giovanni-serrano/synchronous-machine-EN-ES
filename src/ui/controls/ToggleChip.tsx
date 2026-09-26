import type { ReactNode } from 'react';

/** Checkbox chip with an optional colour swatch (the swatch never carries meaning alone: the label does). */
export function ToggleChip({
  checked,
  onChange,
  swatch,
  dashed = false,
  children,
}: {
  checked: boolean;
  onChange(checked: boolean): void;
  swatch?: string;
  dashed?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="chip">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {swatch && (
        <span
          className="chip__swatch"
          style={{ borderColor: swatch, borderStyle: dashed ? 'dashed' : 'solid' }}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </label>
  );
}
