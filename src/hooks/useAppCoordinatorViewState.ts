import { useActiveReviewComments } from './useActiveReviewComments';
import { useAppPagePaginationActions } from './useAppPagePaginationActions';
import { useAppViewModels } from './useAppViewModels';
import type { CoordinatorServicesArgs } from './useAppCoordinatorServices.types';
import type { useAppCoordinatorAuthLoaders } from './useAppCoordinatorAuthLoaders';
import type { useAppCoordinatorNavigationNotifications } from './useAppCoordinatorNavigationNotifications';

type CoordinatorAuthLoaders = ReturnType<typeof useAppCoordinatorAuthLoaders>;
type CoordinatorNavigationNotifications = ReturnType<typeof useAppCoordinatorNavigationNotifications>;

export function useAppCoordinatorViewState(
  { routeState, domainState, shellRuntimeState, dataState }: CoordinatorServicesArgs,
  { sessionUser, myPage }: CoordinatorAuthLoaders,
  { notifications, unreadNotificationCount }: CoordinatorNavigationNotifications,
) {
  const { selectedPlaceId, selectedFestivalId } = routeState;
  const {
    map: { activeCategory, selectedRoutePreview },
    review: { activeCommentReviewId },
  } = domainState;
  const {
    notice,
    setNotice,
    currentPosition,
    mapLocationStatus,
    mapLocationMessage,
    bootstrapStatus,
    bootstrapError,
  } = shellRuntimeState;
  const {
    festivals,
    myPage: myPageData,
    places,
    reviews,
    selectedPlaceReviews,
    setMyPage,
    setReviews,
    stampState,
  } = dataState;

  const viewModels = useAppViewModels({
    places,
    festivals,
    reviews,
    selectedPlaceReviews,
    selectedPlaceId,
    selectedFestivalId,
    selectedRoutePreview,
    activeCategory,
    myPage: myPageData,
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
  });

  const paginationActions = useAppPagePaginationActions({
    sessionUser,
    myPage,
    setReviews,
    setMyPage,
    reportBackgroundError,
  });

  const activeReviewCommentsState = useActiveReviewComments({
    activeCommentReviewId,
    setNotice,
    formatErrorMessage,
  });

  return {
    viewModels,
    paginationActions,
    activeReviewCommentsState,
  };
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '?遺욧퍕??筌ｌ꼶???? 筌륁궢六??곸뒄. ?醫롫뻻 ??쇰퓠 ??쇰뻻 ??뺣즲??雅뚯눘苑??';
}

function reportBackgroundError(error: unknown) {
  console.error(error);
}
