import { jsonResponse } from '../lib/http';
import { parseListLimit } from '../lib/supabase';
import { WorkerPaginationRuntimeConfig } from '../config/runtime';
import { readSessionUser } from './auth';
import { mapMyComments } from './my-domain/mapper';
import { loadFeedsForCommentRows, loadMyCommentRows, loadMySummaryCommentRows } from './my-domain/repository';
import type { WorkerEnv } from '../types';
import type { WorkerMyServiceDeps } from './my-domain/contracts';

interface WorkerMyCommentPageOptions {
  cursor?: string | null;
  limit?: number;
}

export function createMyService({ communityRouteService, loadBaseData, loadStaticBaseRows, loadUserNotifications }: WorkerMyServiceDeps) {
  async function loadMyCommentPageData(env: WorkerEnv, userId: string, options: WorkerMyCommentPageOptions = {}) {
    const { cursor = null, limit = WorkerPaginationRuntimeConfig.myCommentsPageSize } = options;
    const commentRows = await loadMyCommentRows(env, userId, cursor, limit);
    const nextCursor = commentRows.length > limit ? String(commentRows[limit].created_at) : null;
    const pageRows = commentRows.slice(0, limit);
    const feedRows = await loadFeedsForCommentRows(env, pageRows);
    if (feedRows.length === 0) {
      return { items: [], nextCursor };
    }

    const { placeRows } = await loadStaticBaseRows(env);
    const placesByPositionId = new Map(placeRows.map((row) => [String(row.position_id), { id: row.slug, name: row.name }]));
    return { items: mapMyComments(pageRows, feedRows ?? [], placesByPositionId), nextCursor };
  }

  async function handleMyComments(request: Request, env: WorkerEnv, url: URL) {
    const sessionUser = await readSessionUser(request, env);
    if (!sessionUser) {
      return jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request);
    }
    const payload = await loadMyCommentPageData(env, sessionUser.id, {
      cursor: url.searchParams.get('cursor') ?? null,
      limit: parseListLimit(url, WorkerPaginationRuntimeConfig.myCommentsPageSize, WorkerPaginationRuntimeConfig.myCommentsMaxPageSize),
    });
    return jsonResponse(200, payload, env, request);
  }

  async function handleMySummary(request: Request, env: WorkerEnv) {
    const sessionUser = await readSessionUser(request, env);
    if (!sessionUser) {
      return jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request);
    }

    const baseData = await loadBaseData(env, sessionUser.id);
    const routes = await communityRouteService.loadCommunityRoutes(env, { ownerUserId: sessionUser.id, sessionUserId: sessionUser.id });
    const reviewItems = baseData.reviews.filter((review) => review.userId === sessionUser.id);
    const reviewById = new Map(baseData.reviews.map((review) => [String(review.id), review]));
    const notifications = await loadUserNotifications(env, sessionUser.id);
    const myCommentRows = await loadMySummaryCommentRows(env, sessionUser.id);
    const placesByPositionId = new Map(baseData.places.map((place) => [String(place.positionId), { id: place.id, name: place.name }]));
    const myComments = mapMyComments(myCommentRows ?? [], reviewById, placesByPositionId);
    const collectedSet = new Set(baseData.collectedPlaceIds);
    const visitedPlaces = baseData.places.filter((place) => collectedSet.has(place.id)).map(({ positionId, ...place }) => place);
    const unvisitedPlaces = baseData.places.filter((place) => !collectedSet.has(place.id)).map(({ positionId, ...place }) => place);
    return jsonResponse(
      200,
      {
        user: sessionUser,
        stats: {
          reviewCount: reviewItems.length,
          stampCount: baseData.stampLogs.length,
          uniquePlaceCount: collectedSet.size,
          totalPlaceCount: baseData.places.length,
          routeCount: routes.length,
        },
        reviews: reviewItems,
        comments: myComments,
        notifications,
        unreadNotificationCount: notifications.filter((notification) => !notification.isRead).length,
        stampLogs: baseData.stampLogs,
        travelSessions: baseData.travelSessions,
        visitedPlaces,
        unvisitedPlaces,
        collectedPlaces: visitedPlaces,
        routes,
      },
      env,
      request,
    );
  }

  return { handleMyComments, handleMySummary };
}
