import type { Dispatch, SetStateAction } from 'react';
import { toggleCommunityRouteLike } from '../../api/routesClient';
import type { MyPageResponse, SessionUser, Tab, UserRoute } from '../../types';

type HistoryMode = 'push' | 'replace';

interface CreateToggleRouteLikeHandlerParams {
  sessionUser: SessionUser | null;
  setNotice: (message: string | null) => void;
  setRouteLikeUpdatingId: (routeId: string | null) => void;
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
  patchCommunityRoutes: (routeId: string, updater: (route: UserRoute) => UserRoute) => void;
  formatErrorMessage: (error: unknown) => string;
  goToTab: (nextTab: Tab, historyMode?: HistoryMode) => void;
}

export function createToggleRouteLikeHandler({
  sessionUser,
  setNotice,
  setRouteLikeUpdatingId,
  setMyPage,
  patchCommunityRoutes,
  formatErrorMessage,
  goToTab,
}: CreateToggleRouteLikeHandlerParams) {
  return async function handleToggleRouteLike(routeId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('좋아요를 누르려면 먼저 로그인해 주세요.');
      return;
    }

    setRouteLikeUpdatingId(routeId);
    try {
      const result = await toggleCommunityRouteLike(routeId);
      patchCommunityRoutes(routeId, (route) => ({
        ...route,
        likeCount: result.likeCount,
        likedByMe: result.likedByMe,
      }));
      setMyPage((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          routes: current.routes.map((route) =>
            route.id === routeId
              ? {
                  ...route,
                  likeCount: result.likeCount,
                  likedByMe: result.likedByMe,
                }
              : route,
          ),
        };
      });
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setRouteLikeUpdatingId(null);
    }
  };
}
