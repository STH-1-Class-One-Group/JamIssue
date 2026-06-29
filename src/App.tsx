import { useState } from 'react';
import { AppMapStageView } from './components/AppMapStageView';
import { AppPageStage } from './components/AppPageStage';
import { MapFloatingNav } from './components/map-stage/MapFloatingNav';
import { MapPlaceSearch } from './components/map-stage/MapPlaceSearch';
import { AppChrome, AppShell } from './components/app-shell';
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
    notificationUtility,
    mapStageProps,
    pageStageProps,
  } = useAppStageProps(coordinator);
  const appChromeCenter = activeTab === 'map' ? (
    <MapFloatingNav
      activeCategory={mapStageProps.mapData.activeCategory}
      activeTourismDisplayGroup={mapStageProps.mapData.activeTourismDisplayGroup}
      showTourismInfo={mapStageProps.mapData.showTourismInfo}
      tourismFacets={mapStageProps.mapData.tourismFacets}
      tourismPlaces={mapStageProps.mapData.tourismPlaces}
      tourismSourceReady={mapStageProps.mapData.tourismSourceReady}
      tourismLoading={mapStageProps.mapData.tourismLoading}
      tourismError={mapStageProps.mapData.tourismError}
      onSelectCategory={mapStageProps.mapActions.setActiveCategory}
      onSelectTourismDisplayGroup={mapStageProps.mapActions.setActiveTourismDisplayGroup}
      onToggleTourismInfo={mapStageProps.mapActions.onToggleTourismInfo}
    />
  ) : undefined;
  const appChromeSecondary = activeTab === 'map' ? (
    <MapPlaceSearch
      places={dataState.places}
      onOpenPlace={mapStageProps.mapActions.onOpenPlace}
    />
  ) : undefined;
  const sessionUser = coordinator.sessionUser;

  return (
    <AppShell
      activeTab={activeTab}
      canNavigateBack={canNavigateBack}
      globalStatus={globalStatus ? {
        tone: globalStatus.tone,
        message: globalStatus.message,
        layout: activeTab === 'map' ? 'map' : 'page',
      } : null}
      chrome={(
        <AppChrome
          accountSettings={{
            providers: pageStageProps.myPageData.providers,
            profileSaving: pageStageProps.myPageData.profileSaving,
            profileError: pageStageProps.myPageData.profileError,
            isLoggingOut: pageStageProps.myPageData.isLoggingOut,
            onLinkProvider: pageStageProps.myPageActions.onLinkProvider,
            onSaveNickname: pageStageProps.myPageActions.onSaveNickname,
            onUploadAvatar: pageStageProps.myPageActions.onUploadAvatar,
            onDeleteAvatar: pageStageProps.myPageActions.onDeleteAvatar,
            onLogout: pageStageProps.myPageActions.onLogout,
          }}
          activeTab={activeTab}
          canNavigateBack={canNavigateBack}
          center={appChromeCenter}
          secondary={appChromeSecondary}
          globalUtility={globalUtility}
          notificationUtility={notificationUtility}
          onNavigateBack={handleNavigateBack}
          sessionUser={sessionUser}
        />
      )}
      headerMode="hidden"
      onBottomTabChange={handleBottomNavChange}
      onNavigateBack={handleNavigateBack}
      showEntrySplash
    >
      {activeTab === 'map' ? (
        <AppMapStageView {...mapStageProps} />
      ) : (
        <AppPageStage {...pageStageProps} />
      )}
    </AppShell>
  );
}
