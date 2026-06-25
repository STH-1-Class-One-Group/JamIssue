import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export type ContentCardVariant = 'default' | 'soft' | 'outlined';

export interface ContentCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  interactive?: boolean;
  variant?: ContentCardVariant;
}

export function ContentCard({
  as: Component = 'article',
  children,
  className,
  interactive = false,
  variant = 'default',
  ...props
}: ContentCardProps) {
  return (
    <Component
      className={classNames(
        'ui-content-card',
        `ui-content-card--${variant}`,
        interactive && 'ui-content-card--interactive',
        className,
      )}
      data-ui-content-card=""
      {...props}
    >
      {children}
    </Component>
  );
}
