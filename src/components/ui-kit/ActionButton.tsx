import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export type ActionButtonSize = 'sm' | 'md' | 'lg';
export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: ActionButtonSize;
  variant?: ActionButtonVariant;
}

export function ActionButton({
  children,
  className,
  size = 'md',
  type = 'button',
  variant = 'secondary',
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={classNames('ui-action-button', `ui-action-button--${variant}`, `ui-action-button--${size}`, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
