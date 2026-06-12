import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { createNotificationStoreActions } from '../../src/store/notification-store/actions';
import { initialNotificationStoreState } from '../../src/store/notification-store/helpers';
import type { NotificationStore } from '../../src/store/notification-store/types';
import type { SessionUser, UserNotification } from '../../src/types';

const myClientMocks = vi.hoisted(() => ({
  deleteNotification: vi.fn(),
  getMyNotifications: vi.fn(),
  getMyNotificationsRealtimeChannel: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const supabaseMocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  removeRealtimeChannel: vi.fn(),
}));

vi.mock('../../src/api/myClient', () => ({
  deleteNotification: myClientMocks.deleteNotification,
  getMyNotifications: myClientMocks.getMyNotifications,
  getMyNotificationsRealtimeChannel: myClientMocks.getMyNotificationsRealtimeChannel,
  markAllNotificationsRead: myClientMocks.markAllNotificationsRead,
  markNotificationRead: myClientMocks.markNotificationRead,
}));

vi.mock('../../src/lib/supabase', () => ({
  getSupabaseClient: supabaseMocks.getSupabaseClient,
  removeRealtimeChannel: supabaseMocks.removeRealtimeChannel,
}));

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

function notificationFixture(id: string, isRead = false): UserNotification {
  return {
    id,
    type: 'review-comment',
    title: 'title',
    body: 'body',
    createdAt: '2026-05-14T00:00:00Z',
    isRead,
    reviewId: 'review-1',
    commentId: null,
    routeId: null,
    actorName: 'tester',
  };
}

