import type { ReactNode } from 'react';
import type { ApiStatus, DrawerState, FestivalItem, Place, ReviewMood, RoutePreview } from '../../types/core';
import type { TourismPlaceDetailItem, TourismPlaceItem } from '../../tourismTypes';
import type { SessionUser } from '../../types/auth';
import type { BootstrapResponse } from '../../types/review';

type TourismSheetState = Exclude<DrawerState, 'closed'>;

export interface MapTabStageProps {
  floatingNav?: ReactNode;
  mapData: {
    filteredPlaces: Place[];
    festivals: FestivalItem[];
    tourismPlaces: TourismPlaceItem[];
    currentPosition: { latitude: number; longitude: number } | null;
    mapLocationStatus: ApiStatus;
    mapLocationMessage: string | null;
    mapLocationFocusKey: number;
    routePreviewPlaces: Place[];
  };
  routePreviewData: {
    routePreview: RoutePreview | null;
    onClearRoutePreview: () => void;
    onOpenRoutePreviewPlace: (placeId: string) => void;
  };
  viewportData: {
    initialMapCenter?: { lat: number; lng: number };
    initialMapZoom?: number;
    onLocateCurrentPosition: () => void;
    onMapViewportChange: (lat: number, lng: number, zoom: number) => void;
  };
  placeSheet: {
    selectedPlace: Place | null;
    drawerState: DrawerState;
    sessionUser: SessionUser | null;
    selectedPlaceReviews: BootstrapResponse['reviews'];
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
    onOpenPlace: (placeId: string) => void;
    onOpenFeedReview: () => void;
    onCloseDrawer: () => void;
    onExpandPlaceDrawer: () => void;
    onCollapsePlaceDrawer: () => void;
    onRequestLogin: () => void;
    onClaimStamp: (place: Place) => Promise<void>;
    onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
  };
  festivalSheet: {
    selectedFestival: FestivalItem | null;
    drawerState: DrawerState;
    onOpenFestival: (festivalId: string) => void;
    onCloseDrawer: () => void;
    onExpandFestivalDrawer: () => void;
    onCollapseFestivalDrawer: () => void;
  };
  tourismSheet: {
    selectedTourismPlace: TourismPlaceItem | null;
    selectedTourismDetail: TourismPlaceDetailItem | null;
    sheetState: TourismSheetState;
    sourceReady: boolean;
    loading: boolean;
    error: string | null;
    detailLoading: boolean;
    detailError: string | null;
    onClose: () => void;
    onExpand: () => void;
    onCollapse: () => void;
  };
  tourismActions: {
    selectedTourismPlaceId: string | null;
    onOpenTourismPlace: (tourismPlaceId: string) => void;
  };
}
