import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  actions?: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}

export function EmptyState({ actions, className, description, title, ...props }: EmptyStateProps) {
  return (
    <section className={classNames('ui-empty-state', className)} {...props}>
      <h2 className="ui-empty-state__title">{title}</h2>
      {description ? <p className="ui-empty-state__description">{description}</p> : null}
      {actions ? <div className="ui-empty-state__actions">{actions}</div> : null}
    </section>
  );
}
