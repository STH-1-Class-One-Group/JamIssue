import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  deleteNotification as deleteNotificationRequest,
  getMyNotifications,
  getMyNotificationsRealtimeChannel,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from '../api/myClient';
import { getSupabaseClient, removeRealtimeChannel } from '../lib/supabase';
import type { SessionUser, UserNotification } from '../types';

type NotificationStore = {
  notifications: UserNotification[];
  unreadCount: number;
  connected: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  channel: RealtimeChannel | null;
  reconnectTimer: number | null;
  fetchNotifications: () => Promise<void>;
  connect: (sessionUser: SessionUser | null) => void;
  disconnect: () => void;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  hydrate: (notifications: UserNotification[], unreadCount?: number) => void;
};

function countUnread(notifications: UserNotification[]) {
  return notifications.filter((notification) => !notification.isRead).length;
}

function clearReconnectTimer(timer: number | null) {
  if (timer !== null && typeof window !== 'undefined') {
    window.clearTimeout(timer);
  }
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  connected: false,
  status: 'idle',
  error: null,
  channel: null,
  reconnectTimer: null,
  async fetchNotifications() {
    set({ status: 'loading', error: null });
    try {
      const notifications = await getMyNotifications();
      set({
        notifications,
        unreadCount: countUnread(notifications),
        status: 'ready',
        error: null,
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : '알림을 불러오지 못했어요.',
      });
    }
  },
  connect(sessionUser) {
    const currentChannel = get().channel;
    if (!sessionUser) {
      get().disconnect();
      return;
    }
    if (currentChannel) {
      return;
    }

    clearReconnectTimer(get().reconnectTimer);
    const supabase = getSupabaseClient();
    if (!supabase) {
      set({
        status: 'error',
        error: '실시간 알림 설정이 비어 있어요.',
        connected: false,
      });
      return;
    }

    void (async () => {
      try {
        const { topic } = await getMyNotificationsRealtimeChannel();
        const channel = supabase.channel(topic);

        channel.on('broadcast', { event: 'notification.created' }, ({ payload }) => {
          const nextPayload = payload as {
            notification: UserNotification;
            unreadCount: number;
          };
          set((state) => ({
            notifications: [nextPayload.notification, ...state.notifications.filter((item) => item.id !== nextPayload.notification.id)],
            unreadCount: nextPayload.unreadCount,
            connected: true,
            status: 'ready',
            error: null,
          }));
        });

        channel.on('broadcast', { event: 'notification.read' }, ({ payload }) => {
          const nextPayload = payload as {
            notificationId: string;
            unreadCount: number;
          };
          set((state) => ({
            notifications: state.notifications.map((notification) => (
              notification.id === nextPayload.notificationId
                ? { ...notification, isRead: true }
                : notification
            )),
            unreadCount: nextPayload.unreadCount,
            connected: true,
          }));
        });

        channel.on('broadcast', { event: 'notification.all-read' }, ({ payload }) => {
          const nextPayload = payload as { unreadCount: number };
          set((state) => ({
            notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
            unreadCount: nextPayload.unreadCount,
            connected: true,
          }));
        });

        channel.on('broadcast', { event: 'notification.deleted' }, ({ payload }) => {
          const nextPayload = payload as {
            notificationId: string;
            unreadCount: number;
          };
          set((state) => ({
            notifications: state.notifications.filter((notification) => notification.id !== nextPayload.notificationId),
            unreadCount: nextPayload.unreadCount,
            connected: true,
          }));
        });

        channel.subscribe((nextStatus) => {
          if (nextStatus === 'SUBSCRIBED') {
            set({ channel, connected: true, status: 'ready', error: null });
            return;
          }
          if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT' || nextStatus === 'CLOSED') {
            removeRealtimeChannel(channel);
            set({ channel: null, connected: false });
            const reconnectTimer = window.setTimeout(() => {
              set({ reconnectTimer: null });
              get().connect(sessionUser);
            }, 3000);
            set({ reconnectTimer });
          }
        });
        set({
          channel,
          connected: false,
          status: 'loading',
          error: null,
        });
      } catch (error) {
        set({
          status: 'error',
          error: error instanceof Error ? error.message : '알림 채널을 연결하지 못했어요.',
          connected: false,
        });
      }
    })();
  },
  disconnect() {
    clearReconnectTimer(get().reconnectTimer);
    removeRealtimeChannel(get().channel);
    set({
      channel: null,
      reconnectTimer: null,
      connected: false,
      notifications: [],
      unreadCount: 0,
      error: null,
      status: 'idle',
    });
  },
  async markRead(notificationId) {
    await markNotificationReadRequest(notificationId);
    set((state) => ({
      notifications: state.notifications.map((notification) => (
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )),
      unreadCount: Math.max(0, state.notifications.filter((notification) => !notification.isRead && notification.id !== notificationId).length),
    }));
  },
  async markAllRead() {
    await markAllNotificationsReadRequest();
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
      unreadCount: 0,
    }));
  },
  async deleteNotification(notificationId) {
    await deleteNotificationRequest(notificationId);
    set((state) => {
      const notifications = state.notifications.filter((notification) => notification.id !== notificationId);
      return {
        notifications,
        unreadCount: countUnread(notifications),
      };
    });
  },
  hydrate(notifications, unreadCount) {
    set({
      notifications,
      unreadCount: unreadCount ?? countUnread(notifications),
      status: 'ready',
      error: null,
    });
  },
}));
