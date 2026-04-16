import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SessionUser, UserNotification } from '../../types';

export interface NotificationStoreState {
  notifications: UserNotification[];
  unreadCount: number;
  connected: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  channel: RealtimeChannel | null;
  reconnectTimer: number | null;
}

export interface NotificationStoreActions {
  fetchNotifications: () => Promise<void>;
  connect: (sessionUser: SessionUser | null) => void;
  disconnect: () => void;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  hydrate: (notifications: UserNotification[], unreadCount?: number) => void;
}

export type NotificationStore = NotificationStoreState & NotificationStoreActions;
