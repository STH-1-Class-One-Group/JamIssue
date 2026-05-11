import { formatDateTime } from '../../lib/dates';
import type {
  WorkerCommunityPlaceMap,
  WorkerCommunityRoutePlaceRow,
  WorkerCommunityRouteRow,
  WorkerCommunityUserRow,
} from './contracts';

interface WorkerCommunityRoutePlaceRef {
  stopOrder: number;
  placeId: string;
}

export function mapCommunityRoutes(
  routeRows: WorkerCommunityRouteRow[],
  routePlaceRows: WorkerCommunityRoutePlaceRow[],
  usersById: Map<string, WorkerCommunityUserRow>,
  placesByPositionId: WorkerCommunityPlaceMap,
  likedRouteIds = new Set<string>(),
) {
  const placeRowsByRouteId = new Map<string, WorkerCommunityRoutePlaceRef[]>();
  for (const row of routePlaceRows) {
    const routeId = String(row.route_id);
    if (!placeRowsByRouteId.has(routeId)) {
      placeRowsByRouteId.set(routeId, []);
    }
    placeRowsByRouteId.get(routeId)?.push({
      stopOrder: row.stop_order,
      placeId: placesByPositionId.get(String(row.position_id))?.id ?? String(row.position_id),
    });
  }

  return routeRows.map((row) => {
    const placeRows = (placeRowsByRouteId.get(String(row.route_id)) ?? []).sort((left, right) => left.stopOrder - right.stopOrder);
    const placeIds = placeRows.map((item) => item.placeId);
    return {
      id: String(row.route_id),
      authorId: row.user_id,
      author: usersById.get(row.user_id)?.nickname ?? '이름 없음',
      title: row.title,
      description: row.description,
      mood: row.mood,
      likeCount: row.like_count ?? 0,
      likedByMe: likedRouteIds.has(String(row.route_id)),
      createdAt: formatDateTime(row.created_at),
      placeIds,
      placeNames: placeIds.map((placeId) => {
        for (const place of placesByPositionId.values()) {
          if (place.id === placeId) {
            return place.name;
          }
        }
        return placeId;
      }),
      isUserGenerated: row.is_user_generated ?? false,
      travelSessionId: row.travel_session_id ? String(row.travel_session_id) : null,
    };
  });
}
