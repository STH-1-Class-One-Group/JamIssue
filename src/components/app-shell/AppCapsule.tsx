import type { ReactNode } from 'react';
import { AppSettingsPanel, type AppSettingsPanelProps } from '../app-settings/AppSettingsPanel';

export interface AppCapsuleProps {
  ariaLabel?: string;
  canNavigateBack: boolean;
  center?: ReactNode;
  globalUtility: AppSettingsPanelProps;
  menuOpen?: boolean;
  notificationOpen?: boolean;
  notificationUnreadCount?: number;
  onNavigateBack: () => void;
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
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

function BellIcon() {
  return (
    <svg className="app-capsule__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.75a4.25 4.25 0 0 0-4.25 4.25v2.23c0 .92-.3 1.81-.86 2.54l-1.1 1.47a1 1 0 0 0 .8 1.6h11.82a1 1 0 0 0 .8-1.6l-1.1-1.47a4.24 4.24 0 0 1-.86-2.54V9A4.25 4.25 0 0 0 12 4.75Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.25 18.25a2 2 0 0 0 3.5 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function AppCapsule({
  ariaLabel = '앱 캡슐 내비게이션',
  canNavigateBack,
  center,
  globalUtility,
  menuOpen = false,
  notificationOpen = false,
  notificationUnreadCount = 0,
  onNavigateBack,
  onOpenMenu,
  onOpenNotifications,
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
          </button>
        )}
        {onOpenNotifications && (
          <button
            type="button"
            className={notificationOpen ? 'app-capsule__notification-button is-complete' : 'app-capsule__notification-button'}
            aria-label="알림 열기"
            aria-expanded={notificationOpen}
            onClick={onOpenNotifications}
          >
            <BellIcon />
            {notificationUnreadCount > 0 && <span className="notification-bell__dot" aria-hidden="true" />}
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
        <AppSettingsPanel {...globalUtility} />
      </div>
    </nav>
  );
}
