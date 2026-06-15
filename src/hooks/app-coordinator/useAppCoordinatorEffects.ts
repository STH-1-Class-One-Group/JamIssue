/*
 * File: useAppCoordinatorEffects.ts
 * Purpose: Register app-level side effects for bootstrap, feedback, and optional map overlays.
 * Primary Responsibility: Compose domain effect hooks without owning their internal fetch policies.
 * Design Intent: Keep the shell coordinator readable by delegating large behavior-specific effects to owner hooks.
 * Non-Goals: This hook does not render UI, normalize API payloads, or call provider/admin APIs directly.
 * Dependencies: React effects, app bootstrap lifecycle, feedback effects, and tourism overlay effects.
 */
import { useEffect } from 'react';
import { FeedbackRuntimeConfig } from '../../config/runtimeLimitConfig';
import { useAppBootstrapLifecycle } from '../app-bootstrap/useAppBootstrapLifecycle';
import { getInitialNotice } from '../app-route/useAppRouteState';
import { useAppFeedbackEffects } from '../useAppFeedbackEffects';
import { useTourismOverlayEffects } from './useTourismOverlayEffects';
import type {
  DataState,
  DomainState,
  PageRuntimeState,
  RouteState,
  ShellRuntimeState,
} from './useAppShellCoordinator.types';
import type { useAppCoordinatorServices } from './useAppCoordinatorServices';

type CoordinatorEffectsArgs = {
  routeState: RouteState;
  domainState: DomainState;
  shellRuntimeState: ShellRuntimeState;
  pageRuntimeState: PageRuntimeState;
  dataState: DataState;
  services: ReturnType<typeof useAppCoordinatorServices>;
};

export function useAppCoordinatorEffects({
  routeState,
  domainState,
  shellRuntimeState,
  pageRuntimeState,
  dataState,
  services,
}: CoordinatorEffectsArgs) {
  const { activeTab, goToTab, selectedPlaceId } = routeState;
  const {
    auth: { sessionUser },
    map: { selectedTourismPlaceId, showTourismInfo, setSelectedTourismPlaceId },
    myPage: { myPageTab },
  } = domainState;
  const { mapLocationMessage, notice, setNotice } = shellRuntimeState;
  const { myCommentsLoadedOnce } = pageRuntimeState;
  const {
    adminSummary,
    communityRouteSort,
    myPage,
    placeReviewsCacheRef,
    resetReviewCaches,
    setFestivals,
    setHasRealData,
    setMyPage,
    setPlaces,
    setSelectedPlaceReviews,
    setStampState,
    setTourismDetailError,
    setTourismDetailLoading,
    setTourismDetailsById,
    setTourismError,
    setTourismFacets,
    setTourismLoading,
    setTourismPlaces,
    setTourismPlacesQueryKey,
    setTourismSourceReady,
    tourismDetailsById,
    tourismPlaces,
    tourismPlacesQueryKey,
  } = dataState;
  const {
    dataLoaders: {
      ensureFeedReviews,
      fetchCommunityRoutes,
      refreshAdminSummary,
      refreshMyPageForUser,
    },
    paginationActions: { loadMoreMyComments },
    viewModels,
  } = services;

  useEffect(() => {
    const initialNotice = getInitialNotice();
    if (initialNotice) {
      setNotice((current) => current ?? initialNotice);
    }
  }, [setNotice]);

  useAppFeedbackEffects({
    selectedPlace: viewModels.selectedPlace,
    selectedPlaceDistanceMeters: viewModels.selectedPlaceDistanceMeters,
    sessionUser,
    todayStamp: viewModels.todayStamp,
    notice,
    mapLocationMessage,
    stampUnlockRadiusMeters: FeedbackRuntimeConfig.stampUnlockRadiusMeters,
    noticeDismissDelayMs: FeedbackRuntimeConfig.noticeDismissDelayMs,
  });

  useTourismOverlayEffects({
    selectedTourismPlaceId,
    showTourismInfo,
    tourismDetailsById,
    tourismPlaces,
    tourismPlacesQueryKey,
    setSelectedTourismPlaceId,
    setTourismDetailError,
    setTourismDetailLoading,
    setTourismDetailsById,
    setTourismError,
    setTourismFacets,
    setTourismLoading,
    setTourismPlaces,
    setTourismPlacesQueryKey,
    setTourismSourceReady,
    formatErrorMessage,
  });

  useAppBootstrapLifecycle({
    activeTab,
    selectedPlaceId,
    sessionUser,
    myPage,
    myPageTab,
    adminSummary,
    communityRouteSort,
    myCommentsLoadedOnce,
    placeReviewsCacheRef,
    setPlaces,
    setFestivals,
    setStampState,
    setHasRealData,
    setSelectedPlaceReviews,
    setMyPage,
    resetReviewCaches,
    refreshMyPageForUser,
    ensureFeedReviews,
    fetchCommunityRoutes,
    refreshAdminSummary,
    loadMoreMyComments,
    goToTab,
    formatErrorMessage,
    reportBackgroundError,
  });
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '요청을 처리하지 못했어요. 조금 뒤에 다시 시도해 주세요.';
}

function reportBackgroundError(error: unknown) {
  console.error(error);
}
