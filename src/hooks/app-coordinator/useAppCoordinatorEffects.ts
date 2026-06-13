import { useEffect } from 'react';
import { getTourismPlaces } from '../../api/tourismClient';
import { FeedbackRuntimeConfig, TourismRuntimeConfig } from '../../config/runtimeLimitConfig';
import { getInitialNotice } from '../app-route/useAppRouteState';
import { useAppFeedbackEffects } from '../useAppFeedbackEffects';
import { useAppBootstrapLifecycle } from '../app-bootstrap/useAppBootstrapLifecycle';
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
    map: { showTourismInfo, setSelectedTourismPlaceId },
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
    setTourismError,
    setTourismLoading,
    setTourismPlaces,
    setTourismSourceReady,
    tourismPlaces,
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
    if (!initialNotice) {
      return;
    }
    setNotice((current) => current ?? initialNotice);
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

  useEffect(() => {
    if (!showTourismInfo) {
      setSelectedTourismPlaceId(null);
      return;
    }
    if (tourismPlaces.length > 0) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, TourismRuntimeConfig.placesRequestTimeoutMs);
    setTourismLoading(true);
    setTourismError(null);

    getTourismPlaces({}, { signal: controller.signal })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setTourismPlaces(response.items);
        setTourismSourceReady(response.sourceReady);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }
        setTourismError(formatTourismErrorMessage(error));
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (isActive) {
          setTourismLoading(false);
        }
      });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    setSelectedTourismPlaceId,
    setTourismError,
    setTourismLoading,
    setTourismPlaces,
    setTourismSourceReady,
    showTourismInfo,
    tourismPlaces.length,
  ]);

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

function formatTourismErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '관광정보 응답이 지연되고 있어요. 잠시 후 다시 켜 주세요.';
  }
  return formatErrorMessage(error);
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
