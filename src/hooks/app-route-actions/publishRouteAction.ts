import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { createUserRoute } from '../../api/routesClient';
import type { MyPageResponse, MyPageTabKey, SessionUser, Tab, UserRoute } from '../../types';

type CommunityRoutesCache = Partial<Record<'popular' | 'latest', UserRoute[]>>;
type HistoryMode = 'push' | 'replace';

interface CreatePublishRouteHandlerParams {
  sessionUser: SessionUser | null;
  setRouteSubmitting: (value: boolean) => void;
  setRouteError: (value: string | null) => void;
  setNotice: (message: string | null) => void;
  setMyPageTab: (value: MyPageTabKey) => void;
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
  communityRoutesCacheRef: MutableRefObject<CommunityRoutesCache>;
  refreshMyPageForUser: (user: SessionUser | null, force?: boolean) => Promise<MyPageResponse | null>;
  formatErrorMessage: (error: unknown) => string;
  goToTab: (nextTab: Tab, historyMode?: HistoryMode) => void;
}

export function createPublishRouteHandler({
  sessionUser,
  setRouteSubmitting,
  setRouteError,
  setNotice,
  setMyPageTab,
  setMyPage,
  communityRoutesCacheRef,
  refreshMyPageForUser,
  formatErrorMessage,
  goToTab,
}: CreatePublishRouteHandlerParams) {
  return async function handlePublishRoute(payload: {
    travelSessionId: string;
    title: string;
    description: string;
    mood: string;
  }) {
    if (!sessionUser) {
      goToTab('my');
      setRouteError('로그인하면 여행 세션을 코스로 발행할 수 있어요.');
      return;
    }

    setRouteSubmitting(true);
    setRouteError(null);
    try {
      const createdRoute = await createUserRoute({
        travelSessionId: payload.travelSessionId,
        title: payload.title,
        description: payload.description,
        mood: payload.mood,
        isPublic: true,
      });
      communityRoutesCacheRef.current = {
        ...communityRoutesCacheRef.current,
        latest: [createdRoute, ...(communityRoutesCacheRef.current.latest ?? []).filter((route) => route.id !== createdRoute.id)],
      };
      delete communityRoutesCacheRef.current.popular;
      setMyPage((current) => {
        if (!current) {
          return current;
        }
        const routeExists = current.routes.some((route) => route.id === createdRoute.id);
        return {
          ...current,
          routes: [createdRoute, ...current.routes.filter((route) => route.id !== createdRoute.id)],
          travelSessions: current.travelSessions.map((session) =>
            session.id === payload.travelSessionId ? { ...session, publishedRouteId: createdRoute.id } : session,
          ),
          stats: {
            ...current.stats,
            routeCount: routeExists ? current.stats.routeCount : current.stats.routeCount + 1,
          },
        };
      });
      setNotice('코스를 발행했어요. 공개 경로 탭에서 바로 확인할 수 있어요.');
      setMyPageTab('routes');
      await refreshMyPageForUser(sessionUser, true);
    } catch (error) {
      setRouteError(formatErrorMessage(error));
    } finally {
      setRouteSubmitting(false);
    }
  };
}
