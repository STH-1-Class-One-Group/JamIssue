import { buildInFilter, encodeFilterValue, rememberPending, supabaseRequest } from '../lib/supabase';
import { WorkerBaseDataRuntimeConfig } from '../config/runtime';
import type {
  SupabaseCoursePlaceRow,
  SupabaseCourseRow,
  SupabaseMapRow,
  WorkerFeedLikeRow,
  WorkerPositionStampRow,
  WorkerStampRow,
  WorkerStaticBaseRows,
  WorkerTravelSessionRow,
  WorkerUserRouteRow,
} from './base-data-contracts';
import type { SupabaseCacheState } from '../lib/supabase';
import type {
  WorkerEnv,
  WorkerJsonRecord,
} from '../types';
import type {
  WorkerReviewCommentRow,
  WorkerReviewFeedRow,
  WorkerReviewRouteRow,
  WorkerReviewStampRow,
  WorkerReviewUserRow,
} from '../services/review-domain';

const STATIC_BASE_CACHE_TTL_MS = WorkerBaseDataRuntimeConfig.staticBaseCacheTtlMs;

let staticBaseCache: SupabaseCacheState<WorkerStaticBaseRows> & {
  expiresAt: number;
} = {
  expiresAt: 0,
  pending: null,
  value: null,
};

export interface WorkerBaseDataRows {
  staticRows: WorkerStaticBaseRows;
  feedRows: WorkerReviewFeedRow[];
  commentRows: WorkerReviewCommentRow[];
  likeRows: WorkerFeedLikeRow[];
  reviewStampRows: WorkerReviewStampRow[];
  userFeedLikeRows: WorkerFeedLikeRow[];
  userSessionRows: WorkerTravelSessionRow[];
  ownerRouteRows: WorkerUserRouteRow[];
  userStampRows: WorkerStampRow[];
  allPlaceStampRows: WorkerPositionStampRow[];
  reviewRouteRows: WorkerReviewRouteRow[];
  userRows: WorkerReviewUserRow[];
}

export async function loadStaticBaseRows(env: WorkerEnv): Promise<WorkerStaticBaseRows> {
  const now = Date.now();
  if (staticBaseCache.value && staticBaseCache.expiresAt > now) {
    return staticBaseCache.value;
  }

  return rememberPending(staticBaseCache, async () => {
    const [placeRows, courseRows, coursePlaceRows] = await Promise.all([
      supabaseRequest<SupabaseMapRow[]>(
        env,
        'map?select=position_id,slug,name,district,category,latitude,longitude,summary,description,image_url,image_storage_path,vibe_tags,visit_time,route_hint,stamp_reward,hero_label,jam_color,accent_color,is_active&is_active=eq.true&order=position_id.asc',
      ),
      supabaseRequest<SupabaseCourseRow[]>(env, 'course?select=course_id,title,mood,duration,note,color,display_order&order=display_order.asc'),
      supabaseRequest<SupabaseCoursePlaceRow[]>(env, 'course_place?select=course_id,position_id,stop_order&order=stop_order.asc'),
    ]);
    const value = { placeRows, courseRows, coursePlaceRows };
    staticBaseCache = { ...staticBaseCache, value, expiresAt: Date.now() + STATIC_BASE_CACHE_TTL_MS, pending: null };
    return value;
  });
}

export async function loadBaseDataRows(env: WorkerEnv, sessionUserId: string | null = null): Promise<WorkerBaseDataRows> {
  const [staticRows, feedRows] = await Promise.all([
    loadStaticBaseRows(env),
    supabaseRequest<WorkerReviewFeedRow[]>(
      env,
      'feed?select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at&order=created_at.desc',
    ),
  ]);

  const feedIdsFilter = buildInFilter(feedRows.map((row) => row.feed_id));
  const reviewStampIdsFilter = buildInFilter(feedRows.map((row) => row.stamp_id).filter(Boolean));
  const [
    commentRows,
    likeRows,
    reviewStampRows,
    userFeedLikeRows = [],
    userSessionRows = [],
    ownerRouteRows = [],
    userStampRows = [],
    allPlaceStampRows = [],
  ] = await Promise.all([
    feedIdsFilter
        ? supabaseRequest<WorkerReviewCommentRow[]>(
          env,
          `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=${feedIdsFilter}&order=created_at.asc`,
        )
      : Promise.resolve([]),
    feedIdsFilter ? supabaseRequest<WorkerFeedLikeRow[]>(env, `feed_like?select=feed_id,user_id&feed_id=${feedIdsFilter}`) : Promise.resolve([]),
    reviewStampIdsFilter
        ? supabaseRequest<WorkerReviewStampRow[]>(
          env,
          `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=${reviewStampIdsFilter}`,
        )
      : Promise.resolve([]),
    sessionUserId && feedIdsFilter
      ? supabaseRequest<WorkerFeedLikeRow[]>(env, `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(sessionUserId)}&feed_id=${feedIdsFilter}`)
      : Promise.resolve([]),
    sessionUserId
      ? supabaseRequest<WorkerJsonRecord[]>(
          env,
          `travel_session?select=travel_session_id,user_id,started_at,ended_at,last_stamp_at,stamp_count,created_at&user_id=eq.${encodeFilterValue(
            sessionUserId,
          )}&order=started_at.desc`,
        )
      : Promise.resolve([]),
    sessionUserId
        ? supabaseRequest<WorkerUserRouteRow[]>(env, `user_route?select=route_id,travel_session_id&user_id=eq.${encodeFilterValue(sessionUserId)}&order=created_at.desc`)
      : Promise.resolve([]),
    sessionUserId
        ? supabaseRequest<WorkerStampRow[]>(
          env,
          `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&user_id=eq.${encodeFilterValue(
            sessionUserId,
          )}&order=created_at.desc`,
        )
      : Promise.resolve([]),
    supabaseRequest<WorkerPositionStampRow[]>(env, 'user_stamp?select=position_id'),
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
      ? await supabaseRequest<WorkerReviewRouteRow[]>(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(reviewTravelSessionIds)}`)
      : [];
  const userIdsFilter = buildInFilter([
    ...feedRows.map((row) => row.user_id),
    ...commentRows.map((row) => row.user_id),
    ...(sessionUserId ? [sessionUserId] : []),
  ]);
  const userRows = userIdsFilter ? await supabaseRequest<WorkerReviewUserRow[]>(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];

  return {
    staticRows,
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
  };
}
