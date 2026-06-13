import { memo } from 'react';
import { MapTabStage } from './MapTabStage';
import { MapStageCategoryStrip } from './map-stage/MapStageCategoryStrip';
import type { TourismPlaceItem } from '../tourismTypes';
import type { ApiStatus, Category, DrawerState, FestivalItem, Place, ReviewMood, RoutePreview } from '../types/core';
import type { SessionUser } from '../types/auth';
import type { BootstrapResponse } from '../types/review';

interface AppMapStageViewProps {
  mapData: {
    activeCategory: Category;
    filteredPlaces: Place[];
    festivals: FestivalItem[];
    selectedPlace: Place | null;
    selectedFestival: FestivalItem | null;
    selectedTourismPlace: TourismPlaceItem | null;
    currentPosition: { latitude: number; longitude: number } | null;
    mapLocationStatus: ApiStatus;
    mapLocationFocusKey: number;
    drawerState: DrawerState;
    sessionUser: SessionUser | null;
    selectedPlaceReviews: BootstrapResponse['reviews'];
    routePreview: RoutePreview | null;
    routePreviewPlaces: Place[];
    visitCount: number;
    latestStamp: BootstrapResponse['stamps']['logs'][number] | null;
    todayStamp: BootstrapResponse['stamps']['logs'][number] | null;
    stampActionStatus: ApiStatus;
    stampActionMessage: string;
    reviewProofMessage: string;
    reviewError: string | null;
    reviewSubmitting: boolean;
    canCreateReview: boolean;
    hasCreatedReviewToday: boolean;
    initialMapViewport: { lat: number; lng: number; zoom: number };
    showTourismInfo: boolean;
    tourismPlaces: TourismPlaceItem[];
    tourismSourceReady: boolean;
    tourismLoading: boolean;
    tourismError: string | null;
    tourismSheetState: 'partial' | 'full';
  };
  mapActions: {
    setActiveCategory: (category: Category) => void;
    onToggleTourismInfo: () => void;
    onOpenTourismPlace: (tourismPlaceId: string) => void;
    onCloseTourismInfoSheet: () => void;
    onExpandTourismInfoSheet: () => void;
    onCollapseTourismInfoSheet: () => void;
    onOpenPlaceFeed: () => void;
    onOpenPlace: (placeId: string) => void;
    onOpenRoutePreviewPlace: (placeId: string) => void;
    onOpenFestival: (festivalId: string) => void;
    onCloseDrawer: () => void;
    onClearRoutePreview: () => void;
    onExpandPlaceDrawer: () => void;
    onCollapsePlaceDrawer: () => void;
    onExpandFestivalDrawer: () => void;
    onCollapseFestivalDrawer: () => void;
    onRequestLogin: () => void;
    onClaimStamp: (place: Place) => Promise<void>;
    onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
    onLocateCurrentPosition: () => void;
    onMapViewportChange: (lat: number, lng: number, zoom: number) => void;
  };
}

type AppMapStageSubNavProps = Pick<AppMapStageViewProps, 'mapData' | 'mapActions'>;

export function AppMapStageSubNav({
  mapData,
  mapActions,
}: AppMapStageSubNavProps) {
  return (
    <div className="map-stage-subnav">
      <MapStageCategoryStrip
        activeCategory={mapData.activeCategory}
        onSelectCategory={mapActions.setActiveCategory}
      />
      <button
        type="button"
        className={mapData.showTourismInfo ? 'chip map-filter-chip is-active tourism-toggle-chip' : 'chip map-filter-chip tourism-toggle-chip'}
        data-tourism-toggle="map"
        onClick={mapActions.onToggleTourismInfo}
      >
        관광정보
      </button>
    </div>
  );
}

export const AppMapStageView = memo(function AppMapStageView({
  mapData,
  mapActions,
}: AppMapStageViewProps) {
  return (
    <MapTabStage
      mapData={{
        filteredPlaces: mapData.filteredPlaces,
        festivals: mapData.festivals,
        tourismPlaces: mapData.showTourismInfo ? mapData.tourismPlaces : [],
        currentPosition: mapData.currentPosition,
        mapLocationStatus: mapData.mapLocationStatus,
        mapLocationFocusKey: mapData.mapLocationFocusKey,
        routePreviewPlaces: mapData.routePreviewPlaces,
      }}
      routePreviewData={{
        routePreview: mapData.routePreview,
        onClearRoutePreview: mapActions.onClearRoutePreview,
        onOpenRoutePreviewPlace: mapActions.onOpenRoutePreviewPlace,
      }}
      viewportData={{
        initialMapCenter: { lat: mapData.initialMapViewport.lat, lng: mapData.initialMapViewport.lng },
        initialMapZoom: mapData.initialMapViewport.zoom,
        onLocateCurrentPosition: mapActions.onLocateCurrentPosition,
        onMapViewportChange: mapActions.onMapViewportChange,
      }}
      placeSheet={{
        selectedPlace: mapData.selectedPlace,
        drawerState: mapData.drawerState,
        sessionUser: mapData.sessionUser,
        selectedPlaceReviews: mapData.selectedPlaceReviews,
        visitCount: mapData.visitCount,
        latestStamp: mapData.latestStamp,
        todayStamp: mapData.todayStamp,
        stampActionStatus: mapData.stampActionStatus,
        stampActionMessage: mapData.stampActionMessage,
        reviewProofMessage: mapData.reviewProofMessage,
        reviewError: mapData.reviewError,
        reviewSubmitting: mapData.reviewSubmitting,
        canCreateReview: mapData.canCreateReview,
        hasCreatedReviewToday: mapData.hasCreatedReviewToday,
        onOpenPlace: mapActions.onOpenPlace,
        onOpenFeedReview: mapActions.onOpenPlaceFeed,
        onCloseDrawer: mapActions.onCloseDrawer,
        onExpandPlaceDrawer: mapActions.onExpandPlaceDrawer,
        onCollapsePlaceDrawer: mapActions.onCollapsePlaceDrawer,
        onRequestLogin: mapActions.onRequestLogin,
        onClaimStamp: mapActions.onClaimStamp,
        onCreateReview: mapActions.onCreateReview,
      }}
      festivalSheet={{
        selectedFestival: mapData.selectedFestival,
        drawerState: mapData.drawerState,
        onOpenFestival: mapActions.onOpenFestival,
        onCloseDrawer: mapActions.onCloseDrawer,
        onExpandFestivalDrawer: mapActions.onExpandFestivalDrawer,
        onCollapseFestivalDrawer: mapActions.onCollapseFestivalDrawer,
      }}
      tourismSheet={{
        selectedTourismPlace: mapData.selectedTourismPlace,
        sheetState: mapData.tourismSheetState,
        sourceReady: mapData.tourismSourceReady,
        loading: mapData.tourismLoading,
        error: mapData.tourismError,
        onClose: mapActions.onCloseTourismInfoSheet,
        onExpand: mapActions.onExpandTourismInfoSheet,
        onCollapse: mapActions.onCollapseTourismInfoSheet,
      }}
      tourismActions={{
        selectedTourismPlaceId: mapData.selectedTourismPlace?.id ?? null,
        onOpenTourismPlace: mapActions.onOpenTourismPlace,
      }}
    />
  );
});
