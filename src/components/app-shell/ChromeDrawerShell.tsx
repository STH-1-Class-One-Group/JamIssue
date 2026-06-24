import { useEffect, useRef, useState } from 'react';
import type { ReactNode, UIEvent } from 'react';

export interface ChromeDrawerShellProps {
  ariaLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  title?: ReactNode;
}

export function ChromeDrawerShell({
  ariaLabel,
  children,
  footer,
  isOpen,
  onClose,
  side,
  title,
}: ChromeDrawerShellProps) {
  const scrollResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    return () => {
      if (scrollResetTimerRef.current) {
        clearTimeout(scrollResetTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const handleContentScroll = (_event: UIEvent<HTMLDivElement>) => {
    setIsScrolling(true);
    if (scrollResetTimerRef.current) {
      clearTimeout(scrollResetTimerRef.current);
    }
    scrollResetTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollResetTimerRef.current = null;
    }, 800);
  };

  return (
    <div className={`chrome-drawer chrome-drawer--${side}`} data-chrome-drawer={side}>
      <button
        type="button"
        className="chrome-drawer__overlay"
        aria-label={`${ariaLabel} 닫기`}
        onClick={onClose}
      />
      <aside
        className="chrome-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <header className="chrome-drawer__header">
          <div className="chrome-drawer__title">{title}</div>
          <button
            type="button"
            className="chrome-drawer__close"
            aria-label={`${ariaLabel} 닫기`}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div
          className={isScrolling ? 'chrome-drawer__content is-scrolling' : 'chrome-drawer__content'}
          onScroll={handleContentScroll}
        >
          {children}
        </div>
        {footer ? <footer className="chrome-drawer__footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}
