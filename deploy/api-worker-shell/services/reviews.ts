import { jsonResponse } from '../lib/http';
import { parseListLimit } from '../lib/supabase';
import { WorkerPaginationRuntimeConfig } from '../config/runtime';
import { readSessionUser } from './auth';
import { createReviewMapper } from './review-domain/mapper';
import type { WorkerEnv } from '../types';
import type {
  WorkerReviewDataFilters,
  WorkerReviewPageOptions,
  WorkerReviewReadServiceDeps,
  WorkerReviewUserRow,
} from './review-domain/contracts';
import {
  readReviewCommentRows,
  readReviewFeedRows,
  readReviewLikeRows,
  readReviewPageRows,
  readReviewPlaceRows,
  readReviewRouteRows,
  readReviewStampRows,
  readReviewUserRows,
  readSingleReviewFeedRow,
  readUserFeedLikeRows,
} from './review-domain/read-repository';

function indexUsersById(userRows: WorkerReviewUserRow[]) {
  return new Map(userRows.map((row) => [row.user_id, row] as const));
}

export function createReviewReadService({ formatVisitLabel, loadStaticBaseRows, mapPlace }: WorkerReviewReadServiceDeps) {
  const { buildCommentTree, countComments, mapReviewRows } = createReviewMapper(formatVisitLabel);

  async function loadReviewData(env: WorkerEnv, sessionUserId: string | null = null, filters: WorkerReviewDataFilters = {}) {
    const { placeRows } = await loadStaticBaseRows(env);
    const places = placeRows.map(mapPlace);
    const placesByPositionId = new Map(places.map((place) => [place.positionId, place]));
    const placeIdToPositionId = new Map(places.map((place) => [place.id, place.positionId]));
    let positionId: string | null = null;
    if (filters.placeId) {
      positionId = placeIdToPositionId.get(filters.placeId) ?? null;
      if (!positionId) {
        return [];
      }
    }

    const feedRows = await readReviewFeedRows(env, { positionId, userId: filters.userId });
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
    const userRows = await readReviewUserRows(env, [...feedRows.map((row) => row.user_id), ...commentRows.map((row) => row.user_id)]);
    const usersById = indexUsersById(userRows);
    const stampRowsById = new Map((reviewStampRows ?? []).map((row) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id)));
    return mapReviewRows(feedRows, commentRows, likeRows, usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds);
  }

  async function loadReviewPageData(env: WorkerEnv, sessionUserId: string | null = null, options: WorkerReviewPageOptions = {}) {
    const { cursor = null, limit = WorkerPaginationRuntimeConfig.reviewFeedPageSize } = options;
    const { placeRows } = await loadStaticBaseRows(env);
    const places = placeRows.map(mapPlace);
    const placesByPositionId = new Map(places.map((place) => [place.positionId, place]));
    const feedRows = await readReviewPageRows(env, { cursor, limit });
    const nextCursor = feedRows.length > limit ? String(feedRows[limit].created_at) : null;
    const pageRows = feedRows.slice(0, limit);
    const feedIds = pageRows.map((row) => row.feed_id);
    const [commentRows, likeRows, reviewStampRows, userFeedLikeRows = []] = await Promise.all([
      readReviewCommentRows(env, feedIds),
      readReviewLikeRows(env, feedIds),
      readReviewStampRows(env, pageRows.map((row) => row.stamp_id)),
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
    const userRows = await readReviewUserRows(env, [...pageRows.map((row) => row.user_id), ...commentRows.map((row) => row.user_id)]);
    const usersById = indexUsersById(userRows);
    const stampRowsById = new Map((reviewStampRows ?? []).map((row) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id)));
    return { items: mapReviewRows(pageRows, commentRows, likeRows, usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds), nextCursor };
  }

  async function loadSingleReview(env: WorkerEnv, reviewId: string, sessionUserId: string | null = null) {
    const reviewRow = await readSingleReviewFeedRow(env, reviewId);
    if (!reviewRow) {
      return null;
    }
    const [commentRows, likeRows, placeRows, stampRows, userFeedLikeRows = []] = await Promise.all([
      readReviewCommentRows(env, [reviewId]),
      readReviewLikeRows(env, [reviewId]),
      readReviewPlaceRows(env, reviewRow.position_id),
      readReviewStampRows(env, [reviewRow.stamp_id]),
      readUserFeedLikeRows(env, [reviewId], sessionUserId),
    ]);
    const reviewTravelSessionIds = [
      ...new Set(
        (stampRows ?? [])
          .map((row) => row.travel_session_id)
          .filter(Boolean)
          .map((value) => String(value)),
      ),
    ];
    const reviewRouteRows = await readReviewRouteRows(env, reviewTravelSessionIds);
    const userRows = await readReviewUserRows(env, [reviewRow.user_id, ...commentRows.map((row) => row.user_id)]);
    const places = placeRows.map(mapPlace);
    const placesByPositionId = new Map(places.map((place) => [place.positionId, place]));
    const usersById = indexUsersById(userRows);
    const stampRowsById = new Map((stampRows ?? []).map((row) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id)));
    return mapReviewRows([reviewRow], commentRows ?? [], likeRows ?? [], usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds)[0] ?? null;
  }

  async function handleReviews(request: Request, env: WorkerEnv, url: URL) {
    const sessionUser = await readSessionUser(request, env);
    const reviews = await loadReviewData(env, sessionUser?.id ?? null, {
      placeId: url.searchParams.get('placeId') ?? undefined,
      userId: url.searchParams.get('userId') ?? undefined,
    });
    return jsonResponse(200, reviews, env, request);
  }

  async function handleReviewFeed(request: Request, env: WorkerEnv, url: URL) {
    const sessionUser = await readSessionUser(request, env);
    const payload = await loadReviewPageData(env, sessionUser?.id ?? null, {
      cursor: url.searchParams.get('cursor') ?? null,
      limit: parseListLimit(url, WorkerPaginationRuntimeConfig.reviewFeedPageSize, WorkerPaginationRuntimeConfig.reviewFeedMaxPageSize),
    });
    return jsonResponse(200, payload, env, request);
  }

  async function handleReviewDetail(request: Request, env: WorkerEnv, reviewId: string) {
    const sessionUser = await readSessionUser(request, env);
    const review = await loadSingleReview(env, reviewId, sessionUser?.id ?? null);
    if (!review) {
      return jsonResponse(404, { detail: '리뷰를 찾을 수 없어요.' }, env, request);
    }
    return jsonResponse(200, review, env, request);
  }

  return {
    buildCommentTree,
    countComments,
    handleReviewDetail,
    handleReviewFeed,
    handleReviews,
    loadReviewData,
    loadReviewPageData,
    loadSingleReview,
    mapReviewRows,
  };
}
