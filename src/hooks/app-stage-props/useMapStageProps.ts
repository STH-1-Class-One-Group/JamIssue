import { updateMapViewportInUrl } from '../app-route/useAppRouteState';
import { shouldShowCuratedMapItems } from '../../lib/appPreferences';
import { filterTourismPlacesByDisplayGroup } from '../../lib/tourismTaxonomy';
import type { TourismDisplayGroupFilter } from '../../tourismTypes';
import type { useAppShellCoordinator } from '../app-coordinator/useAppShellCoordinator';

type AppShellCoordinatorState = ReturnType<typeof useAppShellCoordinator>;

export function useMapStageProps(state: AppShellCoordinatorState) {
  const {
    activeCategory,
    activeTourismDisplayGroup,
    currentPosition,
    festivals,
    initialMapViewport,
    mapLocationFocusKey,
    mapLocationMessage,
    mapLocationStatus,
    mapStageActions,
    reviewActions,
    reviewError,
    reviewSubmitting,
    selectedPlaceReviews,
    selectedRoutePreview,
    sessionUser,
    setActiveCategory,
    setActiveTourismDisplayGroup,
    stampActionMessage,
    stampActionStatus,
    setSelectedTourismPlaceId,
    setShowTourismInfo,
    setTourismSheetState,
    showCuratedWithTourism,
    selectedTourismPlaceId,
    showTourismInfo,
    tourismError,
    tourismFacets,
    tourismDetailError,
    tourismDetailLoading,
    tourismDetailsById,
    tourismLoading,
    tourismPlaces,
    tourismSheetState,
    tourismSourceReady,
    viewModels,
  } = state;
  const visibleTourismPlaces = filterTourismPlacesByDisplayGroup(tourismPlaces, activeTourismDisplayGroup);
  const showCuratedMapItems = shouldShowCuratedMapItems({ showTourismInfo, showCuratedWithTourism });
  const visibleCuratedPlaces = showCuratedMapItems ? viewModels.filteredPlaces : [];
  const visibleRoutePreviewPlaces = showCuratedMapItems ? viewModels.routePreviewPlaces : [];
  const selectedTourismPlace = tourismPlaces.find((place) => place.id === selectedTourismPlaceId) ?? null;
  const selectedTourismDetail = selectedTourismPlaceId ? tourismDetailsById[selectedTourismPlaceId]?.item ?? null : null;

  return {
    mapData: {
      activeCategory,
      activeTourismDisplayGroup,
      filteredPlaces: visibleCuratedPlaces,
      festivals,
      selectedPlace: viewModels.selectedPlace,
      selectedFestival: viewModels.selectedFestival,
      selectedTourismPlace,
      selectedTourismDetail,
      currentPosition,
      mapLocationStatus,
      mapLocationMessage,
      mapLocationFocusKey,
      drawerState: state.drawerState,
      sessionUser,
      selectedPlaceReviews,
      routePreview: selectedRoutePreview,
      routePreviewPlaces: visibleRoutePreviewPlaces,
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
      tourismPlaces: visibleTourismPlaces,
      tourismFacets,
      tourismSourceReady,
      tourismLoading,
      tourismError,
      tourismDetailLoading,
      tourismDetailError,
      tourismSheetState,
    },
    mapActions: {
      setActiveCategory,
      setActiveTourismDisplayGroup: (displayGroup: TourismDisplayGroupFilter) => {
        setActiveTourismDisplayGroup(displayGroup);
        setSelectedTourismPlaceId(null);
      },
      onToggleTourismInfo: () => setShowTourismInfo((current) => !current),
      onOpenTourismPlace: (tourismPlaceId: string) => {
        const tourismPlace = tourismPlaces.find((place) => place.id === tourismPlaceId);
        if (tourismPlace?.isCurated && tourismPlace.curatedPlace) {
          mapStageActions.handleMapOpenPlace(tourismPlace.curatedPlace.id);
          return;
        }
        setSelectedTourismPlaceId(tourismPlaceId);
        setTourismSheetState('full');
      },
      onCloseTourismInfoSheet: () => setSelectedTourismPlaceId(null),
      onExpandTourismInfoSheet: () => setTourismSheetState('full'),
      onCollapseTourismInfoSheet: () => setTourismSheetState('peek'),
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
