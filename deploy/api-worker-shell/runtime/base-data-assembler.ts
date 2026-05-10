import type { WorkerReviewReadService } from '../services/review-domain/contracts';
import type { WorkerBaseData, WorkerEnv, WorkerJsonRecord, WorkerPlace } from '../types';
import {
  buildPlaceVisitCountMap,
  buildStampLogs,
  buildTravelSessions,
  mapCourses,
  mapPlace,
} from './base-data-mappers';
import { loadBaseDataRows } from './base-data-repository';

export function createLoadBaseData(reviewReadService: WorkerReviewReadService) {
  return async function loadBaseData(env: WorkerEnv, sessionUserId: string | null = null): Promise<WorkerBaseData> {
    const {
      staticRows: { placeRows, courseRows, coursePlaceRows },
      feedRows,
      commentRows,
      likeRows,
      reviewStampRows,
      userFeedLikeRows,
      userSessionRows,
      ownerRouteRows,
      userStampRows,
      allPlaceStampRows,
      reviewRouteRows,
      userRows,
    } = await loadBaseDataRows(env, sessionUserId);

    const allStampRows = [
      ...reviewStampRows,
      ...userStampRows.filter((row: any) => !reviewStampRows.some((stamp: any) => String(stamp.stamp_id) === String(row.stamp_id))),
    ];
    const placeVisitCounts = buildPlaceVisitCountMap(allPlaceStampRows);
    const places = placeRows.map((row) => mapPlace({ ...row, total_visit_count: placeVisitCounts.get(String(row.position_id)) ?? 0 }));
    const placesByPositionId = new Map<string, WorkerPlace>(places.map((place) => [place.positionId, place]));
    const usersById = new Map<string, WorkerJsonRecord>(userRows.map((row: any) => [row.user_id, row]));
    const stampRowsById = new Map<string, WorkerJsonRecord>((allStampRows ?? []).map((row: any) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set<string>((userFeedLikeRows ?? []).map((row: any) => String(row.feed_id)));
    const collectedPlaceIds = [
      ...new Set<string>(
        userStampRows
          .map((row: any) => placesByPositionId.get(String(row.position_id))?.id)
          .filter((placeId: unknown): placeId is string => typeof placeId === 'string' && placeId.length > 0),
      ),
    ];

    return {
      places,
      placesByPositionId,
      reviews: reviewReadService.mapReviewRows(
        feedRows,
        commentRows,
        likeRows,
        usersById,
        placesByPositionId,
        stampRowsById,
        reviewRouteRows,
        likedFeedIds,
      ),
      courses: mapCourses(courseRows, coursePlaceRows, placesByPositionId),
      collectedPlaceIds,
      stampLogs: buildStampLogs(userStampRows, placesByPositionId),
      travelSessions: buildTravelSessions(userSessionRows ?? [], userStampRows, placesByPositionId, ownerRouteRows ?? []),
    };
  };
}
