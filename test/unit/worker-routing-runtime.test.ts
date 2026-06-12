import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRouteRequest } from '../../deploy/api-worker-shell/runtime/routing';
import type { RouteRuntime } from '../../deploy/api-worker-shell/runtime/route-runtime';
import type { WorkerBaseData } from '../../deploy/api-worker-shell/runtime/base-data-contracts';
import type { WorkerReviewInteractionDeps } from '../../deploy/api-worker-shell/services/review-domain/contracts';
import type { WorkerEnv, WorkerSessionUser } from '../../deploy/api-worker-shell/types';

const supabaseMock = vi.hoisted(() => ({
  encodeFilterValue: (value: unknown) => encodeURIComponent(String(value)),
  getSupabaseKey: vi.fn(() => 'service-role-key'),
  parseListLimit: (url: URL, defaultLimit: number, maxLimit: number) => {
    const raw = Number(url.searchParams.get('limit') ?? defaultLimit);
    return Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), maxLimit) : defaultLimit;
  },
  supabaseRequest: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/lib/supabase', () => supabaseMock);

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

const routeSessionUser: WorkerSessionUser = {
  id: 'actor',
  nickname: 'Actor',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

const routePlace = {
  id: 'bread-house',
  positionId: '101',
  name: 'Bread House',
};

const baseDataWithPlace: WorkerBaseData = {
  ...emptyBaseData,
  places: [routePlace],
  placesByPositionId: new Map([[routePlace.positionId, routePlace]]),
};

function createJsonResponse(route: string, status = 200) {
  return new Response(JSON.stringify({ route }), {
    headers: { 'content-type': 'application/json' },
    status,
  });
}

function createReviewInteractionDeps(overrides: Partial<WorkerReviewInteractionDeps> = {}): WorkerReviewInteractionDeps {
  return {
    badgeByMood: {},
    countUnreadNotifications: vi.fn(async () => 0),
    createUserNotification: vi.fn(async () => null),
    loadBaseData: vi.fn(async () => emptyBaseData),
    loadNotificationById: vi.fn(async () => null),
    loadSingleReview: vi.fn(async () => null),
    publishNotificationEvent: vi.fn(async () => undefined),
    readSessionUser: vi.fn(async () => null),
    ...overrides,
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
  supabaseMock.supabaseRequest.mockReset();
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

  it('dispatches the public tourism route through the route registry', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([{ resource_type: 'places', source_name: 'KTO', last_success_at: '2026-06-01T00:00:00Z' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const response = await createRouteRequest(createRuntime())(new Request(`${apiUrl}/api/tourism/places`), env);

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      sourceReady: true,
      sourceName: 'KTO',
      items: [],
    });
  });

  it('dispatches pattern routes through the route registry', async () => {
    const runtime = createRuntime();
    const response = await createRouteRequest(runtime)(new Request(`${apiUrl}/api/reviews/7/comments`), env);

    expect(response.status).toBe(200);
    expect(await readJson<Array<{ id: string }>>(response)).toEqual([{ id: 'comment-1' }]);
    expect(runtime.reviewReadService.loadSingleReview).toHaveBeenCalledWith(env, '7', null);
  });

  it('dispatches authenticated review creation through the Worker write route', async () => {
    supabaseMock.supabaseRequest.mockImplementation(async (_env, path: string, init?: RequestInit) => {
      if (path.startsWith('user_stamp?select=')) {
        return [{ stamp_id: 11, position_id: 101, user_id: 'actor' }];
      }
      if (path === 'feed?select=feed_id' && init?.method === 'POST') {
        return [{ feed_id: 7 }];
      }
      return [];
    });
    const reviewDeps = createReviewInteractionDeps({
      loadBaseData: vi.fn(async () => baseDataWithPlace),
      loadSingleReview: vi.fn(async () => ({ id: '7', comments: [] })),
      readSessionUser: vi.fn(async () => routeSessionUser),
    });
    const runtime = createRuntime();
    runtime.buildReviewInteractionDeps = vi.fn(() => reviewDeps);

    const response = await createRouteRequest(runtime)(
      new Request(`${apiUrl}/api/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          placeId: 'bread-house',
          stampId: '11',
          body: 'visited today',
          mood: '혼자서',
        }),
      }),
      env,
    );

    expect(response.status).toBe(201);
    expect(await readJson<{ id: string; comments: unknown[] }>(response)).toEqual({ id: '7', comments: [] });
    expect(reviewDeps.loadSingleReview).toHaveBeenCalledWith(env, '7', 'actor');
  });

  it('dispatches authenticated comment creation through the Worker write route', async () => {
    supabaseMock.supabaseRequest.mockImplementation(async (_env, path: string) => {
      if (path.startsWith('feed?select=')) {
        return [{ feed_id: 7, position_id: 101, user_id: 'owner' }];
      }
      if (path === 'user_comment?select=comment_id') {
        return [{ comment_id: 22 }];
      }
      return [];
    });
    const reviewDeps = createReviewInteractionDeps({
      loadSingleReview: vi.fn(async () => ({ id: '7', comments: [{ id: '22' }] })),
      readSessionUser: vi.fn(async () => routeSessionUser),
    });
    const runtime = createRuntime();
    runtime.buildReviewInteractionDeps = vi.fn(() => reviewDeps);

    const response = await createRouteRequest(runtime)(
      new Request(`${apiUrl}/api/reviews/7/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: '좋아요' }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(await readJson<Array<{ id: string }>>(response)).toEqual([{ id: '22' }]);
    expect(reviewDeps.loadSingleReview).toHaveBeenCalledWith(env, '7', 'actor');
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
