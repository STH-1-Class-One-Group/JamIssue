/*
 * File: read-repository.ts
 * Purpose: Keep review read Supabase queries behind the review-domain repository boundary.
 * Primary Responsibility: Fetch review read-model rows without exposing REST query details to services.
 */

import type { SupabaseMapRow } from '../../runtime/base-data-contracts';
import type { WorkerEnv } from '../../types';
import { buildInFilter, encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type {
  WorkerReviewCommentRow,
  WorkerReviewFeedRow,
  WorkerReviewLikeRow,
  WorkerReviewRouteRow,
  WorkerReviewStampRow,
  WorkerReviewUserRow,
} from './contracts';

type ReviewFeedFilters = {
  positionId?: string | null;
  userId?: string;
};

type ReviewPageQuery = {
  cursor?: string | null;
  limit: number;
};

export async function readReviewFeedRows(env: WorkerEnv, filters: ReviewFeedFilters = {}) {
  const reviewQuery = ['select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at', 'order=created_at.desc'];
  if (filters.positionId) {
    reviewQuery.push(`position_id=eq.${encodeFilterValue(filters.positionId)}`);
  }
  if (filters.userId) {
    reviewQuery.push(`user_id=eq.${encodeFilterValue(filters.userId)}`);
  }

  return supabaseRequest<WorkerReviewFeedRow[]>(env, `feed?${reviewQuery.join('&')}`);
}

export async function readReviewPageRows(env: WorkerEnv, { cursor = null, limit }: ReviewPageQuery) {
  const reviewQuery = [
    'select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at',
    'order=created_at.desc',
    `limit=${limit + 1}`,
  ];
  if (cursor) {
    reviewQuery.push(`created_at=lt.${encodeFilterValue(cursor)}`);
  }

  return supabaseRequest<WorkerReviewFeedRow[]>(env, `feed?${reviewQuery.join('&')}`);
}

export async function readSingleReviewFeedRow(env: WorkerEnv, reviewId: string | number) {
  const rows = await supabaseRequest<WorkerReviewFeedRow[]>(
    env,
    `feed?select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at&feed_id=eq.${encodeFilterValue(reviewId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function readReviewCommentRows(env: WorkerEnv, feedIds: Array<string | number>) {
  const feedIdsFilter = buildInFilter(feedIds);
  return feedIdsFilter
    ? supabaseRequest<WorkerReviewCommentRow[]>(
      env,
      `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=${feedIdsFilter}&order=created_at.asc`,
    )
    : [];
}

export async function readReviewLikeRows(env: WorkerEnv, feedIds: Array<string | number>) {
  const feedIdsFilter = buildInFilter(feedIds);
  return feedIdsFilter ? supabaseRequest<WorkerReviewLikeRow[]>(env, `feed_like?select=feed_id,user_id&feed_id=${feedIdsFilter}`) : [];
}

export async function readReviewStampRows(env: WorkerEnv, stampIds: Array<string | number | null | undefined>) {
  const stampIdsFilter = buildInFilter(stampIds.filter(Boolean));
  return stampIdsFilter
    ? supabaseRequest<WorkerReviewStampRow[]>(
      env,
      `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=${stampIdsFilter}`,
    )
    : [];
}

export async function readUserFeedLikeRows(env: WorkerEnv, feedIds: Array<string | number>, userId: string | null) {
  const feedIdsFilter = buildInFilter(feedIds);
  return userId && feedIdsFilter
    ? supabaseRequest<WorkerReviewLikeRow[]>(
      env,
      `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(userId)}&feed_id=${feedIdsFilter}`,
    )
    : [];
}

export async function readReviewRouteRows(env: WorkerEnv, travelSessionIds: string[]) {
  return travelSessionIds.length > 0
    ? supabaseRequest<WorkerReviewRouteRow[]>(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(travelSessionIds)}`)
    : [];
}

export async function readReviewUserRows(env: WorkerEnv, userIds: Array<string | number>) {
  const userIdsFilter = buildInFilter(userIds);
  return userIdsFilter ? supabaseRequest<WorkerReviewUserRow[]>(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];
}

export async function readReviewPlaceRows(env: WorkerEnv, positionId: string | number) {
  return supabaseRequest<SupabaseMapRow[]>(
    env,
    `map?select=position_id,slug,name,district,category,latitude,longitude,summary,description,image_url,image_storage_path,vibe_tags,visit_time,route_hint,stamp_reward,hero_label,jam_color,accent_color,is_active&position_id=eq.${encodeFilterValue(positionId)}&limit=1`,
  );
}
