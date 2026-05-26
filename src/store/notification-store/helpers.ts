import type { NotificationStoreState } from './types';
import type { UserNotification } from '../../types';

type NotificationCreatedPayload = {
  notification: UserNotification;
  unreadCount: number;
};

type NotificationReadPayload = {
  notificationId: string;
  unreadCount: number;
};

type NotificationAllReadPayload = { unreadCount: number };

export function countUnread(notifications: UserNotification[]) {
  // Optimization: use a for...of loop to avoid O(N) array allocation from .filter()
  let count = 0;
  for (const notification of notifications) {
    if (!notification.isRead) {
      count++;
    }
  }
  return count;
}

export function clearReconnectTimer(timer: number | null) {
  if (timer !== null && typeof window !== 'undefined') {
    window.clearTimeout(timer);
  }
}

export function applyCreatedNotification(
  state: NotificationStoreState,
  { notification, unreadCount }: NotificationCreatedPayload,
): Partial<NotificationStoreState> {
  return {
    notifications: [notification, ...state.notifications.filter((item) => item.id !== notification.id)],
    unreadCount,
    connected: true,
    status: 'ready',
    error: null,
  };
}

export function applyReadNotification(
  state: NotificationStoreState,
  { notificationId, unreadCount }: NotificationReadPayload,
): Partial<NotificationStoreState> {
  const idx = state.notifications.findIndex((notification) => notification.id === notificationId);
  if (idx === -1) {
    return {
      unreadCount,
      connected: true,
    };
  }
  const nextNotifications = [...state.notifications];
  nextNotifications[idx] = { ...nextNotifications[idx], isRead: true };
  return {
    notifications: nextNotifications,
    unreadCount,
    connected: true,
  };
}

export function applyAllReadNotifications(
  state: NotificationStoreState,
  { unreadCount }: NotificationAllReadPayload,
): Partial<NotificationStoreState> {
  return {
    notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
    unreadCount,
    connected: true,
  };
}

export function applyDeletedNotification(
  state: NotificationStoreState,
  { notificationId, unreadCount }: NotificationReadPayload,
): Partial<NotificationStoreState> {
  return {
    notifications: state.notifications.filter((notification) => notification.id !== notificationId),
    unreadCount,
    connected: true,
  };
}

export const initialNotificationStoreState: NotificationStoreState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
  status: 'idle',
  error: null,
  channel: null,
  reconnectTimer: null,
};
