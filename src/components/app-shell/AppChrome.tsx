import { useState, type ReactNode } from 'react';
import type { SessionUser } from '../../types/auth';
import type { Tab } from '../../types/core';
import { AppSettingsButton } from '../app-settings/AppSettingsButton';
import { AppSettingsDrawer } from '../app-settings/AppSettingsDrawer';
import type { AppSettingsPanelProps } from '../app-settings/AppSettingsPanel';
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
  activeTab: Tab;
  canNavigateBack: boolean;
  center?: ReactNode;
  globalUtility: AppSettingsPanelProps;
  menuBadgeCount?: number;
  notificationUtility: NotificationDrawerContentProps;
  onNavigateBack: () => void;
  sessionUser: SessionUser | null;
}

export function AppChrome({
  activeTab,
  canNavigateBack,
  center,
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

  return (
    <>
      <AppCapsule
        canNavigateBack={canNavigateBack}
        center={capsuleCenter}
        menuBadgeCount={resolvedMenuBadgeCount}
        menuOpen={isSideDrawerOpen}
        onNavigateBack={onNavigateBack}
        onOpenMenu={() => setIsSideDrawerOpen(true)}
        settingsAction={(
          <AppSettingsButton
            isOpen={isSettingsDrawerOpen}
            onOpen={() => setIsSettingsDrawerOpen(true)}
          />
        )}
      />
      <SideDrawer
        isOpen={isSideDrawerOpen}
        items={secondaryMenuItems}
        onClose={() => setIsSideDrawerOpen(false)}
        renderItemContent={(itemId) => (
          itemId === 'notification' ? <NotificationDrawerContent {...notificationUtility} onClose={() => setIsSideDrawerOpen(false)} /> : null
        )}
      />
      <AppSettingsDrawer
        isOpen={isSettingsDrawerOpen}
        mapDisplayPreferences={globalUtility.mapDisplayPreferences}
        onClose={() => setIsSettingsDrawerOpen(false)}
      />
    </>
  );
}
