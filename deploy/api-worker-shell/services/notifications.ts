import { WorkerNotificationRuntimeConfig } from '../config/runtime';
import { formatDateTime } from '../lib/dates';
import { jsonResponse } from '../lib/http';
import type { WorkerEnv, WorkerJsonRecord } from '../types';
import { readSessionUser } from './auth';
import type {
  WorkerNotificationCreatePayload,
  WorkerNotificationInsertResult,
  WorkerNotificationRow,
} from './notification-domain';
import {
  buildNotificationRealtimeTopic,
  createNotification,
  deleteNotificationRow,
  markAllNotificationsRead,
  markNotificationRead,
  readNotificationActorRow,
  readNotificationActorRows,
  readNotificationRow,
  readUnreadNotificationRows,
  readUserNotificationRows,
  sendRealtimeBroadcast,
} from './notification-domain';

async function requireSessionUser(request: Request, env: WorkerEnv) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
  }
  return { sessionUser };
}

function mapNotificationRow(row: WorkerNotificationRow, actorName: string | null | undefined) {
  return {
    id: String(row.notification_id),
    type: row.type,
    title: row.title,
    body: row.body ?? '',
    createdAt: formatDateTime(row.created_at),
    isRead: Boolean(row.is_read),
    reviewId: row.review_id ? String(row.review_id) : null,
    commentId: row.comment_id ? String(row.comment_id) : null,
    routeId: row.route_id ? String(row.route_id) : null,
    actorName: row.actor_user_id ? actorName ?? null : null,
  };
}

export async function createUserNotification(
  env: WorkerEnv,
  payload: WorkerNotificationCreatePayload,
): Promise<WorkerNotificationInsertResult | null> {
  if (!payload.userId) {
    return null;
  }

  return createNotification(env, payload);
}

export async function loadUserNotifications(
  env: WorkerEnv,
  userId: string,
  limit = WorkerNotificationRuntimeConfig.defaultListLimit,
) {
  const rows = await readUserNotificationRows(env, userId, limit);
  const actorRows = await readNotificationActorRows(
    env,
    rows.map((row) => row.actor_user_id),
  );
  const actorNameById = new Map(actorRows.map((row) => [row.user_id, row.nickname]));

  return rows.map((row) => mapNotificationRow(row, row.actor_user_id ? actorNameById.get(row.actor_user_id) : null));
}

export async function countUnreadNotifications(env: WorkerEnv, userId: string) {
  const rows = await readUnreadNotificationRows(env, userId);
  return rows.length;
}

export async function loadNotificationById(env: WorkerEnv, notificationId: string | number) {
  const row = await readNotificationRow(env, notificationId);
  if (!row) {
    return null;
  }

  const actorRow = row.actor_user_id ? await readNotificationActorRow(env, row.actor_user_id) : null;
  return mapNotificationRow(row, actorRow?.nickname ?? null);
}

export async function publishNotificationEvent(
  env: WorkerEnv,
  userId: string,
  event: string,
  payload: WorkerJsonRecord,
) {
  const topic = await buildNotificationRealtimeTopic(env, userId);
  await sendRealtimeBroadcast(env, topic, event, payload);
}

export async function handleMyNotifications(request: Request, env: WorkerEnv) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const notifications = await loadUserNotifications(
    env,
    sessionResult.sessionUser.id,
    WorkerNotificationRuntimeConfig.myNotificationsListLimit,
  );
  return jsonResponse(200, notifications, env, request);
}

export async function handleNotificationRealtimeChannel(request: Request, env: WorkerEnv) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const topic = await buildNotificationRealtimeTopic(env, sessionResult.sessionUser.id);
  return jsonResponse(200, { topic }, env, request);
}

export async function handleMarkNotificationRead(request: Request, env: WorkerEnv, notificationId: string) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const notificationRow = await readNotificationRow(env, notificationId);
  if (!notificationRow) {
    return jsonResponse(404, { detail: '알림을 찾지 못했어요.' }, env, request);
  }
  if (notificationRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 알림만 확인할 수 있어요.' }, env, request);
  }

  if (!notificationRow.is_read) {
    const nowIso = new Date().toISOString();
    await markNotificationRead(env, notificationId, nowIso);
    await publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.read', {
      notificationId: String(notificationId),
      unreadCount: await countUnreadNotifications(env, sessionResult.sessionUser.id),
    });
  }

  return jsonResponse(200, { notificationId: String(notificationId), read: true }, env, request);
}

export async function handleMarkAllNotificationsRead(request: Request, env: WorkerEnv) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const unreadRows = await readUnreadNotificationRows(env, sessionResult.sessionUser.id);
  const updated = unreadRows.length;

  if (updated > 0) {
    const nowIso = new Date().toISOString();
    await markAllNotificationsRead(env, sessionResult.sessionUser.id, nowIso);
    await publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.all-read', {
      updated,
      unreadCount: 0,
    });
  }

  return jsonResponse(200, { updated }, env, request);
}

export async function handleDeleteNotification(request: Request, env: WorkerEnv, notificationId: string) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const notificationRow = await readNotificationRow(env, notificationId);
  if (!notificationRow) {
    return jsonResponse(404, { detail: '알림을 찾지 못했어요.' }, env, request);
  }
  if (notificationRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 알림만 삭제할 수 있어요.' }, env, request);
  }

  await deleteNotificationRow(env, notificationId);
  await publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.deleted', {
    notificationId: String(notificationId),
    unreadCount: await countUnreadNotifications(env, sessionResult.sessionUser.id),
  });

  return jsonResponse(200, { notificationId: String(notificationId), deleted: true }, env, request);
}
