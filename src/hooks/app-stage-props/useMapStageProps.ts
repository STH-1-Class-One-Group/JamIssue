import { updateMapViewportInUrl } from '../app-route/useAppRouteState';
import type { useAppShellCoordinator } from '../app-coordinator/useAppShellCoordinator';

type AppShellCoordinatorState = ReturnType<typeof useAppShellCoordinator>;

export function useMapStageProps(state: AppShellCoordinatorState) {
  const {
    activeCategory,
    currentPosition,
    festivals,
    initialMapViewport,
    mapLocationFocusKey,
    mapLocationStatus,
    mapStageActions,
    reviewActions,
    reviewError,
    reviewSubmitting,
    selectedPlaceReviews,
    selectedRoutePreview,
    sessionUser,
    setActiveCategory,
    stampActionMessage,
    stampActionStatus,
    setSelectedTourismPlaceId,
    setShowTourismInfo,
    setTourismSheetState,
    selectedTourismPlaceId,
    showTourismInfo,
    tourismError,
    tourismLoading,
    tourismPlaces,
    tourismSheetState,
    tourismSourceReady,
    viewModels,
  } = state;
  const selectedTourismPlace = tourismPlaces.find((place) => place.id === selectedTourismPlaceId) ?? null;

  return {
    mapData: {
      activeCategory,
      filteredPlaces: viewModels.filteredPlaces,
      festivals,
      selectedPlace: viewModels.selectedPlace,
      selectedFestival: viewModels.selectedFestival,
      selectedTourismPlace,
      currentPosition,
      mapLocationStatus,
      mapLocationFocusKey,
      drawerState: state.drawerState,
      sessionUser,
      selectedPlaceReviews,
      routePreview: selectedRoutePreview,
      routePreviewPlaces: viewModels.routePreviewPlaces,
      visitCount: viewModels.visitCount,
      latestStamp: viewModels.latestStamp,
      todayStamp: viewModels.todayStamp,
      stampActionStatus,
      stampActionMessage,
      reviewProofMessage: viewModels.reviewProofMessage,
      reviewError,
      reviewSubmitting,
      canCreateReview: viewModels.canCreateReview,
      hasCreatedReviewToday: viewModels.hasCreatedReviewToday,
      initialMapViewport,
      showTourismInfo,
      tourismPlaces,
      tourismSourceReady,
      tourismLoading,
      tourismError,
      tourismSheetState,
    },
    mapActions: {
      setActiveCategory,
      onToggleTourismInfo: () => setShowTourismInfo((current) => !current),
      onOpenTourismPlace: (tourismPlaceId: string) => {
        const tourismPlace = tourismPlaces.find((place) => place.id === tourismPlaceId);
        if (tourismPlace?.isCurated && tourismPlace.curatedPlace) {
          mapStageActions.handleMapOpenPlace(tourismPlace.curatedPlace.id);
          return;
        }
        setSelectedTourismPlaceId(tourismPlaceId);
        setTourismSheetState('partial');
      },
      onCloseTourismInfoSheet: () => setSelectedTourismPlaceId(null),
      onExpandTourismInfoSheet: () => setTourismSheetState('full'),
      onCollapseTourismInfoSheet: () => setTourismSheetState('partial'),
      onOpenPlaceFeed: mapStageActions.handleMapOpenPlaceFeed,
      onOpenPlace: mapStageActions.handleMapOpenPlace,
      onOpenRoutePreviewPlace: mapStageActions.handleMapOpenRoutePreviewPlace,
      onOpenFestival: mapStageActions.handleMapOpenFestival,
      onCloseDrawer: state.closeDrawer,
      onClearRoutePreview: mapStageActions.handleClearRoutePreview,
      onExpandPlaceDrawer: mapStageActions.handleExpandPlaceDrawer,
      onCollapsePlaceDrawer: mapStageActions.handleCollapsePlaceDrawer,
      onExpandFestivalDrawer: mapStageActions.handleExpandFestivalDrawer,
      onCollapseFestivalDrawer: mapStageActions.handleCollapseFestivalDrawer,
      onRequestLogin: mapStageActions.handleRequestLogin,
      onClaimStamp: state.handleClaimStamp,
      onCreateReview: reviewActions.handleCreateReview,
      onLocateCurrentPosition: mapStageActions.handleLocateCurrentPosition,
      onMapViewportChange: updateMapViewportInUrl,
    },
  };
}
