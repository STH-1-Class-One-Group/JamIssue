import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface MetricTileProps extends HTMLAttributes<HTMLDivElement> {
  detail?: ReactNode;
  label: ReactNode;
  value: ReactNode;
}

export function MetricTile({ className, detail, label, value, ...props }: MetricTileProps) {
  return (
    <div className={classNames('ui-metric-tile', className)} {...props}>
      <strong className="ui-metric-tile__value">{value}</strong>
      <span className="ui-metric-tile__label">{label}</span>
      {detail ? <span className="ui-metric-tile__detail">{detail}</span> : null}
    </div>
  );
}
