import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export type AppSurfaceVariant = 'page' | 'section' | 'panel' | 'subtle';

export interface AppSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  variant?: AppSurfaceVariant;
}

export function AppSurface({
  as: Component = 'section',
  children,
  className,
  variant = 'section',
  ...props
}: AppSurfaceProps) {
  return (
    <Component
      className={classNames('ui-app-surface', `ui-app-surface--${variant}`, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
