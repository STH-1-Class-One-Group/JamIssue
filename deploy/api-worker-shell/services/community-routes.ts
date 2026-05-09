import { jsonResponse } from '../lib/http';
import { readSessionUser } from './auth';
import { mapCommunityRoutes } from './community-domain/mapper';
import {
  countRouteLikes,
  createRouteLike,
  createUserRoute,
  createUserRoutePlaces,
  deleteRouteLike,
  loadRouteDetailRows,
  loadRouteRows,
  loadSessionStampRows,
  readExistingRouteForSession,
  readRouteLikeRow,
  readRouteRow,
  readTravelSessionForOwner,
  updateRouteLikeCount,
} from './community-domain/repository';
import { countUnreadNotifications, createUserNotification, loadNotificationById, publishNotificationEvent } from './notifications';

export function createCommunityRouteService({ loadStaticBaseRows }: {
  loadStaticBaseRows: (env: any) => Promise<any>;
}) {
  async function requireSessionUser(request: Request, env: any) {
    const sessionUser = await readSessionUser(request, env);
    if (!sessionUser) {
      return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
    }
    return { sessionUser };
  }

  async function readJsonBody(request: Request): Promise<any> {
    try {
      return await request.json();
    } catch {
      throw new Error('요청 형식이 올바르지 않아요.');
    }
  }

  async function loadCommunityRoutes(env: any, options: any = {}) {
    const { sort = 'popular', sessionUserId = null, ownerUserId = null } = options;
    const routeRows = await loadRouteRows(env, { sort, ownerUserId });
    const { routePlaceRows, userRouteLikeRows, userRows } = await loadRouteDetailRows(env, routeRows, sessionUserId);
    if (routePlaceRows.length === 0) {
      return [];
    }

    const { placeRows } = await loadStaticBaseRows(env);
    const neededPositionIds = new Set(routePlaceRows.map((row) => String(row.position_id)));
    const placesByPositionId = new Map(placeRows.filter((row) => neededPositionIds.has(String(row.position_id))).map((row) => [String(row.position_id), { id: row.slug, name: row.name }]));
    const usersById = new Map(userRows.map((row) => [row.user_id, row]));
    const likedRouteIds = new Set(userRouteLikeRows.map((row) => String(row.route_id)));
    return mapCommunityRoutes(routeRows, routePlaceRows, usersById, placesByPositionId, likedRouteIds);
  }

  async function handleCommunityRoutes(request: Request, env: any, url: URL) {
    const sessionUser = await readSessionUser(request, env);
    const sort = url.searchParams.get('sort') === 'latest' ? 'latest' : 'popular';
    const routes = await loadCommunityRoutes(env, { sort, sessionUserId: sessionUser?.id ?? null });
    return jsonResponse(200, routes, env, request);
  }

  async function handleMyRoutes(request: Request, env: any) {
    const sessionUser = await readSessionUser(request, env);
    if (!sessionUser) {
      return jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request);
    }
    return jsonResponse(200, await loadCommunityRoutes(env, { ownerUserId: sessionUser.id, sessionUserId: sessionUser.id }), env, request);
  }

  async function handleCreateUserRoute(request: Request, env: any) {
    const sessionResult = await requireSessionUser(request, env);
    if (sessionResult.response) {
      return sessionResult.response;
    }

    const payload = await readJsonBody(request);
    const travelSessionId = String(payload.travelSessionId ?? '').trim();
    const title = String(payload.title ?? '').trim();
    const description = String(payload.description ?? '').trim();
    const mood = String(payload.mood ?? '').trim();
    const isPublic = payload.isPublic !== false;
    if (!travelSessionId) {
      return jsonResponse(400, { detail: '방향을 묶을 여행 세션이 필요해요.' }, env, request);
    }
    if (!title) {
      return jsonResponse(400, { detail: '경로 제목을 적어 주세요.' }, env, request);
    }
    if (!description) {
      return jsonResponse(400, { detail: '한 줄 소개를 적어 주세요.' }, env, request);
    }

    const sessionRow = await readTravelSessionForOwner(env, travelSessionId, sessionResult.sessionUser.id);
    if (!sessionRow) {
      return jsonResponse(404, { detail: '여행 세션을 찾지 못했어요.' }, env, request);
    }
    const existingRoute = await readExistingRouteForSession(env, travelSessionId, sessionResult.sessionUser.id);
    if (existingRoute) {
      return jsonResponse(409, { detail: '이미 발행된 여행 코스예요.' }, env, request);
    }

    const sessionStampRows = await loadSessionStampRows(env, travelSessionId, sessionResult.sessionUser.id);
    const orderedPositionIds = [];
    const seenPositionIds = new Set();
    for (const stampRow of sessionStampRows ?? []) {
      const positionId = String(stampRow.position_id);
      if (seenPositionIds.has(positionId)) {
        continue;
      }
      seenPositionIds.add(positionId);
      orderedPositionIds.push(positionId);
    }
    if (orderedPositionIds.length < 2) {
      return jsonResponse(400, { detail: '코스에는 최소 두 곳 이상의 스탬프 기록이 필요해요.' }, env, request);
    }

    const routeId = await createUserRoute(env, {
      user_id: sessionResult.sessionUser.id,
      travel_session_id: Number(travelSessionId),
      title,
      description,
      mood,
      is_public: isPublic,
      is_user_generated: true,
      like_count: 0,
    });
    await createUserRoutePlaces(env, routeId as string | number, orderedPositionIds);
    const routes = await loadCommunityRoutes(env, { ownerUserId: sessionResult.sessionUser.id, sessionUserId: sessionResult.sessionUser.id });
    const createdRoute = routes.find((route) => route.id === String(routeId)) ?? null;

    const createdNotification = await createUserNotification(env, {
      userId: sessionResult.sessionUser.id,
      actorUserId: sessionResult.sessionUser.id,
      type: 'route-published',
      title: '새로운 코스가 발행되었습니다.',
      body: title,
      routeId,
      metadata: { travelSessionId },
    });
    if (createdNotification?.notification_id) {
      const notification = await loadNotificationById(env, createdNotification.notification_id);
      if (notification) {
        await publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.created', {
          notification,
          unreadCount: await countUnreadNotifications(env, sessionResult.sessionUser.id),
        });
      }
    }
    return jsonResponse(201, createdRoute, env, request);
  }

  async function handleToggleCommunityRouteLike(request: Request, env: any, routeId: string) {
    const sessionResult = await requireSessionUser(request, env);
    if (sessionResult.response) {
      return sessionResult.response;
    }

    const routeRow = await readRouteRow(env, routeId);
    if (!routeRow) {
      return jsonResponse(404, { detail: '경로를 찾지 못했어요.' }, env, request);
    }

    const existing = await readRouteLikeRow(env, routeId, sessionResult.sessionUser.id);
    if (existing) {
      await deleteRouteLike(env, existing.route_like_id as string | number);
    } else {
      await createRouteLike(env, routeId, sessionResult.sessionUser.id);
    }
    const likeCount = await countRouteLikes(env, routeId);
    await updateRouteLikeCount(env, routeId, likeCount);
    return jsonResponse(200, { routeId: String(routeId), likeCount, likedByMe: !existing }, env, request);
  }

  return { handleCommunityRoutes, handleCreateUserRoute, handleMyRoutes, handleToggleCommunityRouteLike, loadCommunityRoutes };
}
