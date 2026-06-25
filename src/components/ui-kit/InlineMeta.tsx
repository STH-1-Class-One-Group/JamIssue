import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface InlineMetaProps extends HTMLAttributes<HTMLDivElement> {
  items: ReactNode[];
  separator?: ReactNode;
}

export function InlineMeta({ className, items, separator = '·', ...props }: InlineMetaProps) {
  const visibleItems = items.filter((item) => item !== null && item !== undefined && item !== false);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className={classNames('ui-inline-meta', className)} {...props}>
      {visibleItems.map((item, index) => (
        <span className="ui-inline-meta__item" key={index}>
          {index > 0 ? <span className="ui-inline-meta__separator">{separator}</span> : null}
          {item}
        </span>
      ))}
    </div>
  );
}
