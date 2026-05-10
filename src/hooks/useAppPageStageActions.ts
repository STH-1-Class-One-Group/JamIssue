import { useEventCallback } from './useEventCallback';
import type { SessionUser } from '../types/auth';

interface UseAppPageStageActionsParams {
  sessionUser: SessionUser | null;
  setFeedPlaceFilterId: (placeId: string | null) => void;
  setCommunityRouteSort: (sort: 'popular' | 'latest') => void;
  handleOpenCommentWithReturn: (reviewId: string, commentId: string) => void;
  handleOpenCommunityRouteWithReturn: (routeId: string) => void;
  fetchCommunityRoutes: (sort: 'popular' | 'latest') => Promise<unknown>;
  refreshMyPageForUser: (user: SessionUser | null, force?: boolean) => Promise<unknown>;
  reportBackgroundError: (error: unknown) => void;
}

export function useAppPageStageActions({
  sessionUser,
  setFeedPlaceFilterId,
  setCommunityRouteSort,
  handleOpenCommentWithReturn,
  handleOpenCommunityRouteWithReturn,
  fetchCommunityRoutes,
  refreshMyPageForUser,
  reportBackgroundError,
}: UseAppPageStageActionsParams) {
  const handleClearPlaceFilter = useEventCallback(() => {
    setFeedPlaceFilterId(null);
  });

  const handleChangeRouteSort = useEventCallback((sort: 'popular' | 'latest') => {
    setCommunityRouteSort(sort);
    void fetchCommunityRoutes(sort).catch(reportBackgroundError);
  });

  const handleRetryMyPage = useEventCallback(async () => {
    if (!sessionUser) {
      return;
    }
    await refreshMyPageForUser(sessionUser, true);
  });

  const handleOpenCommentFromMyPage = useEventCallback((reviewId: string, commentId: string) => {
    handleOpenCommentWithReturn(reviewId, commentId);
  });

  const handleOpenRouteFromMyPage = useEventCallback(async (routeId: string) => {
    setCommunityRouteSort('latest');
    await fetchCommunityRoutes('latest');
    handleOpenCommunityRouteWithReturn(routeId);
  });

  return {
    handleClearPlaceFilter,
    handleChangeRouteSort,
    handleRetryMyPage,
    handleOpenCommentFromMyPage,
    handleOpenRouteFromMyPage,
  };
}
