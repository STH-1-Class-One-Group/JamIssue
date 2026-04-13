import { useAppNavigationHelpers } from './useAppNavigationHelpers';
import { useGlobalNotifications } from './useGlobalNotifications';
import type { CoordinatorServicesArgs } from './useAppCoordinatorServices.types';
import type { useAppCoordinatorAuthLoaders } from './useAppCoordinatorAuthLoaders';

type CoordinatorAuthLoaders = ReturnType<typeof useAppCoordinatorAuthLoaders>;

export function useAppCoordinatorNavigationNotifications(
  { routeState, domainState, shellRuntimeState, dataState }: CoordinatorServicesArgs,
  { sessionUser, myPage }: CoordinatorAuthLoaders,
) {
  const {
    activeTab,
    drawerState,
    selectedPlaceId,
    selectedFestivalId,
    commitRouteState,
    goToTab,
  } = routeState;
  const {
    map: { setSelectedRoutePreview },
    myPage: { myPageTab, setMyPageTab },
    returnView: { setReturnView },
    review: {
      feedPlaceFilterId,
      activeCommentReviewId,
      highlightedCommentId,
      highlightedReviewId,
      setActiveCommentReviewId,
      setFeedPlaceFilterId,
      setHighlightedCommentId,
      setHighlightedReviewId,
      setHighlightedRouteId,
    },
  } = domainState;
  const { setNotice } = shellRuntimeState;
  const { reviews, selectedPlaceReviews, upsertReviewCollections } = dataState;

  const navigationHelpers = useAppNavigationHelpers({
    activeTab,
    myPageTab,
    activeCommentReviewId,
    highlightedCommentId,
    highlightedReviewId,
    selectedPlaceId,
    selectedFestivalId,
    drawerState,
    feedPlaceFilterId,
    reviews,
    selectedPlaceReviews,
    myPageReviews: myPage?.reviews ?? [],
    setActiveCommentReviewId,
    setHighlightedCommentId,
    setHighlightedReviewId,
    setHighlightedRouteId,
    setReturnView,
    setSelectedRoutePreview,
    setFeedPlaceFilterId,
    setNotice,
    goToTab,
    commitRouteState,
    upsertReviewCollections,
  });

  const notificationState = useGlobalNotifications({
    sessionUser,
    myPage,
    goToTab,
    setMyPageTab,
    handleOpenCommentWithReturn: navigationHelpers.handleOpenCommentWithReturn,
    handleOpenReviewWithReturn: navigationHelpers.handleOpenReviewWithReturn,
  });

  return {
    navigationHelpers,
    ...notificationState,
  };
}
