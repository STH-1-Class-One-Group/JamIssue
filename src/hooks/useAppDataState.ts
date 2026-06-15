import { useState } from 'react';
import type { TourismFacets, TourismPlaceDetailResponse, TourismPlaceItem } from '../tourismTypes';
import type { FestivalItem } from '../types/core';
import type { BootstrapResponse } from '../types/review';
import type { MyPageResponse } from '../types/my-page';
import type { AdminSummaryResponse } from '../types/admin';
import { useCommunityRouteState } from './app-data/useCommunityRouteState';
import { useReviewCollectionState } from './app-data/useReviewCollectionState';

export function useAppDataState(selectedPlaceId: string | null) {
  const [places, setPlaces] = useState<BootstrapResponse['places']>([]);
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [tourismPlaces, setTourismPlaces] = useState<TourismPlaceItem[]>([]);
  const [tourismPlacesQueryKey, setTourismPlacesQueryKey] = useState<string | null>(null);
  const [tourismFacets, setTourismFacets] = useState<TourismFacets | null>(null);
  const [tourismSourceReady, setTourismSourceReady] = useState(false);
  const [tourismLoading, setTourismLoading] = useState(false);
  const [tourismError, setTourismError] = useState<string | null>(null);
  const [tourismDetailsById, setTourismDetailsById] = useState<Record<string, TourismPlaceDetailResponse>>({});
  const [tourismDetailLoading, setTourismDetailLoading] = useState(false);
  const [tourismDetailError, setTourismDetailError] = useState<string | null>(null);
  const [courses, setCourses] = useState<BootstrapResponse['courses']>([]);
  const [stampState, setStampState] = useState<BootstrapResponse['stamps']>({
    collectedPlaceIds: [],
    logs: [],
    travelSessions: [],
  });
  const [hasRealData, setHasRealData] = useState(true);
  const [myPage, setMyPage] = useState<MyPageResponse | null>(null);
  const [adminSummary, setAdminSummary] = useState<AdminSummaryResponse | null>(null);
  const [adminBusyPlaceId, setAdminBusyPlaceId] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const communityRouteState = useCommunityRouteState();
  const reviewCollectionState = useReviewCollectionState(selectedPlaceId);

  return {
    places,
    setPlaces,
    festivals,
    setFestivals,
    tourismPlaces,
    setTourismPlaces,
    tourismPlacesQueryKey,
    setTourismPlacesQueryKey,
    tourismFacets,
    setTourismFacets,
    tourismSourceReady,
    setTourismSourceReady,
    tourismLoading,
    setTourismLoading,
    tourismError,
    setTourismError,
    tourismDetailsById,
    setTourismDetailsById,
    tourismDetailLoading,
    setTourismDetailLoading,
    tourismDetailError,
    setTourismDetailError,
    ...reviewCollectionState,
    courses,
    setCourses,
    stampState,
    setStampState,
    hasRealData,
    setHasRealData,
    ...communityRouteState,
    myPage,
    setMyPage,
    adminSummary,
    setAdminSummary,
    adminBusyPlaceId,
    setAdminBusyPlaceId,
    adminLoading,
    setAdminLoading,
  };
}
