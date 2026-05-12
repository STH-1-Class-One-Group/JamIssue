import { buildInFilter, encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type { WorkerEnv } from '../../types';
import type {
  WorkerNotificationActorRow,
  WorkerNotificationCreatePayload,
  WorkerNotificationInsertResult,
  WorkerNotificationRow,
} from './contracts';

const notificationSelect =
  'notification_id,user_id,actor_user_id,type,title,body,review_id,comment_id,route_id,is_read,created_at';

export async function readNotificationRow(env: WorkerEnv, notificationId: string | number) {
  const rows = await supabaseRequest<WorkerNotificationRow[]>(
    env,
    `user_notification?select=${notificationSelect}&notification_id=eq.${encodeFilterValue(notificationId)}&limit=1`,
  );

  return rows?.[0] ?? null;
}

export async function createNotification(env: WorkerEnv, payload: WorkerNotificationCreatePayload) {
  const nowIso = new Date().toISOString();
  const rows = await supabaseRequest<WorkerNotificationInsertResult[]>(env, 'user_notification?select=notification_id', {
    method: 'POST',
    body: JSON.stringify({
      user_id: payload.userId,
      actor_user_id: payload.actorUserId ?? null,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? '',
      review_id: payload.reviewId ? Number(payload.reviewId) : null,
      comment_id: payload.commentId ? Number(payload.commentId) : null,
      route_id: payload.routeId ? Number(payload.routeId) : null,
      metadata: payload.metadata ?? {},
      is_read: false,
      created_at: nowIso,
      updated_at: nowIso,
    }),
  });

  return rows?.[0] ?? null;
}

export async function readUserNotificationRows(env: WorkerEnv, userId: string, limit: number) {
  return (
    (await supabaseRequest<WorkerNotificationRow[]>(
      env,
      `user_notification?select=${notificationSelect}&user_id=eq.${encodeFilterValue(
        userId,
      )}&order=created_at.desc&limit=${limit}`,
    )) ?? []
  );
}

export async function readNotificationActorRows(env: WorkerEnv, actorUserIds: Array<string | null | undefined>) {
  const actorIdsFilter = buildInFilter(actorUserIds.filter(Boolean));
  return actorIdsFilter
    ? ((await supabaseRequest<WorkerNotificationActorRow[]>(
        env,
        `user?select=user_id,nickname&user_id=${actorIdsFilter}`,
      )) ?? [])
    : [];
}

export async function readNotificationActorRow(env: WorkerEnv, actorUserId: string) {
  const rows = await supabaseRequest<WorkerNotificationActorRow[]>(
    env,
    `user?select=user_id,nickname&user_id=eq.${encodeFilterValue(actorUserId)}&limit=1`,
  );

  return rows?.[0] ?? null;
}

export async function readUnreadNotificationRows(env: WorkerEnv, userId: string) {
  return (
    (await supabaseRequest<WorkerNotificationInsertResult[]>(
      env,
      `user_notification?select=notification_id&user_id=eq.${encodeFilterValue(userId)}&is_read=eq.false`,
    )) ?? []
  );
}

export async function markNotificationRead(env: WorkerEnv, notificationId: string | number, nowIso: string) {
  await supabaseRequest(env, `user_notification?notification_id=eq.${encodeFilterValue(notificationId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_read: true, read_at: nowIso, updated_at: nowIso }),
  });
}

export async function markAllNotificationsRead(env: WorkerEnv, userId: string, nowIso: string) {
  await supabaseRequest(env, `user_notification?user_id=eq.${encodeFilterValue(userId)}&is_read=eq.false`, {
    method: 'PATCH',
    body: JSON.stringify({ is_read: true, read_at: nowIso, updated_at: nowIso }),
  });
}

export async function deleteNotificationRow(env: WorkerEnv, notificationId: string | number) {
  await supabaseRequest(env, `user_notification?notification_id=eq.${encodeFilterValue(notificationId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}
