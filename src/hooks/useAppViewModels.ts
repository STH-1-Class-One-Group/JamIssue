import { useMemo } from 'react';
import { calculateDistanceMeters, getLatestPlaceStamp, getTodayStampLog } from '../lib/visits';
import type {
  ApiStatus,
  BootstrapResponse,
  Category,
  FestivalItem,
  MyPageResponse,
  Place,
  Review,
  RoutePreview,
  SessionUser,
} from '../types';
import {
  buildPlaceNameById,
  filterPlacesByCategory,
  getRoutePreviewPlaces,
  getSelectedFestival,
  getSelectedPlace,
} from './app-view-models/placeSelections';
import {
  getHasCreatedReviewToday,
  getKnownMyReviews,
  getReviewProofMessage,
} from './app-view-models/reviewCapability';
import { getGlobalStatus, getHydratedMyPage } from './app-view-models/statusModels';

interface UseAppViewModelsParams {
  places: Place[];
  festivals: FestivalItem[];
  reviews: Review[];
  selectedPlaceReviews: Review[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  selectedRoutePreview: RoutePreview | null;
  activeCategory: Category;
  myPage: MyPageResponse | null;
  notifications: MyPageResponse['notifications'];
  unreadNotificationCount: number;
  stampState: BootstrapResponse['stamps'];
  currentPosition: { latitude: number; longitude: number } | null;
  sessionUser: SessionUser | null;
  notice: string | null;
  bootstrapStatus: ApiStatus;
  bootstrapError: string | null;
  mapLocationStatus: ApiStatus;
  mapLocationMessage: string | null;
}

export function useAppViewModels({
  places,
  festivals,
  reviews,
  selectedPlaceReviews,
  selectedPlaceId,
  selectedFestivalId,
  selectedRoutePreview,
  activeCategory,
  myPage,
  notifications,
  unreadNotificationCount,
  stampState,
  currentPosition,
  sessionUser,
  notice,
  bootstrapStatus,
  bootstrapError,
  mapLocationStatus,
  mapLocationMessage,
}: UseAppViewModelsParams) {
  const filteredPlaces = useMemo(() => filterPlacesByCategory(places, activeCategory), [places, activeCategory]);
  const hydratedMyPage = useMemo(() => getHydratedMyPage({ myPage, notifications, unreadNotificationCount }), [myPage, notifications, unreadNotificationCount]);
  const selectedPlace = useMemo(() => getSelectedPlace(places, selectedPlaceId), [places, selectedPlaceId]);
  const routePreviewPlaces = useMemo(() => getRoutePreviewPlaces(places, selectedRoutePreview), [places, selectedRoutePreview]);
  const selectedFestival = useMemo(() => getSelectedFestival(festivals, selectedFestivalId), [festivals, selectedFestivalId]);
  const todayStamp = selectedPlace ? getTodayStampLog(stampState.logs, selectedPlace.id) : null;
  const latestStamp = selectedPlace ? getLatestPlaceStamp(stampState.logs, selectedPlace.id) : null;
  const visitCount = selectedPlace?.totalVisitCount ?? 0;
  const selectedPlaceDistanceMeters = selectedPlace && currentPosition
    ? calculateDistanceMeters(currentPosition.latitude, currentPosition.longitude, selectedPlace.latitude, selectedPlace.longitude)
    : null;
  const knownMyReviews = useMemo(() => getKnownMyReviews({
    reviews,
    selectedPlaceReviews,
    myPageReviews: myPage?.reviews,
    sessionUser,
  }), [myPage?.reviews, reviews, selectedPlaceReviews, sessionUser]);
  const hasCreatedReviewToday = useMemo(() => getHasCreatedReviewToday({
    knownMyReviews,
    sessionUser,
    todayStamp,
  }), [knownMyReviews, sessionUser, todayStamp]);
  const canCreateReview = Boolean(sessionUser && selectedPlace && todayStamp && !hasCreatedReviewToday);
  const placeNameById = useMemo(() => buildPlaceNameById(places), [places]);
  const globalStatus = useMemo(() => getGlobalStatus({
    notice,
    bootstrapStatus,
    bootstrapError,
    mapLocationStatus,
    mapLocationMessage,
  }), [notice, bootstrapStatus, bootstrapError, mapLocationMessage, mapLocationStatus]);
  const reviewProofMessage = getReviewProofMessage({
    sessionUser,
    hasCreatedReviewToday,
    todayStamp,
  });

  return {
    filteredPlaces,
    hydratedMyPage,
    selectedPlace,
    routePreviewPlaces,
    selectedFestival,
    todayStamp,
    latestStamp,
    visitCount,
    selectedPlaceDistanceMeters,
    hasCreatedReviewToday,
    canCreateReview,
    placeNameById,
    globalStatus,
    reviewProofMessage,
  };
}
