import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface ListItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  actions?: ReactNode;
  as?: ElementType;
  badges?: ReactNode;
  description?: ReactNode;
  media?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
}

export function ListItem({
  actions,
  as: Component = 'article',
  badges,
  className,
  description,
  media,
  meta,
  title,
  ...props
}: ListItemProps) {
  return (
    <Component className={classNames('ui-list-item', className)} {...props}>
      {media ? <div className="ui-list-item__media">{media}</div> : null}
      <div className="ui-list-item__body">
        <div className="ui-list-item__header">
          <div className="ui-list-item__title-block">
            <h3 className="ui-list-item__title">{title}</h3>
            {meta ? <div className="ui-list-item__meta">{meta}</div> : null}
          </div>
          {actions ? <div className="ui-list-item__actions">{actions}</div> : null}
        </div>
        {description ? <p className="ui-list-item__description">{description}</p> : null}
        {badges ? <div className="ui-list-item__badges">{badges}</div> : null}
      </div>
    </Component>
  );
}
