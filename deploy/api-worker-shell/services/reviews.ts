import { jsonResponse } from '../lib/http';
import { buildInFilter, encodeFilterValue, parseListLimit, supabaseRequest } from '../lib/supabase';
import { WorkerPaginationRuntimeConfig } from '../config/runtime';
import { readSessionUser } from './auth';
import { createReviewMapper } from './review-domain/mapper';

export function createReviewReadService({ formatVisitLabel, loadStaticBaseRows, mapPlace }: any) {
  const { buildCommentTree, countComments, mapReviewRows } = createReviewMapper(formatVisitLabel);

  async function loadReviewData(env: any, sessionUserId: string | null = null, filters: any = {}) {
    const { placeRows } = await loadStaticBaseRows(env);
    const places = placeRows.map(mapPlace);
    const placesByPositionId = new Map(places.map((place) => [place.positionId, place]));
    const placeIdToPositionId = new Map(places.map((place) => [place.id, place.positionId]));
    const reviewQuery = ['select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at', 'order=created_at.desc'];
    if (filters.placeId) {
      const positionId = placeIdToPositionId.get(filters.placeId);
      if (!positionId) {
        return [];
      }
      reviewQuery.push(`position_id=eq.${encodeFilterValue(positionId)}`);
    }
    if (filters.userId) {
      reviewQuery.push(`user_id=eq.${encodeFilterValue(filters.userId)}`);
    }

    const feedRows = await supabaseRequest(env, `feed?${reviewQuery.join('&')}`);
    const feedIdsFilter = buildInFilter(feedRows.map((row) => row.feed_id));
    const reviewStampIdsFilter = buildInFilter(feedRows.map((row) => row.stamp_id).filter(Boolean));
    const [commentRows, likeRows, reviewStampRows, userFeedLikeRows = []] = await Promise.all([
      feedIdsFilter
        ? supabaseRequest(env, `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=${feedIdsFilter}&order=created_at.asc`)
        : Promise.resolve([]),
      feedIdsFilter ? supabaseRequest(env, `feed_like?select=feed_id,user_id&feed_id=${feedIdsFilter}`) : Promise.resolve([]),
      reviewStampIdsFilter
        ? supabaseRequest(env, `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=${reviewStampIdsFilter}`)
        : Promise.resolve([]),
      sessionUserId && feedIdsFilter
        ? supabaseRequest(env, `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(sessionUserId)}&feed_id=${feedIdsFilter}`)
        : Promise.resolve([]),
    ]);
    const reviewTravelSessionIds = [
      ...new Set(
        (reviewStampRows ?? [])
          .map((row) => row.travel_session_id)
          .filter(Boolean)
          .map((value) => String(value)),
      ),
    ];
    const reviewRouteRows =
      reviewTravelSessionIds.length > 0
        ? await supabaseRequest(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(reviewTravelSessionIds)}`)
        : [];
    const userIdsFilter = buildInFilter([...feedRows.map((row) => row.user_id), ...commentRows.map((row) => row.user_id)]);
    const userRows = userIdsFilter ? await supabaseRequest(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];
    const usersById = new Map(userRows.map((row) => [row.user_id, row]));
    const stampRowsById = new Map((reviewStampRows ?? []).map((row) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id)));
    return mapReviewRows(feedRows, commentRows, likeRows, usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds);
  }

  async function loadReviewPageData(env: any, sessionUserId: string | null = null, options: any = {}) {
    const { cursor = null, limit = WorkerPaginationRuntimeConfig.reviewFeedPageSize } = options;
    const { placeRows } = await loadStaticBaseRows(env);
    const places = placeRows.map(mapPlace);
    const placesByPositionId = new Map(places.map((place) => [place.positionId, place]));
    const reviewQuery = ['select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at', 'order=created_at.desc', `limit=${limit + 1}`];
    if (cursor) {
      reviewQuery.push(`created_at=lt.${encodeFilterValue(cursor)}`);
    }

    const feedRows = await supabaseRequest(env, `feed?${reviewQuery.join('&')}`);
    const nextCursor = feedRows.length > limit ? String(feedRows[limit].created_at) : null;
    const pageRows = feedRows.slice(0, limit);
    const feedIdsFilter = buildInFilter(pageRows.map((row) => row.feed_id));
    const reviewStampIdsFilter = buildInFilter(pageRows.map((row) => row.stamp_id).filter(Boolean));
    const [commentRows, likeRows, reviewStampRows, userFeedLikeRows = []] = await Promise.all([
      feedIdsFilter
        ? supabaseRequest(env, `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=${feedIdsFilter}&order=created_at.asc`)
        : Promise.resolve([]),
      feedIdsFilter ? supabaseRequest(env, `feed_like?select=feed_id,user_id&feed_id=${feedIdsFilter}`) : Promise.resolve([]),
      reviewStampIdsFilter
        ? supabaseRequest(env, `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=${reviewStampIdsFilter}`)
        : Promise.resolve([]),
      sessionUserId && feedIdsFilter
        ? supabaseRequest(env, `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(sessionUserId)}&feed_id=${feedIdsFilter}`)
        : Promise.resolve([]),
    ]);
    const reviewTravelSessionIds = [
      ...new Set(
        (reviewStampRows ?? [])
          .map((row) => row.travel_session_id)
          .filter(Boolean)
          .map((value) => String(value)),
      ),
    ];
    const reviewRouteRows =
      reviewTravelSessionIds.length > 0
        ? await supabaseRequest(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(reviewTravelSessionIds)}`)
        : [];
    const userIdsFilter = buildInFilter([...pageRows.map((row) => row.user_id), ...commentRows.map((row) => row.user_id)]);
    const userRows = userIdsFilter ? await supabaseRequest(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];
    const usersById = new Map(userRows.map((row) => [row.user_id, row]));
    const stampRowsById = new Map((reviewStampRows ?? []).map((row) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id)));
    return { items: mapReviewRows(pageRows, commentRows, likeRows, usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds), nextCursor };
  }

  async function loadSingleReview(env: any, reviewId: string, sessionUserId: string | null = null) {
    const reviewRows = await supabaseRequest(
      env,
      `feed?select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at&feed_id=eq.${encodeFilterValue(reviewId)}&limit=1`,
    );
    const reviewRow = reviewRows?.[0] ?? null;
    if (!reviewRow) {
      return null;
    }
    const [commentRows, likeRows, placeRows, stampRows, userFeedLikeRows = []] = await Promise.all([
      supabaseRequest(env, `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=eq.${encodeFilterValue(reviewId)}&order=created_at.asc`),
      supabaseRequest(env, `feed_like?select=feed_id,user_id&feed_id=eq.${encodeFilterValue(reviewId)}`),
      supabaseRequest(
        env,
        `map?select=position_id,slug,name,district,category,latitude,longitude,summary,description,image_url,image_storage_path,vibe_tags,visit_time,route_hint,stamp_reward,hero_label,jam_color,accent_color,is_active&position_id=eq.${encodeFilterValue(reviewRow.position_id)}&limit=1`,
      ),
      reviewRow.stamp_id
        ? supabaseRequest(env, `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=eq.${encodeFilterValue(reviewRow.stamp_id)}&limit=1`)
        : Promise.resolve([]),
      sessionUserId ? supabaseRequest(env, `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(sessionUserId)}&feed_id=eq.${encodeFilterValue(reviewId)}&limit=1`) : Promise.resolve([]),
    ]);
    const reviewTravelSessionIds = [
      ...new Set(
        (stampRows ?? [])
          .map((row) => row.travel_session_id)
          .filter(Boolean)
          .map((value) => String(value)),
      ),
    ];
    const reviewRouteRows =
      reviewTravelSessionIds.length > 0
        ? await supabaseRequest(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(reviewTravelSessionIds)}`)
        : [];
    const userIdsFilter = buildInFilter([reviewRow.user_id, ...commentRows.map((row) => row.user_id)]);
    const userRows = userIdsFilter ? await supabaseRequest(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];
    const places = placeRows.map(mapPlace);
    const placesByPositionId = new Map(places.map((place) => [place.positionId, place]));
    const usersById = new Map(userRows.map((row) => [row.user_id, row]));
    const stampRowsById = new Map((stampRows ?? []).map((row) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id)));
    return mapReviewRows([reviewRow], commentRows ?? [], likeRows ?? [], usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds)[0] ?? null;
  }

  async function handleReviews(request: Request, env: any, url: URL) {
    const sessionUser = await readSessionUser(request, env);
    const reviews = await loadReviewData(env, sessionUser?.id ?? null, {
      placeId: url.searchParams.get('placeId') ?? undefined,
      userId: url.searchParams.get('userId') ?? undefined,
    });
    return jsonResponse(200, reviews, env, request);
  }

  async function handleReviewFeed(request: Request, env: any, url: URL) {
    const sessionUser = await readSessionUser(request, env);
    const payload = await loadReviewPageData(env, sessionUser?.id ?? null, {
      cursor: url.searchParams.get('cursor') ?? null,
      limit: parseListLimit(url, WorkerPaginationRuntimeConfig.reviewFeedPageSize, WorkerPaginationRuntimeConfig.reviewFeedMaxPageSize),
    });
    return jsonResponse(200, payload, env, request);
  }

  async function handleReviewDetail(request: Request, env: any, reviewId: string) {
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
