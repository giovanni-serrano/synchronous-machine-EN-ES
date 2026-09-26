import { useId } from 'react';

/** Radio group styled as a segmented control. Keyboard-accessible (native radios). */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange(value: T): void;
}) {
  const name = useId();
  return (
    <fieldset className="segmented">
      <legend>{label}</legend>
      <div className="segmented__options">
        {options.map((o) => (
          <label key={String(o.value)} className="segmented__option">
            <input
              type="radio"
              name={name}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