function createActionHarness(initial?: Partial<NotificationStore>) {
  let state: NotificationStore;
  const get = (() => state) as StoreApi<NotificationStore>['getState'];
  const set = ((partial: Parameters<StoreApi<NotificationStore>['setState']>[0]) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...nextState };
  }) as StoreApi<NotificationStore>['setState'];
  state = {
    ...initialNotificationStoreState,
    ...createNotificationStoreActions(set, get),
    ...initial,
  };
  return {
    actions: createNotificationStoreActions(set, get),
    getState: () => state,
  };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('notification store actions', () => {
  it('fetches notifications and derives unread count', async () => {
    const notifications = [notificationFixture('notification-1'), notificationFixture('notification-2', true)];
    myClientMocks.getMyNotifications.mockResolvedValue(notifications);
    const { actions, getState } = createActionHarness();

    await actions.fetchNotifications();

    expect(myClientMocks.getMyNotifications).toHaveBeenCalledTimes(1);
    expect(getState()).toMatchObject({
      notifications,
      unreadCount: 1,
      status: 'ready',
      error: null,
    });
  });

  it('records fetch errors without throwing through the UI store boundary', async () => {
    myClientMocks.getMyNotifications.mockRejectedValue(new Error('network'));
    const { actions, getState } = createActionHarness();

    await actions.fetchNotifications();

    expect(getState()).toMatchObject({
      status: 'error',
      error: 'network',
    });
  });

  it('marks and deletes notifications through API-backed mutations', async () => {
    myClientMocks.markNotificationRead.mockResolvedValue({ notificationId: 'notification-1', read: true });
    myClientMocks.markAllNotificationsRead.mockResolvedValue({ updated: 1 });
    myClientMocks.deleteNotification.mockResolvedValue({ notificationId: 'notification-2', deleted: true });
    const first = notificationFixture('notification-1');
    const second = notificationFixture('notification-2');
    const { actions, getState } = createActionHarness({
      notifications: [first, second],
      unreadCount: 2,
    });

    await actions.markRead('notification-1');
    expect(myClientMocks.markNotificationRead).toHaveBeenCalledWith('notification-1');
    expect(getState()).toMatchObject({
      notifications: [{ ...first, isRead: true }, second],
      unreadCount: 1,
    });

    await actions.markAllRead();
    expect(myClientMocks.markAllNotificationsRead).toHaveBeenCalledTimes(1);
    expect(getState()).toMatchObject({
      notifications: [{ ...first, isRead: true }, { ...second, isRead: true }],
      unreadCount: 0,
    });

    await actions.deleteNotification('notification-2');
    expect(myClientMocks.deleteNotification).toHaveBeenCalledWith('notification-2');
    expect(getState().notifications).toEqual([{ ...first, isRead: true }]);
  });

  it('disconnects immediately when realtime connect is requested without a session user', () => {
    const channel = { topic: 'notification:user-1' };
    const { actions, getState } = createActionHarness({
      channel: channel as never,
      connected: true,
      status: 'ready',
    });

    actions.connect(null);

    expect(supabaseMocks.removeRealtimeChannel).toHaveBeenCalledWith(channel);
    expect(getState()).toMatchObject(initialNotificationStoreState);
  });

  it('reports configuration errors when Supabase realtime is unavailable', () => {
    supabaseMocks.getSupabaseClient.mockReturnValue(null);
    const { actions, getState } = createActionHarness();

    actions.connect(sessionUser);

    expect(getState()).toMatchObject({
      status: 'error',
      connected: false,
    });
  });

  it('subscribes to realtime notification broadcasts and applies payload reducers', async () => {
    const eventHandlers = new Map<string, (event: { payload: unknown }) => void>();
    const subscribe = vi.fn((callback: (status: string) => void) => {
      callback('SUBSCRIBED');
    });
    const channel = {
      on: vi.fn((_type: string, options: { event: string }, handler: (event: { payload: unknown }) => void) => {
        eventHandlers.set(options.event, handler);
        return channel;
      }),
      subscribe,
    };
    const supabase = {
      channel: vi.fn(() => channel),
    };
    myClientMocks.getMyNotificationsRealtimeChannel.mockResolvedValue({ topic: 'notification:user-1' });
    supabaseMocks.getSupabaseClient.mockReturnValue(supabase);
    const { actions, getState } = createActionHarness();

    actions.connect(sessionUser);
    await flushAsyncWork();

    expect(supabase.channel).toHaveBeenCalledWith('notification:user-1');
    expect(channel.on).toHaveBeenCalledTimes(4);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(getState()).toMatchObject({
      channel,
      connected: false,
      status: 'loading',
      error: null,
    });

    eventHandlers.get('notification.created')?.({
      payload: { notification: notificationFixture('notification-1'), unreadCount: 1 },
    });
    eventHandlers.get('notification.read')?.({
      payload: { notificationId: 'notification-1', unreadCount: 0 },
    });
    eventHandlers.get('notification.all-read')?.({
      payload: { unreadCount: 0 },
    });
    eventHandlers.get('notification.deleted')?.({
      payload: { notificationId: 'notification-1', unreadCount: 0 },
    });

    expect(getState()).toMatchObject({
      notifications: [],
      unreadCount: 0,
      connected: true,
    });
  });

  it('schedules reconnect when realtime channel closes', async () => {
    vi.useFakeTimers();
    let subscribeCallback: ((status: string) => void) | null = null;
    const channel = {
      on: vi.fn(() => channel),
      subscribe: vi.fn((callback: (status: string) => void) => {
        subscribeCallback = callback;
      }),
    };
    const supabase = {
      channel: vi.fn(() => channel),
    };
    myClientMocks.getMyNotificationsRealtimeChannel.mockResolvedValue({ topic: 'notification:user-1' });
    supabaseMocks.getSupabaseClient.mockReturnValue(supabase);
    const { actions, getState } = createActionHarness();

    actions.connect(sessionUser);
    await flushAsyncWork();
    subscribeCallback?.('CLOSED');

    expect(supabaseMocks.removeRealtimeChannel).toHaveBeenCalledWith(channel);
    expect(getState().connected).toBe(false);
    expect(getState().reconnectTimer).not.toBeNull();

    await vi.runOnlyPendingTimersAsync();
    expect(getState().reconnectTimer).toBeNull();
    vi.useRealTimers();
  });
});
