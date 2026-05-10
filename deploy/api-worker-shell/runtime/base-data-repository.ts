import { buildInFilter, encodeFilterValue, rememberPending, supabaseRequest } from '../lib/supabase';
import { WorkerBaseDataRuntimeConfig } from '../config/runtime';
import type {
  SupabaseCacheState,
  SupabaseCoursePlaceRow,
  SupabaseCourseRow,
  SupabaseMapRow,
  WorkerEnv,
  WorkerJsonRecord,
  WorkerStaticBaseRows,
} from '../types';

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
  feedRows: WorkerJsonRecord[];
  commentRows: WorkerJsonRecord[];
  likeRows: WorkerJsonRecord[];
  reviewStampRows: WorkerJsonRecord[];
  userFeedLikeRows: WorkerJsonRecord[];
  userSessionRows: WorkerJsonRecord[];
  ownerRouteRows: WorkerJsonRecord[];
  userStampRows: WorkerJsonRecord[];
  allPlaceStampRows: WorkerJsonRecord[];
  reviewRouteRows: WorkerJsonRecord[];
  userRows: WorkerJsonRecord[];
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
    supabaseRequest<WorkerJsonRecord[]>(
      env,
      'feed?select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at&order=created_at.desc',
    ),
  ]);

  const feedIdsFilter = buildInFilter(feedRows.map((row: any) => row.feed_id));
  const reviewStampIdsFilter = buildInFilter(feedRows.map((row: any) => row.stamp_id).filter(Boolean));
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
      ? supabaseRequest<WorkerJsonRecord[]>(
          env,
          `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=${feedIdsFilter}&order=created_at.asc`,
        )
      : Promise.resolve([]),
    feedIdsFilter ? supabaseRequest<WorkerJsonRecord[]>(env, `feed_like?select=feed_id,user_id&feed_id=${feedIdsFilter}`) : Promise.resolve([]),
    reviewStampIdsFilter
      ? supabaseRequest<WorkerJsonRecord[]>(
          env,
          `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=${reviewStampIdsFilter}`,
        )
      : Promise.resolve([]),
    sessionUserId && feedIdsFilter
      ? supabaseRequest<WorkerJsonRecord[]>(env, `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(sessionUserId)}&feed_id=${feedIdsFilter}`)
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
      ? supabaseRequest<WorkerJsonRecord[]>(env, `user_route?select=route_id,travel_session_id&user_id=eq.${encodeFilterValue(sessionUserId)}&order=created_at.desc`)
      : Promise.resolve([]),
    sessionUserId
      ? supabaseRequest<WorkerJsonRecord[]>(
          env,
          `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&user_id=eq.${encodeFilterValue(
            sessionUserId,
          )}&order=created_at.desc`,
        )
      : Promise.resolve([]),
    supabaseRequest<WorkerJsonRecord[]>(env, 'user_stamp?select=position_id'),
  ]);

  const reviewTravelSessionIds = [
    ...new Set(
      (reviewStampRows ?? [])
        .map((row: any) => row.travel_session_id)
        .filter(Boolean)
        .map((value: any) => String(value)),
    ),
  ];
  const reviewRouteRows =
    reviewTravelSessionIds.length > 0
      ? await supabaseRequest<WorkerJsonRecord[]>(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(reviewTravelSessionIds)}`)
      : [];
  const userIdsFilter = buildInFilter([
    ...feedRows.map((row: any) => row.user_id),
    ...commentRows.map((row: any) => row.user_id),
    ...(sessionUserId ? [sessionUserId] : []),
  ]);
  const userRows = userIdsFilter ? await supabaseRequest<WorkerJsonRecord[]>(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];

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
