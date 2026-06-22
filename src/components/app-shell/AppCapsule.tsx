import type { ReactNode } from 'react';

export interface AppCapsuleProps {
  ariaLabel?: string;
  canNavigateBack: boolean;
  center?: ReactNode;
  menuBadgeCount?: number;
  menuOpen?: boolean;
  onNavigateBack: () => void;
  onOpenMenu?: () => void;
  settingsAction?: ReactNode;
}

function MenuIcon() {
  return (
    <svg className="app-capsule__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="app-capsule__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function AppCapsule({
  ariaLabel = '앱 캡슐 네비게이션',
  canNavigateBack,
  center,
  menuBadgeCount = 0,
  menuOpen = false,
  onNavigateBack,
  onOpenMenu,
  settingsAction,
}: AppCapsuleProps) {
  return (
    <nav className="app-capsule" aria-label={ariaLabel} data-app-capsule="root">
      <div className="app-capsule__leading" data-app-capsule-slot="leading">
        {onOpenMenu && (
          <button
            type="button"
            className="app-capsule__menu-button"
            aria-label="보조 메뉴 열기"
            aria-expanded={menuOpen}
            onClick={onOpenMenu}
          >
            <MenuIcon />
            {menuBadgeCount > 0 && <span className="app-capsule__menu-badge" aria-hidden="true" />}
          </button>
        )}
      </div>
      <div className="app-capsule__center" data-app-capsule-slot="center">
        {center}
      </div>
      <div className="app-capsule__actions" data-app-capsule-slot="actions">
        <button
          type="button"
          className="app-capsule__back-button"
          aria-label="이전 화면으로 돌아가기"
          disabled={!canNavigateBack}
          onClick={canNavigateBack ? onNavigateBack : undefined}
        >
          <BackIcon />
        </button>
        {settingsAction}
      </div>
    </nav>
  );
}
