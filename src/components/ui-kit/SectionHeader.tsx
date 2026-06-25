import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}

export function SectionHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
  ...props
}: SectionHeaderProps) {
  return (
    <header className={classNames('ui-section-header', className)} {...props}>
      <div className="ui-section-header__copy">
        {eyebrow ? <p className="ui-section-header__eyebrow">{eyebrow}</p> : null}
        <h2 className="ui-section-header__title">{title}</h2>
        {description ? <p className="ui-section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="ui-section-header__actions">{actions}</div> : null}
    </header>
  );
}
