import { buildInFilter, encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type { WorkerEnv, WorkerJsonRecord } from '../../types';
import type {
  WorkerCommunityRouteLikeRow,
  WorkerCommunityRoutePlaceRow,
  WorkerCommunityRouteRow,
  WorkerCommunityUserRow,
} from './contracts';

export async function readRouteRow(env: WorkerEnv, routeId: string) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `user_route?select=route_id,user_id,like_count&route_id=eq.${encodeFilterValue(routeId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function loadRouteRows(env: WorkerEnv, options: { sort?: string; ownerUserId?: string | null }) {
  const { sort = 'popular', ownerUserId = null } = options;
  const routeFilter = ownerUserId
    ? `user_id=eq.${encodeFilterValue(ownerUserId)}&order=created_at.desc`
    : `is_public=eq.true&order=${sort === 'popular' ? 'like_count.desc,created_at.desc' : 'created_at.desc'}`;
  return supabaseRequest<WorkerCommunityRouteRow[]>(
    env,
    `user_route?select=route_id,user_id,travel_session_id,title,description,mood,like_count,created_at,is_public,is_user_generated&${routeFilter}`,
  );
}

export async function loadRouteDetailRows(env: WorkerEnv, routeRows: WorkerCommunityRouteRow[], sessionUserId: string | null) {
  const routeIdsFilter = buildInFilter(routeRows.map((row) => row.route_id));
  if (!routeIdsFilter) {
    return { routePlaceRows: [], userRouteLikeRows: [], userRows: [] };
  }

  const [routePlaceRows, userRouteLikeRows = []] = await Promise.all([
    supabaseRequest<WorkerCommunityRoutePlaceRow[]>(env, `user_route_place?select=route_id,position_id,stop_order&route_id=${routeIdsFilter}&order=stop_order.asc`),
    sessionUserId
      ? supabaseRequest<WorkerCommunityRouteLikeRow[]>(env, `user_route_like?select=route_id&user_id=eq.${encodeFilterValue(sessionUserId)}&route_id=${routeIdsFilter}`)
      : Promise.resolve([]),
  ]);
  const userIdsFilter = buildInFilter(routeRows.map((row) => row.user_id));
  const userRows = userIdsFilter ? await supabaseRequest<WorkerCommunityUserRow[]>(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];
  return { routePlaceRows, userRouteLikeRows, userRows };
}

export async function readTravelSessionForOwner(env: WorkerEnv, travelSessionId: string, userId: string) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `travel_session?select=travel_session_id,user_id&travel_session_id=eq.${encodeFilterValue(travelSessionId)}&user_id=eq.${encodeFilterValue(userId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function readExistingRouteForSession(env: WorkerEnv, travelSessionId: string, userId: string) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `user_route?select=route_id&user_id=eq.${encodeFilterValue(userId)}&travel_session_id=eq.${encodeFilterValue(travelSessionId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function loadSessionStampRows(env: WorkerEnv, travelSessionId: string, userId: string) {
  return supabaseRequest<WorkerJsonRecord[]>(
    env,
    `user_stamp?select=position_id,created_at&travel_session_id=eq.${encodeFilterValue(travelSessionId)}&user_id=eq.${encodeFilterValue(userId)}&order=created_at.asc`,
  );
}

export async function createUserRoute(env: WorkerEnv, payload: WorkerJsonRecord) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(env, 'user_route?select=route_id', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return rows?.[0]?.route_id ?? null;
}

export async function createUserRoutePlaces(env: WorkerEnv, routeId: string | number, orderedPositionIds: string[]) {
  await supabaseRequest(env, 'user_route_place?select=user_route_place_id', {
    method: 'POST',
    body: JSON.stringify(orderedPositionIds.map((positionId, index) => ({ route_id: Number(routeId), position_id: Number(positionId), stop_order: index + 1 }))),
  });
}

export async function readRouteLikeRow(env: WorkerEnv, routeId: string, userId: string) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `user_route_like?select=route_like_id&route_id=eq.${encodeFilterValue(routeId)}&user_id=eq.${encodeFilterValue(userId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function createRouteLike(env: WorkerEnv, routeId: string, userId: string) {
  await supabaseRequest(env, 'user_route_like?select=route_like_id', {
    method: 'POST',
    body: JSON.stringify({ route_id: Number(routeId), user_id: userId }),
  });
}

export async function deleteRouteLike(env: WorkerEnv, routeLikeId: string | number) {
  await supabaseRequest(env, `user_route_like?route_like_id=eq.${encodeFilterValue(routeLikeId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}

export async function countRouteLikes(env: WorkerEnv, routeId: string) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(env, `user_route_like?select=route_like_id&route_id=eq.${encodeFilterValue(routeId)}`);
  return rows.length;
}

export async function updateRouteLikeCount(env: WorkerEnv, routeId: string, likeCount: number) {
  await supabaseRequest(env, `user_route?route_id=eq.${encodeFilterValue(routeId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ like_count: likeCount, updated_at: new Date().toISOString() }),
  });
}
