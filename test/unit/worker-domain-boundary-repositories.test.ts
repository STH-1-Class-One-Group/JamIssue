import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTravelSession,
  createUserStamp,
  readLastStampRow,
  readPlaceStampRows,
  readTodayStampRow,
  readTravelSessionRow,
  updateStampTravelSession,
  updateTravelSession,
} from '../../deploy/api-worker-shell/services/stamp-domain/repository';
import {
  buildNotificationRealtimeTopic,
  sendRealtimeBroadcast,
} from '../../deploy/api-worker-shell/services/notification-domain/publisher';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const supabaseMocks = vi.hoisted(() => ({
  encodeFilterValue: vi.fn((value: unknown) => encodeURIComponent(String(value))),
  getSupabaseKey: vi.fn(),
  supabaseRequest: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getSigningSecret: vi.fn(),
  sha256Base64Url: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/lib/supabase', () => ({
  encodeFilterValue: supabaseMocks.encodeFilterValue,
  getSupabaseKey: supabaseMocks.getSupabaseKey,
  supabaseRequest: supabaseMocks.supabaseRequest,
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  getSigningSecret: authMocks.getSigningSecret,
  sha256Base64Url: authMocks.sha256Base64Url,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
  APP_SUPABASE_URL: 'https://supabase.test',
} as WorkerEnv;

describe('worker stamp-domain repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.supabaseRequest.mockResolvedValue([{ stamp_id: 7, travel_session_id: 55, created_at: '2026-05-14T00:00:00Z', stamp_count: 2 }]);
  });

  it('reads stamp rows through encoded Supabase filters and null-safe single-row lookups', async () => {
    await expect(readTodayStampRow(env, 'user/1', '101', '2026-05-14')).resolves.toEqual(expect.objectContaining({ stamp_id: 7 }));
    await expect(readPlaceStampRows(env, 'user/1', '101')).resolves.toEqual([expect.objectContaining({ stamp_id: 7 })]);
    await expect(readLastStampRow(env, 'user/1')).resolves.toEqual(expect.objectContaining({ stamp_id: 7 }));
    await expect(readTravelSessionRow(env, 55)).resolves.toEqual(expect.objectContaining({ stamp_count: 2 }));

    expect(supabaseMocks.supabaseRequest.mock.calls.map(([, query]) => query)).toEqual([
      'user_stamp?select=stamp_id&user_id=eq.user%2F1&position_id=eq.101&stamp_date=eq.2026-05-14&limit=1',
      'user_stamp?select=stamp_id&user_id=eq.user%2F1&position_id=eq.101',
      'user_stamp?select=stamp_id,travel_session_id,created_at&user_id=eq.user%2F1&order=created_at.desc&limit=1',
      'travel_session?select=stamp_count&travel_session_id=eq.55&limit=1',
    ]);

    supabaseMocks.supabaseRequest.mockResolvedValueOnce([]);
    await expect(readTodayStampRow(env, 'user-1', '101', '2026-05-14')).resolves.toBeNull();

    supabaseMocks.supabaseRequest.mockResolvedValueOnce(null);
    await expect(readPlaceStampRows(env, 'user-1', '101')).resolves.toEqual([]);
  });

  it('writes travel sessions, stamp session links, and user stamp rows through explicit methods', async () => {
    const payload = { user_id: 'user-1' };

    await expect(createTravelSession(env, payload)).resolves.toEqual(expect.objectContaining({ stamp_id: 7 }));
    await updateTravelSession(env, 55, { stamp_count: 2 });
    await updateStampTravelSession(env, 7, 55);
    await expect(createUserStamp(env, payload)).resolves.toEqual(expect.objectContaining({ stamp_id: 7 }));

    expect(supabaseMocks.supabaseRequest.mock.calls).toEqual([
      [env, 'travel_session?select=travel_session_id', { method: 'POST', body: JSON.stringify(payload) }],
      [env, 'travel_session?travel_session_id=eq.55', { method: 'PATCH', body: JSON.stringify({ stamp_count: 2 }) }],
      [env, 'user_stamp?stamp_id=eq.7', { method: 'PATCH', body: JSON.stringify({ travel_session_id: 55 }) }],
      [env, 'user_stamp?select=stamp_id', { method: 'POST', body: JSON.stringify(payload) }],
    ]);
  });
});

describe('worker notification realtime publisher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    authMocks.getSigningSecret.mockReturnValue('secret');
    authMocks.sha256Base64Url.mockResolvedValue('signature');
    supabaseMocks.getSupabaseKey.mockReturnValue('service-key');
  });

  it('builds signed per-user notification topics and rejects missing secrets', async () => {
    await expect(buildNotificationRealtimeTopic(env, 'user-1')).resolves.toBe('user-notifications:user-1:signature');
    expect(authMocks.sha256Base64Url).toHaveBeenCalledWith('user-1:secret:notifications');

    authMocks.getSigningSecret.mockReturnValueOnce('');
    await expect(buildNotificationRealtimeTopic(env, 'user-1')).rejects.toThrow('Notification realtime secret is missing.');
  });

  it('skips broadcasts without Supabase config and posts realtime broadcast payloads when configured', async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await sendRealtimeBroadcast({ ...env, APP_SUPABASE_URL: '' }, 'topic', 'event', { ok: true });
    supabaseMocks.getSupabaseKey.mockReturnValueOnce('');
    await sendRealtimeBroadcast(env, 'topic', 'event', { ok: true });
    expect(fetchMock).not.toHaveBeenCalled();

    supabaseMocks.getSupabaseKey.mockReturnValue('service-key');
    await sendRealtimeBroadcast(env, 'topic', 'event', { ok: true });

    expect(fetchMock).toHaveBeenCalledWith('https://supabase.test/realtime/v1/api/broadcast', {
      method: 'POST',
      headers: {
        apikey: 'service-key',
        Authorization: 'Bearer service-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic: 'topic',
            event: 'event',
            payload: { ok: true },
            private: false,
          },
        ],
      }),
    });
  });
});
