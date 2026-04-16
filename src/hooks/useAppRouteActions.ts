import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { MyPageResponse, SessionUser, Tab, UserRoute } from '../types';
import { createPublishRouteHandler } from './app-route-actions/publishRouteAction';
import { createToggleRouteLikeHandler } from './app-route-actions/routeLikeAction';
import { useAppRouteActionStoreBindings } from './useAppRouteActionStoreBindings';

type SetState<T> = Dispatch<SetStateAction<T>>;
type CommunityRoutesCache = Partial<Record<'popular' | 'latest', UserRoute[]>>;
type HistoryMode = 'push' | 'replace';

interface UseAppRouteActionsParams {
  setMyPage: SetState<MyPageResponse | null>;
  communityRoutesCacheRef: MutableRefObject<CommunityRoutesCache>;
  patchCommunityRoutes: (routeId: string, updater: (route: UserRoute) => UserRoute) => void;
  refreshMyPageForUser: (user: SessionUser | null, force?: boolean) => Promise<MyPageResponse | null>;
  formatErrorMessage: (error: unknown) => string;
  goToTab: (nextTab: Tab, historyMode?: HistoryMode) => void;
}

export function useAppRouteActions({
  setMyPage,
  communityRoutesCacheRef,
  patchCommunityRoutes,
  refreshMyPageForUser,
  formatErrorMessage,
  goToTab,
}: UseAppRouteActionsParams) {
  const bindings = useAppRouteActionStoreBindings();

  const handleToggleRouteLike = createToggleRouteLikeHandler({
    sessionUser: bindings.sessionUser,
    setNotice: bindings.setNotice,
    setRouteLikeUpdatingId: bindings.setRouteLikeUpdatingId,
    setMyPage,
    patchCommunityRoutes,
    formatErrorMessage,
    goToTab,
  });

  const handlePublishRoute = createPublishRouteHandler({
    sessionUser: bindings.sessionUser,
    setRouteSubmitting: bindings.setRouteSubmitting,
    setRouteError: bindings.setRouteError,
    setNotice: bindings.setNotice,
    setMyPageTab: bindings.setMyPageTab,
    setMyPage,
    communityRoutesCacheRef,
    refreshMyPageForUser,
    formatErrorMessage,
    goToTab,
  });

  return {
    handleToggleRouteLike,
    handlePublishRoute,
  };
}
