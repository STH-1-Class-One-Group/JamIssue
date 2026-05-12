import { jsonResponse } from './lib/http';
import { createAdminService } from './services/admin';
import { readSessionUser } from './services/auth';
import { createCommunityRouteService } from './services/community-routes';
import {
  countUnreadNotifications,
  createUserNotification,
  loadNotificationById,
  loadUserNotifications,
  publishNotificationEvent,
} from './services/notifications';
import { createReviewReadService } from './services/reviews';
import { createStampService } from './services/stamps';
import { createMyService } from './services/my';
import {
  BADGE_BY_MOOD,
  createLoadBaseData,
  formatVisitLabel,
  loadCuratedCourses,
  loadStaticBaseRows,
  mapPlace,
  normalizePlaceCategory,
} from './runtime/base-data';
import { createRouteRequest } from './runtime/routing';
import type { WorkerReviewInteractionDeps } from './services/review-domain';
import type { WorkerEnv } from './types';

const reviewReadService = createReviewReadService({
  formatVisitLabel,
  loadStaticBaseRows,
  mapPlace,
});
const communityRouteService = createCommunityRouteService({ loadStaticBaseRows });
const loadBaseData = createLoadBaseData(reviewReadService);
const myService = createMyService({
  communityRouteService,
  loadBaseData,
  loadStaticBaseRows,
  loadUserNotifications,
});
const adminService = createAdminService({ normalizePlaceCategory });
const stampService = createStampService({ loadBaseData });

function buildReviewInteractionDeps(): WorkerReviewInteractionDeps {
  return {
    badgeByMood: BADGE_BY_MOOD,
    countUnreadNotifications,
    createUserNotification,
    loadBaseData,
    loadNotificationById,
    loadSingleReview: reviewReadService.loadSingleReview,
    publishNotificationEvent,
    readSessionUser,
  };
}

const routeRequest = createRouteRequest({
  adminService,
  buildReviewInteractionDeps,
  communityRouteService,
  loadBaseData,
  loadCuratedCourses,
  myService,
  reviewReadService,
  stampService,
});

export function buildWorkerErrorPayload() {
  return {
    service: 'daejeon-jamissue-api',
    status: 'worker-error',
    message: 'Internal worker error',
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      console.error('Worker request failed', error);
      return jsonResponse(500, buildWorkerErrorPayload(), env, request);
    }
  },
};
