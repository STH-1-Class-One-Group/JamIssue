import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteRuntime } from '../../deploy/api-worker-shell/runtime/route-runtime';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const registryMocks = vi.hoisted(() => {
  const response = (name: string) => vi.fn(async () => new Response(name));
  return {
    auth: {
      handleAuthProviders: response('auth-providers'),
      handleAuthSession: response('auth-session'),
      handleKakaoCallback: response('kakao-callback'),
      handleLogout: response('logout'),
      handleNaverCallback: response('naver-callback'),
      handleStartKakaoLogin: response('kakao-login'),
      handleStartNaverLogin: response('naver-login'),
      handleUpdateProfile: response('profile'),
      readSessionUser: vi.fn(async () => ({ id: 'user-1' })),
    },
    festivals: {
      handleBannerEvents: response('banner-events'),
      handleFestivalImport: response('festival-import'),
      handleFestivals: response('festivals'),
    },
    tourism: {
      handleTourismPlaces: response('tourism-places'),
    },
    notifications: {
      handleDeleteNotification: response('notification-delete'),
      handleMarkAllNotificationsRead: response('notifications-read-all'),
      handleMarkNotificationRead: response('notification-read'),
      handleMyNotifications: response('my-notifications'),
      handleNotificationRealtimeChannel: response('notification-realtime'),
    },
    reviewInteractions: {
      handleCreateComment: response('comment-create'),
      handleCreateReview: response('review-create'),
      handleDeleteComment: response('comment-delete'),
      handleDeleteReview: response('review-delete'),
      handleReviewUpload: response('review-upload'),
      handleToggleReviewLike: response('review-like'),
      handleUpdateComment: response('comment-update'),
      handleUpdateReview: response('review-update'),
    },
    routeHandlers: {
      handleBootstrap: response('bootstrap'),
      handleCuratedCourses: response('curated-courses'),
      handleHealth: response('health'),
      handleMapBootstrap: response('map-bootstrap'),
    },
  };
});

vi.mock('../../deploy/api-worker-shell/services/auth', () => registryMocks.auth);
vi.mock('../../deploy/api-worker-shell/services/festivals', () => registryMocks.festivals);
vi.mock('../../deploy/api-worker-shell/services/tourism', () => registryMocks.tourism);
vi.mock('../../deploy/api-worker-shell/services/notifications', () => registryMocks.notifications);
vi.mock('../../deploy/api-worker-shell/services/review-interactions', () => registryMocks.reviewInteractions);
vi.mock('../../deploy/api-worker-shell/runtime/route-handlers', () => registryMocks.routeHandlers);

function runtimeFixture(): RouteRuntime {
  return {
    adminService: {
      handleAdminImportPublicData: vi.fn(async () => new Response('admin-import')),
      handleAdminPlaceVisibility: vi.fn(async () => new Response('admin-place')),
      handleAdminSummary: vi.fn(async () => new Response('admin-summary')),
    },
    buildReviewInteractionDeps: vi.fn(() => ({ deps: true })),
    communityRouteService: {
      handleCommunityRoutes: vi.fn(async () => new Response('community-routes')),
      handleCreateUserRoute: vi.fn(async () => new Response('community-create')),
      handleMyRoutes: vi.fn(async () => new Response('my-routes')),
      handleToggleCommunityRouteLike: vi.fn(async () => new Response('community-like')),
    },
    loadBaseData: vi.fn(),
    loadCuratedCourses: vi.fn(),
    myService: {
      handleMyComments: vi.fn(async () => new Response('my-comments')),
      handleMySummary: vi.fn(async () => new Response('my-summary')),
    },
    reviewReadService: {
      buildCommentTree: vi.fn(),
      countComments: vi.fn(),
      handleReviewDetail: vi.fn(async () => new Response('review-detail')),
      handleReviewFeed: vi.fn(async () => new Response('review-feed')),
      handleReviews: vi.fn(async () => new Response('reviews')),
      loadReviewData: vi.fn(),
      loadReviewPageData: vi.fn(),
      loadSingleReview: vi.fn(async () => ({ comments: [{ id: 'comment-1' }] })),
      mapReviewRows: vi.fn(),
    },
    stampService: {
      handleToggleStamp: vi.fn(async () => new Response('stamp-toggle')),
    },
  } as unknown as RouteRuntime;
}

async function textOf(response: Promise<Response>) {
  return await (await response).text();
}

