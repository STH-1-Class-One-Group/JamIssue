import { formatDateTime } from '../lib/dates';
import { jsonResponse } from '../lib/http';
import { buildInFilter, encodeFilterValue, getSupabaseKey, supabaseRequest } from '../lib/supabase';
import { WorkerNotificationRuntimeConfig } from '../config/runtime';
import { getSigningSecret, readSessionUser, sha256Base64Url } from './auth';
import type { WorkerEnv, WorkerJsonRecord } from '../types';

interface WorkerNotificationRow extends WorkerJsonRecord {
    notification_id: string | number;
    user_id: string;
    actor_user_id?: string | null;
    type: string;
    title: string;
    body?: string | null;
    review_id?: string | number | null;
    comment_id?: string | number | null;
    route_id?: string | number | null;
    is_read?: boolean | null;
    created_at: string;
}

interface WorkerNotificationActorRow extends WorkerJsonRecord {
    user_id: string;
    nickname?: string | null;
}

interface WorkerNotificationInsertResult extends WorkerJsonRecord {
    notification_id?: string | number | null;
}

interface WorkerNotificationCreatePayload extends WorkerJsonRecord {
    userId: string;
    actorUserId?: string | null;
    type: string;
    title: string;
    body?: string;
    reviewId?: string | number | null;
    commentId?: string | number | null;
    routeId?: string | number | null;
    metadata?: WorkerJsonRecord;
}

