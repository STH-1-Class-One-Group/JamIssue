import { afterEach, describe, expect, it, vi } from 'vitest';
import { issueSessionCookie } from '../../deploy/api-worker-shell/services/auth/session';
import {
  handleDeleteNotification,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
  handleNotificationRealtimeChannel,
} from '../../deploy/api-worker-shell/services/notifications';
import type { WorkerEnv, WorkerSessionUser } from '../../deploy/api-worker-shell/types';

const env: WorkerEnv = {
  APP_CORS_ORIGINS: 'http://localhost',
  APP_FRONTEND_URL: 'http://localhost',
  APP_SESSION_HTTPS: 'false',
  APP_SESSION_SECRET: 'test-session-secret',
  APP_SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  APP_SUPABASE_URL: 'https://supabase.test',
};

const sessionUser: WorkerSessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

const notificationRow = {
  notification_id: 10,
  user_id: sessionUser.id,
  actor_user_id: 'actor-1',
  type: 'comment',
  title: 'title',
  body: 'body',
  review_id: 20,
  comment_id: 30,
  route_id: null,
  is_read: false,
  created_at: '2026-05-12T00:00:00.000Z',
};

async function createAuthedRequest(method = 'POST') {
  const baseRequest = new Request('http://localhost/api/my/notifications', { method });
  const cookie = await issueSessionCookie(sessionUser, baseRequest, env);

  return new Request('http://localhost/api/my/notifications', {
    method,
    headers: { cookie },
  });
}

function stubFetchRows(rowsByCall: unknown[][]) {
  const calls: Array<{ init?: RequestInit; url: string }> = [];
  const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async (input, init) => {
    calls.push({ init, url: String(input) });
    const isRealtime = String(input).includes('/realtime/v1/api/broadcast');
    const rows = isRealtime ? { ok: true } : rowsByCall.shift() ?? [];

    return new Response(JSON.stringify(rows), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return { calls, fetchMock };
}

function realtimePayload(call: { init?: RequestInit }) {
  return JSON.parse(String(call.init?.body)) as {
    messages: Array<{ event: string; payload: Record<string, unknown>; topic: string }>;
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('worker notification service', () => {
  it('marks a single notification as read and publishes a realtime event', async () => {
    const { calls } = stubFetchRows([[notificationRow], [], []]);

    const response = await handleMarkNotificationRead(await createAuthedRequest(), env, '10');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ notificationId: '10', read: true });
    expect(calls.map((call) => [call.init?.method ?? 'GET', new URL(call.url).pathname])).toEqual([
      ['GET', '/rest/v1/user_notification'],
      ['PATCH', '/rest/v1/user_notification'],
      ['GET', '/rest/v1/user_notification'],
      ['POST', '/realtime/v1/api/broadcast'],
    ]);
    expect(realtimePayload(calls.at(-1)!).messages[0]).toMatchObject({
      event: 'notification.read',
      payload: { notificationId: '10', unreadCount: 0 },
    });
  });

  it('marks all unread notifications and publishes a realtime event with the updated count', async () => {
    const { calls } = stubFetchRows([[{ notification_id: 10 }, { notification_id: 11 }], []]);

    const response = await handleMarkAllNotificationsRead(await createAuthedRequest(), env);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ updated: 2 });
    expect(calls.map((call) => [call.init?.method ?? 'GET', new URL(call.url).pathname])).toEqual([
      ['GET', '/rest/v1/user_notification'],
      ['PATCH', '/rest/v1/user_notification'],
      ['POST', '/realtime/v1/api/broadcast'],
    ]);
    expect(realtimePayload(calls.at(-1)!).messages[0]).toMatchObject({
      event: 'notification.all-read',
      payload: { unreadCount: 0, updated: 2 },
    });
  });

  it('deletes a notification and publishes a realtime event', async () => {
    const { calls } = stubFetchRows([[notificationRow], [], []]);

    const response = await handleDeleteNotification(await createAuthedRequest('DELETE'), env, '10');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ deleted: true, notificationId: '10' });
    expect(calls.map((call) => [call.init?.method ?? 'GET', new URL(call.url).pathname])).toEqual([
      ['GET', '/rest/v1/user_notification'],
      ['DELETE', '/rest/v1/user_notification'],
      ['GET', '/rest/v1/user_notification'],
      ['POST', '/realtime/v1/api/broadcast'],
    ]);
    expect(realtimePayload(calls.at(-1)!).messages[0]).toMatchObject({
      event: 'notification.deleted',
      payload: { notificationId: '10', unreadCount: 0 },
    });
  });

  it('returns a signed notification realtime topic for the current session user', async () => {
    const response = await handleNotificationRealtimeChannel(await createAuthedRequest('GET'), env);
    const payload = (await response.json()) as { topic: string };

    expect(response.status).toBe(200);
    expect(payload.topic).toMatch(/^user-notifications:user-1:[A-Za-z0-9_-]+$/);
  });
});
