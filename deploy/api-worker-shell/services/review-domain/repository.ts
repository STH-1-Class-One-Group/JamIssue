import { encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type { WorkerEnv, WorkerJsonRecord } from '../../types';

export async function readFeedRow(env: WorkerEnv, reviewId: string | number): Promise<WorkerJsonRecord | null> {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `feed?select=feed_id,position_id,user_id&feed_id=eq.${encodeFilterValue(reviewId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function readCommentRow(env: WorkerEnv, commentId: string | number): Promise<WorkerJsonRecord | null> {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `user_comment?select=comment_id,feed_id,user_id,parent_id,is_deleted&comment_id=eq.${encodeFilterValue(commentId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function readStampRow(env: WorkerEnv, stampId: string | number): Promise<WorkerJsonRecord | null> {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,visit_ordinal,stamp_date,created_at&stamp_id=eq.${encodeFilterValue(stampId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function createReviewRow(env: WorkerEnv, payload: WorkerJsonRecord): Promise<WorkerJsonRecord | null> {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(env, 'feed?select=feed_id', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return rows?.[0] ?? null;
}

export async function updateReviewRow(env: WorkerEnv, reviewId: string | number, payload: WorkerJsonRecord): Promise<void> {
  await supabaseRequest(env, `feed?feed_id=eq.${encodeFilterValue(reviewId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteReviewRow(env: WorkerEnv, reviewId: string | number): Promise<void> {
  await supabaseRequest(env, `feed?feed_id=eq.${encodeFilterValue(reviewId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}

export async function createCommentRow(env: WorkerEnv, payload: WorkerJsonRecord): Promise<WorkerJsonRecord | null> {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(env, 'user_comment?select=comment_id', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return rows?.[0] ?? null;
}

export async function updateCommentRow(env: WorkerEnv, commentId: string | number, payload: WorkerJsonRecord): Promise<void> {
  await supabaseRequest(env, `user_comment?comment_id=eq.${encodeFilterValue(commentId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function softDeleteCommentRow(env: WorkerEnv, commentId: string | number): Promise<void> {
  await updateCommentRow(env, commentId, {
    body: '[deleted]',
    is_deleted: true,
    updated_at: new Date().toISOString(),
  });
}

export async function readReviewLikeRow(env: WorkerEnv, reviewId: string | number, userId: string): Promise<WorkerJsonRecord | null> {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `feed_like?select=feed_like_id&feed_id=eq.${encodeFilterValue(reviewId)}&user_id=eq.${encodeFilterValue(userId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function createReviewLikeRow(env: WorkerEnv, reviewId: string | number, userId: string): Promise<void> {
  await supabaseRequest(env, 'feed_like?select=feed_like_id', {
    method: 'POST',
    body: JSON.stringify({ feed_id: Number(reviewId), user_id: userId }),
  });
}

export async function deleteReviewLikeRow(env: WorkerEnv, feedLikeId: string | number): Promise<void> {
  await supabaseRequest(env, `feed_like?feed_like_id=eq.${encodeFilterValue(feedLikeId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}

export async function countReviewLikes(env: WorkerEnv, reviewId: string | number): Promise<number> {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `feed_like?select=feed_like_id&feed_id=eq.${encodeFilterValue(reviewId)}`,
  );
  return rows.length;
}
