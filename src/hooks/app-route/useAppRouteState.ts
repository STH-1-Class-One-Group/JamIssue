import { useCallback, useEffect } from 'react';
import { useAppMapStore } from '../../store/app-map-store';
import { useAppRouteStore } from '../../store/app-route-store';
import type { Tab } from '../../types/core';
import {
  clearAuthQueryParams,
  getInitialRouteState,
  getInitialNotice,
  getLoginReturnUrl,
} from './authQueryState';
import {
  getInitialMapViewport,
  updateMapViewportInUrl,
  type MapViewport,
} from './mapViewportState';
import {
  buildHistoryState,
  buildRouteUrl,
  getRoutePreviewFromHistoryState,
  type AppHistoryState,
  type RouteState,
  type RouteStateCommitOptions,
} from './routeHistoryState';
import { buildCommitRouteState } from './routeStateActions';
import { initializeRouteStore } from './routeStoreInitialization';

export {
  buildHistoryState,
  buildRouteUrl,
  clearAuthQueryParams,
  getInitialMapViewport,
  getInitialRouteState,
  getInitialNotice,
  getLoginReturnUrl,
  updateMapViewportInUrl,
};
export type { AppHistoryState, MapViewport, RouteState, RouteStateCommitOptions };
export { getRoutePreviewFromHistoryState, initializeRouteStore };

export function useAppRouteState() {
  initializeRouteStore();

  const activeTab = useAppRouteStore((state) => state.activeTab);
  const drawerState = useAppRouteStore((state) => state.drawerState);
  const selectedPlaceId = useAppRouteStore((state) => state.selectedPlaceId);
  const selectedFestivalId = useAppRouteStore((state) => state.selectedFestivalId);
  const setActiveTab = useAppRouteStore((state) => state.setActiveTab);
  const setDrawerState = useAppRouteStore((state) => state.setDrawerState);
  const setSelectedPlaceId = useAppRouteStore((state) => state.setSelectedPlaceId);
  const setSelectedFestivalId = useAppRouteStore((state) => state.setSelectedFestivalId);
  const selectedRoutePreview = useAppMapStore((state) => state.selectedRoutePreview);
  const setSelectedRoutePreview = useAppMapStore((state) => state.setSelectedRoutePreview);

  const commitRouteState = useCallback(
    buildCommitRouteState({
      setActiveTab,
      setDrawerState,
      setSelectedPlaceId,
      setSelectedFestivalId,
      setSelectedRoutePreview,
      getSelectedRoutePreview: () => selectedRoutePreview,
    }),
    [selectedRoutePreview, setActiveTab, setDrawerState, setSelectedFestivalId, setSelectedPlaceId, setSelectedRoutePreview],
  );

  const goToTab = useCallback(
    (nextTab: Tab, mode: 'push' | 'replace' = 'push') => {
      commitRouteState(
        {
          tab: nextTab,
          placeId: null,
          festivalId: null,
          drawerState: 'closed',
        },
        mode,
        { routePreview: null },
      );
    },
    [commitRouteState],
  );

  const openPlace = useCallback(
    (placeId: string) => {
      commitRouteState({
        tab: 'map',
        placeId,
        festivalId: null,
        drawerState: 'peek',
      });
    },
    [commitRouteState],
  );

  const openFestival = useCallback(
    (festivalId: string) => {
      commitRouteState({
        tab: 'map',
        placeId: null,
        festivalId,
        drawerState: 'peek',
      });
    },
    [commitRouteState],
  );

  const closeDrawer = useCallback(() => {
    commitRouteState({
      tab: 'map',
      placeId: null,
      festivalId: null,
      drawerState: 'closed',
    });
  }, [commitRouteState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = (event: PopStateEvent) => {
      commitRouteState(
        getInitialRouteState(),
        'replace',
        { routePreview: getRoutePreviewFromHistoryState(event.state) },
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [commitRouteState]);

  return {
    activeTab,
    drawerState,
    selectedPlaceId,
    selectedFestivalId,
    setSelectedPlaceId,
    setSelectedFestivalId,
    commitRouteState,
    goToTab,
    openPlace,
    openFestival,
    closeDrawer,
  };
}
