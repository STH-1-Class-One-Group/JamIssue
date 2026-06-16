/*
 * File: AppMapStageView.tsx
 * Purpose: Compose the map tab stage from coordinator-provided map data and actions.
 * Primary Responsibility: Adapt app-level map props into the MapTabStage contract.
 * Design Intent: Keep the app shell coordinator separate from map-stage presentation wiring.
 * Non-Goals: This component does not fetch map data, own Naver SDK state, or implement sheet internals.
 */
import { memo } from 'react';
import type { TourismDisplayGroupFilter, TourismFacets, TourismPlaceDetailItem, TourismPlaceItem } from '../tourismTypes';
import type { SessionUser } from '../types/auth';
import type { ApiStatus, Category, DrawerState, FestivalItem, Place, ReviewMood, RoutePreview } from '../types/core';
import type { BootstrapResponse } from '../types/review';
import { MapTabStage } from './MapTabStage';
import { MapFloatingNav } from './map-stage/MapFloatingNav';
import type { GlobalSettingsMenuProps } from './GlobalSettingsMenu';

interface AppMapStageViewProps {
  mapData: {
    activeCategory: Category;
    activeTourismDisplayGroup: TourismDisplayGroupFilter;
    filteredPlaces: Place[];
    festivals: FestivalItem[];
    selectedPlace: Place | null;
    selectedFestival: FestivalItem | null;
    selectedTourismPlace: TourismPlaceItem | null;
    selectedTourismDetail: TourismPlaceDetailItem | null;
    currentPosition: { latitude: number; longitude: number } | null;
    mapLocationStatus: ApiStatus;
    mapLocationMessage: string | null;
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
    tourismFacets: TourismFacets | null;
    tourismSourceReady: boolean;
    tourismLoading: boolean;
    tourismError: string | null;
    tourismDetailLoading: boolean;
    tourismDetailError: string | null;
    tourismSheetState: Exclude<DrawerState, 'closed'>;
  };
  mapActions: {
    setActiveCategory: (category: Category) => void;
    setActiveTourismDisplayGroup: (displayGroup: TourismDisplayGroupFilter) => void;
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
  globalUtility: GlobalSettingsMenuProps;
}

export const AppMapStageView = memo(function AppMapStageView({
  mapData,
  mapActions,
  globalUtility,
}: AppMapStageViewProps) {
  return (
    <MapTabStage
      floatingNav={(
        <MapFloatingNav
          activeCategory={mapData.activeCategory}
          activeTourismDisplayGroup={mapData.activeTourismDisplayGroup}
          showTourismInfo={mapData.showTourismInfo}
          tourismFacets={mapData.tourismFacets}
          tourismPlaces={mapData.tourismPlaces}
          tourismSourceReady={mapData.tourismSourceReady}
          tourismLoading={mapData.tourismLoading}
          tourismError={mapData.tourismError}
          globalUtility={globalUtility}
          onSelectCategory={mapActions.setActiveCategory}
          onSelectTourismDisplayGroup={mapActions.setActiveTourismDisplayGroup}
          onToggleTourismInfo={mapActions.onToggleTourismInfo}
        />
      )}
      mapData={{
        filteredPlaces: mapData.filteredPlaces,
        festivals: mapData.festivals,
        tourismPlaces: mapData.showTourismInfo ? mapData.tourismPlaces : [],
        currentPosition: mapData.currentPosition,
        mapLocationStatus: mapData.mapLocationStatus,
        mapLocationMessage: mapData.mapLocationMessage,
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
        selectedTourismDetail: mapData.selectedTourismDetail,
        sheetState: mapData.tourismSheetState,
        sourceReady: mapData.tourismSourceReady,
        loading: mapData.tourismLoading,
        error: mapData.tourismError,
        detailLoading: mapData.tourismDetailLoading,
        detailError: mapData.tourismDetailError,
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
