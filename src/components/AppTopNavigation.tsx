import { useState } from 'react';
import type { Tab } from '../types/core';
import { bottomNavItems } from './BottomNav';
import type { AppMapStageViewProps } from './AppMapStageView';
import { AppCapsule } from './app-shell/AppCapsule';
import { SideDrawer } from './app-shell/SideDrawer';
import type { GlobalSettingsMenuProps } from './GlobalSettingsMenu';
import { MapFloatingNav } from './map-stage/MapFloatingNav';

interface AppTopNavigationProps {
  activeTab: Tab;
  canNavigateBack: boolean;
  globalUtility: GlobalSettingsMenuProps;
  mapActions: AppMapStageViewProps['mapActions'];
  mapData: AppMapStageViewProps['mapData'];
  onNavigateBack: () => void;
}

export function AppTopNavigation({
  activeTab,
  canNavigateBack,
  globalUtility,
  mapActions,
  mapData,
  onNavigateBack,
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
        menuOpen={isSideDrawerOpen}
        onNavigateBack={onNavigateBack}
        onOpenMenu={() => setIsSideDrawerOpen(true)}
      />
      <SideDrawer isOpen={isSideDrawerOpen} onClose={() => setIsSideDrawerOpen(false)} />
    </>
  );
}
