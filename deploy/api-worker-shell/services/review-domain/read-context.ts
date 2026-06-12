/*
 * File: read-context.ts
 * Purpose: Build review read-model context shared by list, page, and detail reads.
 * Primary Responsibility: Own review dependency row fan-out and map/set indexes for mapper calls.
 * Design Intent: Keep Worker review handlers focused on public API orchestration while this domain helper hides repeated read-context assembly.
 * Non-Goals: This file does not build HTTP responses, parse requests, or map final review DTOs.
 * Dependencies: Worker environment contract and review-domain read repositories.
 */
import type { SupabaseMapRow, WorkerPlace } from '../../runtime/base-data-contracts';
import type { WorkerEnv } from '../../types';
import type {
  WorkerReviewCommentRow,
  WorkerReviewFeedRow,
  WorkerReviewLikeRow,
  WorkerReviewRouteRow,
  WorkerReviewStampRow,
  WorkerReviewUserRow,
} from './contracts';
import {
  readReviewCommentRows,
  readReviewLikeRows,
  readReviewRouteRows,
  readReviewStampRows,
  readReviewUserRows,
  readUserFeedLikeRows,
} from './read-repository';

export interface WorkerReviewPlaceContext {
  placeIdToPositionId: Map<string, string>;
  placesByPositionId: Map<string, WorkerPlace>;
}

export interface WorkerReviewMappingContext {
  commentRows: WorkerReviewCommentRow[];
  likeRows: WorkerReviewLikeRow[];
  likedFeedIds: Set<string>;
  reviewRouteRows: WorkerReviewRouteRow[];
  stampRowsById: Map<string, WorkerReviewStampRow>;
  usersById: Map<string, WorkerReviewUserRow>;
}

/**
 * Converts static place rows into the two lookup maps required by review read flows.
 */
export function buildReviewPlaceContext(placeRows: SupabaseMapRow[], mapPlace: (row: SupabaseMapRow) => WorkerPlace): WorkerReviewPlaceContext {
  const places = placeRows.map(mapPlace);
  return {
    placeIdToPositionId: new Map(places.map((place) => [place.id, place.positionId])),
    placesByPositionId: new Map(places.map((place) => [place.positionId, place])),
  };
}

/**
 * Loads comment, like, stamp, route, and user rows needed to map feed rows into review DTOs.
 */
export async function loadReviewMappingContext(
  env: WorkerEnv,
  feedRows: WorkerReviewFeedRow[],
  sessionUserId: string | null,
): Promise<WorkerReviewMappingContext> {
  const feedIds = feedRows.map((row) => row.feed_id);
  const [commentRows, likeRows, reviewStampRows, userFeedLikeRows = []] = await Promise.all([
    readReviewCommentRows(env, feedIds),
    readReviewLikeRows(env, feedIds),
    readReviewStampRows(env, feedRows.map((row) => row.stamp_id)),
    readUserFeedLikeRows(env, feedIds, sessionUserId),
  ]);
  const reviewTravelSessionIds = [
    ...new Set(
      (reviewStampRows ?? [])
        .map((row) => row.travel_session_id)
        .filter(Boolean)
        .map((value) => String(value)),
    ),
  ];
  const reviewRouteRows = await readReviewRouteRows(env, reviewTravelSessionIds);
  const userRows = await readReviewUserRows(env, [
    ...feedRows.map((row) => row.user_id),
    ...commentRows.map((row) => row.user_id),
  ]);

  return {
    commentRows,
    likeRows,
    likedFeedIds: new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id))),
    reviewRouteRows,
    stampRowsById: new Map((reviewStampRows ?? []).map((row) => [String(row.stamp_id), row])),
    usersById: new Map(userRows.map((row) => [row.user_id, row] as const)),
  };
}
