import { useState, type ReactNode } from 'react';
import type { AuthProvider, SessionUser } from '../../types/auth';
import type { Tab } from '../../types/core';
import { AppAccountSettingsSlot } from '../app-settings/AppAccountSettingsSlot';
import { AppSettingsButton } from '../app-settings/AppSettingsButton';
import { AppSettingsDrawer } from '../app-settings/AppSettingsDrawer';
import { NotificationDrawerContent, type NotificationDrawerContentProps } from '../notifications/NotificationDrawerContent';
import { AppCapsule } from './AppCapsule';
import { SideDrawer } from './SideDrawer';
import { resolveSecondaryMenuItems } from './secondaryMenu';

const TAB_LABELS: Record<Tab, string> = {
  map: '지도',
  event: '행사',
  feed: '피드',
  course: '코스',
  my: '마이',
};

export interface AppChromeProps {
  accountSettings?: {
    providers: AuthProvider[];
    profileSaving: boolean;
    profileError: string | null;
    isLoggingOut: boolean;
    onLinkProvider: (provider: AuthProvider) => void;
    onSaveNickname: (nickname: string) => Promise<void>;
    onUploadAvatar: (file: File) => Promise<void>;
    onDeleteAvatar: () => Promise<void>;
    onLogout: () => Promise<void>;
  };
  activeTab: Tab;
  canNavigateBack: boolean;
  center?: ReactNode;
  secondary?: ReactNode;
  globalUtility: {
    mapDisplayPreferences?: {
      showCuratedWithTourism: boolean;
      onShowCuratedWithTourismChange: (checked: boolean) => void;
    };
  };
  menuBadgeCount?: number;
  notificationUtility: NotificationDrawerContentProps;
  onNavigateBack: () => void;
  sessionUser: SessionUser | null;
}

export function AppChrome({
  accountSettings,
  activeTab,
  canNavigateBack,
  center,
  secondary,
  globalUtility,
  menuBadgeCount,
  notificationUtility,
  onNavigateBack,
  sessionUser,
}: AppChromeProps) {
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const resolvedMenuBadgeCount = menuBadgeCount ?? notificationUtility.unreadCount;
  const secondaryMenuItems = resolveSecondaryMenuItems({
    canOpenAdminTools: Boolean(sessionUser?.isAdmin),
    isAdmin: Boolean(sessionUser?.isAdmin),
    unreadNotificationCount: notificationUtility.unreadCount,
  });
  const capsuleCenter = center ?? (
    <span className="app-capsule__page-title" data-app-capsule-center-tab={activeTab}>
      {TAB_LABELS[activeTab]}
    </span>
  );
  const accountSettingsContent = sessionUser && accountSettings ? (
    <AppAccountSettingsSlot
      sessionUser={sessionUser}
      providers={accountSettings.providers}
      profileSaving={accountSettings.profileSaving}
      profileError={accountSettings.profileError}
      isLoggingOut={accountSettings.isLoggingOut}
      onLinkProvider={accountSettings.onLinkProvider}
      onSaveNickname={accountSettings.onSaveNickname}
      onUploadAvatar={accountSettings.onUploadAvatar}
      onDeleteAvatar={accountSettings.onDeleteAvatar}
      onLogout={accountSettings.onLogout}
    />
  ) : null;

  const toggleSideDrawer = () => {
    setIsSideDrawerOpen((isOpen) => {
      if (!isOpen) {
        setIsSettingsDrawerOpen(false);
      }
      return !isOpen;
    });
  };

  const toggleSettingsDrawer = () => {
    setIsSettingsDrawerOpen((isOpen) => {
      if (!isOpen) {
        setIsSideDrawerOpen(false);
      }
      return !isOpen;
    });
  };

  return (
    <>
      <AppCapsule
        canNavigateBack={canNavigateBack}
        center={capsuleCenter}
        menuBadgeCount={resolvedMenuBadgeCount}
        menuOpen={isSideDrawerOpen}
        onNavigateBack={onNavigateBack}
        onOpenMenu={toggleSideDrawer}
        settingsAction={(
          <AppSettingsButton
            isOpen={isSettingsDrawerOpen}
            onToggle={toggleSettingsDrawer}
          />
        )}
      />
      {secondary ? (
        <div className="app-chrome__secondary" data-app-chrome-secondary="true">
          {secondary}
        </div>
      ) : null}
      <SideDrawer
        isOpen={isSideDrawerOpen}
        items={secondaryMenuItems}
        onClose={() => setIsSideDrawerOpen(false)}
        renderItemContent={(itemId) => (
          itemId === 'notification'
            ? <NotificationDrawerContent {...notificationUtility} onClose={() => setIsSideDrawerOpen(false)} />
            : null
        )}
      />
      <AppSettingsDrawer
        accountSettings={accountSettingsContent}
        isOpen={isSettingsDrawerOpen}
        mapDisplayPreferences={globalUtility.mapDisplayPreferences}
        onClose={() => setIsSettingsDrawerOpen(false)}
      />
    </>
  );
}
