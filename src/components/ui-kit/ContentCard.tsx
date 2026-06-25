import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { classNames } from './classNames';

export type ContentCardVariant = 'default' | 'soft' | 'outlined';

export interface ContentCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  interactive?: boolean;
  variant?: ContentCardVariant;
}

export const ContentCard = forwardRef<HTMLElement, ContentCardProps>(function ContentCard({
  as: Component = 'article',
  children,
  className,
  interactive = false,
  variant = 'default',
  ...props
}, ref) {
  return (
    <Component
      className={classNames(
        'ui-content-card',
        `ui-content-card--${variant}`,
        interactive && 'ui-content-card--interactive',
        className,
      )}
      data-ui-content-card=""
      ref={ref}
      {...props}
    >
      {children}
    </Component>
  );
});
