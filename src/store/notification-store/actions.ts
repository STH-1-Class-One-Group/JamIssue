import type { StoreApi } from 'zustand';
import {
  deleteNotification as deleteNotificationRequest,
  getMyNotifications,
  getMyNotificationsRealtimeChannel,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from '../../api/myClient';
import { getSupabaseClient, removeRealtimeChannel } from '../../lib/supabase';
import {
  applyAllReadNotifications,
  applyCreatedNotification,
  applyDeletedNotification,
  applyReadNotification,
  clearReconnectTimer,
  countUnread,
  initialNotificationStoreState,
} from './helpers';
import type { NotificationStore } from './types';

type SetState = StoreApi<NotificationStore>['setState'];
type GetState = StoreApi<NotificationStore>['getState'];
type NotificationStoreActions = Pick<
  NotificationStore,
  'fetchNotifications' | 'connect' | 'disconnect' | 'markRead' | 'markAllRead' | 'deleteNotification' | 'hydrate'
>;

export function createNotificationStoreActions(set: SetState, get: GetState): NotificationStoreActions {
  return {
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
            set((state) => applyCreatedNotification(state, payload as { notification: NotificationStore['notifications'][number]; unreadCount: number }));
          });

          channel.on('broadcast', { event: 'notification.read' }, ({ payload }) => {
            set((state) => applyReadNotification(state, payload as { notificationId: string; unreadCount: number }));
          });

          channel.on('broadcast', { event: 'notification.all-read' }, ({ payload }) => {
            set((state) => applyAllReadNotifications(state, payload as { unreadCount: number }));
          });

          channel.on('broadcast', { event: 'notification.deleted' }, ({ payload }) => {
            set((state) => applyDeletedNotification(state, payload as { notificationId: string; unreadCount: number }));
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
      set(initialNotificationStoreState);
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
  };
}