describe('worker route registry dispatch handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes every exact route handler without changing the route registry surface', async () => {
    const { createExactRoutes } = await import('../../deploy/api-worker-shell/runtime/route-registry');
    const request = new Request('https://api.test/api/bootstrap');
    const env = {} as WorkerEnv;
    const url = new URL(request.url);
    const runtime = runtimeFixture();
    const routes = createExactRoutes(request, env, url, runtime);

    await expect(Promise.all(routes.map(([, pathname, handler]) => textOf(handler()).then((text) => [pathname, text])))).resolves.toEqual([
      ['/api/health', 'health'],
      ['/api/auth/providers', 'auth-providers'],
      ['/api/auth/me', 'auth-session'],
      ['/api/auth/logout', 'logout'],
      ['/api/auth/profile', 'profile'],
      ['/api/auth/naver/login', 'naver-login'],
      ['/api/auth/naver/callback', 'naver-callback'],
      ['/api/auth/kakao/login', 'kakao-login'],
      ['/api/auth/kakao/callback', 'kakao-callback'],
      ['/api/bootstrap', 'bootstrap'],
      ['/api/map-bootstrap', 'map-bootstrap'],
      ['/api/courses/curated', 'curated-courses'],
      ['/api/review-feed', 'review-feed'],
      ['/api/reviews', 'reviews'],
      ['/api/reviews/upload', 'review-upload'],
      ['/api/reviews', 'review-create'],
      ['/api/stamps/toggle', 'stamp-toggle'],
      ['/api/community-routes', 'community-routes'],
      ['/api/community-routes', 'community-create'],
      ['/api/my/routes', 'my-routes'],
      ['/api/my/summary', 'my-summary'],
      ['/api/my/notifications', 'my-notifications'],
      ['/api/my/notifications/realtime-channel', 'notification-realtime'],
      ['/api/my/comments', 'my-comments'],
      ['/api/notifications/read-all', 'notifications-read-all'],
      ['/api/festivals', 'festivals'],
      ['/api/banner/events', 'banner-events'],
      ['/api/tourism/places', 'tourism-places'],
      ['/api/internal/public-events/import', 'festival-import'],
      ['/api/admin/summary', 'admin-summary'],
      ['/api/admin/import/public-data', 'admin-import'],
    ]);
    expect(runtime.buildReviewInteractionDeps).toHaveBeenCalledTimes(2);
  });

  it('executes every pattern route handler with the matched identifier values', async () => {
    const { createPatternRoutes } = await import('../../deploy/api-worker-shell/runtime/route-registry');
    const request = new Request('https://api.test/api/reviews/7/comments');
    const env = {} as WorkerEnv;
    const runtime = runtimeFixture();
    const routes = createPatternRoutes(request, env, runtime);
    const pathnames = [
      '/api/reviews/7',
      '/api/reviews/7',
      '/api/reviews/7',
      '/api/reviews/7/comments',
      '/api/reviews/7/comments',
      '/api/reviews/7/comments/3',
      '/api/reviews/7/comments/3',
      '/api/reviews/7/like',
      '/api/community-routes/9/like',
      '/api/notifications/5/read',
      '/api/notifications/5',
      '/api/admin/places/place-1',
    ];

    const results = await Promise.all(routes.map(([method, pattern, handler], index) => {
      const match = pathnames[index].match(pattern);
      if (!match) {
        throw new Error(`${method} ${pathnames[index]} did not match ${pattern.source}`);
      }
      return textOf(handler(match)).then((text) => [method, text]);
    }));

    expect(results).toEqual([
      ['GET', 'review-detail'],
      ['PATCH', 'review-update'],
      ['DELETE', 'review-delete'],
      ['GET', JSON.stringify([{ id: 'comment-1' }])],
      ['POST', 'comment-create'],
      ['PATCH', 'comment-update'],
      ['DELETE', 'comment-delete'],
      ['POST', 'review-like'],
      ['POST', 'community-like'],
      ['PATCH', 'notification-read'],
      ['DELETE', 'notification-delete'],
      ['PATCH', 'admin-place'],
    ]);
    expect(registryMocks.auth.readSessionUser).toHaveBeenCalledWith(request, env);
    expect(runtime.reviewReadService.loadSingleReview).toHaveBeenCalledWith(env, '7', 'user-1');
    expect(runtime.adminService.handleAdminPlaceVisibility).toHaveBeenCalledWith(request, env, 'place-1');
  });
});
