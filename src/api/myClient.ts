import type {
  MyCommentPageResponse,
  MyPageResponse,
  NotificationDeleteResponse,
  NotificationReadResponse,
  NotificationRealtimeChannelResponse,
  UserNotification,
} from '../types';
import { fetchJson, invalidateApiCache } from './core';

export function getMySummary() {
  return fetchJson<MyPageResponse>('/api/my/summary');
}

export function getMyNotifications() {
  return fetchJson<UserNotification[]>('/api/my/notifications');
}

export function getMyNotificationsRealtimeChannel() {
  return fetchJson<NotificationRealtimeChannelResponse>('/api/my/notifications/realtime-channel');
}

export async function markNotificationRead(notificationId: string) {
  const response = await fetchJson<NotificationReadResponse>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
  invalidateApiCache(['/api/my/summary']);
  return response;
}

export async function markAllNotificationsRead() {
  const response = await fetchJson<{ updated: number }>('/api/notifications/read-all', {
    method: 'PATCH',
  });
  invalidateApiCache(['/api/my/summary']);
  return response;
}

export async function deleteNotification(notificationId: string) {
  const response = await fetchJson<NotificationDeleteResponse>(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  });
  invalidateApiCache(['/api/my/summary']);
  return response;
}

export function getMyCommentsPage(params?: { cursor?: string | null; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.cursor) {
    search.set('cursor', params.cursor);
  }
  if (params?.limit) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  return fetchJson<MyCommentPageResponse>(`/api/my/comments${query ? `?${query}` : ''}`);
}

