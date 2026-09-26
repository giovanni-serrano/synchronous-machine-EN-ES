import { useId, type ReactNode } from 'react';

/** Labelled range input with its formatted value. Native <input type="range"> for keyboard and screen readers. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  valueText,
  hint,
  centerMark = false,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange(value: number): void;
  /** Formatted value shown next to the label. */
  display: ReactNode;
  /** Plain-text value for assistive technology. */
  valueText: string;
  hint?: ReactNode;
  /** Draw a tick at zero (signed sliders). */
  centerMark?: boolean;
}) {
  const id = useId();
  return (
    <div className="slider">
      <div className="slider__head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <div className={centerMark ? 'slider__track slider__track--center' : 'slider__track'}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={valueText}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
