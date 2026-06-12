import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  countUnreadNotifications,
  createUserNotification,
  handleDeleteNotification,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
  handleMyNotifications,
  handleNotificationRealtimeChannel,
  loadNotificationById,
  loadUserNotifications,
  publishNotificationEvent,
} from '../../deploy/api-worker-shell/services/notifications';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const authMocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
}));

const notificationDomainMocks = vi.hoisted(() => ({
  buildNotificationRealtimeTopic: vi.fn(),
  createNotification: vi.fn(),
  deleteNotificationRow: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  readNotificationActorRow: vi.fn(),
  readNotificationActorRows: vi.fn(),
  readNotificationRow: vi.fn(),
  readUnreadNotificationRows: vi.fn(),
  readUserNotificationRows: vi.fn(),
  sendRealtimeBroadcast: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  readSessionUser: authMocks.readSessionUser,
}));

vi.mock('../../deploy/api-worker-shell/services/notification-domain', () => ({
  buildNotificationRealtimeTopic: notificationDomainMocks.buildNotificationRealtimeTopic,
  createNotification: notificationDomainMocks.createNotification,
  deleteNotificationRow: notificationDomainMocks.deleteNotificationRow,
  markAllNotificationsRead: notificationDomainMocks.markAllNotificationsRead,
  markNotificationRead: notificationDomainMocks.markNotificationRead,
  readNotificationActorRow: notificationDomainMocks.readNotificationActorRow,
  readNotificationActorRows: notificationDomainMocks.readNotificationActorRows,
  readNotificationRow: notificationDomainMocks.readNotificationRow,
  readUnreadNotificationRows: notificationDomainMocks.readUnreadNotificationRows,
  readUserNotificationRows: notificationDomainMocks.readUserNotificationRows,
  sendRealtimeBroadcast: notificationDomainMocks.sendRealtimeBroadcast,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
} as WorkerEnv;

function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    notification_id: 'notification-1',
    user_id: 'user-1',
    actor_user_id: 'actor-1',
    type: 'comment',
    title: 'title',
    body: 'body',
    is_read: false,
    review_id: 'review-1',
    comment_id: 'comment-1',
    route_id: null,
    created_at: '2026-05-14T00:00:00Z',
    ...overrides,
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('worker notification service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.readSessionUser.mockResolvedValue({ id: 'user-1' });
    notificationDomainMocks.buildNotificationRealtimeTopic.mockResolvedValue('topic:user-1');
    notificationDomainMocks.readUnreadNotificationRows.mockResolvedValue([notificationRow()]);
    notificationDomainMocks.readUserNotificationRows.mockResolvedValue([notificationRow()]);
    notificationDomainMocks.readNotificationActorRows.mockResolvedValue([{ user_id: 'actor-1', nickname: 'Actor' }]);
    notificationDomainMocks.readNotificationActorRow.mockResolvedValue({ user_id: 'actor-1', nickname: 'Actor' });
    notificationDomainMocks.readNotificationRow.mockResolvedValue(notificationRow());
    notificationDomainMocks.createNotification.mockResolvedValue({ notification_id: 'notification-1' });
  });

  it('creates notifications only when a user id is present', async () => {
    await expect(createUserNotification(env, {
      userId: '',
      type: 'comment',
      title: 'title',
    })).resolves.toBeNull();
    await expect(createUserNotification(env, {
      userId: 'user-1',
      type: 'comment',
      title: 'title',
    })).resolves.toEqual({ notification_id: 'notification-1' });

    expect(notificationDomainMocks.createNotification).toHaveBeenCalledTimes(1);
  });

  it('maps notification rows with actor names and unread counts', async () => {
    await expect(loadUserNotifications(env, 'user-1', 5)).resolves.toEqual([
      expect.objectContaining({
        id: 'notification-1',
        actorName: 'Actor',
        reviewId: 'review-1',
        commentId: 'comment-1',
        routeId: null,
        isRead: false,
      }),
    ]);
    await expect(countUnreadNotifications(env, 'user-1')).resolves.toBe(1);

    expect(notificationDomainMocks.readUserNotificationRows).toHaveBeenCalledWith(env, 'user-1', 5);
    expect(notificationDomainMocks.readNotificationActorRows).toHaveBeenCalledWith(env, ['actor-1']);
  });

  it('loads a single notification with its actor and returns null for missing rows', async () => {
    await expect(loadNotificationById(env, 'notification-1')).resolves.toEqual(expect.objectContaining({
      id: 'notification-1',
      actorName: 'Actor',
    }));

    notificationDomainMocks.readNotificationRow.mockResolvedValueOnce(null);
    await expect(loadNotificationById(env, 'missing')).resolves.toBeNull();
  });

  it('publishes realtime notification events to the computed topic', async () => {
    await publishNotificationEvent(env, 'user-1', 'notification.created', { notificationId: 'notification-1' });

    expect(notificationDomainMocks.buildNotificationRealtimeTopic).toHaveBeenCalledWith(env, 'user-1');
    expect(notificationDomainMocks.sendRealtimeBroadcast).toHaveBeenCalledWith(
      env,
      'topic:user-1',
      'notification.created',
      { notificationId: 'notification-1' },
    );
  });

  it('guards notification list and realtime channel handlers behind session auth', async () => {
    authMocks.readSessionUser.mockResolvedValueOnce(null);
    const unauthorized = await handleMyNotifications(new Request('https://api.test/api/my/notifications'), env);
    expect(unauthorized.status).toBe(401);

    const listResponse = await handleMyNotifications(new Request('https://api.test/api/my/notifications'), env);
    const realtimeResponse = await handleNotificationRealtimeChannel(new Request('https://api.test/api/my/notifications/realtime'), env);

    expect(listResponse.status).toBe(200);
    await expect(readJson(listResponse)).resolves.toEqual([expect.objectContaining({ id: 'notification-1' })]);
    await expect(readJson(realtimeResponse)).resolves.toEqual({ topic: 'topic:user-1' });
  });

  it('marks an owned unread notification as read and publishes the unread count', async () => {
    const response = await handleMarkNotificationRead(new Request('https://api.test/api/my/notifications/notification-1/read'), env, 'notification-1');
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ notificationId: 'notification-1', read: true });
    expect(notificationDomainMocks.markNotificationRead).toHaveBeenCalledWith(env, 'notification-1', expect.any(String));
    expect(notificationDomainMocks.sendRealtimeBroadcast).toHaveBeenCalledWith(
      env,
      'topic:user-1',
      'notification.read',
      { notificationId: 'notification-1', unreadCount: 1 },
    );
  });

  it('does not republish read events for already-read notifications', async () => {
    notificationDomainMocks.readNotificationRow.mockResolvedValueOnce(notificationRow({ is_read: true }));

    const response = await handleMarkNotificationRead(new Request('https://api.test/api/my/notifications/notification-1/read'), env, 'notification-1');

    expect(response.status).toBe(200);
    expect(notificationDomainMocks.markNotificationRead).not.toHaveBeenCalled();
    expect(notificationDomainMocks.sendRealtimeBroadcast).not.toHaveBeenCalled();
  });

  it('rejects missing or unowned notification read requests', async () => {
    notificationDomainMocks.readNotificationRow.mockResolvedValueOnce(null);
    const missing = await handleMarkNotificationRead(new Request('https://api.test/api/my/notifications/missing/read'), env, 'missing');
    expect(missing.status).toBe(404);

    notificationDomainMocks.readNotificationRow.mockResolvedValueOnce(notificationRow({ user_id: 'other-user' }));
    const forbidden = await handleMarkNotificationRead(new Request('https://api.test/api/my/notifications/notification-1/read'), env, 'notification-1');
    expect(forbidden.status).toBe(403);
  });

  it('marks all unread notifications and reports zero updates when there is nothing to mark', async () => {
    const updated = await handleMarkAllNotificationsRead(new Request('https://api.test/api/my/notifications/read-all'), env);
    await expect(readJson(updated)).resolves.toEqual({ updated: 1 });
    expect(notificationDomainMocks.markAllNotificationsRead).toHaveBeenCalledWith(env, 'user-1', expect.any(String));

    vi.clearAllMocks();
    authMocks.readSessionUser.mockResolvedValue({ id: 'user-1' });
    notificationDomainMocks.readUnreadNotificationRows.mockResolvedValue([]);
    const unchanged = await handleMarkAllNotificationsRead(new Request('https://api.test/api/my/notifications/read-all'), env);
    await expect(readJson(unchanged)).resolves.toEqual({ updated: 0 });
    expect(notificationDomainMocks.markAllNotificationsRead).not.toHaveBeenCalled();
  });

  it('deletes owned notifications and rejects missing or unowned deletion targets', async () => {
    const deleted = await handleDeleteNotification(new Request('https://api.test/api/my/notifications/notification-1'), env, 'notification-1');
    await expect(readJson(deleted)).resolves.toEqual({ notificationId: 'notification-1', deleted: true });
    expect(notificationDomainMocks.deleteNotificationRow).toHaveBeenCalledWith(env, 'notification-1');

    notificationDomainMocks.readNotificationRow.mockResolvedValueOnce(null);
    const missing = await handleDeleteNotification(new Request('https://api.test/api/my/notifications/missing'), env, 'missing');
    expect(missing.status).toBe(404);

    notificationDomainMocks.readNotificationRow.mockResolvedValueOnce(notificationRow({ user_id: 'other-user' }));
    const forbidden = await handleDeleteNotification(new Request('https://api.test/api/my/notifications/notification-1'), env, 'notification-1');
    expect(forbidden.status).toBe(403);
  });
});
