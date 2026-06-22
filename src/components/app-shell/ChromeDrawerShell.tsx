import type { ReactNode } from 'react';

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
  if (!isOpen) {
    return null;
  }

  const legacyRootClass = side === 'left' ? 'side-drawer' : 'app-settings-drawer';
  const legacyOverlayClass = side === 'left' ? 'side-drawer__overlay' : 'app-settings-drawer__overlay';
  const legacyPanelClass = side === 'left' ? 'side-drawer__panel' : 'app-settings-drawer__panel';
  const legacyCloseClass = side === 'left' ? 'side-drawer__close' : 'app-settings-drawer__close';

  return (
    <div className={`chrome-drawer chrome-drawer--${side} ${legacyRootClass}`} data-chrome-drawer={side}>
      <button
        type="button"
        className={`chrome-drawer__overlay ${legacyOverlayClass}`}
        aria-label={`${ariaLabel} 닫기`}
        onClick={onClose}
      />
      <aside
        className={`chrome-drawer__panel ${legacyPanelClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <header className="chrome-drawer__header">
          <div className="chrome-drawer__title">{title}</div>
          <button
            type="button"
            className={`chrome-drawer__close ${legacyCloseClass}`}
            aria-label={`${ariaLabel} 닫기`}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="chrome-drawer__content">{children}</div>
        {footer ? <footer className="chrome-drawer__footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}
