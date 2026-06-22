import { useState } from 'react';
import type { Tab } from '../types/core';
import type { SessionUser } from '../types/auth';
import { bottomNavItems } from './BottomNav';
import type { AppMapStageViewProps } from './AppMapStageView';
import { AppTopNavigationDrawers } from './AppTopNavigationDrawers';
import { AppCapsule } from './app-shell/AppCapsule';
import type { AppSettingsPanelProps } from './app-settings/AppSettingsPanel';
import { MapFloatingNav } from './map-stage/MapFloatingNav';
import type { NotificationDrawerContentProps } from './notifications/NotificationDrawerContent';

interface AppTopNavigationProps {
  activeTab: Tab;
  canNavigateBack: boolean;
  globalUtility: AppSettingsPanelProps;
  mapActions: AppMapStageViewProps['mapActions'];
  mapData: AppMapStageViewProps['mapData'];
  notificationUtility: NotificationDrawerContentProps;
  onNavigateBack: () => void;
  sessionUser: SessionUser | null;
}

export function AppTopNavigation({
  activeTab,
  canNavigateBack,
  globalUtility,
  mapActions,
  mapData,
  notificationUtility,
  onNavigateBack,
  sessionUser,
}: AppTopNavigationProps) {
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const activeBottomNavItem = bottomNavItems.find((item) => item.key === activeTab);
  const center = activeTab === 'map' ? (
    <MapFloatingNav
      activeCategory={mapData.activeCategory}
      activeTourismDisplayGroup={mapData.activeTourismDisplayGroup}
      showTourismInfo={mapData.showTourismInfo}
      tourismFacets={mapData.tourismFacets}
      tourismPlaces={mapData.tourismPlaces}
      tourismSourceReady={mapData.tourismSourceReady}
      tourismLoading={mapData.tourismLoading}
      tourismError={mapData.tourismError}
      onSelectCategory={mapActions.setActiveCategory}
      onSelectTourismDisplayGroup={mapActions.setActiveTourismDisplayGroup}
      onToggleTourismInfo={mapActions.onToggleTourismInfo}
    />
  ) : (
    <span className="app-capsule__page-title" data-app-capsule-center-tab={activeTab}>
      {activeBottomNavItem?.label}
    </span>
  );

  return (
    <>
      <AppCapsule
        canNavigateBack={canNavigateBack}
        center={center}
        globalUtility={globalUtility}
        menuBadgeCount={notificationUtility.unreadCount}
        menuOpen={isSideDrawerOpen}
        onNavigateBack={onNavigateBack}
        onOpenMenu={() => setIsSideDrawerOpen(true)}
      />
      <AppTopNavigationDrawers
        isSideDrawerOpen={isSideDrawerOpen}
        notificationUtility={notificationUtility}
        onCloseSideDrawer={() => setIsSideDrawerOpen(false)}
        sessionUser={sessionUser}
      />
    </>
  );
}
