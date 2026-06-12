import { describe, expect, it, vi } from 'vitest';
import { createExactRoutes, createPatternRoutes } from '../../deploy/api-worker-shell/runtime/route-registry';
import type { RouteRuntime } from '../../deploy/api-worker-shell/runtime/route-runtime';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

function runtimeFixture(): RouteRuntime {
  return {
    adminService: {
      handleAdminImportPublicData: vi.fn(),
      handleAdminPlaceVisibility: vi.fn(),
      handleAdminSummary: vi.fn(),
    },
    buildReviewInteractionDeps: vi.fn(),
    communityRouteService: {
      handleCommunityRoutes: vi.fn(),
      handleCreateUserRoute: vi.fn(),
      handleMyRoutes: vi.fn(),
      handleToggleCommunityRouteLike: vi.fn(),
    },
    loadBaseData: vi.fn(),
    loadCuratedCourses: vi.fn(),
    myService: {
      handleMyComments: vi.fn(),
      handleMySummary: vi.fn(),
    },
    reviewReadService: {
      buildCommentTree: vi.fn(),
      countComments: vi.fn(),
      handleReviewDetail: vi.fn(),
      handleReviewFeed: vi.fn(),
      handleReviews: vi.fn(),
      loadReviewData: vi.fn(),
      loadReviewPageData: vi.fn(),
      loadSingleReview: vi.fn(),
      mapReviewRows: vi.fn(),
    },
    stampService: {
      handleToggleStamp: vi.fn(),
    },
  } as unknown as RouteRuntime;
}

