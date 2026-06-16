import type { ReactNode } from 'react';
import { GlobalSettingsMenu, type GlobalSettingsMenuProps } from '../GlobalSettingsMenu';

export interface AppCapsuleProps {
  ariaLabel?: string;
  canNavigateBack: boolean;
  center?: ReactNode;
  globalUtility: GlobalSettingsMenuProps;
  menuOpen?: boolean;
  onNavigateBack: () => void;
  onOpenMenu?: () => void;
}

export function AppCapsule({
  ariaLabel = '앱 캡슐 내비게이션',
  canNavigateBack,
  center,
  globalUtility,
  menuOpen = false,
  onNavigateBack,
  onOpenMenu,
}: AppCapsuleProps) {
  return (
    <nav className="app-capsule" aria-label={ariaLabel} data-app-capsule="root">
      <div className="app-capsule__leading" data-app-capsule-slot="leading">
        <button
          type="button"
          className="app-capsule__menu-button"
          aria-label="메뉴 열기"
          aria-expanded={onOpenMenu ? menuOpen : undefined}
          disabled={!onOpenMenu}
          onClick={onOpenMenu}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <button
          type="button"
          className="app-capsule__back-button"
          aria-label="이전 화면으로 돌아가기"
          disabled={!canNavigateBack}
          onClick={canNavigateBack ? onNavigateBack : undefined}
        >
          <span aria-hidden="true">←</span>
        </button>
      </div>
      <div className="app-capsule__center" data-app-capsule-slot="center">
        {center}
      </div>
      <div className="app-capsule__actions" data-app-capsule-slot="actions">
        <GlobalSettingsMenu {...globalUtility} notificationPanelMode="floating" />
      </div>
    </nav>
  );
}
