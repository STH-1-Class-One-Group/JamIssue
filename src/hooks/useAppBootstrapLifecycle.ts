import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import { useAppShellRuntimeStore } from '../store/app-shell-runtime-store';
import { useAppRouteStore } from '../store/app-route-store';
import { useAppTabWarmup } from './useAppTabWarmup';
import { useSelectedPlaceReviewSync } from './useSelectedPlaceReviewSync';
import { useAppBootstrapSharedRefs } from './useAppBootstrapSharedRefs';
import { useFestivalBootstrapEffect, useMapBootstrapEffect } from './useAppBootstrapEffects';
import type {
  AdminSummaryResponse,
  FestivalItem,
  MyPageResponse,
  Place,
  Review,
  SessionUser,
  StampState,
  Tab,
} from '../types';

interface UseAppBootstrapLifecycleParams {
  activeTab: Tab;
  selectedPlaceId: string | null;
  sessionUser: SessionUser | null;
  myPage: MyPageResponse | null;
  myPageTab: string;
  adminSummary: AdminSummaryResponse | null;
  communityRouteSort: 'popular' | 'latest';
  myCommentsLoadedOnce: boolean;
  placeReviewsCacheRef: MutableRefObject<Record<string, Review[]>>;
  setPlaces: Dispatch<SetStateAction<Place[]>>;
  setFestivals: Dispatch<SetStateAction<FestivalItem[]>>;
  setStampState: Dispatch<SetStateAction<StampState>>;
  setHasRealData: Dispatch<SetStateAction<boolean>>;
  setSelectedPlaceReviews: Dispatch<SetStateAction<Review[]>>;
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
  resetReviewCaches: () => void;
  refreshMyPageForUser: (user: SessionUser | null, force?: boolean) => Promise<MyPageResponse | null>;
  ensureFeedReviews: (force?: boolean) => Promise<void>;
  fetchCommunityRoutes: (sort: 'popular' | 'latest', force?: boolean) => Promise<unknown>;
  refreshAdminSummary: (force?: boolean) => Promise<AdminSummaryResponse | null>;
  loadMoreMyComments: (initial?: boolean) => Promise<void>;
  goToTab: (tab: Tab, historyMode?: 'push' | 'replace') => void;
  formatErrorMessage: (error: unknown) => string;
  reportBackgroundError: (error: unknown) => void;
}

export function useAppBootstrapLifecycle({
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
}: UseAppBootstrapLifecycleParams) {
  const setSessionUser = useAuthStore((state) => state.setSessionUser);
  const setProviders = useAuthStore((state) => state.setProviders);
  const setBootstrapStatus = useAppShellRuntimeStore((state) => state.setBootstrapStatus);
  const setBootstrapError = useAppShellRuntimeStore((state) => state.setBootstrapError);
  const setSelectedPlaceId = useAppRouteStore((state) => state.setSelectedPlaceId);
  const setSelectedFestivalId = useAppRouteStore((state) => state.setSelectedFestivalId);
  const setNotice = useAppShellRuntimeStore((state) => state.setNotice);
  const setFeedNextCursor = useAppPageRuntimeStore((state) => state.setFeedNextCursor);
  const setFeedHasMore = useAppPageRuntimeStore((state) => state.setFeedHasMore);
  const setFeedLoadingMore = useAppPageRuntimeStore((state) => state.setFeedLoadingMore);
  const setMyCommentsNextCursor = useAppPageRuntimeStore((state) => state.setMyCommentsNextCursor);
  const setMyCommentsHasMore = useAppPageRuntimeStore((state) => state.setMyCommentsHasMore);
  const setMyCommentsLoadingMore = useAppPageRuntimeStore((state) => state.setMyCommentsLoadingMore);
  const setMyCommentsLoadedOnce = useAppPageRuntimeStore((state) => state.setMyCommentsLoadedOnce);

  const sharedRefs = useAppBootstrapSharedRefs({
    refreshMyPageForUser,
    resetReviewCaches,
    goToTab,
    formatErrorMessage,
    reportBackgroundError,
  });

  useSelectedPlaceReviewSync({
    activeTab,
    selectedPlaceId,
    placeReviewsCacheRef,
    setSelectedPlaceReviews,
    reportBackgroundError,
  });

  useAppTabWarmup({
    activeTab,
    sessionUser,
    myPage,
    myPageTab,
    adminSummary,
    communityRouteSort,
    myCommentsLoadedOnce,
    ensureFeedReviews,
    fetchCommunityRoutes,
    refreshMyPageForUser,
    refreshAdminSummary,
    loadMoreMyComments,
    reportBackgroundError,
  });

  useMapBootstrapEffect({
    ...sharedRefs,
    setBootstrapStatus,
    setBootstrapError,
    setPlaces,
    setStampState,
    setHasRealData,
    setSessionUser,
    setFeedNextCursor,
    setFeedHasMore,
    setFeedLoadingMore,
    setMyCommentsNextCursor,
    setMyCommentsHasMore,
    setMyCommentsLoadingMore,
    setMyCommentsLoadedOnce,
    setProviders,
    setSelectedPlaceId,
    setSelectedFestivalId,
    setMyPage,
    setNotice,
  });

  useFestivalBootstrapEffect({
    reportBackgroundErrorRef: sharedRefs.reportBackgroundErrorRef,
    setFestivals,
    setSelectedFestivalId,
  });
}
