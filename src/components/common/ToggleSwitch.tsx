/*
 * File: ToggleSwitch.tsx
 * Purpose: Provide a reusable controlled on/off switch for compact app chrome controls.
 * Primary Responsibility: Render an accessible switch and report checked state changes.
 * Design Intent: Keep switch presentation independent from map, KTO, or routing state.
 * Non-Goals: This component does not own data loading, persistence, or product-specific labels.
 * Dependencies: React input events and local CSS classes.
 */
import type { LabelHTMLAttributes } from 'react';

export interface ToggleSwitchProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked: boolean;
  disabled?: boolean;
  label?: string;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
}

/**
 * Renders a compact controlled switch.
 *
 * The caller owns state and side effects; this component only exposes the next
 * checked value through the standard input change event.
 */
export function ToggleSwitch({
  checked,
  disabled = false,
  label,
  onChange,
  size = 'md',
  className,
  ...rootProps
}: ToggleSwitchProps) {
  const classes = [
    'toggle-switch',
    `toggle-switch--${size}`,
    checked ? 'is-checked' : '',
    checked ? 'is-active' : '',
    disabled ? 'is-disabled' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <label {...rootProps} className={classes}>
      {label ? <span className="toggle-switch__label">{label}</span> : null}
      <input
        className="toggle-switch__input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="toggle-switch__track" aria-hidden="true">
        <span className="toggle-switch__thumb" />
      </span>
    </label>
  );
}
