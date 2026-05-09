import { jsonResponse } from '../lib/http';
import {
  handleAuthProviders,
  handleAuthSession,
  handleKakaoCallback,
  handleLogout,
  handleNaverCallback,
  handleStartKakaoLogin,
  handleStartNaverLogin,
  handleUpdateProfile,
  readSessionUser,
} from '../services/auth';
import { handleBannerEvents, handleFestivalImport, handleFestivals } from '../services/festivals';
import {
  handleDeleteNotification,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
  handleMyNotifications,
  handleNotificationRealtimeChannel,
} from '../services/notifications';
import {
  handleCreateComment,
  handleCreateReview,
  handleDeleteComment,
  handleDeleteReview,
  handleReviewUpload,
  handleToggleReviewLike,
  handleUpdateComment,
  handleUpdateReview,
} from '../services/review-interactions';
import type { RouteRuntime, WorkerEnv } from '../types';
import { handleBootstrap, handleCuratedCourses, handleHealth, handleMapBootstrap } from './route-handlers';

export type ExactRoute = [method: string, pathname: string, handler: () => Promise<Response>];
export type PatternRoute = [method: string, pattern: RegExp, handler: (match: RegExpMatchArray) => Promise<Response>];

export function createExactRoutes(request: Request, env: WorkerEnv, url: URL, runtime: RouteRuntime): ExactRoute[] {
  return [
    ['GET', '/api/health', () => handleHealth(request, env)],
    ['GET', '/api/auth/providers', () => handleAuthProviders(request, env)],
    ['GET', '/api/auth/me', () => handleAuthSession(request, env)],
    ['POST', '/api/auth/logout', () => handleLogout(request, env)],
    ['PATCH', '/api/auth/profile', () => handleUpdateProfile(request, env)],
    ['GET', '/api/auth/naver/login', () => handleStartNaverLogin(request, env, url)],
    ['GET', '/api/auth/naver/callback', () => handleNaverCallback(request, env, url)],
    ['GET', '/api/auth/kakao/login', () => handleStartKakaoLogin(request, env, url)],
    ['GET', '/api/auth/kakao/callback', () => handleKakaoCallback(request, env, url)],
    ['GET', '/api/bootstrap', () => handleBootstrap(request, env, runtime)],
    ['GET', '/api/map-bootstrap', () => handleMapBootstrap(request, env, runtime)],
    ['GET', '/api/courses/curated', () => handleCuratedCourses(request, env, runtime)],
    ['GET', '/api/review-feed', () => runtime.reviewReadService.handleReviewFeed(request, env, url)],
    ['GET', '/api/reviews', () => runtime.reviewReadService.handleReviews(request, env, url)],
    ['POST', '/api/reviews/upload', () => handleReviewUpload(request, env, runtime.buildReviewInteractionDeps())],
    ['POST', '/api/reviews', () => handleCreateReview(request, env, runtime.buildReviewInteractionDeps())],
    ['POST', '/api/stamps/toggle', () => runtime.stampService.handleToggleStamp(request, env)],
    ['GET', '/api/community-routes', () => runtime.communityRouteService.handleCommunityRoutes(request, env, url)],
    ['POST', '/api/community-routes', () => runtime.communityRouteService.handleCreateUserRoute(request, env)],
    ['GET', '/api/my/routes', () => runtime.communityRouteService.handleMyRoutes(request, env)],
    ['GET', '/api/my/summary', () => runtime.myService.handleMySummary(request, env)],
    ['GET', '/api/my/notifications', () => handleMyNotifications(request, env)],
    ['GET', '/api/my/notifications/realtime-channel', () => handleNotificationRealtimeChannel(request, env)],
    ['GET', '/api/my/comments', () => runtime.myService.handleMyComments(request, env, url)],
    ['PATCH', '/api/notifications/read-all', () => handleMarkAllNotificationsRead(request, env)],
    ['GET', '/api/festivals', () => handleFestivals(request, env)],
    ['GET', '/api/banner/events', () => handleBannerEvents(request, env)],
    ['POST', '/api/internal/public-events/import', () => handleFestivalImport(request, env)],
    ['GET', '/api/admin/summary', () => runtime.adminService.handleAdminSummary(request, env)],
    ['POST', '/api/admin/import/public-data', () => runtime.adminService.handleAdminImportPublicData(request, env)],
  ];
}

export function createPatternRoutes(request: Request, env: WorkerEnv, runtime: RouteRuntime): PatternRoute[] {
  return [
    ['GET', /^\/api\/reviews\/(\d+)$/, (match) => runtime.reviewReadService.handleReviewDetail(request, env, match[1])],
    ['PATCH', /^\/api\/reviews\/(\d+)$/, (match) => handleUpdateReview(request, env, match[1], runtime.buildReviewInteractionDeps())],
    ['DELETE', /^\/api\/reviews\/(\d+)$/, (match) => handleDeleteReview(request, env, match[1], runtime.buildReviewInteractionDeps())],
    [
      'GET',
      /^\/api\/reviews\/(\d+)\/comments$/,
      async (match) => {
        const sessionUser = await readSessionUser(request, env);
        const comments = (await runtime.reviewReadService.loadSingleReview(env, match[1], sessionUser?.id ?? null))?.comments ?? [];
        return jsonResponse(200, comments, env, request);
      },
    ],
    ['POST', /^\/api\/reviews\/(\d+)\/comments$/, (match) => handleCreateComment(request, env, match[1], runtime.buildReviewInteractionDeps())],
    [
      'PATCH',
      /^\/api\/reviews\/(\d+)\/comments\/(\d+)$/,
      (match) => handleUpdateComment(request, env, match[1], match[2], runtime.buildReviewInteractionDeps()),
    ],
    [
      'DELETE',
      /^\/api\/reviews\/(\d+)\/comments\/(\d+)$/,
      (match) => handleDeleteComment(request, env, match[1], match[2], runtime.buildReviewInteractionDeps()),
    ],
    ['POST', /^\/api\/reviews\/(\d+)\/like$/, (match) => handleToggleReviewLike(request, env, match[1], runtime.buildReviewInteractionDeps())],
    ['POST', /^\/api\/community-routes\/(\d+)\/like$/, (match) => runtime.communityRouteService.handleToggleCommunityRouteLike(request, env, match[1])],
    ['PATCH', /^\/api\/notifications\/(\d+)\/read$/, (match) => handleMarkNotificationRead(request, env, match[1])],
    ['DELETE', /^\/api\/notifications\/(\d+)$/, (match) => handleDeleteNotification(request, env, match[1])],
    ['PATCH', /^\/api\/admin\/places\/([^/]+)$/, (match) => runtime.adminService.handleAdminPlaceVisibility(request, env, match[1])],
  ];
}
