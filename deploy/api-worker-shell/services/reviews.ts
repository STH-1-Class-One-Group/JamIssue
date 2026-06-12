import { jsonResponse } from '../lib/http';
import { parseListLimit } from '../lib/supabase';
import { WorkerPaginationRuntimeConfig } from '../config/runtime';
import { readSessionUser } from './auth';
import type { WorkerEnv } from '../types';
import type {
  WorkerReviewDataFilters,
  WorkerReviewPageOptions,
  WorkerReviewReadServiceDeps,
} from './review-domain';
import {
  buildReviewPlaceContext,
  createReviewMapper,
  loadReviewMappingContext,
  readReviewFeedRows,
  readReviewPageRows,
  readReviewPlaceRows,
  readSingleReviewFeedRow,
} from './review-domain';

export function createReviewReadService({ formatVisitLabel, loadStaticBaseRows, mapPlace }: WorkerReviewReadServiceDeps) {
  const { buildCommentTree, countComments, mapReviewRows } = createReviewMapper(formatVisitLabel);

  async function loadReviewData(env: WorkerEnv, sessionUserId: string | null = null, filters: WorkerReviewDataFilters = {}) {
    const { placeRows } = await loadStaticBaseRows(env);
    const { placeIdToPositionId, placesByPositionId } = buildReviewPlaceContext(placeRows, mapPlace);
    let positionId: string | null = null;
    if (filters.placeId) {
      positionId = placeIdToPositionId.get(filters.placeId) ?? null;
      if (!positionId) {
        return [];
      }
    }

    const feedRows = await readReviewFeedRows(env, { positionId, userId: filters.userId });
    const { commentRows, likeRows, likedFeedIds, reviewRouteRows, stampRowsById, usersById } = await loadReviewMappingContext(env, feedRows, sessionUserId);
    return mapReviewRows(feedRows, commentRows, likeRows, usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds);
  }

  async function loadReviewPageData(env: WorkerEnv, sessionUserId: string | null = null, options: WorkerReviewPageOptions = {}) {
    const { cursor = null, limit = WorkerPaginationRuntimeConfig.reviewFeedPageSize } = options;
    const { placeRows } = await loadStaticBaseRows(env);
    const { placesByPositionId } = buildReviewPlaceContext(placeRows, mapPlace);
    const feedRows = await readReviewPageRows(env, { cursor, limit });
    const nextCursor = feedRows.length > limit ? String(feedRows[limit].created_at) : null;
    const pageRows = feedRows.slice(0, limit);
    const { commentRows, likeRows, likedFeedIds, reviewRouteRows, stampRowsById, usersById } = await loadReviewMappingContext(env, pageRows, sessionUserId);
    return { items: mapReviewRows(pageRows, commentRows, likeRows, usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds), nextCursor };
  }

  async function loadSingleReview(env: WorkerEnv, reviewId: string, sessionUserId: string | null = null) {
    const reviewRow = await readSingleReviewFeedRow(env, reviewId);
    if (!reviewRow) {
      return null;
    }
    const [placeRows, mappingContext] = await Promise.all([
      readReviewPlaceRows(env, reviewRow.position_id),
      loadReviewMappingContext(env, [reviewRow], sessionUserId),
    ]);
    const { placesByPositionId } = buildReviewPlaceContext(placeRows, mapPlace);
    const { commentRows, likeRows, likedFeedIds, reviewRouteRows, stampRowsById, usersById } = mappingContext;
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
