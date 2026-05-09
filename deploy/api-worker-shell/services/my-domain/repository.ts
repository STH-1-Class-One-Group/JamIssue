import { buildInFilter, encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type { WorkerEnv, WorkerJsonRecord } from '../../types';

export async function loadMyCommentRows(env: WorkerEnv, userId: string, cursor: string | null, limit: number) {
  const query = [
    'select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at',
    `user_id=eq.${encodeFilterValue(userId)}`,
    'order=created_at.desc',
    `limit=${limit + 1}`,
  ];
  if (cursor) {
    query.push(`created_at=lt.${encodeFilterValue(cursor)}`);
  }
  return supabaseRequest<WorkerJsonRecord[]>(env, `user_comment?${query.join('&')}`);
}

export async function loadFeedsForCommentRows(env: WorkerEnv, commentRows: WorkerJsonRecord[]) {
  const feedIdsFilter = buildInFilter(commentRows.map((row: any) => row.feed_id));
  if (!feedIdsFilter) {
    return [];
  }
  return supabaseRequest<WorkerJsonRecord[]>(env, `feed?select=feed_id,position_id,body&feed_id=${feedIdsFilter}`);
}

export async function loadMySummaryCommentRows(env: WorkerEnv, userId: string) {
  return supabaseRequest<WorkerJsonRecord[]>(
    env,
    `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&user_id=eq.${encodeFilterValue(userId)}&order=created_at.desc`,
  );
}