describe('worker route registry contract', () => {
  it('registers every exact public route without leaking route matching into callers', () => {
    const request = new Request('https://api.test/api/bootstrap');
    const env = {} as WorkerEnv;
    const url = new URL(request.url);
    const routes = createExactRoutes(request, env, url, runtimeFixture());

    expect(routes.map(([method, pathname]) => `${method} ${pathname}`)).toEqual([
      'GET /api/health',
      'GET /api/auth/providers',
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'PATCH /api/auth/profile',
      'GET /api/auth/naver/login',
      'GET /api/auth/naver/callback',
      'GET /api/auth/kakao/login',
      'GET /api/auth/kakao/callback',
      'GET /api/bootstrap',
      'GET /api/map-bootstrap',
      'GET /api/courses/curated',
      'GET /api/review-feed',
      'GET /api/reviews',
      'POST /api/reviews/upload',
      'POST /api/reviews',
      'POST /api/stamps/toggle',
      'GET /api/community-routes',
      'POST /api/community-routes',
      'GET /api/my/routes',
      'GET /api/my/summary',
      'GET /api/my/notifications',
      'GET /api/my/notifications/realtime-channel',
      'GET /api/my/comments',
      'PATCH /api/notifications/read-all',
      'GET /api/festivals',
      'GET /api/banner/events',
      'GET /api/tourism/places',
      'POST /api/internal/public-events/import',
      'GET /api/admin/summary',
      'POST /api/admin/import/public-data',
    ]);
  });

  it('registers pattern routes for review, comment, community, notification, and admin resources', () => {
    const routes = createPatternRoutes(
      new Request('https://api.test/api/reviews/7'),
      {} as WorkerEnv,
      runtimeFixture(),
    );

    const routeKeys = routes.map(([method, pattern]) => `${method} ${pattern.source}`);
    expect(routeKeys).toEqual([
      'GET ^\\/api\\/reviews\\/(\\d+)$',
      'PATCH ^\\/api\\/reviews\\/(\\d+)$',
      'DELETE ^\\/api\\/reviews\\/(\\d+)$',
      'GET ^\\/api\\/reviews\\/(\\d+)\\/comments$',
      'POST ^\\/api\\/reviews\\/(\\d+)\\/comments$',
      'PATCH ^\\/api\\/reviews\\/(\\d+)\\/comments\\/(\\d+)$',
      'DELETE ^\\/api\\/reviews\\/(\\d+)\\/comments\\/(\\d+)$',
      'POST ^\\/api\\/reviews\\/(\\d+)\\/like$',
      'POST ^\\/api\\/community-routes\\/(\\d+)\\/like$',
      'PATCH ^\\/api\\/notifications\\/(\\d+)\\/read$',
      'DELETE ^\\/api\\/notifications\\/(\\d+)$',
      'PATCH ^\\/api\\/admin\\/places\\/([^/]+)$',
    ]);
  });

  it('dispatches exact routes that belong to runtime-owned services', async () => {
    const request = new Request('https://api.test/api/review-feed');
    const env = {} as WorkerEnv;
    const url = new URL(request.url);
    const runtime = runtimeFixture();
    vi.mocked(runtime.reviewReadService.handleReviewFeed).mockResolvedValue(new Response('review-feed'));
    vi.mocked(runtime.communityRouteService.handleCommunityRoutes).mockResolvedValue(new Response('community-routes'));
    vi.mocked(runtime.myService.handleMySummary).mockResolvedValue(new Response('my-summary'));
    vi.mocked(runtime.adminService.handleAdminSummary).mockResolvedValue(new Response('admin-summary'));

    const routes = createExactRoutes(request, env, url, runtime);
    const runExactRoute = async (method: string, pathname: string) => {
      const route = routes.find(([routeMethod, routePathname]) => routeMethod === method && routePathname === pathname);
      if (!route) {
        throw new Error(`${method} ${pathname} route missing`);
      }
      return route[2]();
    };

    await expect((await runExactRoute('GET', '/api/review-feed')).text()).resolves.toBe('review-feed');
    await expect((await runExactRoute('GET', '/api/community-routes')).text()).resolves.toBe('community-routes');
    await expect((await runExactRoute('GET', '/api/my/summary')).text()).resolves.toBe('my-summary');
    await expect((await runExactRoute('GET', '/api/admin/summary')).text()).resolves.toBe('admin-summary');
    expect(runtime.reviewReadService.handleReviewFeed).toHaveBeenCalledWith(request, env, url);
    expect(runtime.communityRouteService.handleCommunityRoutes).toHaveBeenCalledWith(request, env, url);
    expect(runtime.myService.handleMySummary).toHaveBeenCalledWith(request, env);
    expect(runtime.adminService.handleAdminSummary).toHaveBeenCalledWith(request, env);
  });

  it('dispatches pattern routes that belong to runtime-owned services', async () => {
    const request = new Request('https://api.test/api/reviews/7/comments');
    const env = {} as WorkerEnv;
    const runtime = runtimeFixture();
    vi.mocked(runtime.reviewReadService.handleReviewDetail).mockResolvedValue(new Response('review-detail'));
    vi.mocked(runtime.reviewReadService.loadSingleReview).mockResolvedValue({
      comments: [{ id: 'comment-1', body: 'comment' }],
    } as Awaited<ReturnType<RouteRuntime['reviewReadService']['loadSingleReview']>>);
    vi.mocked(runtime.communityRouteService.handleToggleCommunityRouteLike).mockResolvedValue(new Response('route-like'));
    vi.mocked(runtime.adminService.handleAdminPlaceVisibility).mockResolvedValue(new Response('admin-place'));

    const routes = createPatternRoutes(request, env, runtime);
    const runPatternRoute = async (method: string, pathname: string) => {
      const route = routes.find(([routeMethod, pattern]) => routeMethod === method && pattern.test(pathname));
      if (!route) {
        throw new Error(`${method} ${pathname} route missing`);
      }
      return route[2](pathname.match(route[1]) as RegExpMatchArray);
    };

    await expect((await runPatternRoute('GET', '/api/reviews/7')).text()).resolves.toBe('review-detail');
    expect(runtime.reviewReadService.handleReviewDetail).toHaveBeenCalledWith(request, env, '7');

    const commentsResponse = await runPatternRoute('GET', '/api/reviews/7/comments');
    await expect(commentsResponse.json()).resolves.toEqual([{ id: 'comment-1', body: 'comment' }]);
    expect(runtime.reviewReadService.loadSingleReview).toHaveBeenCalledWith(env, '7', null);

    await expect((await runPatternRoute('POST', '/api/community-routes/9/like')).text()).resolves.toBe('route-like');
    expect(runtime.communityRouteService.handleToggleCommunityRouteLike).toHaveBeenCalledWith(request, env, '9');

    await expect((await runPatternRoute('PATCH', '/api/admin/places/place-1')).text()).resolves.toBe('admin-place');
    expect(runtime.adminService.handleAdminPlaceVisibility).toHaveBeenCalledWith(request, env, 'place-1');
  });
});
