import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRouteRequest } from '../../deploy/api-worker-shell/runtime/routing';
import type { RouteRuntime } from '../../deploy/api-worker-shell/runtime/route-runtime';
import type { WorkerBaseData } from '../../deploy/api-worker-shell/runtime/base-data-contracts';
import type { WorkerReviewInteractionDeps } from '../../deploy/api-worker-shell/services/review-domain/contracts';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const apiUrl = 'https://api.daejeon.jamissue.com';

const env: WorkerEnv = {
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
};

const emptyBaseData: WorkerBaseData = {
  places: [],
  placesByPositionId: new Map(),
  reviews: [],
  courses: [],
  collectedPlaceIds: [],
  stampLogs: [],
  travelSessions: [],
};

function createJsonResponse(route: string, status = 200) {
  return new Response(JSON.stringify({ route }), {
    headers: { 'content-type': 'application/json' },
    status,
  });
}

function createReviewInteractionDeps(): WorkerReviewInteractionDeps {
  return {
    badgeByMood: {},
    countUnreadNotifications: vi.fn(async () => 0),
    createUserNotification: vi.fn(async () => null),
    loadBaseData: vi.fn(async () => emptyBaseData),
    loadNotificationById: vi.fn(async () => null),
    loadSingleReview: vi.fn(async () => null),
    publishNotificationEvent: vi.fn(async () => undefined),
    readSessionUser: vi.fn(async () => null),
  };
}

function createRuntime(): RouteRuntime {
  const responseHandler = vi.fn(async () => createJsonResponse('handler'));

  return {
    adminService: {
      handleAdminImportPublicData: responseHandler,
      handleAdminPlaceVisibility: responseHandler,
      handleAdminSummary: responseHandler,
    },
    buildReviewInteractionDeps: vi.fn(createReviewInteractionDeps),
    communityRouteService: {
      handleCommunityRoutes: responseHandler,
      handleCreateUserRoute: responseHandler,
      handleMyRoutes: responseHandler,
      handleToggleCommunityRouteLike: responseHandler,
      loadCommunityRoutes: vi.fn(async () => []),
    },
    loadBaseData: vi.fn(async () => emptyBaseData),
    loadCuratedCourses: vi.fn(async () => []),
    myService: {
      handleMyComments: responseHandler,
      handleMySummary: responseHandler,
    },
    reviewReadService: {
      handleReviewDetail: responseHandler,
      handleReviewFeed: responseHandler,
      handleReviews: responseHandler,
      loadSingleReview: vi.fn(async () => ({ comments: [{ id: 'comment-1' }], id: 'review-1' })),
      mapReviewRows: vi.fn(() => []),
    },
    stampService: {
      handleToggleStamp: responseHandler,
    },
  };
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('worker routing runtime', () => {
  it('dispatches exact routes through the route registry', async () => {
    const runtime = createRuntime();
    const response = await createRouteRequest(runtime)(new Request(`${apiUrl}/api/review-feed`), env);

    expect(response.status).toBe(200);
    expect(await readJson<{ route: string }>(response)).toEqual({ route: 'handler' });
    expect(runtime.reviewReadService.handleReviewFeed).toHaveBeenCalledTimes(1);
  });

  it('dispatches pattern routes through the route registry', async () => {
    const runtime = createRuntime();
    const response = await createRouteRequest(runtime)(new Request(`${apiUrl}/api/reviews/7/comments`), env);

    expect(response.status).toBe(200);
    expect(await readJson<Array<{ id: string }>>(response)).toEqual([{ id: 'comment-1' }]);
    expect(runtime.reviewReadService.loadSingleReview).toHaveBeenCalledWith(env, '7', null);
  });

  it('returns the existing fallback response when no origin is configured', async () => {
    const response = await createRouteRequest(createRuntime())(new Request(`${apiUrl}/api/not-yet-ported`), env);

    expect(response.status).toBe(501);
    expect(await readJson<{ detail: string }>(response)).toEqual({
      detail: '이 기능은 아직 Worker 브랜치에서 직접 구현되지 않았어요.',
    });
  });

  it('proxies unmatched routes to the configured origin without changing path or query', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('proxied', { status: 202 }));

    const response = await createRouteRequest(createRuntime())(
      new Request(`${apiUrl}/api/legacy/path?cursor=next`, {
        headers: { 'cf-connecting-ip': '203.0.113.5' },
      }),
      { ...env, APP_ORIGIN_API_URL: 'https://origin.example.com/root' },
    );

    expect(response.status).toBe(202);
    expect(await response.text()).toBe('proxied');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('https://origin.example.com/api/legacy/path?cursor=next');

    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(requestInit.method).toBe('GET');
    expect(requestInit.redirect).toBe('manual');
    expect(headers.get('x-forwarded-host')).toBe('api.daejeon.jamissue.com');
    expect(headers.get('x-forwarded-proto')).toBe('https');
    expect(headers.get('x-forwarded-for')).toBe('203.0.113.5');
  });
});
