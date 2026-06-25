import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  count?: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
}

export function FilterChip({
  children,
  className,
  count,
  icon,
  selected = false,
  type = 'button',
  ...props
}: FilterChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={classNames('ui-filter-chip', selected && 'ui-filter-chip--selected', className)}
      type={type}
      {...props}
    >
      {icon ? <span className="ui-filter-chip__icon">{icon}</span> : null}
      <span className="ui-filter-chip__label">{children}</span>
      {count ? <span className="ui-filter-chip__count">{count}</span> : null}
    </button>
  );
}
