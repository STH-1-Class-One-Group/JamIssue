import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  error?: ReactNode;
  helper?: ReactNode;
  htmlFor?: string;
  label: ReactNode;
}

export function FormField({
  children,
  className,
  error,
  helper,
  htmlFor,
  label,
  ...props
}: FormFieldProps) {
  return (
    <div className={classNames('ui-form-field', Boolean(error) && 'ui-form-field--error', className)} {...props}>
      <label className="ui-form-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="ui-form-field__control">{children}</div>
      {helper ? <p className="ui-form-field__helper">{helper}</p> : null}
      {error ? <p className="ui-form-field__error">{error}</p> : null}
    </div>
  );
}
