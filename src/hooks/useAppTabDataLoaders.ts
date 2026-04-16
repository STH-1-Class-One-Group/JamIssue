import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  AdminSummaryResponse,
  CommunityRouteSort,
  Course,
  MyPageResponse,
  Review,
  SessionUser,
  Tab,
  UserRoute,
} from '../types';
import { createCommunityRouteLoader } from './app-tab-loaders/communityRouteLoader';
import { createFeedReviewLoader } from './app-tab-loaders/feedReviewLoader';
import { createAdminSummaryLoader, createMyPageSummaryLoader } from './app-tab-loaders/summaryLoaders';
import { useAppTabLoaderBindings } from './useAppTabLoaderBindings';

type CommunityRoutesCache = Partial<Record<CommunityRouteSort, UserRoute[]>>;

interface UseAppTabDataLoadersParams {
  activeTab: Tab;
  adminSummary: AdminSummaryResponse | null;
  myPage: MyPageResponse | null;
  sessionUser: SessionUser | null;
  communityRoutesCacheRef: MutableRefObject<CommunityRoutesCache>;
  feedLoadedRef: MutableRefObject<boolean>;
  coursesLoadedRef: MutableRefObject<boolean>;
  replaceCommunityRoutes: (nextRoutes: UserRoute[], sort?: CommunityRouteSort) => void;
  setCommunityRoutes: Dispatch<SetStateAction<UserRoute[]>>;
  setReviews: Dispatch<SetStateAction<Review[]>>;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  setAdminLoading: Dispatch<SetStateAction<boolean>>;
  setAdminSummary: Dispatch<SetStateAction<AdminSummaryResponse | null>>;
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
}

export function useAppTabDataLoaders({
  activeTab,
  adminSummary,
  myPage,
  sessionUser,
  communityRoutesCacheRef,
  feedLoadedRef,
  coursesLoadedRef,
  replaceCommunityRoutes,
  setCommunityRoutes,
  setReviews,
  setCourses,
  setAdminLoading,
  setAdminSummary,
  setMyPage,
}: UseAppTabDataLoadersParams) {
  const bindings = useAppTabLoaderBindings();

  const fetchCommunityRoutes = useCallback(
    createCommunityRouteLoader({
      communityRoutesCacheRef,
      replaceCommunityRoutes,
      setCommunityRoutes,
    }),
    [communityRoutesCacheRef, replaceCommunityRoutes, setCommunityRoutes],
  );

  const ensureFeedReviews = useCallback(
    createFeedReviewLoader({
      feedLoadedRef,
      setReviews,
      setFeedNextCursor: bindings.setFeedNextCursor,
      setFeedHasMore: bindings.setFeedHasMore,
    }),
    [bindings.setFeedHasMore, bindings.setFeedNextCursor, feedLoadedRef, setReviews],
  );

  const ensureCuratedCourses = useCallback(async (force = false) => {
    if (!force && coursesLoadedRef.current) {
      return;
    }

    setCourses((current) => current);
    coursesLoadedRef.current = true;
  }, [coursesLoadedRef, setCourses]);

  const refreshAdminSummary = useCallback(
    createAdminSummaryLoader({
      activeTab,
      adminSummary,
      sessionUser,
      setAdminLoading,
      setAdminSummary,
    }),
    [activeTab, adminSummary, sessionUser, setAdminLoading, setAdminSummary],
  );

  const refreshMyPageForUser = useCallback(
    createMyPageSummaryLoader({
      activeTab,
      myPage,
      setMyPage,
      setMyPageError: bindings.setMyPageError,
    }),
    [activeTab, bindings.setMyPageError, myPage, setMyPage],
  );

  return {
    fetchCommunityRoutes,
    ensureFeedReviews,
    ensureCuratedCourses,
    refreshAdminSummary,
    refreshMyPageForUser,
  };
}