async function requireSessionUser(request: Request, env: WorkerEnv) { const sessionUser = await readSessionUser(request, env); if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
} return { sessionUser }; }
async function readNotificationRow(env: WorkerEnv, notificationId: string | number) { const rows = await supabaseRequest<WorkerNotificationRow[]>(env, `user_notification?select=notification_id,user_id,actor_user_id,type,title,body,review_id,comment_id,route_id,is_read,created_at&notification_id=eq.${encodeFilterValue(notificationId)}&limit=1`); return rows?.[0] ?? null; }
export async function createUserNotification(env: WorkerEnv, { userId, actorUserId = null, type, title, body = '', reviewId = null, commentId = null, routeId = null, metadata = {} }: WorkerNotificationCreatePayload): Promise<WorkerNotificationInsertResult | null> { if (!userId) {
    return null;
} const nowIso = new Date().toISOString(); const rows = await supabaseRequest<WorkerNotificationInsertResult[]>(env, 'user_notification?select=notification_id', { method: 'POST', body: JSON.stringify({ user_id: userId, actor_user_id: actorUserId, type, title, body, review_id: reviewId ? Number(reviewId) : null, comment_id: commentId ? Number(commentId) : null, route_id: routeId ? Number(routeId) : null, metadata, is_read: false, created_at: nowIso, updated_at: nowIso, }), }); return rows?.[0] ?? null; }
export async function loadUserNotifications(env: WorkerEnv, userId: string, limit = WorkerNotificationRuntimeConfig.defaultListLimit) { const rows = await supabaseRequest<WorkerNotificationRow[]>(env, `user_notification?select=notification_id,user_id,actor_user_id,type,title,body,review_id,comment_id,route_id,is_read,created_at&user_id=eq.${encodeFilterValue(userId)}&order=created_at.desc&limit=${limit}`); const actorIdsFilter = buildInFilter((rows || []).map((row) => row.actor_user_id).filter(Boolean)); const actorRows = actorIdsFilter ? await supabaseRequest<WorkerNotificationActorRow[]>(env, `user?select=user_id,nickname&user_id=${actorIdsFilter}`) : []; const actorNameById = new Map((actorRows || []).map((row) => [row.user_id, row.nickname])); return (rows || []).map((row) => ({ id: String(row.notification_id), type: row.type, title: row.title, body: row.body ?? '', createdAt: formatDateTime(row.created_at), isRead: Boolean(row.is_read), reviewId: row.review_id ? String(row.review_id) : null, commentId: row.comment_id ? String(row.comment_id) : null, routeId: row.route_id ? String(row.route_id) : null, actorName: row.actor_user_id ? actorNameById.get(row.actor_user_id) ?? null : null, })); }
export async function countUnreadNotifications(env: WorkerEnv, userId: string) { const rows = await supabaseRequest<WorkerNotificationInsertResult[]>(env, `user_notification?select=notification_id&user_id=eq.${encodeFilterValue(userId)}&is_read=eq.false`); return rows?.length ?? 0; }
export async function loadNotificationById(env: WorkerEnv, notificationId: string | number) { const row = await readNotificationRow(env, notificationId); if (!row) {
    return null;
} let actorName = null; if (row.actor_user_id) {
    const actorRows = await supabaseRequest<WorkerNotificationActorRow[]>(env, `user?select=user_id,nickname&user_id=eq.${encodeFilterValue(row.actor_user_id)}&limit=1`);
    actorName = actorRows?.[0]?.nickname ?? null;
} return { id: String(row.notification_id), type: row.type, title: row.title, body: row.body ?? '', createdAt: formatDateTime(row.created_at), isRead: Boolean(row.is_read), reviewId: row.review_id ? String(row.review_id) : null, commentId: row.comment_id ? String(row.comment_id) : null, routeId: row.route_id ? String(row.route_id) : null, actorName, }; }
async function buildNotificationRealtimeTopic(env: WorkerEnv, userId: string) { const secret = getSigningSecret(env); if (!secret) {
    throw new Error('Notification realtime secret is missing.');
} const signature = await sha256Base64Url(`${userId}:${secret}:notifications`); return `user-notifications:${userId}:${signature}`; }
async function sendRealtimeBroadcast(env: WorkerEnv, topic: string, event: string, payload: WorkerJsonRecord) { if (!env.APP_SUPABASE_URL) {
    return;
} const apiKey = getSupabaseKey(env); if (!apiKey) {
    return;
} await fetch(`${env.APP_SUPABASE_URL}/realtime/v1/api/broadcast`, { method: 'POST', headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', }, body: JSON.stringify({ messages: [{ topic, event, payload, private: false, },], }), }); }
export async function publishNotificationEvent(env: WorkerEnv, userId: string, event: string, payload: WorkerJsonRecord) { const topic = await buildNotificationRealtimeTopic(env, userId); await sendRealtimeBroadcast(env, topic, event, payload); }
export async function handleMyNotifications(request: Request, env: WorkerEnv) { const sessionResult = await requireSessionUser(request, env); if (sessionResult.response) {
    return sessionResult.response;
} const notifications = await loadUserNotifications(env, sessionResult.sessionUser.id, WorkerNotificationRuntimeConfig.myNotificationsListLimit); return jsonResponse(200, notifications, env, request); }
export async function handleNotificationRealtimeChannel(request: Request, env: WorkerEnv) { const sessionResult = await requireSessionUser(request, env); if (sessionResult.response) {
    return sessionResult.response;
} const topic = await buildNotificationRealtimeTopic(env, sessionResult.sessionUser.id); return jsonResponse(200, { topic }, env, request); }
export async function handleMarkNotificationRead(request: Request, env: WorkerEnv, notificationId: string) { const sessionResult = await requireSessionUser(request, env); if (sessionResult.response) {
    return sessionResult.response;
} const notificationRow = await readNotificationRow(env, notificationId); if (!notificationRow) {
    return jsonResponse(404, { detail: '알림을 찾지 못했어요.' }, env, request);
} if (notificationRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 알림만 확인할 수 있어요.' }, env, request);
} if (!notificationRow.is_read) {
    const nowIso = new Date().toISOString();
    await supabaseRequest(env, `user_notification?notification_id=eq.${encodeFilterValue(notificationId)}`, { method: 'PATCH', body: JSON.stringify({ is_read: true, read_at: nowIso, updated_at: nowIso, }), });
    await publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.read', { notificationId: String(notificationId), unreadCount: await countUnreadNotifications(env, sessionResult.sessionUser.id), });
} return jsonResponse(200, { notificationId: String(notificationId), read: true }, env, request); }
export async function handleMarkAllNotificationsRead(request: Request, env: WorkerEnv) { const sessionResult = await requireSessionUser(request, env); if (sessionResult.response) {
    return sessionResult.response;
} const unreadRows = await supabaseRequest<WorkerNotificationInsertResult[]>(env, `user_notification?select=notification_id&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&is_read=eq.false`); const updated = unreadRows?.length ?? 0; if (updated > 0) {
    const nowIso = new Date().toISOString();
    await supabaseRequest(env, `user_notification?user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&is_read=eq.false`, { method: 'PATCH', body: JSON.stringify({ is_read: true, read_at: nowIso, updated_at: nowIso, }), });
    await publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.all-read', { updated, unreadCount: 0, });
} return jsonResponse(200, { updated }, env, request); }
export async function handleDeleteNotification(request: Request, env: WorkerEnv, notificationId: string) { const sessionResult = await requireSessionUser(request, env); if (sessionResult.response) {
    return sessionResult.response;
} const notificationRow = await readNotificationRow(env, notificationId); if (!notificationRow) {
    return jsonResponse(404, { detail: '알림을 찾지 못했어요.' }, env, request);
} if (notificationRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 알림만 삭제할 수 있어요.' }, env, request);
} await supabaseRequest(env, `user_notification?notification_id=eq.${encodeFilterValue(notificationId)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' }, }); await publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.deleted', { notificationId: String(notificationId), unreadCount: await countUnreadNotifications(env, sessionResult.sessionUser.id), }); return jsonResponse(200, { notificationId: String(notificationId), deleted: true }, env, request); }

