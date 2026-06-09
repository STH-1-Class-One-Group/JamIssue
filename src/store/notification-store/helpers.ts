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
  // Count unread notifications without creating an intermediate array to reduce memory pressure
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
  const nextNotifications = [notification];
  for (const item of state.notifications) {
    if (item.id !== notification.id) {
      nextNotifications.push(item);
    }
  }

  return {
    notifications: nextNotifications,
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
  let hasChanges = false;
  let nextNotifications = state.notifications;
  for (let i = 0; i < state.notifications.length; i++) {
    if (!state.notifications[i].isRead) {
      if (!hasChanges) {
        nextNotifications = [...state.notifications];
        hasChanges = true;
      }
      nextNotifications[i] = { ...nextNotifications[i], isRead: true };
    }
  }

  return {
    notifications: nextNotifications,
    unreadCount,
    connected: true,
  };
}

export function applyDeletedNotification(
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
  nextNotifications.splice(idx, 1);

  return {
    notifications: nextNotifications,
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
