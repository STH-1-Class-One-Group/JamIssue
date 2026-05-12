import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerBaseData, WorkerPlace } from '../../deploy/api-worker-shell/runtime/base-data-contracts';
import { issueSessionCookie } from '../../deploy/api-worker-shell/services/auth/session';
import { createStampService } from '../../deploy/api-worker-shell/services/stamps';
import type { WorkerEnv, WorkerSessionUser } from '../../deploy/api-worker-shell/types';

const env: WorkerEnv = {
  APP_CORS_ORIGINS: 'http://localhost',
  APP_FRONTEND_URL: 'http://localhost',
  APP_SESSION_HTTPS: 'false',
  APP_SESSION_SECRET: 'test-session-secret',
  APP_STAMP_UNLOCK_RADIUS_METERS: '100',
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

const place: WorkerPlace = {
  id: 'place-1',
  positionId: '101',
  name: 'Place 1',
  district: 'Daejeon',
  category: 'cafe',
  jamColor: '#ff66aa',
  accentColor: '#ffccdd',
  imageUrl: null,
  latitude: 36.35,
  longitude: 127.38,
  summary: null,
  description: null,
  vibeTags: [],
  visitTime: null,
  routeHint: null,
  stampReward: null,
  heroLabel: null,
  totalVisitCount: 0,
};

function buildBaseData(): WorkerBaseData {
  return {
    places: [place],
    placesByPositionId: new Map([[place.positionId, place]]),
    reviews: [],
    courses: [],
    collectedPlaceIds: [place.id],
    stampLogs: [{ id: 'stamp-1', placeId: place.id }],
    travelSessions: [{ id: 'session-1', placeIds: [place.id] }],
  };
}

async function createAuthedRequest(payload: Record<string, unknown>) {
  const baseRequest = new Request('http://localhost/api/stamps/toggle', { method: 'POST' });
  const cookie = await issueSessionCookie(sessionUser, baseRequest, env);

  return new Request('http://localhost/api/stamps/toggle', {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function stubSupabaseRows(rowsByCall: unknown[][]) {
  const calls: Array<{ init?: RequestInit; url: string }> = [];
  const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async (input, init) => {
    calls.push({ init, url: String(input) });
    const rows = rowsByCall.shift() ?? [];

    return new Response(JSON.stringify(rows), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return { calls, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('worker stamp service', () => {
  it('returns duplicate stamp state without writing new persistence rows', async () => {
    const { calls } = stubSupabaseRows([[{ stamp_id: 1 }]]);
    const loadBaseData = vi.fn(async () => buildBaseData());
    const service = createStampService({ loadBaseData });

    const response = await service.handleToggleStamp(
      await createAuthedRequest({ latitude: place.latitude, longitude: place.longitude, placeId: place.id }),
      env,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ collectedPlaceIds: [place.id], logs: [{ placeId: place.id }] });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('user_stamp?select=stamp_id');
    expect(calls.some((call) => call.init?.method === 'POST')).toBe(false);
  });

  it('rejects out-of-radius stamp claims before persistence access', async () => {
    const { calls } = stubSupabaseRows([]);
    const loadBaseData = vi.fn(async () => buildBaseData());
    const service = createStampService({ loadBaseData });

    const response = await service.handleToggleStamp(
      await createAuthedRequest({ latitude: 37.5, longitude: 127.38, placeId: place.id }),
      env,
    );

    expect(response.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it('creates travel session and stamp rows for successful first claims', async () => {
    const { calls } = stubSupabaseRows([[], [], [], [{ travel_session_id: 7 }], [{ stamp_id: 11 }]]);
    const loadBaseData = vi.fn(async () => buildBaseData());
    const service = createStampService({ loadBaseData });

    const response = await service.handleToggleStamp(
      await createAuthedRequest({ latitude: place.latitude, longitude: place.longitude, placeId: place.id }),
      env,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ collectedPlaceIds: [place.id], logs: [{ placeId: place.id }] });
    expect(calls.map((call) => [call.init?.method ?? 'GET', new URL(call.url).pathname])).toEqual([
      ['GET', '/rest/v1/user_stamp'],
      ['GET', '/rest/v1/user_stamp'],
      ['GET', '/rest/v1/user_stamp'],
      ['POST', '/rest/v1/travel_session'],
      ['POST', '/rest/v1/user_stamp'],
    ]);
    expect(JSON.parse(String(calls.at(-1)?.init?.body))).toMatchObject({
      position_id: Number(place.positionId),
      travel_session_id: 7,
      user_id: sessionUser.id,
    });
  });
});
