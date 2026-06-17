import type { ReactNode } from 'react';

export interface SideDrawerProps {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function SideDrawer({ children, isOpen, onClose }: SideDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="side-drawer" data-side-drawer="root">
      <button
        type="button"
        className="side-drawer__overlay"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />
      <aside
        className="side-drawer__panel"
        role="dialog"
        aria-label="사이드 메뉴"
        aria-modal="true"
      >
        <div className="side-drawer__control-row">
          <button
            type="button"
            className="side-drawer__close"
            aria-label="메뉴 닫기"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="side-drawer__content" data-side-drawer-slot="content" data-testid="side-drawer-content">
          {children}
        </div>
      </aside>
    </div>
  );
}
