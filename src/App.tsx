import { useState } from 'react';
import { AppMapStageView } from './components/AppMapStageView';
import { AppPageStage } from './components/AppPageStage';
import { AppShell } from './components/app-shell/AppShell';
import {
  useAppRouteState,
  getInitialMapViewport,
} from './hooks/app-route/useAppRouteState';
import { useAppDataState } from './hooks/useAppDataState';
import { useAppPageRuntimeState } from './hooks/useAppPageRuntimeState';
import { useAppShellRuntimeState } from './hooks/useAppShellRuntimeState';
import { useAppShellCoordinator } from './hooks/app-coordinator/useAppShellCoordinator';
import { useAppStageProps } from './hooks/app-stage-props/useAppStageProps';
import { useAuthDomainState } from './hooks/useAuthDomainState';
import { useMapDomainState } from './hooks/useMapDomainState';
import { useMyPageDomainState } from './hooks/useMyPageDomainState';
import { useReturnViewDomainState } from './hooks/useReturnViewDomainState';
import { useReviewDomainState } from './hooks/useReviewDomainState';

export default function App() {
  const routeState = useAppRouteState();

  const [initialMapViewport] = useState(getInitialMapViewport);

  const domainState = {
    auth: useAuthDomainState(),
    map: useMapDomainState(),
    myPage: useMyPageDomainState(),
    returnView: useReturnViewDomainState(),
    review: useReviewDomainState(),
  };

  const shellRuntimeState = useAppShellRuntimeState();
  const pageRuntimeState = useAppPageRuntimeState();
  const dataState = useAppDataState(routeState.selectedPlaceId);
  const coordinator = useAppShellCoordinator({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
    initialMapViewport,
  });
  const {
    activeTab,
    canNavigateBack,
    handleNavigateBack,
    handleBottomNavChange,
    globalStatus,
    globalUtility,
    mapStageProps,
    pageStageProps,
  } = useAppStageProps(coordinator);
  const bottomTabHidden = activeTab === 'map' && (
    (Boolean(mapStageProps.mapData.selectedPlace) && mapStageProps.mapData.drawerState === 'full') ||
    (Boolean(mapStageProps.mapData.selectedFestival) && mapStageProps.mapData.drawerState === 'full') ||
    (Boolean(mapStageProps.mapData.selectedTourismPlace) && mapStageProps.mapData.tourismSheetState === 'full')
  );
  const headerMode = activeTab === 'map' ? 'hidden' : 'default';

  return (
    <AppShell
      activeTab={activeTab}
      bottomTabHidden={bottomTabHidden}
      canNavigateBack={canNavigateBack}
      globalStatus={globalStatus ? {
        tone: globalStatus.tone,
        message: globalStatus.message,
        layout: activeTab === 'map' ? 'map' : 'page',
      } : null}
      globalUtility={globalUtility}
      headerMode={headerMode}
      onBottomTabChange={handleBottomNavChange}
      onNavigateBack={handleNavigateBack}
      showEntrySplash
    >
      {activeTab === 'map' ? (
        <AppMapStageView {...mapStageProps} globalUtility={globalUtility} />
      ) : (
        <AppPageStage {...pageStageProps} />
      )}
    </AppShell>
  );
}
