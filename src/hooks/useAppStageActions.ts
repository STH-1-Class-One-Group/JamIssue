import { useCallback } from 'react';
import type { RouteStateCommitOptions } from './useAppRouteState';
import type { DrawerState, Place, RoutePreview } from '../types';

interface UseAppStageActionsParams {
  selectedPlace: Place | null;
  selectedFestival: { id: string } | null;
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  drawerState: DrawerState;
  selectedRoutePreview: RoutePreview | null;
  setSelectedRoutePreview: (preview: RoutePreview | null) => void;
  commitRouteState: (
    nextState: { tab: 'map'; placeId: string | null; festivalId: string | null; drawerState: DrawerState },
    historyMode?: 'push' | 'replace',
    options?: RouteStateCommitOptions,
  ) => void;
  goToTab: (tab: 'my') => void;
  handleOpenPlaceFeedWithReturn: (placeId: string) => void;
  refreshCurrentPosition: (shouldFocusMap: boolean) => Promise<void>;
}

export function useAppStageActions({
  selectedPlace,
  selectedFestival,
  selectedPlaceId,
  selectedFestivalId,
  drawerState,
  selectedRoutePreview,
  setSelectedRoutePreview,
  commitRouteState,
  goToTab,
  handleOpenPlaceFeedWithReturn,
  refreshCurrentPosition,
}: UseAppStageActionsParams) {
  const handleMapOpenPlaceFeed = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    handleOpenPlaceFeedWithReturn(selectedPlace.id);
  }, [handleOpenPlaceFeedWithReturn, selectedPlace]);

  const handleMapOpenPlace = useCallback((placeId: string) => {
    setSelectedRoutePreview(null);
    commitRouteState({ tab: 'map', placeId, festivalId: null, drawerState: 'partial' }, 'push', { routePreview: null });
  }, [commitRouteState, setSelectedRoutePreview]);

  const handleMapOpenFestival = useCallback((festivalId: string) => {
    setSelectedRoutePreview(null);
    commitRouteState({ tab: 'map', placeId: null, festivalId, drawerState: 'partial' }, 'push', { routePreview: null });
  }, [commitRouteState, setSelectedRoutePreview]);

  const handleMapOpenRoutePreviewPlace = useCallback((placeId: string) => {
    commitRouteState(
      { tab: 'map', placeId, festivalId: null, drawerState: 'partial' },
      'push',
      { routePreview: selectedRoutePreview },
    );
  }, [commitRouteState, selectedRoutePreview]);

  const handleClearRoutePreview = useCallback(() => {
    setSelectedRoutePreview(null);
    commitRouteState(
      { tab: 'map', placeId: selectedPlaceId, festivalId: selectedFestivalId, drawerState },
      'replace',
      { routePreview: null },
    );
  }, [commitRouteState, drawerState, selectedFestivalId, selectedPlaceId, setSelectedRoutePreview]);

  const handleExpandPlaceDrawer = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    commitRouteState({ tab: 'map', placeId: selectedPlace.id, festivalId: null, drawerState: 'full' }, 'replace');
  }, [commitRouteState, selectedPlace]);

  const handleCollapsePlaceDrawer = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    commitRouteState({ tab: 'map', placeId: selectedPlace.id, festivalId: null, drawerState: 'partial' }, 'replace');
  }, [commitRouteState, selectedPlace]);

  const handleExpandFestivalDrawer = useCallback(() => {
    if (!selectedFestival) {
      return;
    }
    commitRouteState({ tab: 'map', placeId: null, festivalId: selectedFestival.id, drawerState: 'full' }, 'replace');
  }, [commitRouteState, selectedFestival]);

  const handleCollapseFestivalDrawer = useCallback(() => {
    if (!selectedFestival) {
      return;
    }
    commitRouteState({ tab: 'map', placeId: null, festivalId: selectedFestival.id, drawerState: 'partial' }, 'replace');
  }, [commitRouteState, selectedFestival]);

  const handleRequestLogin = useCallback(() => {
    goToTab('my');
  }, [goToTab]);

  const handleLocateCurrentPosition = useCallback(() => {
    void refreshCurrentPosition(true);
  }, [refreshCurrentPosition]);

  return {
    handleMapOpenPlaceFeed,
    handleMapOpenPlace,
    handleMapOpenFestival,
    handleMapOpenRoutePreviewPlace,
    handleClearRoutePreview,
    handleExpandPlaceDrawer,
    handleCollapsePlaceDrawer,
    handleExpandFestivalDrawer,
    handleCollapseFestivalDrawer,
    handleRequestLogin,
    handleLocateCurrentPosition,
  };
}
