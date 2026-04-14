import { updateMapViewportInUrl } from './useAppRouteState';
import type { useAppShellCoordinator } from './useAppShellCoordinator';

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
    viewModels,
  } = state;

  return {
    mapData: {
      activeCategory,
      filteredPlaces: viewModels.filteredPlaces,
      festivals,
      selectedPlace: viewModels.selectedPlace,
      selectedFestival: viewModels.selectedFestival,
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
    },
    mapActions: {
      setActiveCategory,
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
