import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  title: ReactNode;
}

export function SectionHeader({
  actions,
  className,
  description,
  eyebrow,
  headingLevel = 2,
  title,
  ...props
}: SectionHeaderProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <header className={classNames('ui-section-header', className)} {...props}>
      <div className="ui-section-header__copy">
        {eyebrow ? <p className="ui-section-header__eyebrow">{eyebrow}</p> : null}
        <Heading className="ui-section-header__title">{title}</Heading>
        {description ? <p className="ui-section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="ui-section-header__actions">{actions}</div> : null}
    </header>
  );
}
