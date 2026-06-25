import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export type MediaFrameRatio = 'square' | 'wide' | 'banner';

export interface MediaFrameProps extends HTMLAttributes<HTMLDivElement> {
  alt?: string;
  children?: ReactNode;
  fallback?: ReactNode;
  ratio?: MediaFrameRatio;
  src?: string | null;
}

export function MediaFrame({
  alt = '',
  children,
  className,
  fallback,
  ratio = 'wide',
  src,
  ...props
}: MediaFrameProps) {
  return (
    <div className={classNames('ui-media-frame', `ui-media-frame--${ratio}`, className)} {...props}>
      {src ? <img alt={alt} className="ui-media-frame__image" src={src} /> : children ?? fallback ?? null}
    </div>
  );
}
